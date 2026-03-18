import { useState } from 'react'
import {
  Play, Download, Shield, TrendingUp, TrendingDown,
  BarChart3, Activity, DollarSign, Percent,
  BookOpen, ChevronRight, CheckCircle, XCircle,
  Mic,
} from 'lucide-react'
import type { Company } from '../../types'
import type { CompanyExtras } from '../../mocks/brvm-data'
import type { CompanyFullDetail } from '../../mocks/company-details'

interface SummaryPanelProps {
  company: Company | null
  extras: CompanyExtras | null
  details: CompanyFullDetail | null
  ticker: string
  currentPrice: number | null
  dailyVar: number | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(n: number | null): string {
  if (n == null) return '—'
  return Math.round(n).toLocaleString('fr-FR')
}

function fmtMktCap(n: number | null | undefined): string {
  if (!n) return '—'
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)} T FCFA`
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)} Md FCFA`
  return `${(n / 1_000_000).toFixed(0)} M FCFA`
}

// Generate a realistic executive summary from company data
function buildSummary(
  company: Company,
  extras: CompanyExtras | null,
  details: CompanyFullDetail | null,
): string[] {
  const name = company.name
  const sector = company.sector ?? "secteur d'activité"
  const country = company.country ?? "Afrique de l'Ouest"
  const ca = extras?.revenue_bn_fcfa ? `${extras.revenue_bn_fcfa} milliards FCFA` : 'plusieurs milliards FCFA'
  const ni = details?.net_income_bn_fcfa ? `${details.net_income_bn_fcfa} Md FCFA` : null
  const margin = details?.net_margin_pct ? `${details.net_margin_pct}%` : null
  const pe = extras?.pe_ratio ? `${extras.pe_ratio}×` : null
  const dy = extras?.dividend_yield ? `${extras.dividend_yield}%` : null
  const ceo = details?.ceo ?? null
  const ebitda = details?.ebitda_bn_fcfa ? `${details.ebitda_bn_fcfa} Md FCFA` : null

  const p1 = `${name} est l'un des émetteurs emblématiques de la Bourse Régionale des Valeurs Mobilières (BRVM), cotée dans le secteur ${sector} avec une présence affirmée en ${country}. La société génère un chiffre d'affaires de ${ca}, ce qui en fait un acteur de référence dans l'espace UEMOA.`

  const p2parts: string[] = []
  if (ni) p2parts.push(`un résultat net de ${ni}`)
  if (margin) p2parts.push(`une marge nette de ${margin}`)
  if (ebitda) p2parts.push(`un EBITDA de ${ebitda}`)
  const p2 = p2parts.length > 0
    ? `Sur le plan financier, ${name} affiche ${p2parts.join(', ')}, démontrant une capacité bénéficiaire solide dans un environnement macroéconomique régional globalement porteur. ${pe ? `Le ratio cours/bénéfice de ${pe} reste en ligne avec les valorisations historiques observées sur la BRVM.` : ''}`
    : `${name} maintient une structure financière robuste, caractérisée par une gestion prudente des charges opérationnelles et une allocation du capital orientée vers la croissance à long terme.`

  const p3 = `${ceo ? `Sous la direction de ${ceo}, la` : 'La'} direction générale a articulé une stratégie claire de consolidation de la position de marché et d'expansion des activités dans les pays de l'UEMOA. ${dy ? `Le rendement du dividende de ${dy} constitue un argument supplémentaire pour les investisseurs en quête de revenus récurrents.` : 'La politique de distribution des dividendes reste alignée sur les objectifs de croissance du groupe.'} Les perspectives pour l'exercice 2026 s'annoncent favorables, portées par la dynamique de consommation régionale et les réformes structurelles en cours.`

  return [p1, p2, p3]
}

