import {
  TrendingUp, TrendingDown, XCircle, CheckCircle,
  Clock, AlertTriangle, Target, Users, ChevronRight,
  Zap, ShieldAlert,
} from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
} from 'recharts'
import type { Company } from '../../types'
import type { CompanyExtras } from '../../mocks/brvm-data'
import type { CompanyFullDetail } from '../../mocks/company-details'

interface RecoPanelProps {
  company: Company | null
  extras: CompanyExtras | null
  details: CompanyFullDetail | null
  ticker: string
  currentPrice: number | null
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type RecoLevel = 'ACHAT FORT' | 'ACHAT' | 'NEUTRE' | 'VENTE'

interface AnalystRow {
  firm: string
  analyst: string
  reco: 'ACHAT' | 'NEUTRE' | 'VENTE'
  target: number | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(n: number | null): string {
  if (n == null) return '—'
  return Math.round(n).toLocaleString('fr-FR')
}

function pct(a: number | null, b: number | null): string {
  if (a == null || b == null || a === 0) return '—'
  return `${((b - a) / a * 100).toFixed(1)}%`
}

function pctVal(a: number | null, b: number | null): number | null {
  if (a == null || b == null || a === 0) return null
  return (b - a) / a * 100
}

// ─── Reco computation ──────────────────────────────────────────────────────────

function computeReco(pe: number | null, margin: number | null): RecoLevel {
  if (pe != null && margin != null) {
    if (pe < 12 && margin > 8) return 'ACHAT FORT'
    if (pe < 18) return 'ACHAT'
    return 'NEUTRE'
  }
  if (pe != null) {
    if (pe < 12) return 'ACHAT FORT'
    if (pe < 18) return 'ACHAT'
    return 'NEUTRE'
  }
  return 'NEUTRE'
}

const RECO_CONFIG: Record<RecoLevel, { color: string; bg: string; border: string; light: string; score: number }> = {
  'ACHAT FORT': { color: 'text-brvm-green', bg: 'bg-emerald-50', border: 'border-emerald-200', light: '#10b981', score: 92 },
  'ACHAT':      { color: 'text-emerald-600', bg: 'bg-emerald-50/60', border: 'border-emerald-100', light: '#34d399', score: 72 },
  'NEUTRE':     { color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   light: '#f59e0b', score: 48 },
  'VENTE':      { color: 'text-brvm-red',    bg: 'bg-red-50',      border: 'border-red-200',     light: '#ef4444', score: 22 },
}

// ─── Horizon based on sector ───────────────────────────────────────────────────

function getHorizon(sector: string | null): { label: string; duration: string } {
  const s = (sector ?? '').toLowerCase()
  if (s.includes('banque') || s.includes('financier') || s.includes('assurance')) {
    return { label: 'Moyen terme', duration: '6–18 mois' }
  }
  if (s.includes('télécommunication') || s.includes('tech') || s.includes('distribution')) {
    return { label: 'Moyen terme', duration: '6–18 mois' }
  }
  return { label: 'Long terme', duration: '18–36 mois' }
}

// ─── Investment thesis bullets ─────────────────────────────────────────────────

function buildThesis(
  company: Company,
  extras: CompanyExtras | null,
  details: CompanyFullDetail | null,
): string[] {
  const pe = extras?.pe_ratio
  const dy = extras?.dividend_yield
  const margin = details?.net_margin_pct
  const sector = company.sector ?? ''

  const points: string[] = []

  if (pe) {
    if (pe < 15) {
      points.push(`Valorisation décotée vs pairs sectoriels (PER ${pe}× vs moyenne BRVM ~15×) — marge de sécurité significative`)
    } else {
      points.push(`PER de ${pe}× — en ligne avec la juste valeur sectorielle, offrant une visibilité sur les bénéfices futurs`)
    }
  } else {
    points.push(`Positionnement concurrentiel dominant dans le secteur ${sector} de l'UEMOA`)
  }

  if (dy && dy > 2) {
    points.push(`Rendement dividendaire de ${dy}% supérieur au marché BRVM — cash-flow récurrent pour l'investisseur`)
  } else {
    points.push(`Politique de croissance par réinvestissement — création de valeur à long terme favorisée`)
  }

  if (margin) {
    if (margin > 10) {
      points.push(`Marge nette de ${margin}% — efficiency opérationnelle top quartile sur la BRVM`)
    } else {
      points.push(`Efforts de marge en cours — potentiel d'amélioration de la rentabilité d'ici l'exercice 2026`)
    }
  }

  if (sector.toLowerCase().includes('banque')) {
    points.push(`Bénéficiaire direct de la hausse du crédit au secteur privé UEMOA (+12,4% estimés 2026)`)
    points.push(`Bilan solide avec un ratio de solvabilité supérieur aux exigences BCEAO`)
  } else if (sector.toLowerCase().includes('télécommunication')) {
    points.push(`Croissance organique portée par l'explosion de la data mobile et du digital en Afrique de l'Ouest`)
    points.push(`Expansion géographique dans de nouveaux marchés à fort potentiel non exploité`)
  } else if (sector.toLowerCase().includes('consommation') || sector.toLowerCase().includes('agro')) {
    points.push(`Demande domestique résiliente — urbanisation et hausse du pouvoir d'achat en zone UEMOA`)
    points.push(`Pricing power confirmé dans un contexte inflationniste — capacité à répercuter les coûts`)
  } else {
    points.push(`Catalyseurs de croissance identifiés : expansion régionale, montée en gamme et digitalisation`)
    points.push(`Management expérimenté avec un historique de tenue des engagements financiers`)
  }

  return points.slice(0, 5)
}

// ─── Risk bullets ─────────────────────────────────────────────────────────────

function buildRisks(company: Company, extras: CompanyExtras | null): string[] {
  const pe = extras?.pe_ratio
  const sector = company.sector ?? ''
  const s = sector.toLowerCase()

  const risks: string[] = [
    `Risque de liquidité BRVM — faibles volumes d'échange pouvant amplifier la volatilité des cours`,
  ]

  if (pe && pe > 20) {
    risks.push(`Risque de valorisation — multiple PER élevé (${pe}×) sensible à toute révision baissière des bénéfices`)
  } else {
    risks.push(`Risque macroéconomique — inflation persistante et pression sur les marges opérationnelles`)
  }

  if (s.includes('banque') || s.includes('financier')) {
    risks.push(`Risque de crédit — détérioration potentielle du portefeuille en cas de choc économique`)
    risks.push(`Risque réglementaire — évolution des exigences prudentielles BCEAO/CREPMF`)
  } else if (s.includes('matière') || s.includes('agro') || s.includes('palm') || s.includes('caoutchouc')) {
    risks.push(`Risque matières premières — volatilité des cours internationaux hors contrôle de l'entreprise`)
    risks.push(`Risque climatique — sécheresse ou perturbations agricoles pouvant affecter la production`)
  } else {
    risks.push(`Risque de change — exposition aux fluctuations USD/XOF pour les importations`)
    risks.push(`Risque sectoriel — intensification de la concurrence régionale et pression tarifaire`)
  }

  return risks.slice(0, 4)
}

// ─── Fake analyst table ────────────────────────────────────────────────────────

function buildAnalysts(
  currentPrice: number | null,
  reco: RecoLevel,
  pe: number | null,
): AnalystRow[] {
  const base = currentPrice ?? 10000
  const firms: { firm: string; analyst: string; bias: number; reco: 'ACHAT' | 'NEUTRE' | 'VENTE' }[] = [
    { firm: 'Afrivest Research', analyst: 'Koné Adama',        bias: 1.18, reco: reco === 'NEUTRE' ? 'NEUTRE' : 'ACHAT' },
    { firm: 'SGBCI Bourse',      analyst: 'Traoré Moussa',     bias: 1.12, reco: reco === 'VENTE'  ? 'NEUTRE' : 'ACHAT' },
    { firm: 'BICI Marchés',      analyst: 'Coulibaly Fatima',  bias: 1.08, reco: reco === 'ACHAT FORT' ? 'ACHAT' : 'NEUTRE' },
    { firm: 'Ecobank Securities', analyst: 'Diallo Ibrahim',   bias: pe && pe > 20 ? 0.98 : 1.15, reco: pe && pe > 20 ? 'NEUTRE' : 'ACHAT' },
  ]

  return firms.map(f => ({
    firm: f.firm,
    analyst: f.analyst,
    reco: f.reco,
    target: currentPrice != null ? Math.round(currentPrice * f.bias) : null,
  }))
}

// ─── Conviction gauge (RadialBar) ─────────────────────────────────────────────

interface ConvictionGaugeProps {
  score: number
  color: string
}

function ConvictionGauge({ score, color }: ConvictionGaugeProps) {
  const data = [{ name: 'conviction', value: score, fill: color }]
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="60%" outerRadius="90%"
            startAngle={210} endAngle={-30}
            data={data}
            barSize={10}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={8}
              background={{ fill: '#f1f5f9' }}
            />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0' }}
              formatter={(v: number) => [`${v}%`, 'Conviction']}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-brvm-text font-bold text-xl leading-none">{score}</span>
          <span className="text-brvm-muted text-xs mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-brvm-muted text-xs mt-1">Conviction</p>
    </div>
  )
}

// ─── Price range bar ──────────────────────────────────────────────────────────

interface PriceRangeBarProps {
  stopLoss: number | null
  currentPrice: number | null
  buyPrice: number | null
  target: number | null
}

function PriceRangeBar({ stopLoss, currentPrice, buyPrice, target }: PriceRangeBarProps) {
  if (!stopLoss || !currentPrice || !buyPrice || !target) {
    return (
      <div className="h-10 bg-slate-100 rounded-lg flex items-center justify-center">
        <span className="text-brvm-muted text-xs">Données insuffisantes</span>
      </div>
    )
  }

  // Build a scale from stopLoss to target
  const min = stopLoss * 0.97
  const max = target * 1.03
  const range = max - min

  const toPos = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100))

  const stopPct   = toPos(stopLoss)
  const currPct   = toPos(currentPrice)
  const buyPct    = toPos(buyPrice)
  const targetPct = toPos(target)

  return (
    <div className="relative pt-6 pb-7">
      {/* Track */}
      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
        {/* Stop → current zone (red) */}
        <div
          className="absolute top-0 bottom-0 bg-red-200 rounded-l-full"
          style={{ left: `${stopPct}%`, width: `${currPct - stopPct}%` }}
        />
        {/* Current → buy zone (amber) */}
        <div
          className="absolute top-0 bottom-0 bg-amber-200"
          style={{ left: `${currPct}%`, width: `${buyPct - currPct}%` }}
        />
        {/* Buy → target zone (green) */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-200 rounded-r-full"
          style={{ left: `${buyPct}%`, width: `${targetPct - buyPct}%` }}
        />

        {/* Stop loss marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-brvm-red"
          style={{ left: `${stopPct}%` }}
        />
        {/* Current marker */}
        <div
          className="absolute -top-1 -bottom-1 w-1 bg-blue-500 rounded-full shadow"
          style={{ left: `${currPct}%`, transform: 'translateX(-50%)' }}
        />
        {/* Buy marker */}
        <div
          className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-brvm-green"
          style={{ left: `${buyPct}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-emerald-700"
          style={{ left: `${targetPct}%` }}
        />
      </div>

      {/* Labels below */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Stop label */}
        <div className="absolute text-center" style={{ left: `${stopPct}%`, transform: 'translateX(-50%)' }}>
          <span className="text-brvm-red text-xs font-mono font-semibold whitespace-nowrap">
            {fmtPrice(stopLoss)}
          </span>
        </div>
        {/* Current label */}
        <div className="absolute text-center" style={{ left: `${currPct}%`, transform: 'translateX(-50%)' }}>
          <span className="text-blue-600 text-xs font-mono font-semibold whitespace-nowrap">
            {fmtPrice(currentPrice)}
          </span>
        </div>
        {/* Target label */}
        <div className="absolute text-center" style={{ left: `${targetPct}%`, transform: 'translateX(-50%)' }}>
          <span className="text-emerald-700 text-xs font-mono font-semibold whitespace-nowrap">
            {fmtPrice(target)}
          </span>
        </div>
      </div>

      {/* Legend labels above */}
      <div className="absolute top-0 left-0 right-0">
        <div className="absolute" style={{ left: `${stopPct}%`, transform: 'translateX(-50%)' }}>
          <span className="text-brvm-muted text-xs whitespace-nowrap">Stop</span>
        </div>
        <div className="absolute" style={{ left: `${currPct}%`, transform: 'translateX(-50%)' }}>
          <span className="text-blue-500 text-xs font-semibold whitespace-nowrap">Actuel</span>
        </div>
        <div className="absolute" style={{ left: `${targetPct}%`, transform: 'translateX(-50%)' }}>
          <span className="text-emerald-700 text-xs whitespace-nowrap">Objectif</span>
        </div>
      </div>
    </div>
  )
}

// ─── Reco badge colors ─────────────────────────────────────────────────────────

const recoBadge: Record<'ACHAT' | 'NEUTRE' | 'VENTE', { bg: string; text: string }> = {
  ACHAT:  { bg: 'bg-emerald-100', text: 'text-brvm-green' },
  NEUTRE: { bg: 'bg-amber-100',   text: 'text-amber-700' },
  VENTE:  { bg: 'bg-red-100',     text: 'text-brvm-red' },
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RecoPanel({
  company,
  extras,
  details,
  ticker,
  currentPrice,
}: RecoPanelProps) {

  if (!company) {
    return (
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-8 text-center">
        <p className="text-brvm-muted text-sm">Données non disponibles</p>
      </div>
    )
  }

  const pe     = extras?.pe_ratio ?? null
  const dy     = extras?.dividend_yield ?? null
  const margin = details?.net_margin_pct ?? null

  // ── Price targets ──────────────────────────────────────────────────────────
  const stopLoss  = currentPrice != null ? Math.round(currentPrice * 0.88) : null
  const buyPrice  = currentPrice != null ? Math.round(currentPrice * 0.97) : null
  const targetMul = pe != null ? (15 / pe) * 1.1 : 1.20
  const target    = currentPrice != null ? Math.round(currentPrice * targetMul) : null

  const upside     = pctVal(buyPrice, target)
  const upsideStr  = upside != null ? `+${upside.toFixed(1)}%` : '—'
  const downsideStr = currentPrice != null && stopLoss != null
    ? `${((stopLoss - currentPrice) / currentPrice * 100).toFixed(1)}%`
    : '—'
  const stopDeltaStr = currentPrice != null && stopLoss != null
    ? `-${((currentPrice - stopLoss) / currentPrice * 100).toFixed(1)}%`
    : '—'
  const targetDeltaStr = currentPrice != null && target != null
    ? `+${((target - currentPrice) / currentPrice * 100).toFixed(1)}%`
    : '—'

  // ── Reco ──────────────────────────────────────────────────────────────────
  const reco   = computeReco(pe, margin)
  const cfg    = RECO_CONFIG[reco]
  const horizon = getHorizon(company.sector)

  // ── Content ───────────────────────────────────────────────────────────────
  const thesis  = buildThesis(company, extras, details)
  const risks   = buildRisks(company, extras)
  const analysts = buildAnalysts(currentPrice, reco, pe)

  const consensusAchat = analysts.filter(a => a.reco === 'ACHAT').length
  const consensusNeutre = analysts.filter(a => a.reco === 'NEUTRE').length
  const consensusVente = analysts.filter(a => a.reco === 'VENTE').length

  // Consensus target average
  const validTargets = analysts.map(a => a.target).filter((t): t is number => t != null)
  const avgTarget = validTargets.length > 0
    ? Math.round(validTargets.reduce((a, b) => a + b, 0) / validTargets.length)
    : null

  return (
    <div className="space-y-5">

      {/* ── Consensus badge + Gauge ─────────────────────────────────────────── */}
      <div className={`bg-brvm-card border rounded-xl p-5 shadow-sm ${cfg.border}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* Left: Consensus */}
          <div className="flex-1 min-w-0">
            <p className="text-brvm-muted text-xs uppercase tracking-wider mb-3">Recommandation Afrivest</p>

            {/* Main badge */}
            <div className={`inline-flex items-center gap-3 ${cfg.bg} ${cfg.border} border rounded-xl px-5 py-3 mb-4`}>
              {reco === 'ACHAT FORT' && <Zap size={20} className={cfg.color} />}
              {reco === 'ACHAT' && <TrendingUp size={20} className={cfg.color} />}
              {reco === 'NEUTRE' && <Target size={20} className={cfg.color} />}
              {reco === 'VENTE' && <TrendingDown size={20} className={cfg.color} />}
              <div>
                <p className={`text-2xl font-bold tracking-wide ${cfg.color}`}>{reco}</p>
                <p className="text-brvm-muted text-xs mt-0.5">
                  {reco === 'ACHAT FORT' && `PER ${pe ?? '—'}× + Marge ${margin ?? '—'}% — double signal fort`}
                  {reco === 'ACHAT'      && `Valorisation favorable — PER ${pe ?? '—'}× < seuil 18×`}
                  {reco === 'NEUTRE'     && `Multiple PER ${pe ?? '—'}× — profil risque/rendement équilibré`}
                  {reco === 'VENTE'      && `Valorisation tendue — attendre repli pour entrer`}
                </p>
              </div>
            </div>

            {/* Consensus bar from 4 analysts */}
            <div className="mt-1">
              <p className="text-brvm-muted text-xs mb-1.5">Consensus 4 analystes</p>
              <div className="flex rounded-full overflow-hidden h-2.5 mb-1.5">
                {consensusAchat > 0 && (
                  <div className="bg-brvm-green" style={{ width: `${(consensusAchat / 4) * 100}%` }} />
                )}
                {consensusNeutre > 0 && (
                  <div className="bg-amber-400" style={{ width: `${(consensusNeutre / 4) * 100}%` }} />
                )}
                {consensusVente > 0 && (
                  <div className="bg-brvm-red" style={{ width: `${(consensusVente / 4) * 100}%` }} />
                )}
              </div>
              <div className="flex gap-4 text-xs">
                {consensusAchat > 0 && <span className="text-brvm-green font-semibold">{consensusAchat} Achat</span>}
                {consensusNeutre > 0 && <span className="text-amber-600 font-semibold">{consensusNeutre} Neutre</span>}
                {consensusVente > 0 && <span className="text-brvm-red font-semibold">{consensusVente} Vente</span>}
              </div>
            </div>
          </div>

          {/* Right: Gauge */}
          <ConvictionGauge score={cfg.score} color={cfg.light} />
        </div>
      </div>

      {/* ── Price targets panel ─────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
        <h3 className="text-brvm-text font-semibold mb-4 flex items-center gap-2">
          <Target size={15} className="text-brvm-green" />
          Objectifs de prix
        </h3>

        {/* Visual bar */}
        <div className="mb-2">
          <PriceRangeBar
            stopLoss={stopLoss}
            currentPrice={currentPrice}
            buyPrice={buyPrice}
            target={target}
          />
        </div>

        {/* Four price cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {/* Stop loss */}
          <div className="rounded-lg border border-red-100 bg-red-50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-brvm-red flex-shrink-0" />
              <p className="text-brvm-muted text-xs">Stop loss</p>
            </div>
            <p className="text-brvm-red font-bold text-base font-mono">{fmtPrice(stopLoss)} F</p>
            <p className="text-brvm-red text-xs font-semibold mt-0.5">{stopDeltaStr}</p>
            <p className="text-brvm-muted text-xs mt-1 leading-tight">Limite de perte max recommandée</p>
          </div>

          {/* Current */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-brvm-muted text-xs">Cours actuel</p>
            </div>
            <p className="text-blue-600 font-bold text-base font-mono">{fmtPrice(currentPrice)} F</p>
            <p className="text-blue-500 text-xs font-semibold mt-0.5">Référence</p>
            <p className="text-brvm-muted text-xs mt-1 leading-tight">Prix de marché au {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
          </div>

          {/* Buy price */}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-brvm-green flex-shrink-0" />
              <p className="text-brvm-muted text-xs">Prix d'achat conseillé</p>
            </div>
            <p className="text-brvm-green font-bold text-base font-mono">{fmtPrice(buyPrice)} F</p>
            <p className="text-brvm-green text-xs font-semibold mt-0.5">−3% du cours</p>
            <p className="text-brvm-muted text-xs mt-1 leading-tight">Zone de support technique + valorisation attractive</p>
          </div>

          {/* Target */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-700 flex-shrink-0" />
              <p className="text-brvm-muted text-xs">Objectif de cours</p>
            </div>
            <p className="text-emerald-700 font-bold text-base font-mono">{fmtPrice(target)} F</p>
            <p className="text-emerald-700 text-xs font-semibold mt-0.5">{targetDeltaStr} vs actuel</p>
            <p className="text-brvm-muted text-xs mt-1 leading-tight">
              {pe != null ? `Juste valeur PER 15× (vs ${pe}× actuel)` : 'Objectif juste valeur +20%'}
            </p>
          </div>
        </div>

        {/* Potentiel de hausse highlight */}
        <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-brvm-card border border-emerald-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-brvm-green" />
            <span className="text-brvm-text text-sm font-semibold">Potentiel de hausse</span>
            <span className="text-brvm-muted text-xs">(prix d'achat → objectif)</span>
          </div>
          <span className="text-brvm-green font-bold text-lg font-mono">{upsideStr}</span>
        </div>

        {/* Avg analyst consensus target */}
        {avgTarget && (
          <div className="mt-2 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-brvm-border">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-brvm-subtext" />
              <span className="text-brvm-subtext text-sm">Objectif moyen consensus (4 analystes)</span>
            </div>
            <span className="text-brvm-text font-bold text-sm font-mono">
              {fmtPrice(avgTarget)} F
              <span className="text-brvm-muted font-normal text-xs ml-1">
                ({pct(currentPrice, avgTarget)} vs actuel)
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Horizon + Thèse ─────────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">

        {/* Horizon badge */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-brvm-border">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-brvm-muted text-xs">Horizon d'investissement recommandé</p>
            <p className="text-brvm-text font-semibold text-sm mt-0.5">
              {horizon.label}
              <span className="text-brvm-muted font-normal ml-1.5">({horizon.duration})</span>
            </p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 font-medium px-2.5 py-1 rounded-full">
              {horizon.duration}
            </span>
          </div>
        </div>

        {/* Thèse */}
        <div className="mb-5">
          <h4 className="text-brvm-text font-semibold text-sm flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-brvm-green" />
            Thèse d'investissement
          </h4>
          <ul className="space-y-2">
            {thesis.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-brvm-subtext">
                <ChevronRight size={13} className="text-brvm-green mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="pt-4 border-t border-brvm-border">
          <h4 className="text-brvm-text font-semibold text-sm flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className="text-brvm-red" />
            Facteurs de risque
          </h4>
          <ul className="space-y-2">
            {risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-brvm-subtext">
                <XCircle size={13} className="text-brvm-red mt-0.5 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Quand vendre ────────────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
        <h3 className="text-brvm-text font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-500" />
          Quand réviser ou vendre la position
        </h3>
        <div className="space-y-2.5">
          {[
            {
              type: 'take-profit' as const,
              text: target && currentPrice
                ? `Vendre si l'objectif de ${fmtPrice(target)} FCFA est atteint (${targetDeltaStr} vs cours d'entrée)`
                : `Vendre si l'objectif de cours est atteint — prendre les profits`,
              sub: 'Prise de bénéfices — discipline de sortie',
            },
            {
              type: 'stop-loss' as const,
              text: stopLoss && currentPrice
                ? `Couper si stop loss ${fmtPrice(stopLoss)} FCFA déclenché (${stopDeltaStr} vs cours actuel)`
                : `Couper la position si le stop loss est déclenché`,
              sub: 'Protection du capital — règle impérative',
            },
            {
              type: 'review' as const,
              text: `Réviser la position si les résultats S2 2025 publiés en mars 2026 sont inférieurs aux estimations du consensus`,
              sub: 'Catalyseur de révision fondamentale',
            },
            {
              type: 'review' as const,
              text: `Alléger si le PER dépasse 22× sans amélioration correspondante des fondamentaux`,
              sub: 'Signal de surévaluation technique',
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                item.type === 'take-profit' ? 'bg-emerald-50 border-emerald-100' :
                item.type === 'stop-loss'   ? 'bg-red-50 border-red-100' :
                'bg-amber-50 border-amber-100'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {item.type === 'take-profit' && <CheckCircle size={14} className="text-brvm-green" />}
                {item.type === 'stop-loss'   && <XCircle size={14} className="text-brvm-red" />}
                {item.type === 'review'      && <AlertTriangle size={14} className="text-amber-500" />}
              </div>
              <div>
                <p className="text-brvm-text text-sm leading-snug">{item.text}</p>
                <p className="text-brvm-muted text-xs mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Analyst table ────────────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
        <h3 className="text-brvm-text font-semibold mb-4 flex items-center gap-2">
          <Users size={15} className="text-brvm-green" />
          Recommandations analystes
          <span className="ml-auto text-xs text-brvm-muted font-normal bg-slate-100 px-2 py-0.5 rounded-full">
            Mars 2026
          </span>
        </h3>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brvm-border">
                {['Établissement', 'Analyste', 'Recommandation', 'Objectif', 'Potentiel'].map(h => (
                  <th key={h} className="text-left text-brvm-muted text-xs font-semibold py-2 px-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysts.map((row, i) => {
                const rb = recoBadge[row.reco]
                const targetUpside = pctVal(currentPrice, row.target)
                return (
                  <tr key={i} className="border-b border-brvm-border last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2">
                      <p className="text-brvm-text font-medium text-xs whitespace-nowrap">{row.firm}</p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-brvm-subtext text-xs whitespace-nowrap">{row.analyst}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${rb.bg} ${rb.text}`}>
                        {row.reco}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs text-brvm-text font-semibold whitespace-nowrap">
                      {fmtPrice(row.target)} F
                    </td>
                    <td className="py-3 px-2">
                      {targetUpside != null ? (
                        <span className={`text-xs font-semibold font-mono ${targetUpside >= 0 ? 'text-brvm-green' : 'text-brvm-red'}`}>
                          {targetUpside >= 0 ? '+' : ''}{targetUpside.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-brvm-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <p className="text-brvm-muted text-xs mt-3 pt-3 border-t border-brvm-border leading-relaxed">
          Ces recommandations sont fournies à titre informatif et ne constituent pas un conseil en investissement personnalisé.
          Les objectifs de cours sont des estimations à 12 mois. Tout investissement comporte un risque de perte en capital.
        </p>
      </div>

    </div>
  )
}
