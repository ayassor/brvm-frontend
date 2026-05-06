import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Upload, FileText, ArrowLeft, Database,
  Copy, Check, Download, Eye, EyeOff, Trash2, RefreshCw,
  ChevronRight, AlertCircle, CheckCircle2, FileSpreadsheet,
  Building2, BarChart2, TrendingUp, Newspaper, MessageSquare, Target, BookOpen,
  GraduationCap, Users, Settings2, Activity,
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import DataImport from './DataImport'
import AdminSocietes        from './AdminSocietes'
import AdminFondamentaux    from './AdminFondamentaux'
import AdminDividendes      from './AdminDividendes'
import AdminActualites      from './AdminActualites'
import AdminResume          from './AdminResume'
import AdminRecommandations from './AdminRecommandations'
import AdminRapports        from './AdminRapports'
import AdminEducation       from './AdminEducation'
import AdminAssetManagers   from './AdminAssetManagers'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type Module = 'apercu' | 'societes' | 'fondamentaux' | 'dividendes' | 'bulletin' | 'historique' | 'actualites' | 'resume' | 'recommandations' | 'rapports' | 'education' | 'assetmanagers' | 'analytics'

interface BulletinRow {
  id:            number
  code:          string
  name:          string
  previousClose: number | null  // Cours de référence → previous_close
  close:         number | null  // Dernier cours      → close
  variation:     number | null  // Variation %        → variation
  volume:        number | null  // Quantité échangée  → volume
  valueTrad:     number | null  // Montant échangé    → value_traded
  valid:         boolean
}

