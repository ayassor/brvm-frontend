import { useState } from 'react'
import {
  Package, Database, Code2, Globe, TrendingUp, BarChart3, Table2,
  ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Terminal, Layers, Activity, Calendar, ArrowUpDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FunctionDoc {
  name: string
  signature: string
  description: string
  source: string
  sourceUrl: string
  returnCols: { name: string; type: string; desc: string }[]
  example: { headers: string[]; rows: (string | number)[][] }
  badge: string
  badgeColor: string
}

// ─── Data ──────────────────────────────────────────────────────────────────────
const SOURCES = [
  { name: 'sikafinance.com', role: 'Cours historiques OHLCV, infos société (Beta, RSI, Cap, PER…)', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'brvm.org', role: 'Cours du jour en temps réel, liste des tickers, compartiments', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { name: 'richbourse.com', role: 'Liste des sociétés avec secteur d\'activité (3 pages)', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { name: 'abourse.com', role: 'Bulletin officiel journalier : Volume, Valeur, PER, Rendement, Compartiment', color: 'bg-purple-100 text-purple-700 border-purple-200' },
]

const INDICES = [
  { code: 'BRVM-COMPOSITE', name: 'Indice général', prev: '225.48', close: '226.14', var: '+0.29%', ytd: '+4.20%' },
  { code: 'BRVM-30', name: '30 plus liquides', prev: '317.82', close: '318.54', var: '+0.23%', ytd: '+5.10%' },
  { code: 'BRVMFI', name: 'Finances', prev: '145.32', close: '145.89', var: '+0.39%', ytd: '+3.80%' },
  { code: 'BRVMIN', name: 'Industrie', prev: '212.10', close: '210.50', var: '-0.75%', ytd: '-1.20%' },
  { code: 'BRVMAG', name: 'Agriculture', prev: '178.45', close: '179.22', var: '+0.43%', ytd: '+6.50%' },
  { code: 'BRVMAS', name: 'Services Pub.', prev: '196.11', close: '197.84', var: '+0.88%', ytd: '+8.30%' },
  { code: 'BRVMDI', name: 'Distribution', prev: '304.50', close: '305.20', var: '+0.23%', ytd: '+2.10%' },
  { code: 'BRVMTR', name: 'Transport', prev: '88.40', close: '86.50', var: '-2.15%', ytd: '-3.40%' },
]

const FUNCTIONS: FunctionDoc[] = [
  {
    name: 'BRVM_ticker_desc',
    signature: 'BRVM_ticker_desc()',
    description: 'Retourne la liste complète des 47 tickers cotés avec leur nom, secteur et pays d\'origine.',
    source: 'brvm.org',
    sourceUrl: 'https://www.brvm.org/en/cours-actions/0/',
    badge: 'Référentiel',
    badgeColor: 'bg-blue-100 text-blue-700',
    returnCols: [
      { name: 'Ticker', type: 'string', desc: 'Code boursier (ex: SNTS)' },
      { name: 'Company name', type: 'string', desc: 'Dénomination sociale' },
      { name: 'Sector', type: 'string', desc: 'Secteur BRVM (Finance, Agro, etc.)' },
      { name: 'Country', type: 'string', desc: 'Pays du siège social' },
    ],
    example: {
      headers: ['Ticker', 'Société', 'Secteur', 'Pays'],
      rows: [
        ['SNTS', 'Sonatel', 'Télécommunications', 'Sénégal'],
        ['SGBC', 'SGBCI', 'Finances', "Côte d'Ivoire"],
        ['NTLC', "Nestlé CI", 'Agro-alimentaire', "Côte d'Ivoire"],
        ['BOAC', 'BOA CI', 'Finances', "Côte d'Ivoire"],
        ['ETIT', 'Etat du Togo', 'Obligations', 'Togo'],
      ],
    },
  },
  {
    name: 'BRVM_index',
    signature: 'BRVM_index()',
    description: 'Données temps réel sur les 11 indices BRVM : cours de clôture, variation quotidienne et performance YTD.',
    source: 'sikafinance.com',
    sourceUrl: 'https://www.sikafinance.com',
    badge: 'Temps réel',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    returnCols: [
      { name: 'Indexes', type: 'string', desc: 'Code de l\'indice (BRVM-30, BRVMFI…)' },
      { name: 'Previous closing', type: 'number', desc: 'Clôture de la séance précédente' },
      { name: 'Closing', type: 'number', desc: 'Clôture de la séance en cours' },
      { name: 'Change (%)', type: 'number', desc: 'Variation quotidienne en %' },
      { name: 'Year to Date Change', type: 'number', desc: 'Performance depuis le 1er janvier' },
    ],
    example: {
      headers: ['Indice', 'Clôture J-1', 'Clôture', 'Var%', 'YTD%'],
      rows: INDICES.map(i => [i.code, i.prev, i.close, i.var, i.ytd]),
    },
  },
  {
    name: 'BRVM_stock_market',
    signature: 'BRVM_stock_market(".weekday")',
    description: 'Revue officielle de cotation pour une séance donnée. Données les plus complètes : 15 colonnes incluant compartiment, PER et rendement net.',
    source: 'abourse.com',
    sourceUrl: 'http://www.abourse.com',
    badge: 'Bulletin officiel',
    badgeColor: 'bg-purple-100 text-purple-700',
    returnCols: [
      { name: 'Ticker', type: 'string', desc: 'Symbole boursier' },
      { name: 'Equity', type: 'string', desc: 'Dénomination complète' },
      { name: 'Volume', type: 'number', desc: 'Nombre de titres échangés' },
      { name: 'Value', type: 'number', desc: 'Valeur totale échangée (FCFA)' },
      { name: 'Previous price', type: 'number', desc: 'Cours de clôture J-1' },
      { name: 'Open', type: 'number', desc: 'Cours d\'ouverture' },
      { name: 'Close', type: 'number', desc: 'Cours de clôture' },
      { name: 'Change (%)', type: 'number', desc: 'Variation quotidienne (%)' },
      { name: 'Annual change (%)', type: 'number', desc: 'Variation sur 1 an (%)' },
      { name: 'Reference price', type: 'number', desc: 'Prix de référence réglementaire' },
      { name: 'Net Income', type: 'number', desc: 'Résultat net de l\'entreprise' },
      { name: 'Compartment', type: 'string', desc: 'Prestige ou Principal' },
      { name: 'Yield Net (%)', type: 'number', desc: 'Rendement du dividende net (%)' },
      { name: 'PER', type: 'number', desc: 'Price-to-Earnings Ratio' },
      { name: 'Date', type: 'date', desc: 'Date de cotation' },
    ],
    example: {
      headers: ['Ticker', 'Volume', 'Clôture', 'Var%', 'Ann%', 'Compartiment', 'PER', 'Rend%'],
      rows: [
        ['SNTS', '16 082', '29 400', '+0.34%', '+12.5%', 'Prestige', '13.2', '4.80%'],
        ['SGBC', '1 352', '37 400', '-0.13%', '+8.3%', 'Prestige', '8.5', '5.20%'],
        ['SLBC', '279', '44 650', '+7.50%', '+27.7%', 'Principal', '11.0', '3.10%'],
        ['SHEC', '10 893', '625', '+4.38%', '+18.2%', 'Principal', '6.8', '7.40%'],
        ['BOAC', '31 361', '4 750', '-0.63%', '-3.5%', 'Principal', '9.2', '6.80%'],
      ],
    },
  },
  {
    name: 'BRVM_get',
    signature: 'BRVM_get(".symbol", ".from", ".to")',
    description: 'Historique journalier OHLCV pour un ou plusieurs tickers sur une plage de dates. Données issues de sikafinance via requête POST JSON.',
    source: 'sikafinance.com',
    sourceUrl: 'https://www.sikafinance.com/api/general/GetHistos',
    badge: 'Historique',
    badgeColor: 'bg-orange-100 text-orange-700',
    returnCols: [
      { name: 'Date', type: 'date', desc: 'Date de cotation (JJ/MM/AAAA → Date)' },
      { name: 'Open', type: 'number', desc: 'Cours d\'ouverture (FCFA)' },
      { name: 'High', type: 'number', desc: 'Plus haut intraday (FCFA)' },
      { name: 'Low', type: 'number', desc: 'Plus bas intraday (FCFA)' },
      { name: 'Close', type: 'number', desc: 'Cours de clôture (FCFA)' },
      { name: 'Volume', type: 'number', desc: 'Nombre de titres échangés' },
      { name: 'Ticker', type: 'string', desc: 'Symbole boursier (multi-ticker)' },
    ],
    example: {
      headers: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'Ticker'],
      rows: [
        ['2026-02-27', '29 300', '29 750', '29 100', '29 400', '16 082', 'SNTS'],
        ['2026-02-26', '29 100', '29 300', '29 050', '29 200', '9 451', 'SNTS'],
        ['2026-02-25', '28 900', '29 200', '28 850', '29 100', '12 330', 'SNTS'],
        ['2026-02-24', '29 200', '29 400', '28 900', '28 950', '7 820', 'SNTS'],
        ['2026-02-21', '29 000', '29 200', '28 900', '29 100', '5 640', 'SNTS'],
      ],
    },
  },
  {
    name: 'BRVM_get1',
    signature: 'BRVM_get1("ticker", "Period", "from", "to")',
    description: 'Identique à BRVM_get mais avec support multi-périodes (daily/weekly/monthly/quarterly/yearly) et accès aux données d\'indices.',
    source: 'sikafinance.com',
    sourceUrl: 'https://www.sikafinance.com/api/general/GetHistos',
    badge: 'Multi-période',
    badgeColor: 'bg-orange-100 text-orange-700',
    returnCols: [
      { name: 'Date', type: 'date', desc: 'Date (fin de période)' },
      { name: 'Open', type: 'number', desc: 'Cours d\'ouverture de la période' },
      { name: 'High', type: 'number', desc: 'Plus haut de la période' },
      { name: 'Low', type: 'number', desc: 'Plus bas de la période' },
      { name: 'Close', type: 'number', desc: 'Cours de clôture de la période' },
      { name: 'Volume', type: 'number', desc: 'Volume cumulé sur la période' },
    ],
    example: {
      headers: ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'],
      rows: [
        ['2025-12', '26 500', '29 800', '26 200', '29 100', '248 750'],
        ['2025-11', '25 800', '27 000', '25 500', '26 500', '187 300'],
        ['2025-10', '24 900', '26 000', '24 700', '25 800', '212 400'],
        ['2025-09', '23 500', '25 100', '23 200', '24 900', '195 600'],
        ['2025-08', '22 800', '23 800', '22 500', '23 500', '178 200'],
      ],
    },
  },
  {
    name: 'BRVM_company_info',
    signature: 'BRVM_company_info("ticker")',
    description: 'Fiche technique complète d\'une société : indicateurs techniques (RSI, Beta), capitalisation, OHLC et ratios fondamentaux issus de 3 tables HTML sikafinance.',
    source: 'sikafinance.com',
    sourceUrl: 'https://www.sikafinance.com/marches/cotation_SNTS',
    badge: 'Fiche société',
    badgeColor: 'bg-teal-100 text-teal-700',
    returnCols: [
      { name: 'Volume (titres)', type: 'number', desc: 'Nombre de titres échangés aujourd\'hui' },
      { name: 'Beta (1 an)', type: 'number', desc: 'Corrélation avec le marché (12 mois)' },
      { name: 'RSI (14j)', type: 'number', desc: 'Relative Strength Index sur 14 séances' },
      { name: 'Capitalisation', type: 'number', desc: 'Capitalisation boursière totale (FCFA)' },
      { name: 'Cours d\'ouverture', type: 'number', desc: 'Cours à l\'ouverture de séance' },
      { name: 'Cours haut', type: 'number', desc: 'Plus haut intraday' },
      { name: 'Cours bas', type: 'number', desc: 'Plus bas intraday' },
      { name: 'Cours de clôture N-1', type: 'number', desc: 'Clôture de la veille' },
      { name: 'PER', type: 'number', desc: 'Price-to-Earnings Ratio' },
      { name: 'Rendement (%)', type: 'number', desc: 'Rendement du dividende' },
    ],
    example: {
      headers: ['Indicateur', 'Sonatel (SNTS)', 'SGBCI (SGBC)', 'Nestlé CI (NTLC)'],
      rows: [
        ['Beta (1 an)', '0.82', '0.94', '0.61'],
        ['RSI (14j)', '58.4', '52.1', '44.8'],
        ['Cap. boursière', '1 556 Mds', '405 Mds', '387 Mds'],
        ['PER', '13.2x', '8.5x', '21.4x'],
        ['Rendement', '4.80%', '5.20%', '2.80%'],
        ['Cours haut (jour)', '29 750', '37 500', '38 500'],
        ['Cours bas (jour)', '29 100', '37 350', '38 150'],
      ],
    },
  },
  {
    name: 'BRVM_bySector',
    signature: 'BRVM_bySector(".sectors")',
    description: 'Données de marché filtrées par secteur BRVM. Retourne toutes les valeurs d\'un secteur (Finance, Agriculture, Industrie, Transport…) avec leurs cotations du jour.',
    source: 'brvm.org + richbourse.com',
    sourceUrl: 'https://www.brvm.org/en/cours-actions/0/',
    badge: 'Sectoriel',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    returnCols: [
      { name: 'Ticker', type: 'string', desc: 'Symbole boursier' },
      { name: 'Company name', type: 'string', desc: 'Dénomination sociale' },
      { name: 'Volume', type: 'number', desc: 'Titres échangés' },
      { name: 'Previous price', type: 'number', desc: 'Clôture J-1' },
      { name: 'Open', type: 'number', desc: 'Ouverture du jour' },
      { name: 'Close', type: 'number', desc: 'Clôture du jour' },
      { name: 'Change (%)', type: 'number', desc: 'Variation journalière' },
      { name: 'Sector', type: 'string', desc: 'Secteur (si multi-secteur demandé)' },
    ],
    example: {
      headers: ['Ticker', 'Société', 'Volume', 'Prev', 'Clôture', 'Var%'],
      rows: [
        ['SGBC', 'SGBCI', '1 352', '37 500', '37 400', '-0.13%'],
        ['SIBC', 'SIB CI', '8 590', '5 740', '5 760', '+0.35%'],
        ['ECOC', 'Ecobank CI', '7 184', '11 205', '11 215', '+0.09%'],
        ['BOAC', 'BOA CI', '31 361', '4 780', '4 750', '-0.63%'],
        ['BICB', 'BIC Burkina', '2 703', '6 480', '6 406', '-1.14%'],
      ],
    },
  },
  {
    name: 'BRVM_company_rank',
    signature: 'BRVM_company_rank()',
    description: 'Classement de toutes les valeurs par performance journalière. Permet d\'identifier rapidement les hausses et baisses du jour.',
    source: 'brvm.org',
    sourceUrl: 'https://www.brvm.org/en/cours-actions/0/status/200',
    badge: 'Classement',
    badgeColor: 'bg-rose-100 text-rose-700',
    returnCols: [
      { name: 'ticker', type: 'string', desc: 'Symbole boursier' },
      { name: 'company_name', type: 'string', desc: 'Dénomination sociale' },
      { name: 'percent_change', type: 'number', desc: 'Variation journalière (%)' },
      { name: 'rank', type: 'number', desc: 'Rang (1 = meilleure performance)' },
    ],
    example: {
      headers: ['Rang', 'Ticker', 'Société', 'Var%'],
      rows: [
        ['1', 'SLBC', 'SOLIBRA', '+7.50%'],
        ['2', 'SDCC', 'SODE CI', '+7.48%'],
        ['3', 'SHEC', 'SHELL CI', '+4.38%'],
        ['4', 'FTSC', 'FILTISAC', '+4.13%'],
        ['5', 'SCRC', 'CROWN SIEM.', '+3.13%'],
      ],
    },
  },
]

// ─── Helper Components ─────────────────────────────────────────────────────────
function FunctionCard({ fn }: { fn: FunctionDoc }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-brvm-card border border-brvm-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-brvm-green/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Terminal size={16} className="text-brvm-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-brvm-text font-bold text-sm font-mono">{fn.name}()</code>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${fn.badgeColor}`}>
                {fn.badge}
              </span>
              <span className="text-xs text-brvm-muted border border-brvm-border px-2 py-0.5 rounded-full flex items-center gap-1">
                <Globe size={10} /> {fn.source}
              </span>
            </div>
            <p className="text-brvm-subtext text-sm mt-1">{fn.description}</p>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0 text-brvm-muted">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-brvm-border">
          {/* Signature */}
          <div className="px-5 py-4 bg-slate-950">
            <pre className="text-emerald-400 text-xs font-mono overflow-x-auto">{`# R Code\n${fn.signature}`}</pre>
          </div>

          <div className="p-5 grid md:grid-cols-2 gap-5">
            {/* Colonnes retournées */}
            <div>
              <h4 className="text-brvm-text font-semibold text-sm mb-3 flex items-center gap-1.5">
                <Layers size={13} className="text-brvm-green" /> Colonnes retournées ({fn.returnCols.length})
              </h4>
              <div className="space-y-1.5">
                {fn.returnCols.map((col) => (
                  <div key={col.name} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-brvm-green bg-brvm-green/10 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
                      {col.type}
                    </span>
                    <div>
                      <span className="text-brvm-text text-xs font-semibold">{col.name}</span>
                      <span className="text-brvm-muted text-xs ml-1.5">{col.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exemple de sortie */}
            <div>
              <h4 className="text-brvm-text font-semibold text-sm mb-3 flex items-center gap-1.5">
                <Table2 size={13} className="text-brvm-green" /> Aperçu des données
              </h4>
              <div className="overflow-x-auto rounded-lg border border-brvm-border">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-brvm-border">
                    <tr>
                      {fn.example.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-brvm-subtext font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fn.example.rows.map((row, i) => (
                      <tr key={i} className="border-b border-brvm-border last:border-0 hover:bg-slate-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-brvm-text font-mono whitespace-nowrap">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function BrvmPackage() {
  return (
    <div className="space-y-8">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brvm-green/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="w-12 h-12 bg-brvm-green/20 rounded-xl flex items-center justify-center border border-brvm-green/30">
              <Package size={22} className="text-brvm-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">Package R — BRVM</h1>
                <span className="bg-brvm-green/20 text-brvm-green text-xs font-semibold px-2.5 py-1 rounded-full border border-brvm-green/30">
                  CRAN
                </span>
                <a
                  href="https://github.com/Koffi-Fredysessie/BRVM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20 hover:bg-white/20 transition flex items-center gap-1"
                >
                  <ExternalLink size={10} /> GitHub
                </a>
              </div>
              <p className="text-slate-400 text-sm mt-0.5">par Koffi Fredyssessie · Données temps réel BRVM</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            Ce package R accède aux données de la BRVM en scrapant 4 sources web : cours historiques OHLCV,
            fiches sociétés (RSI, Beta, PER), bulletin officiel journalier (15 colonnes) et classement des valeurs.
            Voici tout ce qui peut être extrait et intégré dans Afrivest.
          </p>
          <div className="flex gap-3 mt-5 flex-wrap">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 font-mono text-sm">
              <span className="text-slate-400"># CRAN</span>
              <br />
              <span className="text-emerald-400">install.packages</span>
              <span className="text-white">(</span>
              <span className="text-amber-300">"BRVM"</span>
              <span className="text-white">)</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 font-mono text-sm">
              <span className="text-slate-400"># GitHub (dev)</span>
              <br />
              <span className="text-emerald-400">devtools</span>
              <span className="text-white">::</span>
              <span className="text-blue-400">install_github</span>
              <span className="text-white">(</span>
              <span className="text-amber-300">"Koffi-Fredysessie/BRVM"</span>
              <span className="text-white">)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 sources de données ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-brvm-text font-semibold text-lg mb-4 flex items-center gap-2">
          <Database size={16} className="text-brvm-green" /> Sources de données
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SOURCES.map((s) => (
            <div key={s.name} className={`border rounded-xl p-4 ${s.color}`}>
              <p className="font-bold text-sm font-mono">{s.name}</p>
              <p className="text-xs mt-1.5 leading-relaxed opacity-80">{s.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Résumé des données disponibles ───────────────────────────────── */}
      <div>
        <h2 className="text-brvm-text font-semibold text-lg mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-brvm-green" /> Ce qu'on peut obtenir pour chaque action
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: <TrendingUp size={14} />, cat: 'Prix & volumes', items: ['Cours OHLCV quotidien', 'Historique multi-périodes (j/sem/mois/trim/an)', 'Volume en titres et en valeur FCFA', 'Prix de référence réglementaire', 'Variation quotidienne & annuelle'] },
            { icon: <Activity size={14} />, cat: 'Indicateurs techniques', items: ['Beta sur 1 an (vs marché)', 'RSI 14 jours', 'Plus haut / plus bas intraday', 'Cours de clôture J-1', 'Tendance (classement/ranking)'] },
            { icon: <BarChart3 size={14} />, cat: 'Fondamentaux', items: ['Capitalisation boursière', 'PER (Price-to-Earnings)', 'Rendement du dividende net (%)', 'Résultat net', 'Compartiment (Prestige / Principal)'] },
            { icon: <Database size={14} />, cat: 'Référentiel société', items: ['Ticker & dénomination complète', 'Secteur BRVM (8 secteurs)', 'Pays du siège (8 pays UEMOA)', 'URL de la page sikafinance', 'Appartenance à un indice'] },
            { icon: <ArrowUpDown size={14} />, cat: 'Indices BRVM (11)', items: ['BRVM-COMPOSITE', 'BRVM-30', 'BRVMFI (Finances)', 'BRVMIN (Industrie)', 'BRVMAG (Agriculture)', '+6 indices sectoriels YTD'] },
            { icon: <Calendar size={14} />, cat: 'Bulletin officiel', items: ['Revue par séance (date spécifique)', 'Toutes les 47 valeurs en 1 appel', 'Compartiment par valeur', 'Valeur échangée (FCFA/session)', 'Yield & PER officiels BRVM'] },
          ].map(({ icon, cat, items }) => (
            <div key={cat} className="bg-brvm-card border border-brvm-border rounded-xl p-4 shadow-sm">
              <h3 className="text-brvm-text font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="text-brvm-green">{icon}</span> {cat}
              </h3>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-brvm-subtext text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-brvm-green flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8 fonctions détaillées ────────────────────────────────────────── */}
      <div>
        <h2 className="text-brvm-text font-semibold text-lg mb-4 flex items-center gap-2">
          <Code2 size={16} className="text-brvm-green" /> Fonctions disponibles
          <span className="text-brvm-muted text-sm font-normal ml-2">Cliquer pour voir colonnes & aperçu des données</span>
        </h2>
        <div className="space-y-3">
          {FUNCTIONS.map((fn) => <FunctionCard key={fn.name} fn={fn} />)}
        </div>
      </div>

      {/* ── Intégration avec Afrivest ─────────────────────────────────────── */}
      <div>
        <h2 className="text-brvm-text font-semibold text-lg mb-4 flex items-center gap-2">
          <Layers size={16} className="text-brvm-green" /> Intégration dans Afrivest
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: 'Option A — R Plumber API',
              badge: 'Recommandé',
              badgeColor: 'bg-brvm-green/10 text-brvm-green',
              icon: <CheckCircle2 size={14} className="text-brvm-green" />,
              desc: 'Créer un serveur REST en R avec le package {plumber} qui expose le package BRVM via des endpoints HTTP. Notre backend Node.js appelle cette API interne.',
              steps: [
                'Installer R + {plumber} sur le serveur',
                'Créer des endpoints : /api/market, /api/history/{ticker}, /api/company/{ticker}',
                'Déployer sur Render / Railway / VPS',
                'Notre API Node.js proxifie les appels',
              ],
              code: `# plumber.R\n#* @get /market\nfunction() {\n  BRVM_stock_market(Sys.Date()-1)\n}\n#* @get /history/<ticker>\nfunction(ticker) {\n  BRVM_get(ticker, Sys.Date()-365, Sys.Date())\n}`,
            },
            {
              title: 'Option B — Scraper Node.js',
              badge: 'Alternatif',
              badgeColor: 'bg-blue-100 text-blue-700',
              icon: <AlertCircle size={14} className="text-blue-600" />,
              desc: 'Réécrire la logique de scraping en TypeScript avec axios + cheerio. Plus flexible mais nécessite de maintenir le scraper si sikafinance change son HTML.',
              steps: [
                'npm install axios cheerio',
                'POST vers https://sikafinance.com/api/general/GetHistos',
                'Scraper brvm.org/en/cours-actions/0/ avec cheerio',
                'Créer un cache Redis pour éviter les sur-requêtes',
              ],
              code: `// scraper.ts\nconst { data } = await axios.post(\n  'https://sikafinance.com/api/general/GetHistos',\n  { ticker: 'SNTS', datedeb: '2025-01-01',\n    datefin: '2026-02-27', xperiod: '0' }\n);\n// data.lst → [[date, open, high, low, close, vol]]`,
            },
            {
              title: 'Option C — Python FastAPI',
              badge: 'Simple',
              badgeColor: 'bg-amber-100 text-amber-700',
              icon: <AlertCircle size={14} className="text-amber-600" />,
              desc: 'Utiliser pandas + requests en Python exposé via FastAPI. Facile à déployer et proche de la logique R originale.',
              steps: [
                'pip install fastapi requests beautifulsoup4',
                'Implémenter les endpoints /prices, /info, /market',
                'Déployer sur Railway / Fly.io',
                'Remplacer les mocks dans notre frontend',
              ],
              code: `# main.py\n@app.get("/prices/{ticker}")\ndef get_prices(ticker: str, from_: str, to: str):\n    r = requests.post(\n        "https://sikafinance.com/api/general/GetHistos",\n        json={"ticker": ticker.upper(),\n              "datedeb": from_, "datefin": to,\n              "xperiod": "0"}\n    )\n    return r.json()["lst"]`,
            },
          ].map(({ title, badge, badgeColor, icon, desc, steps, code }) => (
            <div key={title} className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-2 mb-3">
                {icon}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-brvm-text font-semibold text-sm">{title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </div>
                  <p className="text-brvm-subtext text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
              <ol className="space-y-1 mb-4">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-brvm-subtext">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-brvm-muted text-xs flex items-center justify-center flex-shrink-0 font-mono mt-0.5">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <div className="bg-slate-950 rounded-lg p-3 overflow-x-auto">
                <pre className="text-emerald-400 text-xs font-mono leading-relaxed">{code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── État actuel vs cible ───────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
        <h2 className="text-brvm-text font-semibold text-base mb-4 flex items-center gap-2">
          <Activity size={15} className="text-brvm-green" /> État actuel vs données réelles
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brvm-border bg-slate-50">
                <th className="text-left px-4 py-2.5 text-brvm-subtext text-xs font-semibold uppercase">Données</th>
                <th className="text-left px-4 py-2.5 text-brvm-subtext text-xs font-semibold uppercase">Actuellement (mock)</th>
                <th className="text-left px-4 py-2.5 text-brvm-subtext text-xs font-semibold uppercase">Avec le package BRVM</th>
                <th className="text-left px-4 py-2.5 text-brvm-subtext text-xs font-semibold uppercase">Fonction R</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Cours du jour (47 actions)', '✅ Réels (Bulletin N°41)', '✅ Temps réel quotidien', 'BRVM_company_rank()'],
                ['Historique OHLCV', '⚠️ Généré (RNG seedé)', '✅ Réel depuis sikafinance', 'BRVM_get() / BRVM_get1()'],
                ['Beta & RSI', '❌ Non disponible', '✅ Beta 1 an + RSI 14j', 'BRVM_company_info()'],
                ['Capitalisation', '✅ Estimée', '✅ Capitalisation réelle', 'BRVM_company_info()'],
                ['PER & Rendement', '✅ Estimés (mock)', '✅ Officiels BRVM', 'BRVM_stock_market()'],
                ['Compartiment (Prestige/Principal)', '✅ Déduit (ID 1-12)', '✅ Officiel par valeur', 'BRVM_stock_market()'],
                ['Indices BRVM (11)', '❌ Non disponible', '✅ 11 indices + YTD', 'BRVM_index()'],
                ['Données sectorielles', '✅ Secteurs estimés', '✅ Officiel + volumes', 'BRVM_bySector()'],
                ['Valeur échangée (FCFA)', '❌ Non disponible', '✅ Volume × Prix par séance', 'BRVM_stock_market()'],
              ].map(([data, current, target, fn]) => (
                <tr key={data as string} className="border-b border-brvm-border last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-brvm-text text-sm font-medium">{data}</td>
                  <td className="px-4 py-3 text-brvm-subtext text-sm">{current}</td>
                  <td className="px-4 py-3 text-brvm-subtext text-sm">{target}</td>
                  <td className="px-4 py-3"><code className="text-brvm-green text-xs bg-brvm-green/10 px-1.5 py-0.5 rounded font-mono">{fn}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