function buildBullCase(
  company: Company,
  extras: CompanyExtras | null,
  details: CompanyFullDetail | null,
): string[] {
  const pe = extras?.pe_ratio
  const dy = extras?.dividend_yield
  const margin = details?.net_margin_pct
  const sector = company.sector ?? ''

  const bulls: string[] = []

  if (pe && pe < 15) bulls.push(`Valorisation attractive avec un PER de ${pe}×, inférieur à la médiane BRVM (~15×)`)
  else bulls.push(`Solidité du modèle économique avec des revenus récurrents et prévisibles`)

  if (dy && dy > 3) bulls.push(`Rendement dividendaire de ${dy}% — bien au-dessus du taux sans risque régional`)
  else bulls.push(`Potentiel de revalorisation du cours à mesure que les résultats progressent`)

  if (margin && margin > 10) bulls.push(`Marge nette de ${margin}% témoignant d'une efficacité opérationnelle supérieure à la moyenne sectorielle`)
  else bulls.push(`Efforts de réduction des coûts en cours, de nature à améliorer la rentabilité`)

  if (sector.toLowerCase().includes('banque') || sector.toLowerCase().includes('financier')) {
    bulls.push(`Exposition directe à la croissance du crédit en zone UEMOA (+12% attendus en 2026)`)
  } else if (sector.toLowerCase().includes('télécommunication') || sector.toLowerCase().includes('tech')) {
    bulls.push(`Pénétration mobile et numérique encore faible — fort potentiel de croissance structurelle`)
  } else {
    bulls.push(`Demande domestique soutenue par l'urbanisation accélérée et la hausse du pouvoir d'achat`)
  }

  return bulls
}

