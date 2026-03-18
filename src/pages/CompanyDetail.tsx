import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, TrendingDown, Building2,
  Globe, BarChart3, Users, Calendar, Activity,
  Award, Briefcase, Newspaper, ChevronRight, PieChart as PieIcon,
  DollarSign, Percent, Target,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  MOCK_EXTRAS,
  REAL_DATA,
  mockCompaniesApi,
  type CompanyExtras,
} from '../mocks/brvm-data'
import {
  companiesApi,
  filterByPeriod,
  toStockPrices,
  type HistoryEntry,
} from '../api/companies.api'
import {
  COMPANY_DETAILS,
  type CompanyFullDetail,
  type Shareholder,
} from '../mocks/company-details'
import type { Company, StockPrice, Dividend, Period } from '../types'
import StockChart from '../components/charts/StockChart'
import Spinner from '../components/common/Spinner'
import {
  getRevenueHistory,
  getNetIncomeHistory,
  getEbitdaHistory,
  getPerHistory,
} from '../utils/fin-history'

// IDs 1–12 = Prestige, 13–47 = Principal
const getCompartiment = (id: number) => id <= 12 ? 'Prestige' : 'Principal'

const SHAREHOLDER_COLORS: Record<Shareholder['type'], string> = {
  institutionnel: 'bg-blue-500',
  etat:           'bg-amber-500',
  fondateur:      'bg-purple-500',
  public:         'bg-emerald-500',
}

const SHAREHOLDER_HEX: Record<Shareholder['type'], string> = {
  institutionnel: '#3b82f6',
  etat:           '#f59e0b',
  fondateur:      '#a855f7',
  public:         '#10b981',
}

const SHAREHOLDER_LABEL: Record<Shareholder['type'], string> = {
  institutionnel: 'Institutionnel',
  etat:           'État / Para-étatique',
  fondateur:      'Fondateur / Famille',
  public:         'Flottant public',
}

