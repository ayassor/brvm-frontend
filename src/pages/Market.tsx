import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Search, Filter,
  BarChart3, Shield, Info, ChevronRight,
} from 'lucide-react'
import { mockCompaniesApi as companiesApi, mockMarketApi as marketApi } from '../mocks/brvm-data'
import type { Company, MarketStock } from '../types'
import Spinner from '../components/common/Spinner'

// ─── OPCVM data (SICAV + FCP) ─────────────────────────────────────────────────
type OpcvmType = 'SICAV' | 'FCP'

interface OpcvmEntry {
  id: number
  type: OpcvmType
  name: string
  country: string
  agrément: string
  aum_bn_fcfa: number
  founded: number
  specialites: string[]
  description: string
  vni_freq: string
  risk: 'Faible' | 'Modéré' | 'Élevé'
}

const OPCVM_LIST: OpcvmEntry[] = [
  // SICAV
  {
    id: 1, type: 'SICAV', name: 'SICAV BRVM Actions',
    country: "Côte d'Ivoire", agrément: 'CREPMF/SICAV/CI/001',
    aum_bn_fcfa: 48, founded: 2004, vni_freq: 'Quotidienne', risk: 'Élevé',
    specialites: ['Actions BRVM', 'Dividendes', 'Croissance long terme'],
    description: 'Investi exclusivement en actions cotées sur la BRVM. Objectif : surperformer l\'indice BRVM Composite sur un horizon de 5 ans.',
  },
  {
    id: 2, type: 'SICAV', name: 'SICAV Obligataire UEMOA',
    country: "Côte d'Ivoire", agrément: 'CREPMF/SICAV/CI/002',
    aum_bn_fcfa: 135, founded: 2006, vni_freq: 'Quotidienne', risk: 'Modéré',
    specialites: ['Obligations d\'État UEMOA', 'Bons du Trésor', 'Rendement régulier'],
    description: 'Fonds obligataire exposé aux obligations des États membres de l\'UEMOA et aux titres corporate de haute qualité.',
  },
  {
    id: 3, type: 'SICAV', name: 'SICAV Mixte Afrique',
    country: 'Sénégal', agrément: 'CREPMF/SICAV/SN/001',
    aum_bn_fcfa: 28, founded: 2018, vni_freq: 'Hebdomadaire', risk: 'Modéré',
    specialites: ['Actions BRVM', 'Obligations UEMOA', 'Allocation flexible'],
    description: 'Allocation flexible combinant actions et obligations. L\'allocation est ajustée dynamiquement selon les conditions de marché.',
  },
  // FCP
  {
    id: 4, type: 'FCP', name: 'FCP Monétaire Sécurité',
    country: "Côte d'Ivoire", agrément: 'CREPMF/FCP/CI/001',
    aum_bn_fcfa: 220, founded: 2002, vni_freq: 'Quotidienne', risk: 'Faible',
    specialites: ['Bons du Trésor', 'Trésorerie court terme', 'Liquidité quotidienne'],
    description: 'Fonds monétaire de référence UEMOA. Investi principalement en bons du Trésor à court terme. Idéal pour la gestion de trésorerie.',
  },
  {
    id: 5, type: 'FCP', name: 'FCP Croissance BRVM',
    country: "Côte d'Ivoire", agrément: 'CREPMF/FCP/CI/004',
    aum_bn_fcfa: 35, founded: 2016, vni_freq: 'Hebdomadaire', risk: 'Élevé',
    specialites: ['Actions croissance', 'Small & Mid Caps BRVM', 'Horizon 5–7 ans'],
    description: 'Fonds actions axé sur les valeurs de croissance de la BRVM avec surpondération télécoms, financier et consommation.',
  },
  {
    id: 6, type: 'FCP', name: 'FCP Obligataire Trésor',
    country: 'Sénégal', agrément: 'CREPMF/FCP/SN/002',
    aum_bn_fcfa: 58, founded: 2010, vni_freq: 'Mensuelle', risk: 'Faible',
    specialites: ['Bons du Trésor SN', 'Obligations souveraines', 'Préservation du capital'],
    description: 'Fonds investi majoritairement en titres souverains sénégalais à moyen terme. Vise la préservation du capital et un rendement supérieur au marché monétaire.',
  },
]

