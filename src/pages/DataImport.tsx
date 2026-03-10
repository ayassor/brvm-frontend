import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Copy, Check, Download, Database, FileSpreadsheet } from 'lucide-react';

// ---------------------------------------------------------------------------
// TICKER MAPPING
// ---------------------------------------------------------------------------
const NAME_TO_TICKER: Record<string, string> = {
  'BANK OF AFRICA COTE D\'IVOIRE': 'BOAC',
  'BANK OF AFRICA CI':             'BOAC',
  'BANK OF AFRICA BENIN':          'BOAN',
  'BANK OF AFRICA BN':             'BOAN',
  'BANK OF AFRICA SENEGAL':        'BOAS',
  'BANK OF AFRICA SN':             'BOAS',
  'BANK OF AFRICA MALI':           'BOAM',
  'BANK OF AFRICA ML':             'BOAM',
  'BANK OF AFRICA TOGO':           'BOAT',
  'BANK OF AFRICA TG':             'BOAT',
  'BANK OF AFRICA BURKINA':        'BOAB',
  'BANK OF AFRICA BF':             'BOAB',
  'SOCIETE GENERALE CI':           'SGCI',
  'SOCIETE GENERALE':              'SGCI',
  'ECOBANK CI':                    'ECOC',
  'ECOBANK TRANSNATIONAL':         'ETIT',
  'ETI':                           'ETIT',
  'CORIS BANK':                    'CBIBF',
  'NSIA BANQUE CI':                'NSIAC',
  'NSIA BANQUE':                   'NSIAC',
  'BICICI':                        'BICC',
  'SIB':                           'SIBC',
  'ORAGROUP':                      'ORGT',
  'PALM CI':                       'PALC',
  'SUCRIVOIRE':                    'SCRC',
  'SAPH':                          'SPHC',
  'FILTISAC':                      'FTSC',
  'NESTLE CI':                     'NTLC',
  'SOLIBRA':                       'SLBC',
  'BERNABE CI':                    'BNBC',
  'VIVO ENERGY CI':                'SHEC',
  'TOTAL CI':                      'TTLC',
  'ORANGE CI':                     'ORAC',
  'ONATEL':                        'ONTBF',
  'MOVIS':                         'MVSC',
  'CFAO MOTORS CI':                'CFAC',
  'CFAO':                          'CFAC',
  'SICABLE':                       'CABC',
  'SITAB':                         'STBC',
  'SODE':                          'SDCC',
  'SMB':                           'SMBC',
  'TRITURAF':                      'TTRC',
  'BOLLORE TRANSPORT':             'SDSC',
  'AIR LIQUIDE':                   'ALSC',
  'UNIWAX':                        'UNXC',
  'NEI':                           'NEIC',
  'SAFCA':                         'SAFC',
  'CIE':                           'CIEC',
  'CROWN SIEM':                    'CIEC',
  'SETAO':                         'STAC',
  'SNC':                           'SNCA',
};

function guessTickerFromName(name: string): string {
  if (!name) return 'TICKER';
  const upper = name.toUpperCase().trim();
  for (const [key, val] of Object.entries(NAME_TO_TICKER)) {
    if (upper === key || upper.startsWith(key) || key.startsWith(upper)) return val;
  }
  for (const [key, val] of Object.entries(NAME_TO_TICKER)) {
    if (upper.includes(key)) return val;
  }
  // Fallback: initials of words > 1 char
  const words = upper.split(/[\s\-_]+/).filter(w => w.length > 1);
  return words.slice(0, 5).map(w => w[0]).join('') || 'TICKER';
}

// ---------------------------------------------------------------------------
// DATE HELPERS
// ---------------------------------------------------------------------------
function excelSerialToISO(serial: number): string {
  return new Date((serial - 25569) * 86400 * 1000).toISOString().split('T')[0];
}

function toISO(val: unknown): string | null {
  if (!val && val !== 0) return null;
  if (typeof val === 'number') return excelSerialToISO(val);
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'string') {
    // Strip trailing time part "HH:MM" or "HH:MM:SS" (e.g. "18/09/1998 00:00")
    const s = val.trim().replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '');
    // dd/mm/yyyy or dd-mm-yyyy
    const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmY) return `${dmY[3]}-${dmY[2].padStart(2, '0')}-${dmY[1].padStart(2, '0')}`;
    // Already ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return null;
}