function buildBearCase(
  company: Company,
  extras: CompanyExtras | null,
): string[] {
  const pe = extras?.pe_ratio
  const sector = company.sector ?? ''

  const bears: string[] = []

  if (pe && pe > 20) bears.push(`Multiple de valorisation élevé (${pe}×) — correction possible si les résultats déçoivent`)
  else bears.push(`Sensibilité aux fluctuations macroéconomiques régionales (inflation, taux de change XOF)`)

  if (sector.toLowerCase().includes('banque')) {
    bears.push(`Risque de crédit amplifié en cas de dégradation du cycle économique UEMOA`)
  } else {
    bears.push(`Dépendance aux matières premières importées libellées en devises étrangères`)
  }

  bears.push(`Liquidité du titre parfois limitée — spread bid/ask pouvant impacter les positions importantes`)

  return bears
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SummaryPanel({
  company,
  extras,
  details,
  ticker,
  currentPrice,
  dailyVar,
}: SummaryPanelProps) {

  const [videoHovered, setVideoHovered] = useState(false)

  if (!company) {
    return (
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-8 text-center">
        <p className="text-brvm-muted text-sm">Données non disponibles</p>
      </div>
    )
  }

  const companyName = company.name
  const isPos = (dailyVar ?? 0) >= 0
  const pe = extras?.pe_ratio ?? null
  const dy = extras?.dividend_yield ?? null

  const summaryParagraphs = buildSummary(company, extras, details)
  const bullCase = buildBullCase(company, extras, details)
  const bearCase = buildBearCase(company, extras)

  // ── Download handler ───────────────────────────────────────────────────────
  const handleDownload = () => {
    const year = new Date().getFullYear()
    const lines: string[] = [
      `════════════════════════════════════════════════════════`,
      `  AFRIVEST RESEARCH — NOTE D'ANALYSE`,
      `  ${ticker} · ${companyName}`,
      `  Mars 2026 — Confidentiel investisseur`,
      `════════════════════════════════════════════════════════`,
      ``,
      `RÉSUMÉ EXÉCUTIF`,
      `───────────────`,
      ...summaryParagraphs.map(p => p + '\n'),
      ``,
      `THÈSE HAUSSIÈRE (BULL CASE)`,
      `───────────────────────────`,
      ...bullCase.map(b => `  ✓ ${b}`),
      ``,
      `FACTEURS DE RISQUE (BEAR CASE)`,
      `───────────────────────────────`,
      ...bearCase.map(b => `  ✗ ${b}`),
      ``,
      `DONNÉES CLÉS`,
      `────────────`,
      `  Cours actuel         : ${fmtPrice(currentPrice)} FCFA`,
      `  Variation journalière : ${dailyVar != null ? (isPos ? '+' : '') + dailyVar.toFixed(2) + '%' : '—'}`,
      `  Capitalisation        : ${fmtMktCap(company.market_cap)}`,
      `  P/E Ratio             : ${pe ? pe + '×' : '—'}`,
      `  Rendement div.        : ${dy ? dy + '%' : '—'}`,
      extras?.revenue_bn_fcfa ? `  Chiffre d'affaires    : ${extras.revenue_bn_fcfa} Md FCFA` : '',
      details?.net_income_bn_fcfa ? `  Résultat net          : ${details.net_income_bn_fcfa} Md FCFA` : '',
      details?.net_margin_pct ? `  Marge nette           : ${details.net_margin_pct}%` : '',
      ``,
      `────────────────────────────────────────────────────────`,
      `Afrivest Research · ${ticker}_afrivest_research_${year}.txt`,
      `Ce document est fourni à titre informatif uniquement.`,
      `Il ne constitue pas un conseil en investissement.`,
      `════════════════════════════════════════════════════════`,
    ].filter(l => l !== undefined)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ticker}_afrivest_research_${year}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const youtubeUrl = `https://www.youtube.com/results?search_query=BRVM+${ticker}+bourse`

  // ── Stat cards data ────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Cours actuel',
      value: currentPrice != null ? `${fmtPrice(currentPrice)} F` : '—',
      icon: <DollarSign size={14} />,
      color: 'text-brvm-green',
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Variation',
      value: dailyVar != null ? `${isPos ? '+' : ''}${dailyVar.toFixed(2)}%` : '—',
      icon: isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      color: isPos ? 'text-brvm-green' : 'text-brvm-red',
      bg: isPos ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100',
    },
    {
      label: 'Capitalisation',
      value: fmtMktCap(company.market_cap),
      icon: <BarChart3 size={14} />,
      color: 'text-blue-500',
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      label: 'P/E Ratio',
      value: pe ? `${pe}×` : '—',
      icon: <Activity size={14} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
  ]

  return (
    <div className="space-y-5">

      {/* ── Video capsule ────────────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic size={14} className="text-brvm-green" />
            <span className="text-brvm-text text-sm font-semibold">Capsule vidéo — Afrivest Research</span>
          </div>
          <span className="text-xs bg-slate-100 text-brvm-muted px-2 py-0.5 rounded-full font-mono">~4:30</span>
        </div>

        {/* Video placeholder */}
        <div
          className="relative mx-5 mb-5 rounded-xl overflow-hidden cursor-pointer group"
          style={{ aspectRatio: '16/9' }}
          onClick={() => window.open(youtubeUrl, '_blank', 'noopener,noreferrer')}
          onMouseEnter={() => setVideoHovered(true)}
          onMouseLeave={() => setVideoHovered(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') window.open(youtubeUrl, '_blank', 'noopener,noreferrer') }}
          aria-label={`Regarder la présentation ${companyName} sur YouTube`}
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              background: videoHovered
                ? 'linear-gradient(135deg, #0f2027 0%, #1a3a4a 40%, #0d2035 100%)'
                : 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
            }}
          />

          {/* Abstract market lines decoration */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" viewBox="0 0 800 450" preserveAspectRatio="none">
              <polyline
                points="0,300 80,280 160,260 240,290 320,220 400,200 480,230 560,180 640,160 720,140 800,120"
                fill="none" stroke="#10b981" strokeWidth="2"
              />
              <polyline
                points="0,340 80,330 160,320 240,335 320,290 400,270 480,295 560,260 640,240 720,220 800,200"
                fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6,4"
              />
              {/* Candlestick shapes */}
              {[80, 160, 240, 320, 400, 480, 560, 640, 720].map((x, i) => (
                <g key={x}>
                  <rect x={x - 8} y={200 + i * 8} width="16" height={20 + i * 3}
                    fill={i % 2 === 0 ? '#10b981' : '#ef4444'} opacity="0.6" rx="1" />
                  <line x1={x} y1={196 + i * 8} x2={x} y2={224 + i * 11}
                    stroke={i % 2 === 0 ? '#10b981' : '#ef4444'} strokeWidth="1.5" opacity="0.6" />
                </g>
              ))}
            </svg>
          </div>

          {/* BRVM/Afrivest logo area */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-7 h-7 bg-brvm-green rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-white text-xs font-semibold opacity-90">Afrivest Research</span>
          </div>

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              videoHovered
                ? 'bg-brvm-green scale-110 shadow-lg shadow-brvm-green/40'
                : 'bg-white/20 backdrop-blur-sm border border-white/30'
            }`}>
              <Play
                size={26}
                className={`transition-colors duration-300 ml-1 ${videoHovered ? 'text-white' : 'text-white'}`}
                fill={videoHovered ? 'white' : 'rgba(255,255,255,0.9)'}
              />
            </div>
          </div>

          {/* Title overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
            <p className="text-white text-sm font-semibold leading-tight">
              Présentation {companyName} — Afrivest Research
            </p>
            <p className="text-white/70 text-xs mt-0.5">Analyse sectorielle · BRVM · Mars 2026</p>
          </div>

          {/* YouTube badge */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-all duration-200 ${
              videoHovered ? 'bg-red-600 text-white' : 'bg-black/40 text-white/80'
            }`}>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="currentColor">
                <path d="M9.8 1.3S9.7.5 9.3.2C8.9-.2 8.4-.2 8.2 0 6.9.1 5 .1 5 .1S3.1.1 1.8 0C1.6-.2 1.1-.2.7.2.3.5.2 1.3.2 1.3S.1 2.3.1 3.3v.9c0 1 .1 2 .1 2s.1.8.5 1.1c.4.4.9.4 1.2.3C2.9 7.5 5 7.4 5 7.4s1.9 0 3.2-.1c.2-.2.7-.2 1.1-.6.4-.3.5-1.1.5-1.1S10 5.2 10 4.2v-.9C10 2.3 9.8 1.3 9.8 1.3zM4 5.2V2.2l2.8 1.5L4 5.2z" />
              </svg>
              Rechercher sur YouTube
            </div>
          </div>
        </div>
      </div>

      {/* ── Key stats grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-3.5 ${bg}`}>
            <div className={`flex items-center gap-1.5 text-xs mb-1.5 ${color}`}>
              {icon}
              <span className="text-brvm-muted">{label}</span>
            </div>
            <p className={`font-bold text-base font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Résumé exécutif ──────────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-brvm-text font-semibold flex items-center gap-2">
            <BookOpen size={15} className="text-brvm-green" />
            Résumé exécutif
          </h3>
          <span className="text-xs text-brvm-muted bg-slate-100 px-2 py-0.5 rounded-full">Afrivest Research · Mars 2026</span>
        </div>

        {/* Paragraphs */}
        <div className="space-y-3 mb-5">
          {summaryParagraphs.map((para, i) => (
            <p key={i} className="text-brvm-subtext text-sm leading-relaxed">{para}</p>
          ))}
        </div>

        {/* Bull / Bear two-column */}
        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-brvm-border">
          {/* Bull case */}
          <div>
            <p className="text-brvm-text text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-brvm-green" />
              Arguments haussiers
            </p>
            <ul className="space-y-1.5">
              {bullCase.map((point, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-brvm-subtext">
                  <CheckCircle size={12} className="text-brvm-green mt-0.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Bear case */}
          <div>
            <p className="text-brvm-text text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingDown size={12} className="text-brvm-red" />
              Facteurs de vigilance
            </p>
            <ul className="space-y-1.5">
              {bearCase.map((point, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-brvm-subtext">
                  <XCircle size={12} className="text-brvm-red mt-0.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key thesis bullets */}
        <div className="mt-4 pt-4 border-t border-brvm-border">
          <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2.5">Points clés de la thèse</p>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {[
              `Valeur de référence BRVM — liquidité et visibilité institutionnelle`,
              `Exposition directe à la croissance économique UEMOA (PIB +6% est. 2026)`,
              pe ? `Multiple PER ${pe}× — convergence vers juste valeur attendue d'ici 12 mois` : `Potentiel de rerating si résultats 2026 dépassent consensus`,
              dy ? `Dividende régulier de ${dy}% — rendement total attractif vs dépôts bancaires` : `Approche croissance pure — réinvestissement des bénéfices privilégié`,
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-brvm-subtext">
                <ChevronRight size={11} className="text-brvm-green mt-0.5 flex-shrink-0" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Download + Analyst badge row ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 bg-brvm-green hover:bg-brvm-green/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Download size={15} />
          Télécharger la note de recherche
          <span className="text-white/70 text-xs font-normal">.txt</span>
        </button>

        {/* Analyst badge */}
        <div className="flex items-center gap-2 bg-brvm-card border border-brvm-border rounded-lg px-3.5 py-2">
          <div className="w-7 h-7 bg-gradient-to-br from-brvm-green to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield size={13} className="text-white" />
          </div>
          <div>
            <p className="text-brvm-text text-xs font-semibold">Afrivest Research</p>
            <p className="text-brvm-muted text-xs">Mars 2026 · Analyse certifiée</p>
          </div>
          <div className="ml-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <svg key={s} width="9" height="9" viewBox="0 0 10 10" fill={s <= 4 ? '#10b981' : '#e2e8f0'}>
                <polygon points="5,0 6.18,3.63 10,3.63 6.9,5.88 8.09,9.51 5,7.26 1.91,9.51 3.1,5.88 0,3.63 3.82,3.63" />
              </svg>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