const RISK_COLORS: Record<string, string> = {
  Faible:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Modéré:  'bg-amber-50 text-amber-700 border-amber-200',
  Élevé:   'bg-red-50 text-red-700 border-red-200',
}

const TYPE_COLORS: Record<OpcvmType, string> = {
  SICAV: 'bg-amber-50 text-amber-700 border-amber-200',
  FCP:   'bg-purple-50 text-purple-700 border-purple-200',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = 'ticker' | 'current_price' | 'variation' | 'volume'
type Tab = 'actions' | 'opcvm'

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Market() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('actions')

  // Actions tab state
  const [companies, setCompanies] = useState<Company[]>([])
  const [marketStocks, setMarketStocks] = useState<Record<number, MarketStock>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [sort, setSort] = useState<SortKey>('ticker')
  const [sortAsc, setSortAsc] = useState(true)

  // OPCVM tab state
  const [opcvmSearch, setOpcvmSearch] = useState('')
  const [opcvmType, setOpcvmType] = useState<'all' | OpcvmType>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const [companiesList, overview] = await Promise.all([
          companiesApi.list(),
          marketApi.overview(),
        ])
        setCompanies(companiesList)
        const map: Record<number, MarketStock> = {}
        overview.stocks.forEach((s) => { map[s.id] = s })
        setMarketStocks(map)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sectors = [...new Set(companies.map((c) => c.sector).filter(Boolean))] as string[]

  const filtered = companies
    .filter((c) => {
      const q = search.toLowerCase()
      return (
        (!search || c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q)) &&
        (!sector || c.sector === sector)
      )
    })
    .sort((a, b) => {
      const ma = marketStocks[a.id]
      const mb = marketStocks[b.id]
      let va: number | string = 0, vb: number | string = 0
      if (sort === 'ticker')         { va = a.ticker; vb = b.ticker }
      else if (sort === 'current_price') { va = ma?.current_price ?? 0; vb = mb?.current_price ?? 0 }
      else if (sort === 'variation') { va = ma?.variation ?? 0; vb = mb?.variation ?? 0 }
      else if (sort === 'volume')    { va = ma?.volume ?? 0; vb = mb?.volume ?? 0 }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })

  const handleSort = (key: SortKey) => {
    if (sort === key) setSortAsc(!sortAsc)
    else { setSort(key); setSortAsc(true) }
  }

  const SortArrow = ({ k }: { k: SortKey }) =>
    sort === k ? <span className="ml-1 text-brvm-green">{sortAsc ? '↑' : '↓'}</span> : null

  const advances = Object.values(marketStocks).filter(s => s.variation > 0).length
  const declines = Object.values(marketStocks).filter(s => s.variation < 0).length

  // OPCVM filtered
  const filteredOpcvm = OPCVM_LIST.filter((o) => {
    const q = opcvmSearch.toLowerCase()
    return (
      (opcvmType === 'all' || o.type === opcvmType) &&
      (!q || o.name.toLowerCase().includes(q) || o.country.toLowerCase().includes(q))
    )
  })
  const totalAum = OPCVM_LIST.reduce((s, o) => s + o.aum_bn_fcfa, 0)

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brvm-text">Marché BRVM</h1>
          <p className="text-brvm-subtext text-sm mt-1">
            {tab === 'actions'
              ? `${companies.length} sociétés cotées · Bulletin N°41 · 27 fév. 2026`
              : `${OPCVM_LIST.length} fonds collectifs agréés CREPMF`
            }
          </p>
        </div>
        {tab === 'actions' && !loading && Object.keys(marketStocks).length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-brvm-green font-semibold">
              <TrendingUp size={14} /> {advances} en hausse
            </span>
            <span className="flex items-center gap-1.5 text-brvm-red font-semibold">
              <TrendingDown size={14} /> {declines} en baisse
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 w-fit">
        <button
          onClick={() => setTab('actions')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'actions' ? 'bg-white text-brvm-text shadow-sm' : 'text-brvm-muted hover:text-brvm-subtext'
          }`}
        >
          <TrendingUp size={14} /> Actions BRVM
        </button>
        <button
          onClick={() => setTab('opcvm')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'opcvm' ? 'bg-white text-brvm-text shadow-sm' : 'text-brvm-muted hover:text-brvm-subtext'
          }`}
        >
          <BarChart3 size={14} /> OPCVM
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ACTIONS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'actions' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
              <input
                type="text"
                placeholder="Rechercher une entreprise ou un ticker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-brvm-card border border-brvm-border rounded-lg pl-9 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/20 transition"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="bg-brvm-card border border-brvm-border rounded-lg pl-8 pr-8 py-2.5 text-brvm-subtext text-sm focus:outline-none focus:border-brvm-green appearance-none cursor-pointer transition"
              >
                <option value="">Tous les secteurs</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {loading ? <Spinner /> : (
            <div className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-brvm-border">
                      <th className="text-left px-5 py-3 text-brvm-subtext text-xs uppercase tracking-wider font-semibold cursor-pointer hover:text-brvm-text select-none"
                        onClick={() => handleSort('ticker')}>
                        Ticker <SortArrow k="ticker" />
                      </th>
                      <th className="text-left px-5 py-3 text-brvm-subtext text-xs uppercase tracking-wider font-semibold">Société</th>
                      <th className="text-left px-5 py-3 text-brvm-subtext text-xs uppercase tracking-wider font-semibold hidden sm:table-cell">Secteur</th>
                      <th className="text-right px-5 py-3 text-brvm-subtext text-xs uppercase tracking-wider font-semibold cursor-pointer hover:text-brvm-text select-none"
                        onClick={() => handleSort('current_price')}>
                        Cours (FCFA) <SortArrow k="current_price" />
                      </th>
                      <th className="text-right px-5 py-3 text-brvm-subtext text-xs uppercase tracking-wider font-semibold cursor-pointer hover:text-brvm-text select-none"
                        onClick={() => handleSort('variation')}>
                        Var. % <SortArrow k="variation" />
                      </th>
                      <th className="text-right px-5 py-3 text-brvm-subtext text-xs uppercase tracking-wider font-semibold hidden md:table-cell cursor-pointer hover:text-brvm-text select-none"
                        onClick={() => handleSort('volume')}>
                        Volume <SortArrow k="volume" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-brvm-muted text-sm">Aucune entreprise trouvée</td>
                      </tr>
                    ) : (
                      filtered.map((company) => {
                        const ms = marketStocks[company.id]
                        const isPos = (ms?.variation ?? 0) >= 0
                        return (
                          <tr
                            key={company.id}
                            onClick={() => navigate(`/market/${company.id}`)}
                            className="border-b border-brvm-border last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-4">
                              <span className="inline-block bg-brvm-green/10 text-brvm-green font-bold text-xs font-mono px-2 py-1 rounded">
                                {company.ticker}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-brvm-text text-sm font-medium">{company.name}</p>
                              {company.country && <p className="text-brvm-muted text-xs mt-0.5">{company.country}</p>}
                            </td>
                            <td className="px-5 py-4 hidden sm:table-cell">
                              <span className="text-brvm-subtext text-xs bg-slate-100 px-2 py-1 rounded-full">{company.sector || '—'}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-brvm-text text-sm font-mono font-semibold">
                                {ms ? ms.current_price.toLocaleString('fr-FR') : '—'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              {ms ? (
                                <span className={`inline-flex items-center justify-end gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                                  isPos ? 'bg-emerald-50 text-brvm-green' : 'bg-red-50 text-brvm-red'
                                }`}>
                                  {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                  {isPos ? '+' : ''}{ms.variation.toFixed(2)}%
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-5 py-4 text-right hidden md:table-cell">
                              <span className="text-brvm-subtext text-sm">{ms ? ms.volume.toLocaleString('fr-FR') : '—'}</span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          OPCVM TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'opcvm' && (
        <>
          {/* Stats banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Fonds agréés', val: OPCVM_LIST.length, sub: 'SICAV + FCP' },
              { label: 'SICAV', val: OPCVM_LIST.filter(o => o.type === 'SICAV').length, sub: 'capital variable' },
              { label: 'FCP', val: OPCVM_LIST.filter(o => o.type === 'FCP').length, sub: 'fonds communs' },
              { label: 'AUM total', val: `${totalAum} Mds`, sub: 'FCFA (estimé)' },
            ].map(({ label, val, sub }) => (
              <div key={label} className="bg-brvm-card border border-brvm-border rounded-xl p-4 shadow-sm">
                <p className="text-brvm-muted text-xs">{label}</p>
                <p className="text-2xl font-extrabold text-brvm-text mt-1">{val}</p>
                <p className="text-brvm-muted text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              {(['all', 'SICAV', 'FCP'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOpcvmType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    opcvmType === t ? 'bg-white text-brvm-text shadow-sm' : 'text-brvm-muted hover:text-brvm-subtext'
                  }`}
                >
                  {t === 'all' ? 'Tous' : t}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
              <input
                type="text"
                placeholder="Rechercher un fonds…"
                value={opcvmSearch}
                onChange={(e) => setOpcvmSearch(e.target.value)}
                className="w-full bg-white border border-brvm-border rounded-xl pl-9 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/10 transition"
              />
            </div>
          </div>

          {/* Cards */}
          {filteredOpcvm.length === 0 ? (
            <div className="text-center py-16 text-brvm-muted">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p>Aucun fonds trouvé</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOpcvm.map((fund) => (
                <div
                  key={fund.id}
                  className="bg-white border border-brvm-border rounded-2xl p-5 hover:border-brvm-green/30 hover:shadow-md transition-all shadow-sm flex flex-col gap-4"
                >
                  {/* Top */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[fund.type]}`}>
                        {fund.type}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${RISK_COLORS[fund.risk]}`}>
                        Risque {fund.risk}
                      </span>
                    </div>
                    <h3 className="font-bold text-brvm-text text-sm leading-snug">{fund.name}</h3>
                    <p className="text-brvm-subtext text-xs mt-1.5 leading-relaxed line-clamp-2">{fund.description}</p>
                  </div>

                  {/* Specialites */}
                  <div className="flex flex-wrap gap-1.5">
                    {fund.specialites.map((s) => (
                      <span key={s} className="text-xs bg-slate-100 text-brvm-subtext px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-brvm-border pt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-brvm-muted text-xs">AUM</p>
                      <p className="font-bold text-brvm-text text-sm">{fund.aum_bn_fcfa} Mds</p>
                    </div>
                    <div>
                      <p className="text-brvm-muted text-xs">VNI</p>
                      <p className="font-bold text-brvm-text text-sm">{fund.vni_freq}</p>
                    </div>
                    <div>
                      <p className="text-brvm-muted text-xs">Depuis</p>
                      <p className="font-bold text-brvm-text text-sm">{fund.founded}</p>
                    </div>
                  </div>

                  {/* Agrément */}
                  <div className="flex items-center gap-1.5 text-xs text-brvm-muted">
                    <Shield size={11} />
                    <span className="font-mono">{fund.agrément}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-semibold text-sm">SICAV — Société d'Investissement à Capital Variable</p>
                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                  Fonds à capital variable dont les parts sont souscrites et rachetées directement auprès de la société.
                  VNI calculée régulièrement et publiée par le CREPMF.
                </p>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3">
              <Info size={15} className="text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-purple-800 font-semibold text-sm">FCP — Fonds Commun de Placement</p>
                <p className="text-purple-700 text-xs mt-1 leading-relaxed">
                  Co-propriété de valeurs mobilières sans personnalité morale, géré par une SGO agréée.
                  Souscription auprès de l'établissement gestionnaire ou distributeur.
                </p>
              </div>
            </div>
          </div>

          {/* CTA SGO */}
          <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-brvm-text font-semibold text-sm">Géré par les Sociétés de Gestion d'OPCVM (SGO)</p>
              <p className="text-brvm-subtext text-xs mt-0.5">Consultez la liste des SGO agréées par le CREPMF</p>
            </div>
            <a
              href="/asset-managers"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brvm-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 transition-colors flex-shrink-0"
              onClick={(e) => { e.preventDefault(); window.location.href = '/asset-managers' }}
            >
              Voir les SGO <ChevronRight size={14} />
            </a>
          </div>
        </>
      )}
    </div>
  )
}