// ---------------------------------------------------------------------------
// NUMBER HELPERS
// ---------------------------------------------------------------------------
function parseNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const s = String(val).replace(/\s/g, '').replace(',', '.').replace('%', '');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function fmtNum(n: number | null | undefined, dec = 2): string {
  if (n === null || n === undefined || isNaN(n as number)) return '-';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function sqlVal(n: number | null | undefined): string {
  return n === null || n === undefined ? 'NULL' : String(n);
}

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface SikaRow   { date: string; open: number; high: number; low: number; close: number; volume: number; }
interface ExcelRow  { date: string; variation: number | null; value_traded: number | null; close_normal: number | null; volume_normal: number | null; }
interface MergedRow { date: string; open: number | null; high: number | null; low: number | null; close: number | null; previous_close: number | null; variation: number | null; volume: number | null; value_traded: number | null; }

// ---------------------------------------------------------------------------
// MERGE LOGIC
// ---------------------------------------------------------------------------
function mergeData(sikaRows: SikaRow[], excelRows: ExcelRow[]): MergedRow[] {
  const sikaMap  = new Map(sikaRows.map(r => [r.date, r]));
  const excelMap = new Map(excelRows.map(r => [r.date, r]));
  const allDates = new Set([...sikaMap.keys(), ...excelMap.keys()]);

  const rows: MergedRow[] = [];
  for (const date of allDates) {
    const s = sikaMap.get(date);
    const e = excelMap.get(date);
    rows.push({
      date,
      open:          s?.open        ?? null,
      high:          s?.high        ?? null,
      low:           s?.low         ?? null,
      close:         s?.close       ?? e?.close_normal  ?? null,   // JSON priority
      previous_close: null,                                          // computed below
      variation:     e?.variation   ?? null,
      volume:        s?.volume      ?? e?.volume_normal ?? null,    // JSON priority
      value_traded:  e?.value_traded ?? null,
    });
  }

  // Sort ascending to compute previous_close
  rows.sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < rows.length; i++) {
    rows[i].previous_close = rows[i - 1].close;
  }

  // Return descending for display
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return rows;
}

// ---------------------------------------------------------------------------
// SQL GENERATOR
// ---------------------------------------------------------------------------
function generateSQL(ticker: string, rows: MergedRow[]): string {
  if (rows.length === 0) return '-- Aucune donnée à exporter';
  const sym = ticker.toUpperCase() || 'TICKER';
  const ascending = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const values = ascending.map(r =>
    `  ('${sym}', '${r.date}', ${sqlVal(r.open)}, ${sqlVal(r.high)}, ${sqlVal(r.low)}, ${sqlVal(r.close)}, ${sqlVal(r.previous_close)}, ${sqlVal(r.variation)}, ${sqlVal(r.volume)}, ${sqlVal(r.value_traded)}, NOW())`
  ).join(',\n');

  return `-- ══════════════════════════════════════════════
-- 1. Créer la table si elle n'existe pas encore
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stock_prices (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  symbol         VARCHAR(10)  NOT NULL,
  date           DATE         NOT NULL,
  open           DECIMAL(12,4)    DEFAULT NULL,
  high           DECIMAL(12,4)    DEFAULT NULL,
  low            DECIMAL(12,4)    DEFAULT NULL,
  close          DECIMAL(12,4)    DEFAULT NULL,
  previous_close DECIMAL(12,4)    DEFAULT NULL,
  variation      DECIMAL(8,4)     DEFAULT NULL,
  volume         BIGINT           DEFAULT NULL,
  value_traded   DECIMAL(20,4)    DEFAULT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_symbol_date (symbol, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ══════════════════════════════════════════════
-- 2. Insérer / mettre à jour les données
-- ══════════════════════════════════════════════
INSERT INTO stock_prices
  (symbol, date, open, high, low, close, previous_close, variation, volume, value_traded, created_at)
VALUES
${values}
ON DUPLICATE KEY UPDATE
  open           = VALUES(open),
  high           = VALUES(high),
  low            = VALUES(low),
  close          = VALUES(close),
  previous_close = VALUES(previous_close),
  variation      = VALUES(variation),
  volume         = VALUES(volume),
  value_traded   = VALUES(value_traded);`;
}

