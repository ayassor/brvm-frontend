import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Building2, Globe, BarChart3 } from 'lucide-react'
import { companiesApi } from '../api/companies.api'
import { marketApi } from '../api/market.api'
import type { Company, StockPrice, Dividend, MarketStock, Period } from '../types'
import StockChart from '../components/charts/StockChart'
import Spinner from '../components/common/Spinner'

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const companyId = Number(id)

  const [company, setCompany] = useState<Company | null>(null)
  const [prices, setPrices] = useState<StockPrice[]>([])
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [marketData, setMarketData] = useState<MarketStock | null>(null)
  const [period, setPeriod] = useState<Period>('1m')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [comp, overview, pricesData, divData] = await Promise.all([
          companiesApi.getById(companyId),
          marketApi.overview(),
          companiesApi.getPrices(companyId, '1m'),
          companiesApi.getDividends(companyId),
        ])
        setCompany(comp)
        setPrices(pricesData)
        setDividends(divData)
        const ms = overview.stocks.find((s) => s.id === companyId) || null
        setMarketData(ms)
      } catch {
        setError('Impossible de charger les données de l\'entreprise')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId])

  const handlePeriodChange = async (p: Period) => {
    setPeriod(p)
    setChartLoading(true)
    try {
      const data = await companiesApi.getPrices(companyId, p)
      setPrices(data)
    } finally {
      setChartLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (error || !company) return (
    <div className="text-center py-12">
      <p className="text-brvm-red mb-4">{error || 'Entreprise introuvable'}</p>
      <Link to="/market" className="text-brvm-green hover:underline text-sm">← Retour au marché</Link>
    </div>
  )

  const isPos = (marketData?.variation ?? 0) >= 0
  const latestPrice = prices[prices.length - 1]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/market" className="mt-1 p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-brvm-muted" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-10 h-10 rounded-lg object-contain bg-white/5 p-1" />
            ) : (
              <div className="w-10 h-10 bg-brvm-green/10 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-brvm-green" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-brvm-text">{company.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-brvm-green font-mono font-bold text-sm">{company.ticker}</span>
                {company.sector && <span className="text-brvm-muted text-xs bg-white/5 px-2 py-0.5 rounded">{company.sector}</span>}
                {company.country && (
                  <span className="text-brvm-muted text-xs flex items-center gap-1">
                    <Globe size={11} /> {company.country}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price banner */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl p-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">Cours actuel</p>
            <p className="text-4xl font-bold text-brvm-text font-mono">
              {marketData ? marketData.current_price.toLocaleString('fr-FR') : latestPrice ? Number(latestPrice.close).toLocaleString('fr-FR') : '—'}
              <span className="text-xl ml-1 text-brvm-muted">FCFA</span>
            </p>
            {marketData && (
              <span className={`inline-flex items-center gap-1.5 mt-2 text-sm font-semibold ${isPos ? 'text-brvm-green' : 'text-brvm-red'}`}>
                {isPos ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {isPos ? '+' : ''}{marketData.variation.toFixed(2)}% aujourd'hui
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
            {latestPrice && (
              <>
                <div>
                  <p className="text-brvm-muted text-xs">Ouverture</p>
                  <p className="text-brvm-text text-sm font-semibold font-mono">{latestPrice.open ? Number(latestPrice.open).toLocaleString('fr-FR') : '—'}</p>
                </div>
                <div>
                  <p className="text-brvm-muted text-xs">Haut</p>
                  <p className="text-brvm-text text-sm font-semibold font-mono">{latestPrice.high ? Number(latestPrice.high).toLocaleString('fr-FR') : '—'}</p>
                </div>
                <div>
                  <p className="text-brvm-muted text-xs">Bas</p>
                  <p className="text-brvm-text text-sm font-semibold font-mono">{latestPrice.low ? Number(latestPrice.low).toLocaleString('fr-FR') : '—'}</p>
                </div>
                <div>
                  <p className="text-brvm-muted text-xs">Volume</p>
                  <p className="text-brvm-text text-sm font-semibold font-mono">{Number(latestPrice.volume).toLocaleString('fr-FR')}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <StockChart
        prices={prices}
        onPeriodChange={handlePeriodChange}
        currentPeriod={period}
        loading={chartLoading}
      />

      {/* Description + Dividends */}
      <div className="grid md:grid-cols-3 gap-5">
        {company.description && (
          <div className="md:col-span-2 bg-brvm-card border border-brvm-border rounded-xl p-5">
            <h2 className="text-brvm-text font-semibold mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-brvm-green" /> À propos
            </h2>
            <p className="text-brvm-muted text-sm leading-relaxed">{company.description}</p>
          </div>
        )}

        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
          <h2 className="text-brvm-text font-semibold mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-brvm-green" /> Dividendes
          </h2>
          {dividends.length === 0 ? (
            <p className="text-brvm-muted text-sm">Aucun dividende enregistré</p>
          ) : (
            <div className="space-y-2">
              {dividends.slice(0, 5).map((d) => (
                <div key={d.id} className="flex justify-between items-center py-2 border-b border-brvm-border last:border-0">
                  <span className="text-brvm-muted text-xs">{new Date(d.payment_date).toLocaleDateString('fr-FR')}</span>
                  <span className="text-brvm-green font-semibold text-sm">{Number(d.amount).toLocaleString('fr-FR')} F</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
