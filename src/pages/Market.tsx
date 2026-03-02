import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import { companiesApi } from '../api/companies.api'
import { marketApi } from '../api/market.api'
import type { Company, MarketStock } from '../types'
import Spinner from '../components/common/Spinner'

type SortKey = 'ticker' | 'current_price' | 'variation' | 'volume'

export default function Market() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [marketStocks, setMarketStocks] = useState<Record<number, MarketStock>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [sort, setSort] = useState<SortKey>('ticker')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [companies, overview] = await Promise.all([
          companiesApi.list(),
          marketApi.overview(),
        ])
        setCompanies(companies)
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
      if (sort === 'ticker') { va = a.ticker; vb = b.ticker }
      else if (sort === 'current_price') { va = ma?.current_price ?? 0; vb = mb?.current_price ?? 0 }
      else if (sort === 'variation') { va = ma?.variation ?? 0; vb = mb?.variation ?? 0 }
      else if (sort === 'volume') { va = ma?.volume ?? 0; vb = mb?.volume ?? 0 }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })

  const handleSort = (key: SortKey) => {
    if (sort === key) setSortAsc(!sortAsc)
    else { setSort(key); setSortAsc(true) }
  }

  const SortArrow = ({ k }: { k: SortKey }) =>
    sort === k ? <span className="ml-1">{sortAsc ? '↑' : '↓'}</span> : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brvm-text">Marché BRVM</h1>
        <p className="text-brvm-muted text-sm mt-1">{companies.length} sociétés cotées</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
          <input
            type="text"
            placeholder="Rechercher une entreprise ou un ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brvm-card border border-brvm-border rounded-lg pl-9 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-brvm-card border border-brvm-border rounded-lg pl-8 pr-4 py-2.5 text-brvm-subtext text-sm focus:outline-none focus:border-brvm-green appearance-none cursor-pointer"
          >
            <option value="">Tous secteurs</option>
            {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brvm-border">
                  <th
                    className="text-left px-5 py-3 text-brvm-muted text-xs uppercase tracking-wider font-semibold cursor-pointer hover:text-brvm-text"
                    onClick={() => handleSort('ticker')}
                  >
                    Ticker <SortArrow k="ticker" />
                  </th>
                  <th className="text-left px-5 py-3 text-brvm-muted text-xs uppercase tracking-wider font-semibold">Société</th>
                  <th className="text-left px-5 py-3 text-brvm-muted text-xs uppercase tracking-wider font-semibold hidden sm:table-cell">Secteur</th>
                  <th
                    className="text-right px-5 py-3 text-brvm-muted text-xs uppercase tracking-wider font-semibold cursor-pointer hover:text-brvm-text"
                    onClick={() => handleSort('current_price')}
                  >
                    Cours <SortArrow k="current_price" />
                  </th>
                  <th
                    className="text-right px-5 py-3 text-brvm-muted text-xs uppercase tracking-wider font-semibold cursor-pointer hover:text-brvm-text"
                    onClick={() => handleSort('variation')}
                  >
                    Var. % <SortArrow k="variation" />
                  </th>
                  <th
                    className="text-right px-5 py-3 text-brvm-muted text-xs uppercase tracking-wider font-semibold hidden md:table-cell cursor-pointer hover:text-brvm-text"
                    onClick={() => handleSort('volume')}
                  >
                    Volume <SortArrow k="volume" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-brvm-muted text-sm">
                      Aucune entreprise trouvée
                    </td>
                  </tr>
                ) : (
                  filtered.map((company) => {
                    const ms = marketStocks[company.id]
                    const isPos = (ms?.variation ?? 0) >= 0
                    return (
                      <tr
                        key={company.id}
                        className="border-b border-brvm-border last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <Link to={`/companies/${company.id}`} className="text-brvm-green font-bold text-sm font-mono hover:underline">
                            {company.ticker}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <Link to={`/companies/${company.id}`} className="text-brvm-text text-sm hover:text-brvm-green transition-colors">
                            {company.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="text-brvm-muted text-xs bg-white/5 px-2 py-1 rounded">
                            {company.sector || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-brvm-text text-sm font-mono font-semibold">
                            {ms ? ms.current_price.toLocaleString('fr-FR') + ' F' : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {ms ? (
                            <span className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPos ? 'text-brvm-green' : 'text-brvm-red'}`}>
                              {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                              {isPos ? '+' : ''}{ms.variation.toFixed(2)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 text-right hidden md:table-cell">
                          <span className="text-brvm-muted text-sm">
                            {ms ? ms.volume.toLocaleString('fr-FR') : '—'}
                          </span>
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
    </div>
  )
}