// ---------------------------------------------------------------------------
// CSV EXPORT
// ---------------------------------------------------------------------------
function exportCSV(rows: MergedRow[], ticker: string): void {
  const headers = 'date,open,high,low,close,previous_close,variation,volume,value_traded';
  const lines = [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => [
      r.date,
      r.open ?? '', r.high ?? '', r.low ?? '', r.close ?? '',
      r.previous_close ?? '', r.variation ?? '', r.volume ?? '', r.value_traded ?? '',
    ].join(','));
  const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${ticker || 'BRVM'}_stock_prices.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// COLUMN AUTO-DETECT FOR EXCEL
// ---------------------------------------------------------------------------
function findCol(cols: string[], pattern: RegExp): string | null {
  return cols.find(c => pattern.test(c.toLowerCase())) ?? null;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function DataImport() {
  const [sikaRows,   setSikaRows]   = useState<SikaRow[]>([]);
  const [excelRows,  setExcelRows]  = useState<ExcelRow[]>([]);
  const [sikaName,   setSikaName]   = useState('');
  const [ticker,     setTicker]     = useState('');
  const [sikaLoaded,  setSikaLoaded]  = useState(false);
  const [excelLoaded, setExcelLoaded] = useState(false);
  const [sikaError,   setSikaError]   = useState('');
  const [excelError,  setExcelError]  = useState('');
  const [jsonPaste,   setJsonPaste]   = useState('');
  const [showPaste,   setShowPaste]   = useState(false);
  const [copied,      setCopied]      = useState(false);

  const excelRef = useRef<HTMLInputElement>(null);
  const jsonRef  = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLInputElement>(null);

  const mergedRows = useMemo(
    () => mergeData(sikaRows, excelRows),
    [sikaRows, excelRows]
  );

  const sql = useMemo(
    () => generateSQL(ticker, mergedRows),
    [ticker, mergedRows]
  );

  // ---- EXCEL HANDLER ----
  const handleExcelFile = (file: File) => {
    setExcelError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array', cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
          raw: false, dateNF: 'yyyy-mm-dd', defval: null,
        });

        if (!json.length) { setExcelError('Fichier Excel vide ou format non reconnu.'); return; }

        const cols       = Object.keys(json[0]);
        const dateCol    = findCol(cols, /date/);
        const varCol     = findCol(cols, /variation/);
        const valCol     = findCol(cols, /valeur/);
        const coursNCol  = findCol(cols, /cours.?normal/);
        const volNCol    = findCol(cols, /volume.?normal/);

        if (!dateCol) { setExcelError('Colonne "Date" introuvable. Vérifiez les en-têtes du fichier Excel.'); return; }

        const rows: ExcelRow[] = [];
        for (const row of json) {
          const dateISO = toISO(row[dateCol]);
          if (!dateISO) continue;
          rows.push({
            date:         dateISO,
            variation:    varCol   ? parseNum(row[varCol])   : null,
            value_traded: valCol   ? parseNum(row[valCol])   : null,
            close_normal: coursNCol ? parseNum(row[coursNCol]) : null,
            volume_normal: volNCol  ? parseNum(row[volNCol])  : null,
          });
        }

        if (!rows.length) { setExcelError('Aucune ligne valide parsée. Vérifiez le format des dates.'); return; }

        setExcelRows(rows);
        setExcelLoaded(true);
      } catch (err: unknown) {
        setExcelError(`Erreur de parsing Excel: ${(err as Error).message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ---- JSON HANDLER ----
  const handleJsonText = (text: string) => {
    setSikaError('');
    try {
      const obj = JSON.parse(text) as Record<string, unknown>;
      const name   = (obj.Name as string) || (obj.name as string) || '';
      const quotes = (obj.QuoteTab || obj.quoteTab || obj.quotes || []) as Record<string, unknown>[];

      if (!quotes.length) { setSikaError('Tableau QuoteTab vide ou absent dans le JSON.'); return; }

      const rows: SikaRow[] = (quotes as Array<Record<string, unknown>>)
        .map(q => ({
          date:   typeof q.d === 'number' ? excelSerialToISO(q.d) : (toISO(q.d) ?? ''),
          open:   parseNum(q.o) ?? 0,
          high:   parseNum(q.h) ?? 0,
          low:    parseNum(q.l) ?? 0,
          close:  parseNum(q.c) ?? 0,
          volume: parseNum(q.v) ?? 0,
        }))
        .filter(r => r.date);

      if (!rows.length) { setSikaError('Aucune entrée valide dans QuoteTab.'); return; }

      setSikaName(name);
      setSikaRows(rows);
      setSikaLoaded(true);
      if (!ticker && name) setTicker(guessTickerFromName(name));
    } catch (err: unknown) {
      setSikaError(`Erreur de parsing JSON: ${(err as Error).message}`);
    }
  };

  // ---- CHART EXCEL HANDLER (format: "Chart title" / DateTime / COMPANY (TICKER) / OHLCV) ----
  const handleChartExcel = (file: File) => {
    setSikaError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });

        // Find the row containing "(TICKER)" pattern — usually row 1 or 2
        let headerRowIdx  = -1;
        let detectedTicker = '';
        let detectedName   = '';

        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const row = rawRows[i] as unknown[];
          for (const cell of row) {
            if (typeof cell === 'string') {
              const m = cell.match(/\(([A-Z0-9]+)\)/);
              if (m) {
                detectedTicker = m[1];
                detectedName   = cell.replace(/\(.*\)/, '').trim();
                headerRowIdx   = i;
                break;
              }
            }
          }
          if (headerRowIdx >= 0) break;
        }

        if (headerRowIdx < 0) {
          setSikaError('Format non reconnu : en-tête "(TICKER)" introuvable dans les 10 premières lignes.');
          return;
        }

        // Data rows start 2 rows below the ticker header (skip open/high/low/close sub-header)
        const dataStartIdx = headerRowIdx + 2;
        const rows: SikaRow[] = [];

        for (let i = dataStartIdx; i < rawRows.length; i++) {
          const row = rawRows[i] as unknown[];
          if (!row || row.filter(c => c !== null).length < 2) continue;

          const dateISO = toISO(row[0]);
          if (!dateISO) continue;

          const open   = parseNum(row[1]);
          const high   = parseNum(row[2]);
          const low    = parseNum(row[3]);
          const close  = parseNum(row[4]);
          const volume = parseNum(row[5]);

          if (close === null) continue;

          rows.push({
            date:   dateISO,
            open:   open  ?? close,
            high:   high  ?? close,
            low:    low   ?? close,
            close,
            volume: volume ?? 0,
          });
        }

        if (!rows.length) {
          setSikaError('Aucune ligne valide après les en-têtes. Vérifiez la structure du fichier.');
          return;
        }

        setSikaName(detectedName || 'Chart Import');
        setSikaRows(rows);
        setSikaLoaded(true);
        if (!ticker && detectedTicker) setTicker(detectedTicker);
      } catch (err: unknown) {
        setSikaError(`Erreur Chart Excel : ${(err as Error).message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database size={24} className="text-purple-400" />
            Import &amp; Fusion de données BRVM
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Fusionnez les historiques <span className="text-green-400 font-medium">richbourse.com</span> (Excel)
            et votre source OHLCV — <span className="text-blue-400 font-medium">Chart Excel</span> ou <span className="text-blue-400 font-medium">sikafinance.com</span> (JSON) — puis générez un INSERT SQL prêt à l&apos;emploi.
          </p>
        </div>

        {/* ── Import Zone ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Excel */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-green-400" />
                richbourse.com — Excel
              </h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                excelLoaded ? 'bg-green-900/60 text-green-300 border border-green-700' : 'bg-gray-700 text-gray-400'
              }`}>
                {excelLoaded ? `✅ ${excelRows.length} lignes` : '⏳ En attente'}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Colonnes attendues&nbsp;: <code className="text-gray-400">Date</code>, <code className="text-gray-400">Variation</code>, <code className="text-gray-400">Valeur</code>, <code className="text-gray-400">Cours Normal</code>, <code className="text-gray-400">Volume Normal Total</code>
            </p>
            <button
              onClick={() => excelRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-700 hover:bg-green-600 active:scale-95 rounded-lg text-sm font-medium transition-all"
            >
              <Upload size={16} />
              Importer fichier Excel (.xlsx / .xls)
            </button>
            <input
              ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleExcelFile(e.target.files[0]); e.target.value = ''; }}
            />
            {excelError && (
              <p className="text-red-400 text-xs bg-red-900/30 border border-red-800/50 p-2.5 rounded-lg">{excelError}</p>
            )}
          </div>

          {/* OHLCV Source */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-blue-400" />
                Source OHLCV
              </h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                sikaLoaded ? 'bg-blue-900/60 text-blue-300 border border-blue-700' : 'bg-gray-700 text-gray-400'
              }`}>
                {sikaLoaded ? `✅ ${sikaRows.length} lignes` : '⏳ En attente'}
              </span>
            </div>
            {sikaLoaded && sikaName && (
              <p className="text-sm text-blue-300 font-medium">{sikaName}</p>
            )}

            {/* Option 1 — Chart Excel */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Option A — Chart Excel</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Format&nbsp;: <code className="text-gray-400">DateTime | NOM (TICKER) | Volume</code>
                <span className="mx-1 text-gray-600">→</span>
                <code className="text-gray-400">open | high | low | close</code>
              </p>
              <button
                onClick={() => chartRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-600 active:scale-95 rounded-lg text-sm font-medium transition-all"
              >
                <Upload size={16} />
                Importer Chart Excel (.xlsx / .xls)
              </button>
              <input
                ref={chartRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleChartExcel(e.target.files[0]); e.target.value = ''; }}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 text-gray-600">
              <div className="flex-1 border-t border-gray-700" />
              <span className="text-xs">ou</span>
              <div className="flex-1 border-t border-gray-700" />
            </div>

            {/* Option 2 — sikafinance JSON */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Option B — sikafinance.com JSON</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Structure&nbsp;: <code className="text-gray-400">{'{ Name, QuoteTab: [{d, o, h, l, c, v}] }'}</code>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => jsonRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 active:scale-95 rounded-lg text-sm font-medium transition-all"
                >
                  <Upload size={15} />
                  Importer .json
                </button>
                <button
                  onClick={() => setShowPaste(v => !v)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    showPaste ? 'bg-blue-900 text-blue-300 border border-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  Coller
                </button>
              </div>
              <input
                ref={jsonRef} type="file" accept=".json" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => handleJsonText(ev.target!.result as string);
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
              {showPaste && (
                <div className="space-y-2">
                  <textarea
                    className="w-full h-32 bg-gray-900 border border-gray-600 focus:border-blue-500 rounded-lg p-3 text-xs font-mono text-gray-300 resize-none focus:outline-none transition-colors"
                    placeholder={'{"Name": "BANK OF AFRICA CI", "QuoteTab": [{...}]}'}
                    value={jsonPaste}
                    onChange={(e) => setJsonPaste(e.target.value)}
                  />
                  <button
                    onClick={() => { handleJsonText(jsonPaste); setShowPaste(false); }}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    Parser le JSON
                  </button>
                </div>
              )}
            </div>

            {sikaError && (
              <p className="text-red-400 text-xs bg-red-900/30 border border-red-800/50 p-2.5 rounded-lg">{sikaError}</p>
            )}
          </div>
        </div>

        {/* ── Merged Table ── */}
        {mergedRows.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div>
                <h2 className="font-semibold text-white">Données fusionnées</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {mergedRows.length} ligne{mergedRows.length > 1 ? 's' : ''} — triées par date décroissante
                </p>
              </div>
              <button
                onClick={() => exportCSV(mergedRows, ticker)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={15} />
                Exporter CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/60 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Open</th>
                    <th className="px-4 py-3 text-right">High</th>
                    <th className="px-4 py-3 text-right">Low</th>
                    <th className="px-4 py-3 text-right">Close</th>
                    <th className="px-4 py-3 text-right">Prev. Close</th>
                    <th className="px-4 py-3 text-right">Variation&nbsp;(%)</th>
                    <th className="px-4 py-3 text-right">Volume</th>
                    <th className="px-4 py-3 text-right">Value&nbsp;Traded</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedRows.map((r, i) => (
                    <tr
                      key={r.date}
                      className={`border-t border-gray-700/40 hover:bg-gray-700/30 transition-colors ${
                        i % 2 === 0 ? '' : 'bg-gray-900/20'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-mono text-gray-300 whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{fmtNum(r.open)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{fmtNum(r.high)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{fmtNum(r.low)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-white">{fmtNum(r.close)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">{fmtNum(r.previous_close)}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                        r.variation === null ? 'text-gray-500' :
                        r.variation > 0     ? 'text-green-400' :
                        r.variation < 0     ? 'text-red-400'   : 'text-gray-400'
                      }`}>
                        {r.variation !== null
                          ? `${r.variation > 0 ? '+' : ''}${fmtNum(r.variation)}%`
                          : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{fmtNum(r.volume, 0)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-300">{fmtNum(r.value_traded, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SQL Section ── */}
        {mergedRows.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Database size={16} className="text-purple-400" />
                SQL généré
                <span className="text-xs font-normal text-gray-400 ml-1">
                  ({[...mergedRows].sort((a,b) => a.date.localeCompare(b.date)).length} INSERT rows)
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 whitespace-nowrap">Ticker&nbsp;:</label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="w-24 px-2.5 py-1.5 bg-gray-700 border border-gray-600 focus:border-purple-500 rounded-lg text-sm font-mono text-white focus:outline-none transition-colors uppercase"
                    placeholder="TICKER"
                    maxLength={10}
                  />
                </div>
                <button
                  onClick={handleCopySQL}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    copied ? 'bg-green-700 text-green-100' : 'bg-purple-700 hover:bg-purple-600 text-white'
                  }`}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copié !' : 'Copier SQL'}
                </button>
              </div>
            </div>
            <div className="p-5">
              <pre className="text-xs font-mono text-gray-300 bg-gray-950 p-4 rounded-lg overflow-x-auto max-h-96 leading-relaxed border border-gray-700/50 select-all">
                {sql}
              </pre>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {mergedRows.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <Database size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Importez au moins une source de données pour voir le tableau fusionné</p>
          </div>
        )}

      </div>
    </div>
  );
}