// Tooltip recharts custom
const chartTooltipStyle = {
  fontSize: 12,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const companyId = Number(id)

  const [company, setCompany] = useState<Company | null>(null)
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([])
  const [prices, setPrices] = useState<StockPrice[]>([])
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [extras, setExtras] = useState<CompanyExtras | null>(null)
  const [details, setDetails] = useState<CompanyFullDetail | null>(null)
  const [period, setPeriod] = useState<Period>('1m')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [comp, divData] = await Promise.all([
          mockCompaniesApi.getById(companyId),
          mockCompaniesApi.getDividends(companyId),
        ])
        setCompany(comp)
        setDividends(divData)
        setExtras(MOCK_EXTRAS[companyId] ?? null)
        setDetails(COMPANY_DETAILS[companyId] ?? null)

        const history = await companiesApi.getHistory(comp.ticker)
        const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
        setAllHistory(sorted)
        setPrices(toStockPrices(filterByPeriod(sorted, '1m')))
      } catch {
        setError("Impossible de charger les données de l'entreprise")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId])

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
    setChartLoading(true)
    setPrices(toStockPrices(filterByPeriod(allHistory, p)))
    setChartLoading(false)
  }

  if (loading) return <div className="py-20"><Spinner /></div>
  if (error || !company) return (
    <div className="text-center py-16">
      <p className="text-brvm-red mb-4">{error || 'Entreprise introuvable'}</p>
      <Link to="/market" className="text-brvm-green hover:underline text-sm">← Retour au marché</Link>
    </div>
  )

  const today = prices[prices.length - 1]
  const yesterday = prices[prices.length - 2]
  const currentPrice = today?.close ?? 0
  const prevPrice = yesterday?.close ?? currentPrice
  const variation = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0
  const isPos = variation >= 0

  const ticker = company.ticker
  const annualVar = details?.annual_variation_pct ?? null
  const realVariation = REAL_DATA[ticker]

  const high52w = prices.length > 0 ? Math.max(...prices.map(p => p.high ?? p.close)) : null
  const low52w  = prices.length > 0 ? Math.min(...prices.map(p => p.low  ?? p.close)) : null

  const fmtN = (n: number | null | undefined) =>
    n != null ? n.toLocaleString('fr-FR') : '—'

  const fmtMktCap = (n: number | null) => {
    if (!n) return '—'
    if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)} T FCFA`
    if (n >= 1_000_000_000)     return `${(n / 1_000_000_000).toFixed(0)} Md FCFA`
    return `${(n / 1_000_000).toFixed(0)} M FCFA`
  }

  const compartiment = getCompartiment(companyId)

  // ── Historiques financiers (générés déterministement) ────────────────────────
  const revenueHistory    = extras?.revenue_bn_fcfa != null
    ? getRevenueHistory(extras.revenue_bn_fcfa, companyId) : []
  const netIncomeHistory  = details?.net_income_bn_fcfa != null
    ? getNetIncomeHistory(details.net_income_bn_fcfa, companyId) : []
  const ebitdaHistory     = details?.ebitda_bn_fcfa != null
    ? getEbitdaHistory(details.ebitda_bn_fcfa, companyId) : []
  const perHistory        = extras?.pe_ratio != null
    ? getPerHistory(extras.pe_ratio, companyId) : []

  const hasFundamentals = revenueHistory.length > 0 || netIncomeHistory.length > 0
    || ebitdaHistory.length > 0 || perHistory.length > 0

  // Dividendes pour graphique
  const dividendChartData = [...dividends]
    .sort((a, b) => String(a.payment_date).localeCompare(String(b.payment_date)))
    .map(d => ({
      year: new Date(d.payment_date).getFullYear().toString(),
      value: Number(d.amount),
    }))

  // Métriques calculées
  const ebitdaMargin = (extras?.revenue_bn_fcfa && details?.ebitda_bn_fcfa)
    ? Math.round((details.ebitda_bn_fcfa / extras.revenue_bn_fcfa) * 1000) / 10
    : null

  return (
    <div className="space-y-5">
      {/* ── Back + Header ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Link
          to="/market"
          className="mt-1 p-2 bg-brvm-card border border-brvm-border rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} className="text-brvm-subtext" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 bg-brvm-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={22} className="text-brvm-green" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-brvm-text">{company.name}</h1>
                <span className="bg-brvm-green/10 text-brvm-green font-mono font-bold text-sm px-2 py-0.5 rounded">
                  {company.ticker}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  compartiment === 'Prestige'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {compartiment}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {company.sector && (
                  <span className="text-brvm-subtext text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                    {company.sector}
                  </span>
                )}
                {company.country && (
                  <span className="text-brvm-muted text-xs flex items-center gap-1">
                    <Globe size={11} /> {company.country}
                  </span>
                )}
                {extras?.website && (
                  <a
                    href={`https://${extras.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brvm-blue text-xs flex items-center gap-1 hover:underline"
                  >
                    <Globe size={11} /> {extras.website}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Price banner ───────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">Cours actuel</p>
            <p className="text-4xl font-bold text-brvm-text font-mono">
              {fmtN(currentPrice)}
              <span className="text-lg ml-2 text-brvm-muted font-normal">FCFA</span>
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${
                isPos ? 'bg-emerald-50 text-brvm-green' : 'bg-red-50 text-brvm-red'
              }`}>
                {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPos ? '+' : ''}{(realVariation?.variation ?? variation).toFixed(2)}% ce jour
              </span>
              {annualVar !== null && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  annualVar >= 0 ? 'bg-emerald-50 text-brvm-green' : 'bg-red-50 text-brvm-red'
                }`}>
                  {annualVar >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {annualVar >= 0 ? '+' : ''}{annualVar.toFixed(2)}% sur 1 an
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[
              { label: 'Ouverture',      value: fmtN(today?.open) },
              { label: 'Haut du jour',   value: fmtN(today?.high) },
              { label: 'Bas du jour',    value: fmtN(today?.low) },
              { label: 'Volume titres',  value: (realVariation?.volume ?? today?.volume ?? 0).toLocaleString('fr-FR') },
              { label: 'Plus haut 52s',  value: fmtN(high52w) },
              { label: 'Plus bas 52s',   value: fmtN(low52w) },
            ].map(({ label, value }) => (
              <div key={label} className="text-right">
                <p className="text-brvm-muted text-xs">{label}</p>
                <p className="text-brvm-text text-sm font-semibold font-mono mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key metrics ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Capitalisation',
            value: fmtMktCap(company.market_cap),
            icon: <BarChart3 size={14} />,
            color: 'text-brvm-green',
          },
          {
            label: 'P/E Ratio',
            value: extras?.pe_ratio ? `${extras.pe_ratio}x` : '—',
            icon: <Activity size={14} />,
            color: 'text-blue-500',
          },
          {
            label: 'Rendement div.',
            value: extras?.dividend_yield ? `${extras.dividend_yield}%` : '—',
            icon: <Percent size={14} />,
            color: 'text-amber-500',
          },
          {
            label: "Chiffre d'affaires",
            value: extras?.revenue_bn_fcfa ? `${extras.revenue_bn_fcfa} Md` : '—',
            icon: <DollarSign size={14} />,
            color: 'text-indigo-500',
          },
          {
            label: 'Résultat net',
            value: details?.net_income_bn_fcfa != null ? `${details.net_income_bn_fcfa} Md` : '—',
            icon: <Target size={14} />,
            color: 'text-purple-500',
          },
          {
            label: ebitdaMargin != null ? 'Marge EBITDA' : 'Flottant',
            value: ebitdaMargin != null ? `${ebitdaMargin}%` : (details?.free_float_pct != null ? `${details.free_float_pct}%` : '—'),
            icon: <Users size={14} />,
            color: 'text-emerald-500',
          },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-brvm-card border border-brvm-border rounded-xl p-4 shadow-sm">
            <div className={`flex items-center gap-1.5 text-xs mb-1 ${color}`}>
              {icon}
              <span className="text-brvm-muted">{label}</span>
            </div>
            <p className="text-brvm-text font-bold text-base">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Chart cours ───────────────────────────────────────────────── */}
      <StockChart
        prices={prices}
        onPeriodChange={handlePeriodChange}
        currentPeriod={period}
        loading={chartLoading}
      />

      {/* ── Analyse Fondamentale ───────────────────────────────────────── */}
      {hasFundamentals && (
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
          <h2 className="text-brvm-text font-semibold mb-5 flex items-center gap-2">
            <BarChart3 size={15} className="text-brvm-green" /> Analyse Fondamentale
            <span className="ml-2 text-xs text-brvm-muted font-normal bg-slate-100 px-2 py-0.5 rounded-full">
              Historique 5 ans · Estimé Afrivest Research
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">

            {/* Chiffre d'affaires */}
            {revenueHistory.length > 0 && (
              <div>
                <p className="text-brvm-subtext text-xs font-semibold uppercase tracking-wider mb-1">
                  Chiffre d'affaires
                </p>
                <p className="text-brvm-muted text-xs mb-3">En milliards FCFA (Md)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={revenueHistory} barSize={32} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v: number) => [`${v} Md FCFA`, "CA"]}
                      cursor={{ fill: '#f0fdf4' }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Résultat net */}
            {netIncomeHistory.length > 0 && (
              <div>
                <p className="text-brvm-subtext text-xs font-semibold uppercase tracking-wider mb-1">
                  Résultat net
                </p>
                <p className="text-brvm-muted text-xs mb-3">En milliards FCFA (Md)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={netIncomeHistory} barSize={32} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v: number) => [`${v} Md FCFA`, "Résultat net"]}
                      cursor={{ fill: '#f5f3ff' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* EBITDA */}
            {ebitdaHistory.length > 0 && (
              <div>
                <p className="text-brvm-subtext text-xs font-semibold uppercase tracking-wider mb-1">
                  EBITDA
                </p>
                <p className="text-brvm-muted text-xs mb-3">
                  Résultat avant intérêts, impôts & amortissements · En Md FCFA
                  {ebitdaMargin != null && (
                    <span className="ml-2 text-amber-600 font-semibold">Marge {ebitdaMargin}%</span>
                  )}
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ebitdaHistory} barSize={32} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v: number) => [`${v} Md FCFA`, "EBITDA"]}
                      cursor={{ fill: '#fffbeb' }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* P/E Ratio */}
            {perHistory.length > 0 && (
              <div>
                <p className="text-brvm-subtext text-xs font-semibold uppercase tracking-wider mb-1">
                  Évolution du P/E Ratio
                </p>
                <p className="text-brvm-muted text-xs mb-3">
                  Nombre d'années de bénéfices payées — référence marché africain ~12–18×
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={perHistory} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v: number) => [`${v.toFixed(1)}×`, "PER"]}
                    />
                    {/* Zone de référence PER sain */}
                    <Line
                      type="monotone" dataKey="value" stroke="#3b82f6"
                      strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {/* Légende contextuelle */}
                <div className="flex gap-4 mt-2">
                  {[
                    { label: 'Sous-évalué', range: '< 10×', color: 'text-brvm-green' },
                    { label: 'Juste valeur', range: '10–20×', color: 'text-amber-600' },
                    { label: 'Surévalué', range: '> 20×', color: 'text-brvm-red' },
                  ].map(({ label, range, color }) => (
                    <div key={label} className="text-xs">
                      <span className={`font-semibold ${color}`}>{range}</span>
                      <span className="text-brvm-muted ml-1">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Tableau de synthèse financière ──────────────────────────── */}
          <div className="mt-6 pt-5 border-t border-brvm-border">
            <p className="text-brvm-muted text-xs uppercase tracking-wider mb-3">Synthèse – exercice 2025</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                extras?.revenue_bn_fcfa && {
                  label: "Chiffre d'affaires", value: `${extras.revenue_bn_fcfa} Md FCFA`,
                  sub: 'Revenus totaux', color: 'border-brvm-green/30 bg-emerald-50/50',
                },
                details?.net_income_bn_fcfa != null && {
                  label: 'Résultat net', value: `${details.net_income_bn_fcfa} Md FCFA`,
                  sub: 'Bénéfices nets', color: 'border-indigo-200 bg-indigo-50/50',
                },
                details?.ebitda_bn_fcfa != null && {
                  label: 'EBITDA', value: `${details.ebitda_bn_fcfa} Md FCFA`,
                  sub: ebitdaMargin ? `Marge ${ebitdaMargin}%` : 'Excédent brut', color: 'border-amber-200 bg-amber-50/50',
                },
                details?.net_margin_pct != null && {
                  label: 'Marge nette', value: `${details.net_margin_pct}%`,
                  sub: 'Efficacité opérationnelle', color: 'border-purple-200 bg-purple-50/50',
                },
              ].filter(Boolean).map((item) => {
                if (!item) return null
                return (
                  <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
                    <p className="text-brvm-muted text-xs">{item.label}</p>
                    <p className="text-brvm-text font-bold text-sm font-mono mt-0.5">{item.value}</p>
                    <p className="text-brvm-muted text-xs mt-0.5">{item.sub}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content grid ──────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left 2 cols: About + CEO + Activities + Certifications + News */}
        <div className="lg:col-span-2 space-y-5">

          {/* About */}
          {company.description && (
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
              <h2 className="text-brvm-text font-semibold mb-3 flex items-center gap-2">
                <Building2 size={15} className="text-brvm-green" /> À propos
              </h2>
              <p className="text-brvm-subtext text-sm leading-relaxed">{company.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-brvm-border">
                {extras?.founded && (
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-brvm-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-brvm-muted text-xs">Fondée en</p>
                      <p className="text-brvm-text text-sm font-semibold">{extras.founded}</p>
                    </div>
                  </div>
                )}
                {extras?.employees && (
                  <div className="flex items-start gap-2">
                    <Users size={14} className="text-brvm-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-brvm-muted text-xs">Employés</p>
                      <p className="text-brvm-text text-sm font-semibold">{extras.employees.toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}
                {details?.ceo && (
                  <div className="flex items-start gap-2">
                    <Briefcase size={14} className="text-brvm-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-brvm-muted text-xs">{details.ceo_title || 'Direction'}</p>
                      <p className="text-brvm-text text-sm font-semibold">{details.ceo}</p>
                    </div>
                  </div>
                )}
                {details?.net_margin_pct != null && (
                  <div className="flex items-start gap-2">
                    <Activity size={14} className="text-brvm-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-brvm-muted text-xs">Marge nette</p>
                      <p className="text-brvm-text text-sm font-semibold">{details.net_margin_pct}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activities */}
          {details?.activities && details.activities.length > 0 && (
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
              <h2 className="text-brvm-text font-semibold mb-3 flex items-center gap-2">
                <Briefcase size={15} className="text-brvm-green" /> Activités & métiers
              </h2>
              <ul className="space-y-2">
                {details.activities.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brvm-subtext">
                    <ChevronRight size={14} className="text-brvm-green mt-0.5 flex-shrink-0" />
                    {act}
                  </li>
                ))}
              </ul>
              {details.certifications && details.certifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brvm-border">
                  <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award size={12} /> Certifications & normes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {details.certifications.map((cert) => (
                      <span key={cert} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Related news */}
          {details?.recent_news && details.recent_news.length > 0 && (
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
              <h2 className="text-brvm-text font-semibold mb-3 flex items-center gap-2">
                <Newspaper size={15} className="text-brvm-green" /> Actualités récentes
              </h2>
              <div className="space-y-3">
                {details.recent_news.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-brvm-border last:border-0">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      item.positive === true  ? 'bg-brvm-green' :
                      item.positive === false ? 'bg-brvm-red'   : 'bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-brvm-text text-sm leading-snug">{item.headline}</p>
                      <p className="text-brvm-muted text-xs mt-1">
                        {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right col: Shareholders (enhanced) + Dividends chart */}
        <div className="space-y-5">

          {/* Shareholders — donut + barres */}
          {details?.shareholders && details.shareholders.length > 0 && (
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
              <h2 className="text-brvm-text font-semibold mb-4 flex items-center gap-2">
                <PieIcon size={15} className="text-brvm-green" /> Actionnariat
              </h2>

              {/* Donut chart */}
              <div className="flex justify-center mb-2">
                <PieChart width={200} height={160}>
                  <Pie
                    data={details.shareholders}
                    dataKey="pct"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={74}
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {details.shareholders.map((sh) => (
                      <Cell key={sh.name} fill={SHAREHOLDER_HEX[sh.type]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ ...chartTooltipStyle, fontSize: 11 }}
                    formatter={(v: number, _name: string, props: { payload?: { name?: string } }) => [
                      `${v}%`,
                      props.payload?.name ?? '',
                    ]}
                  />
                </PieChart>
              </div>

              {/* Barres détaillées */}
              <div className="space-y-3">
                {details.shareholders.map((sh, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-brvm-text text-xs font-medium truncate">{sh.name}</p>
                        <p className="text-brvm-muted text-xs">{SHAREHOLDER_LABEL[sh.type]}</p>
                      </div>
                      <span className="text-brvm-text text-sm font-bold font-mono flex-shrink-0">{sh.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${SHAREHOLDER_COLORS[sh.type]}`}
                        style={{ width: `${Math.min(sh.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Légende */}
              <div className="mt-4 pt-4 border-t border-brvm-border grid grid-cols-2 gap-1.5">
                {(Object.keys(SHAREHOLDER_LABEL) as Shareholder['type'][]).map((type) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SHAREHOLDER_HEX[type] }} />
                    <span className="text-brvm-muted text-xs">{SHAREHOLDER_LABEL[type]}</span>
                  </div>
                ))}
              </div>

              {/* Free float badge */}
              {details.free_float_pct != null && (
                <div className="mt-4 pt-3 border-t border-brvm-border flex items-center justify-between">
                  <span className="text-brvm-subtext text-xs">Flottant BRVM</span>
                  <span className="text-brvm-green font-bold text-sm">{details.free_float_pct}%</span>
                </div>
              )}
            </div>
          )}

          {/* Dividendes — graphique + liste */}
          <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
            <h2 className="text-brvm-text font-semibold mb-3 flex items-center gap-2">
              <BarChart3 size={15} className="text-brvm-green" /> Dividendes par action
            </h2>
            {dividends.length === 0 ? (
              <p className="text-brvm-muted text-sm">Aucun dividende enregistré</p>
            ) : (
              <>
                {/* Bar chart dividendes */}
                {dividendChartData.length > 1 && (
                  <div className="mb-4">
                    <ResponsiveContainer width="100%" height={130}>
                      <BarChart data={dividendChartData} barSize={24} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, "Dividende"]}
                          cursor={{ fill: '#f0fdf4' }}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Liste détaillée */}
                <div className="space-y-0.5">
                  {dividends.map((d) => (
                    <div key={d.id} className="flex justify-between items-center py-2.5 border-b border-brvm-border last:border-0">
                      <div>
                        <p className="text-brvm-text text-sm font-semibold">
                          {new Date(d.payment_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}
                        </p>
                        {d.ex_date && (
                          <p className="text-brvm-muted text-xs">
                            Ex-div : {new Date(d.ex_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <span className="text-brvm-green font-bold text-sm font-mono">
                        {Number(d.amount).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Indicateurs financiers clés */}
          {details?.ebitda_bn_fcfa != null && (
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
              <h2 className="text-brvm-text font-semibold mb-3 flex items-center gap-2">
                <Activity size={15} className="text-brvm-green" /> Indicateurs clés
              </h2>
              <div className="space-y-0.5">
                {[
                  { label: 'EBITDA', value: `${details.ebitda_bn_fcfa} Md FCFA` },
                  details.net_income_bn_fcfa != null && { label: 'Résultat net', value: `${details.net_income_bn_fcfa} Md FCFA` },
                  details.net_margin_pct != null && { label: 'Marge nette', value: `${details.net_margin_pct}%` },
                  ebitdaMargin != null && { label: 'Marge EBITDA', value: `${ebitdaMargin}%` },
                  details.free_float_pct != null && { label: 'Flottant BRVM', value: `${details.free_float_pct}%` },
                  extras?.pe_ratio && { label: 'P/E Ratio', value: `${extras.pe_ratio}×` },
                  extras?.dividend_yield && { label: 'Rendement div.', value: `${extras.dividend_yield}%` },
                ].filter(Boolean).map((item) => {
                  if (!item) return null
                  return (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-brvm-border last:border-0">
                      <span className="text-brvm-subtext text-sm">{item.label}</span>
                      <span className="text-brvm-text font-semibold text-sm font-mono">{item.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