interface ParseResult {
  date:     string | null
  bulletin: string | null
  rows:     BulletinRow[]
  rawLines: string[]
  indices:  { brvm10: number | null; brvmComp: number | null }
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const MONTHS: Record<string, string> = {
  janvier:'01', février:'02', fevrier:'02', mars:'03', avril:'04',
  mai:'05', juin:'06', juillet:'07', août:'08', aout:'08',
  septembre:'09', octobre:'10', novembre:'11', décembre:'12', decembre:'12',
}

// Extract all French-format numbers from a string
function extractFrNums(text: string): number[] {
  const cleaned = text.replace(/%/g, '').replace(/\s*-\s*/g, '-')
  const rx = /-?\d+(?:\s\d{3})*(?:,\d+)?/g
  return (cleaned.match(rx) ?? [])
    .map(m => parseFloat(m.replace(/\s/g, '').replace(',', '.')))
    .filter(n => !isNaN(n))
}

function sqlVal(n: number | null): string {
  return n === null ? 'NULL' : String(n)
}

function fmtBig(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T`
  if (n >= 1e9)  return `${(n / 1e9).toFixed(2)} Md`
  if (n >= 1e6)  return `${(n / 1e6).toFixed(2)} M`
  return n.toLocaleString('fr-FR')
}

/* ══════════════════════════════════════════════════════════════
   PDF PARSER
══════════════════════════════════════════════════════════════ */

// Known BRVM tickers for validation (auto-validates rows)
const KNOWN_TICKERS = new Set([
  'BOAC','BOAN','BOAS','BOAM','BOAT','BOAB','BOABF',
  'SGCI','ECOC','ETIT','CBIBF','NSIAC','BICC','SIBC','ORGT',
  'PALC','SCRC','SPHC','FTSC','NTLC','SLBC','BNBC','SHEC',
  'TTLC','ORAC','ONTBF','MVSC','CFAC','CABC','STBC','SDCC',
  'SMBC','TTRC','SDSC','ALSC','UNXC','NEIC','SAFC','CIEC',
  'STAC','SNCA','SIVC','SDCC','BICC','STBC','SEMC','UNLC','PRSC',
])

// Lines to skip (non-company lines that start with uppercase words)
const SKIP_PREFIXES = new Set([
  'COURS','VALEURS','COMPARTIMENT','VARIATION','VOLUME','MONTANT',
  'CAPITAL','NOMBRE','TITRE','BRVM','INDICATEUR','TOTAL','SOUS',
  'MARCHE','CODE','LIBELLE','LIBELLÉ','COTE','BULLETIN','OFFICIEL',
  'DATE','SEANCE','SÉANCE','VALEUR','NOMBRE','REFERENCE','RÉFÉRENCE',
])

async function parseBulletinPDF(buffer: ArrayBuffer): Promise<ParseResult> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise

  const allLines: string[] = []

  // Only extract pages 3 and 4 (BRVM data table pages)
  const pageStart = Math.min(3, pdf.numPages)
  const pageEnd   = Math.min(4, pdf.numPages)

  for (let p = pageStart; p <= pageEnd; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    // Group items by rounded Y position
    const byY = new Map<number, { str: string; x: number }[]>()
    for (const item of content.items) {
      if ('str' in item && item.str.trim()) {
        const y = Math.round((item as { transform: number[] }).transform[5] / 3) * 3
        const x = (item as { transform: number[] }).transform[4]
        if (!byY.has(y)) byY.set(y, [])
        byY.get(y)!.push({ str: item.str, x })
      }
    }

    // Sort rows top→bottom (descending Y in PDF coords)
    const sortedYs = [...byY.keys()].sort((a, b) => b - a)
    for (const y of sortedYs) {
      const items = byY.get(y)!.sort((a, b) => a.x - b.x)
      const line = items.map(i => i.str).join(' ').trim()
      if (line.length > 1) allLines.push(line)
    }
  }

  const fullText = allLines.join('\n')

  // ── Bulletin number ──────────────────────────────────────
  let bulletin: string | null = null
  const bnMatch = fullText.match(/[Nn]°\s*(\d+)/);
  if (bnMatch) bulletin = `N°${bnMatch[1]}`

  // ── Date ─────────────────────────────────────────────────
  let date: string | null = null
  const dateRx = /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/i
  for (const line of allLines) {
    const m = line.match(dateRx)
    if (m) {
      const month = MONTHS[m[2].toLowerCase()]
      date = `${m[3]}-${month}-${m[1].padStart(2, '0')}`
      break
    }
  }

  // ── BRVM Indices ─────────────────────────────────────────
  let brvm10: number | null = null
  let brvmComp: number | null = null
  for (const line of allLines) {
    if (/BRVM\s*10/i.test(line)) {
      const nums = extractFrNums(line)
      if (nums.length > 0) brvm10 = nums[0]
    }
    if (/BRVM\s*Composite/i.test(line)) {
      const nums = extractFrNums(line)
      if (nums.length > 0) brvmComp = nums[0]
    }
  }

  // ── Company rows ─────────────────────────────────────────
  const rows: BulletinRow[] = []
  let idCounter = 0

  for (const line of allLines) {
    // Must start with a ticker-like code (2-8 uppercase alphanum)
    const codeMatch = line.match(/^([A-Z][A-Z0-9]{1,7})\s+(.+)$/)
    if (!codeMatch) continue

    const code = codeMatch[1]
    const rest = codeMatch[2]

    // Skip known non-company lines
    if (SKIP_PREFIXES.has(code)) continue
    // Skip very short codes that are likely not tickers
    if (code.length < 2) continue
    // Skip lines that look like section headers (no digits)
    if (!/\d/.test(rest)) continue

    // Extract company name: uppercase letters/spaces until first digit
    const nameMatch = rest.match(/^([A-Z][A-Z\s\-'\.&/()ÉÈÊÀÂÎÙÛÔÄËÏÜÇ]+?)(?=\s+-?\d|\s+\d)/u)
    const name = nameMatch ? nameMatch[1].trim() : rest.split(/\d/)[0].trim()

    const afterName = rest.slice(name.length)
    const nums = extractFrNums(afterName)

    if (nums.length < 2) continue // Need at least 2 numbers

    // Bulletin columns: [0] Cours Réf → previous_close, [1] Dernier Cours → close,
    //                   [2] Variation %, [3] Volume, [4] Montant → value_traded
    rows.push({
      id:            ++idCounter,
      code,
      name,
      previousClose: nums[0] ?? null,
      close:         nums[1] ?? null,
      variation:     nums[2] ?? null,
      volume:        nums[3] ?? null,
      valueTrad:     nums[4] ?? null,
      valid: KNOWN_TICKERS.has(code),
    })
  }

  return { date, bulletin, rows, rawLines: allLines, indices: { brvm10, brvmComp } }
}

/* ══════════════════════════════════════════════════════════════
   SQL GENERATOR — Bulletin
══════════════════════════════════════════════════════════════ */
function generateBulletinSQL(result: ParseResult): string {
  const validRows = result.rows.filter(r => r.valid)
  if (!validRows.length) return '-- Aucune ligne valide sélectionnée'
  const d = result.date ?? 'YYYY-MM-DD'

  const ascending = [...validRows] // already one date, order by code alpha
  const values = ascending.map(r =>
    `  ('${r.code}', '${d}', ${sqlVal(r.close)}, ${sqlVal(r.previousClose)}, ` +
    `${sqlVal(r.variation)}, ${sqlVal(r.volume)}, ${sqlVal(r.valueTrad)}, NOW())`
  ).join(',\n')

  return `-- ══════════════════════════════════════════════
-- 1. Créer la table si elle n'existe pas encore
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS stock_prices (
  id             BIGINT        NOT NULL AUTO_INCREMENT,
  symbol         VARCHAR(10)   NOT NULL,
  date           DATE          NOT NULL,
  open           DECIMAL(12,4)     DEFAULT NULL,
  high           DECIMAL(12,4)     DEFAULT NULL,
  low            DECIMAL(12,4)     DEFAULT NULL,
  close          DECIMAL(12,4)     DEFAULT NULL,
  previous_close DECIMAL(12,4)     DEFAULT NULL,
  variation      DECIMAL(8,4)      DEFAULT NULL,
  volume         BIGINT            DEFAULT NULL,
  value_traded   DECIMAL(20,4)     DEFAULT NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_symbol_date (symbol, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ══════════════════════════════════════════════
-- 2. Insérer / mettre à jour — Bulletin${result.bulletin ? ' ' + result.bulletin : ''} — ${d}
--    ${validRows.length} valeur(s) extraite(s) (pages 3–4)
-- ══════════════════════════════════════════════
INSERT INTO stock_prices
  (symbol, date, close, previous_close, variation, volume, value_traded, created_at)
VALUES
${values}
ON DUPLICATE KEY UPDATE
  close          = VALUES(close),
  previous_close = VALUES(previous_close),
  variation      = VALUES(variation),
  volume         = VALUES(volume),
  value_traded   = VALUES(value_traded);`
}

/* ══════════════════════════════════════════════════════════════
   CSV EXPORT — Bulletin
══════════════════════════════════════════════════════════════ */
function exportBulletinCSV(result: ParseResult) {
  const validRows = result.rows.filter(r => r.valid)
  const d = result.date ?? ''
  const headers = 'symbol,date,close,previous_close,variation,volume,value_traded'
  const lines = validRows.map(r =>
    [r.code, d, r.close ?? '', r.previousClose ?? '',
     r.variation ?? '', r.volume ?? '', r.valueTrad ?? ''].join(',')
  )
  const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bulletin_${d || 'brvm'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════════ */
interface SidebarProps {
  active: Module
  onChange: (m: Module) => void
}

function Sidebar({ active, onChange }: SidebarProps) {
  type NavItem = { id: Module; icon: React.ReactNode; label: string; sub?: string }

  const dataItems: NavItem[] = [
    { id: 'societes',     icon: <Building2      size={16} />, label: 'Sociétés',          sub: '47 valeurs BRVM' },
    { id: 'fondamentaux', icon: <BarChart2       size={16} />, label: 'Fondamentaux',      sub: 'Données financières' },
    { id: 'dividendes',   icon: <TrendingUp      size={16} />, label: 'Dividendes',        sub: 'Historique versements' },
  ]
  const contentItems: NavItem[] = [
    { id: 'actualites',      icon: <Newspaper     size={16} />, label: 'Actualités',         sub: 'Créer & publier' },
    { id: 'resume',          icon: <MessageSquare size={16} />, label: 'Résumé analytique',  sub: 'Thèse exécutive' },
    { id: 'recommandations', icon: <Target        size={16} />, label: 'Recommandations',    sub: 'Objectifs de cours' },
    { id: 'rapports',        icon: <BookOpen      size={16} />, label: 'Rapports',           sub: 'Rapports financiers' },
  ]
  const platformItems: NavItem[] = [
    { id: 'education',    icon: <GraduationCap size={16} />, label: 'Formations',           sub: 'Cours & leçons' },
    { id: 'assetmanagers',icon: <Users         size={16} />, label: 'Soc. de gestion',     sub: 'SGI & SGO' },
    { id: 'analytics',    icon: <Activity      size={16} />, label: 'Analytics',            sub: 'Visiteurs & trafic' },
  ]
  const toolItems: NavItem[] = [
    { id: 'bulletin',  icon: <FileText        size={16} />, label: 'Bulletin de la Cote', sub: 'PDF → SQL' },
    { id: 'historique',icon: <FileSpreadsheet size={16} />, label: 'Import Historique',   sub: 'Excel / JSON / CSV' },
  ]

  const renderItem = (item: NavItem) => {
    const isActive = active === item.id
    return (
      <button
        key={item.id}
        onClick={() => onChange(item.id)}
        className={`w-full flex items-center gap-2.5 text-left transition-all rounded-lg px-2.5 py-2 group ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
      >
        {/* Icon pill */}
        <span className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 group-hover:text-slate-300 bg-white/5'
        }`}>
          {item.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[13px] font-medium leading-tight truncate ${isActive ? 'text-emerald-200' : ''}`}>{item.label}</p>
          {item.sub && (
            <p className={`text-[10px] truncate leading-tight mt-0.5 ${isActive ? 'text-emerald-400/60' : 'text-slate-600 group-hover:text-slate-500'}`}>
              {item.sub}
            </p>
          )}
        </div>
        {isActive && (
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto" />
        )}
      </button>
    )
  }

  const Section = ({ label, items }: { label: string; items: NavItem[] }) => (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 px-2.5 mb-1">{label}</p>
      <div className="space-y-0.5">
        {items.map(renderItem)}
      </div>
    </div>
  )

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/5" style={{ background: 'linear-gradient(180deg, #0f1e2e 0%, #0a1520 100%)' }}>

      {/* ── Logo ── */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          {/* Icon mark */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 opacity-90 shadow-lg shadow-emerald-900/50" />
            <div className="absolute inset-0 rounded-xl flex items-center justify-center">
              <TrendingUp size={17} className="text-white drop-shadow" />
            </div>
          </div>
          {/* Wordmark */}
          <div>
            <p className="font-extrabold text-white text-[15px] tracking-tight leading-none">
              Afri<span className="text-emerald-400">vest</span>
            </p>
            <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-500 uppercase mt-0.5">
              Admin
            </p>
          </div>
          {/* Status dot */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 animate-pulse" />
            <span className="text-[9px] text-slate-600 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-5 admin-scrollbar">
        {/* Overview */}
        <div>
          {renderItem({ id: 'apercu', icon: <LayoutDashboard size={16} />, label: "Vue d'ensemble", sub: 'Dashboard global' })}
        </div>

        <Section label="Données marché" items={dataItems} />
        <Section label="Contenu éditorial" items={contentItems} />
        <Section label="Plateforme" items={platformItems} />
        <Section label="Outils" items={toolItems} />
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <Link
          to="/admin"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 text-[12px] transition-colors"
        >
          <Settings2 size={14} /> Paramètres admin
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 text-[12px] transition-colors"
        >
          <ArrowLeft size={14} />
          Retour au site
        </Link>
      </div>
    </aside>
  )
}

/* ══════════════════════════════════════════════════════════════
   MODULE: VUE D'ENSEMBLE
══════════════════════════════════════════════════════════════ */
interface ModuleApercuProps {
  onNavigate: (m: Module) => void
}

function ModuleApercu({ onNavigate }: ModuleApercuProps) {
  const stats = [
    { label: 'Sociétés cotées',     value: '47',   unit: 'valeurs',    color: 'text-brvm-green',  bg: 'bg-brvm-green/8',  border: 'border-brvm-green/20' },
    { label: 'Obligations cotées',  value: '14',   unit: 'titres',     color: 'text-brvm-blue',   bg: 'bg-brvm-blue/8',   border: 'border-brvm-blue/20' },
    { label: 'Sociétés de gestion', value: '16',   unit: 'entités',    color: 'text-violet-600',  bg: 'bg-violet-50',     border: 'border-violet-200' },
    { label: 'Dernier bulletin',    value: 'N°41', unit: '27/02/2026', color: 'text-brvm-gold',   bg: 'bg-amber-50',      border: 'border-amber-200' },
  ]

  const quickLinks: { label: string; sub: string; module: Module; icon: React.ReactNode; color: string }[] = [
    { label: 'Sociétés',            sub: '47 valeurs BRVM',      module: 'societes',     icon: <Building2 size={16} />,      color: 'text-brvm-green' },
    { label: 'Fondamentaux',        sub: 'Données financières',  module: 'fondamentaux', icon: <BarChart2 size={16} />,       color: 'text-brvm-blue' },
    { label: 'Dividendes',          sub: 'Historique versements',module: 'dividendes',   icon: <TrendingUp size={16} />,      color: 'text-violet-600' },
    { label: 'Actualités',          sub: 'Créer & publier',         module: 'actualites',      icon: <Newspaper size={16} />,       color: 'text-teal-600' },
    { label: 'Résumé analytique',   sub: 'Texte exécutif & thèse',  module: 'resume',          icon: <MessageSquare size={16} />,   color: 'text-violet-600' },
    { label: 'Recommandations',     sub: 'Objectifs de cours',       module: 'recommandations', icon: <Target size={16} />,          color: 'text-orange-600' },
    { label: 'Rapports',            sub: 'Rapports financiers',      module: 'rapports',        icon: <BookOpen size={16} />,        color: 'text-cyan-600' },
    { label: 'Formations',          sub: 'Gérer les cours vidéo',    module: 'education',       icon: <BookOpen size={16} />,            color: 'text-emerald-600' },
    { label: 'Bulletin de la Cote', sub: 'PDF → extraction SQL',     module: 'bulletin',        icon: <FileText size={16} />,        color: 'text-brvm-gold' },
    { label: 'Import Historique',   sub: 'Excel & JSON → SQL',       module: 'historique',      icon: <FileSpreadsheet size={16} />, color: 'text-brvm-subtext' },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brvm-text">Vue d'ensemble</h1>
        <p className="text-brvm-subtext text-sm mt-1">Bienvenue dans l'espace d'administration Afrivest.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`bg-brvm-card border border-brvm-border rounded-2xl p-5`}>
            <p className="text-brvm-muted text-xs mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-brvm-muted text-xs mt-1">{s.unit}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div>
        <h2 className="text-xs font-semibold text-brvm-muted uppercase tracking-wider mb-3">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((l, i) => (
            <button
              key={i}
              onClick={() => onNavigate(l.module)}
              className="bg-brvm-card border border-brvm-border rounded-2xl p-5 hover:border-brvm-green/30 hover:bg-brvm-green/5 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center ${l.color} group-hover:bg-brvm-green/10 transition-colors`}>
                  {l.icon}
                </div>
                <div>
                  <p className="font-semibold text-brvm-text text-sm">{l.label}</p>
                  <p className="text-brvm-muted text-xs mt-0.5">{l.sub}</p>
                </div>
                <ChevronRight size={14} className="ml-auto mt-1 text-brvm-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* API Stats */}
      <div>
        <h2 className="text-xs font-semibold text-brvm-muted uppercase tracking-wider mb-3">API Stats</h2>
        <div className="bg-brvm-card border border-brvm-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database size={18} className="text-brvm-muted" />
            <span className="text-sm font-medium text-brvm-text">Connexion backend</span>
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-brvm-gold border border-amber-200 rounded-full">
              Non connecté
            </span>
          </div>
          <p className="text-brvm-subtext text-sm">
            Connectez votre backend pour voir les statistiques en temps réel.
          </p>
          <p className="text-brvm-muted text-xs mt-2">
            API URL : <code className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-brvm-subtext">/api/admin/stats</code>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MODULE: BULLETIN PDF
══════════════════════════════════════════════════════════════ */
function ModuleBulletin() {
  const [parsing,    setParsing]    = useState(false)
  const [result,     setResult]     = useState<ParseResult | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [fileName,   setFileName]   = useState<string | null>(null)
  const [showRaw,    setShowRaw]    = useState(false)
  const [sqlView,    setSqlView]    = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [editRow,    setEditRow]    = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const sql = result ? generateBulletinSQL(result) : ''
  const validCount = result?.rows.filter(r => r.valid).length ?? 0

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setParsing(true)
    setError(null)
    setResult(null)
    setSqlView(false)
    setShowRaw(false)
    try {
      const buf = await file.arrayBuffer()
      const res = await parseBulletinPDF(buf)
      setResult(res)
    } catch (e) {
      setError(`Erreur de parsing PDF : ${(e as Error).message}`)
    } finally {
      setParsing(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') handleFile(f)
  }, [handleFile])

  const toggleValid = (id: number) => {
    setResult(prev => prev ? {
      ...prev,
      rows: prev.rows.map(r => r.id === id ? { ...r, valid: !r.valid } : r)
    } : null)
  }

  const deleteRow = (id: number) => {
    setResult(prev => prev ? { ...prev, rows: prev.rows.filter(r => r.id !== id) } : null)
  }

  const updateField = (id: number, field: keyof BulletinRow, value: string) => {
    setResult(prev => prev ? {
      ...prev,
      rows: prev.rows.map(r => {
        if (r.id !== id) return r
        const numericFields = ['previousClose','close','variation','volume','valueTrad']
        if (numericFields.includes(field)) {
          const n = parseFloat(value.replace(',', '.'))
          return { ...r, [field]: isNaN(n) ? null : n }
        }
        return { ...r, [field]: value }
      })
    } : null)
  }

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-brvm-border bg-brvm-card">
        <h1 className="text-xl font-bold text-brvm-text flex items-center gap-2">
          <FileText size={20} className="text-brvm-green" />
          Bulletin de la Cote — Import PDF
        </h1>
        <p className="text-brvm-subtext text-sm mt-1">
          Uploadez le PDF du Bulletin Officiel BRVM pour extraire automatiquement les données de séance.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            parsing
              ? 'border-brvm-green/50 bg-brvm-green/5'
              : result
              ? 'border-brvm-green/40 bg-brvm-green/5'
              : 'border-brvm-border bg-slate-50 hover:border-brvm-green/50 hover:bg-brvm-green/5'
          }`}
          onClick={() => !parsing && fileRef.current?.click()}
        >
          <input
            ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }}
          />
          {parsing ? (
            <div className="space-y-2">
              <RefreshCw size={32} className="mx-auto text-brvm-green animate-spin" />
              <p className="text-brvm-green font-medium">Analyse du PDF en cours…</p>
              <p className="text-brvm-muted text-sm">{fileName}</p>
            </div>
          ) : result ? (
            <div className="space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-brvm-green" />
              <p className="text-brvm-green font-semibold">{fileName}</p>
              <p className="text-brvm-subtext text-sm">
                {result.rows.length} ligne{result.rows.length > 1 ? 's' : ''} détectée{result.rows.length > 1 ? 's' : ''}
                {result.date ? ` — séance du ${result.date}` : ''}
              </p>
              <p className="text-brvm-muted text-xs">Cliquez pour changer de fichier</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload size={32} className="mx-auto text-brvm-muted" />
              <p className="text-brvm-text font-medium">Déposez le PDF ici ou cliquez pour choisir</p>
              <p className="text-brvm-subtext text-sm">Bulletin Officiel BRVM (.pdf)</p>
              <p className="text-brvm-muted text-xs">Glisser-déposer supporté</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-brvm-red text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Bulletin metadata */}
        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Date séance',    value: result.date      ?? '—' },
              { label: 'Bulletin',       value: result.bulletin  ?? '—' },
              { label: 'BRVM 10',        value: result.indices.brvm10 != null ? result.indices.brvm10.toLocaleString('fr-FR') : '—' },
              { label: 'BRVM Composite', value: result.indices.brvmComp != null ? result.indices.brvmComp.toLocaleString('fr-FR') : '—' },
            ].map((s, i) => (
              <div key={i} className="bg-brvm-card border border-brvm-border rounded-xl p-4">
                <p className="text-brvm-muted text-xs mb-1">{s.label}</p>
                <p className="text-brvm-text font-bold font-mono">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Result tabs */}
        {result && (
          <div className="bg-brvm-card border border-brvm-border rounded-2xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-brvm-border bg-slate-50">
              <div className="flex items-center gap-1 bg-white border border-brvm-border rounded-lg p-1">
                {[
                  { id: false, label: `Données extraites (${result.rows.length})` },
                  { id: true,  label: 'Texte brut' },
                ].map(tab => (
                  <button
                    key={String(tab.id)}
                    onClick={() => setShowRaw(tab.id)}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      showRaw === tab.id
                        ? 'bg-brvm-green text-white shadow-sm'
                        : 'text-brvm-subtext hover:text-brvm-text'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {!showRaw && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brvm-muted">{validCount} valide{validCount > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setSqlView(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sqlView
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-brvm-subtext hover:bg-slate-200 border border-brvm-border'
                    }`}
                  >
                    <Database size={13} />
                    {sqlView ? 'Vue table' : 'Voir SQL'}
                  </button>
                  <button
                    onClick={() => exportBulletinCSV(result)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-brvm-border rounded-lg text-xs font-semibold text-brvm-subtext transition-colors"
                  >
                    <Download size={13} />
                    CSV
                  </button>
                </div>
              )}
            </div>

            {showRaw ? (
              /* ── Raw text view ── */
              <div className="p-5 max-h-[500px] overflow-y-auto bg-slate-50">
                <pre className="text-[11px] font-mono text-brvm-subtext leading-relaxed whitespace-pre-wrap select-all">
                  {result.rawLines.join('\n')}
                </pre>
              </div>
            ) : sqlView ? (
              /* ── SQL view ── */
              <div>
                <div className="flex items-center gap-3 px-5 py-3 border-b border-brvm-border bg-slate-50">
                  <span className="text-xs text-brvm-subtext">SQL généré ({validCount} lignes)</span>
                  <button
                    onClick={handleCopySQL}
                    className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                      copied
                        ? 'bg-brvm-green text-white'
                        : 'bg-violet-600 hover:bg-violet-700 text-white'
                    }`}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <div className="p-5">
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-4 rounded-xl overflow-x-auto max-h-[420px] leading-relaxed border border-slate-700/50 select-all">
                    {sql}
                  </pre>
                </div>
              </div>
            ) : (
              /* ── Data table ── */
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-brvm-muted uppercase tracking-wider text-[10px] border-b border-brvm-border">
                      <th className="px-3 py-3 text-center w-8">✓</th>
                      <th className="px-3 py-3 text-left">Symbol</th>
                      <th className="px-3 py-3 text-left">Libellé</th>
                      <th className="px-3 py-3 text-right">previous_close</th>
                      <th className="px-3 py-3 text-right">close</th>
                      <th className="px-3 py-3 text-right">variation (%)</th>
                      <th className="px-3 py-3 text-right">volume</th>
                      <th className="px-3 py-3 text-right">value_traded</th>
                      <th className="px-3 py-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-brvm-muted">
                          <AlertCircle size={28} className="mx-auto mb-2 opacity-40" />
                          <p>Aucune ligne détectée dans les pages 3–4 de ce PDF.</p>
                          <p className="text-xs mt-1 text-brvm-muted">Vérifiez le texte brut pour diagnostiquer.</p>
                        </td>
                      </tr>
                    ) : result.rows.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-t border-brvm-border transition-colors ${
                          !row.valid
                            ? 'opacity-40 bg-slate-50'
                            : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        {/* Toggle valid */}
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => toggleValid(row.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              row.valid
                                ? 'bg-brvm-green/15 text-brvm-green hover:bg-red-100 hover:text-brvm-red'
                                : 'bg-slate-100 text-brvm-muted hover:bg-brvm-green/15 hover:text-brvm-green'
                            }`}
                          >
                            {row.valid ? <Check size={11} /> : <EyeOff size={11} />}
                          </button>
                        </td>

                        {/* Code / Symbol */}
                        <td className="px-3 py-2">
                          {editRow === row.id ? (
                            <input
                              defaultValue={row.code}
                              onBlur={e => { updateField(row.id, 'code', e.target.value); setEditRow(null) }}
                              className="w-20 bg-white border border-brvm-border rounded px-1.5 py-0.5 font-mono text-brvm-text text-xs uppercase focus:outline-none focus:border-brvm-green"
                              autoFocus
                            />
                          ) : (
                            <button onClick={() => setEditRow(row.id)} className="font-mono font-bold text-brvm-green hover:text-emerald-700">
                              {row.code}
                            </button>
                          )}
                        </td>

                        {/* Name */}
                        <td className="px-3 py-2 text-brvm-subtext max-w-[200px] truncate" title={row.name}>{row.name}</td>

                        {/* previous_close */}
                        <td className="px-3 py-2 text-right tabular-nums text-brvm-subtext font-mono">
                          {row.previousClose !== null ? row.previousClose.toLocaleString('fr-FR') : <span className="text-brvm-muted">—</span>}
                        </td>

                        {/* close */}
                        <td className="px-3 py-2 text-right tabular-nums text-brvm-text font-mono font-semibold">
                          {row.close !== null ? row.close.toLocaleString('fr-FR') : <span className="text-brvm-muted">—</span>}
                        </td>

                        {/* variation */}
                        <td className={`px-3 py-2 text-right tabular-nums font-semibold ${
                          row.variation === null ? 'text-brvm-muted'
                          : row.variation > 0    ? 'text-brvm-green'
                          : row.variation < 0    ? 'text-brvm-red'
                          : 'text-brvm-subtext'
                        }`}>
                          {row.variation !== null
                            ? `${row.variation > 0 ? '+' : ''}${row.variation.toFixed(2)}%`
                            : '—'}
                        </td>

                        {/* volume */}
                        <td className="px-3 py-2 text-right tabular-nums text-brvm-subtext">
                          {row.volume !== null ? row.volume.toLocaleString('fr-FR') : <span className="text-brvm-muted">—</span>}
                        </td>

                        {/* value_traded */}
                        <td className="px-3 py-2 text-right tabular-nums text-brvm-subtext">
                          {row.valueTrad !== null ? fmtBig(row.valueTrad) : <span className="text-brvm-muted">—</span>}
                        </td>

                        {/* Delete */}
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => deleteRow(row.id)} className="text-brvm-muted hover:text-brvm-red transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !parsing && !error && (
          <div className="text-center py-16 text-brvm-muted">
            <FileText size={44} className="mx-auto mb-3 opacity-20" />
            <p className="text-brvm-subtext text-sm">Uploadez un bulletin PDF pour démarrer l'extraction</p>
            <p className="text-brvm-muted text-xs mt-1">Les données seront analysées côté client — aucun envoi serveur.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* EducationRedirect — supprimé, AdminEducation est monté directement */

/* ══════════════════════════════════════════════════════════════
   TOPBAR BREADCRUMB LABELS
══════════════════════════════════════════════════════════════ */
const MODULE_LABELS: Record<Module, string> = {
  apercu:          "Vue d'ensemble",
  societes:        'Sociétés',
  fondamentaux:    'Fondamentaux',
  dividendes:      'Dividendes',
  actualites:      'Actualités',
  resume:          'Résumé analytique',
  recommandations: 'Recommandations',
  rapports:        'Rapports financiers',
  education:       'Formations',
  assetmanagers:   'Sociétés de gestion',
  analytics:       'Analytics',
  bulletin:        'Bulletin de la Cote',
  historique:      'Import Historique',
}

/* ══════════════════════════════════════════════════════════════
   MODULE ANALYTICS
══════════════════════════════════════════════════════════════ */
function ModuleAnalytics() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brvm-text">Analytics — Visiteurs & Trafic</h2>
        <p className="text-brvm-subtext text-sm mt-0.5">
          Statistiques en temps réel de <span className="font-medium text-brvm-green">afrivesting.com</span>
          {' · '}
          <a href="https://analytics.afrivesting.com" target="_blank" rel="noopener noreferrer"
            className="text-brvm-green hover:underline text-xs">
            Ouvrir dans un nouvel onglet ↗
          </a>
        </p>
      </div>
      <div className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm" style={{ height: '82vh' }}>
        <iframe
          src="https://analytics.afrivesting.com/share/afrivesting1"
          className="w-full h-full border-0"
          title="Umami Analytics"
          allow="fullscreen"
        />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════════════════════════════ */
export default function Admin() {
  const [module, setModule] = useState<Module>('apercu')

  // Live clock
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-screen flex bg-brvm-bg text-brvm-text overflow-hidden">
      <Sidebar active={module} onChange={setModule} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-white/5 bg-[#0d1b2a] flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="text-white font-medium">{MODULE_LABELS[module]}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>{time}</span>
            <span className="w-px h-3 bg-white/10" />
            <span>Afrivest v0.1</span>
          </div>
        </div>

        {/* Module content */}
        <div className="flex-1 overflow-y-auto">
          {module === 'apercu'       && <ModuleApercu onNavigate={setModule} />}
          {module === 'societes'     && <AdminSocietes />}
          {module === 'fondamentaux' && <AdminFondamentaux />}
          {module === 'dividendes'   && <AdminDividendes />}
          {module === 'actualites'      && <AdminActualites />}
          {module === 'resume'          && <AdminResume />}
          {module === 'recommandations' && <AdminRecommandations />}
          {module === 'rapports'        && <AdminRapports />}
          {module === 'education'       && <AdminEducation />}
          {module === 'assetmanagers'   && <AdminAssetManagers />}
          {module === 'analytics'       && <ModuleAnalytics />}
          {module === 'bulletin'        && <ModuleBulletin />}
          {module === 'historique'      && <DataImport />}
        </div>
      </main>
    </div>
  )
}
