import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react'
import { portfolioApi } from '../api/portfolio.api'
import { companiesApi } from '../api/companies.api'
import { marketApi } from '../api/market.api'
import type { Portfolio, PortfolioTransaction, Company, MarketStock } from '../types'
import Spinner from '../components/common/Spinner'

function PnlBadge({ value, pct }: { value: number; pct: number }) {
  const isPos = value >= 0
  return (
    <span className={`flex items-center gap-1 text-sm font-semibold ${isPos ? 'text-brvm-green' : 'text-brvm-red'}`}>
      {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {isPos ? '+' : ''}{value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F
      <span className="text-xs opacity-80">({isPos ? '+' : ''}{pct.toFixed(2)}%)</span>
    </span>
  )
}

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selected, setSelected] = useState<Portfolio | null>(null)
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [marketMap, setMarketMap] = useState<Record<number, MarketStock>>({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showTrade, setShowTrade] = useState<'buy' | 'sell' | null>(null)
  const [createForm, setCreateForm] = useState({ name: '', initial_capital: 1000000 })
  const [tradeForm, setTradeForm] = useState({ company_id: 0, quantity: 1, price: 0 })
  const [tradeError, setTradeError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [ports, comps, overview] = await Promise.all([
          portfolioApi.list(),
          companiesApi.list(),
          marketApi.overview(),
        ])
        setPortfolios(ports)
        setCompanies(comps)
        const map: Record<number, MarketStock> = {}
        overview.stocks.forEach((s) => { map[s.id] = s })
        setMarketMap(map)
        if (ports.length > 0) await selectPortfolio(ports[0])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectPortfolio = async (p: Portfolio) => {
    const [detail, txs] = await Promise.all([
      portfolioApi.getById(p.id),
      portfolioApi.transactions(p.id),
    ])
    setSelected(detail)
    setTransactions(txs)
  }

  const handleCreate = async () => {
    if (!createForm.initial_capital || createForm.initial_capital < 100) return
    setActionLoading(true)
    try {
      const created = await portfolioApi.create(createForm)
      setPortfolios([...portfolios, created])
      await selectPortfolio(created)
      setShowCreate(false)
      setCreateForm({ name: '', initial_capital: 1000000 })
    } finally {
      setActionLoading(false)
    }
  }

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!selected || !tradeForm.company_id || !tradeForm.quantity || !tradeForm.price) return
    const comp = companies.find((c) => c.id === tradeForm.company_id)
    if (!comp) return
    setTradeError('')
    setActionLoading(true)
    try {
      if (type === 'buy') {
        await portfolioApi.buy(selected.id, { ...tradeForm, ticker: comp.ticker })
      } else {
        await portfolioApi.sell(selected.id, { ...tradeForm, ticker: comp.ticker })
      }
      await selectPortfolio(selected)
      setShowTrade(null)
      setTradeForm({ company_id: 0, quantity: 1, price: 0 })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setTradeError(err.response?.data?.error || 'Erreur lors de la transaction')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brvm-text">Simulation de portefeuille</h1>
          <p className="text-brvm-muted text-sm mt-1">Entraînez-vous avec du capital fictif</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors"
        >
          <Plus size={16} /> Nouveau portefeuille
        </button>
      </div>

      {/* Portfolio selector */}
      {portfolios.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPortfolio(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selected?.id === p.id
                  ? 'bg-brvm-green text-white'
                  : 'bg-brvm-card border border-brvm-border text-brvm-subtext hover:border-brvm-green'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-12 text-center">
          <p className="text-brvm-muted text-sm mb-4">Vous n'avez pas encore de portefeuille</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-brvm-green text-white rounded-lg text-sm font-semibold">
            Créer mon premier portefeuille
          </button>
        </div>
      ) : selected ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4">
              <p className="text-brvm-muted text-xs mb-1">Valeur totale</p>
              <p className="text-brvm-text font-bold text-lg">{Number(selected.total_value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</p>
            </div>
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4">
              <p className="text-brvm-muted text-xs mb-1">Liquidités</p>
              <p className="text-brvm-text font-bold text-lg">{Number(selected.cash_balance).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</p>
            </div>
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4">
              <p className="text-brvm-muted text-xs mb-1">Capital initial</p>
              <p className="text-brvm-text font-bold text-lg">{Number(selected.initial_capital).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</p>
            </div>
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4">
              <p className="text-brvm-muted text-xs mb-1">P&L total</p>
              <PnlBadge value={selected.total_pnl} pct={selected.total_pnl_percent} />
            </div>
          </div>

          {/* Trade buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowTrade('buy')}
              className="flex items-center gap-2 px-5 py-2.5 bg-brvm-green text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors"
            >
              <ArrowUpRight size={16} /> Acheter
            </button>
            <button
              onClick={() => setShowTrade('sell')}
              className="flex items-center gap-2 px-5 py-2.5 bg-brvm-red/90 text-white rounded-lg text-sm font-semibold hover:bg-red-500 transition-colors"
            >
              <ArrowDownRight size={16} /> Vendre
            </button>
          </div>

          {/* Positions */}
          <div className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-brvm-border">
              <h2 className="text-brvm-text font-semibold">Positions en cours</h2>
            </div>
            {selected.positions.length === 0 ? (
              <div className="p-8 text-center text-brvm-muted text-sm">Aucune position ouverte</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brvm-border">
                      <th className="text-left px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Ticker</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Qté</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Prix moy.</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Prix actuel</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Valeur</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.positions.map((pos) => (
                      <tr key={pos.id} className="border-b border-brvm-border last:border-0 hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <Link to={`/companies/${pos.company_id}`} className="text-brvm-green font-mono font-bold text-sm hover:underline">
                            {pos.ticker}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-right text-brvm-text text-sm">{pos.quantity}</td>
                        <td className="px-5 py-3 text-right text-brvm-muted text-sm font-mono">{Number(pos.avg_buy_price).toLocaleString('fr-FR')}</td>
                        <td className="px-5 py-3 text-right text-brvm-text text-sm font-mono">{Number(pos.current_price).toLocaleString('fr-FR')}</td>
                        <td className="px-5 py-3 text-right text-brvm-text text-sm font-semibold font-mono">{Number(pos.current_value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                        <td className="px-5 py-3 text-right">
                          <PnlBadge value={pos.pnl} pct={pos.pnl_percent} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transactions */}
          {transactions.length > 0 && (
            <div className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-brvm-border">
                <h2 className="text-brvm-text font-semibold">Historique des transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brvm-border">
                      <th className="text-left px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Date</th>
                      <th className="text-left px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Type</th>
                      <th className="text-left px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Ticker</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Qté</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Prix</th>
                      <th className="text-right px-5 py-3 text-brvm-muted text-xs uppercase font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map((tx) => (
                      <tr key={tx.id} className="border-b border-brvm-border last:border-0">
                        <td className="px-5 py-3 text-brvm-muted text-xs">{new Date(tx.executed_at).toLocaleDateString('fr-FR')}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${tx.type === 'BUY' ? 'bg-brvm-green/10 text-brvm-green' : 'bg-brvm-red/10 text-brvm-red'}`}>
                            {tx.type === 'BUY' ? 'ACHAT' : 'VENTE'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-brvm-green font-mono font-bold text-sm">{tx.ticker}</td>
                        <td className="px-5 py-3 text-right text-brvm-text text-sm">{tx.quantity}</td>
                        <td className="px-5 py-3 text-right text-brvm-muted text-sm font-mono">{Number(tx.price).toLocaleString('fr-FR')}</td>
                        <td className="px-5 py-3 text-right text-brvm-text text-sm font-semibold font-mono">{Number(tx.total).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-brvm-card border border-brvm-border rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-brvm-text font-bold text-lg mb-5">Nouveau portefeuille</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-brvm-subtext text-sm mb-2">Nom (optionnel)</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Mon portefeuille"
                  className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-2.5 text-brvm-text text-sm focus:outline-none focus:border-brvm-green"
                />
              </div>
              <div>
                <label className="block text-brvm-subtext text-sm mb-2">Capital initial (FCFA)</label>
                <input
                  type="number"
                  value={createForm.initial_capital}
                  onChange={(e) => setCreateForm({ ...createForm, initial_capital: Number(e.target.value) })}
                  min={100}
                  className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-2.5 text-brvm-text text-sm focus:outline-none focus:border-brvm-green"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-brvm-border text-brvm-subtext rounded-lg text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-brvm-green text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                {actionLoading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade modal */}
      {showTrade && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-brvm-card border border-brvm-border rounded-2xl p-6 w-full max-w-md">
            <h3 className={`font-bold text-lg mb-5 ${showTrade === 'buy' ? 'text-brvm-green' : 'text-brvm-red'}`}>
              {showTrade === 'buy' ? 'Acheter une action' : 'Vendre une action'}
            </h3>
            {tradeError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-lg mb-4 text-sm">
                <AlertCircle size={14} /> {tradeError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-brvm-subtext text-sm mb-2">Entreprise</label>
                <select
                  value={tradeForm.company_id}
                  onChange={(e) => {
                    const cid = Number(e.target.value)
                    const ms = marketMap[cid]
                    setTradeForm({ ...tradeForm, company_id: cid, price: ms?.current_price ?? 0 })
                  }}
                  className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-2.5 text-brvm-text text-sm focus:outline-none focus:border-brvm-green"
                >
                  <option value={0}>Sélectionner...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.ticker} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-brvm-subtext text-sm mb-2">Quantité</label>
                <input
                  type="number"
                  value={tradeForm.quantity}
                  onChange={(e) => setTradeForm({ ...tradeForm, quantity: Number(e.target.value) })}
                  min={1}
                  className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-2.5 text-brvm-text text-sm focus:outline-none focus:border-brvm-green"
                />
              </div>
              <div>
                <label className="block text-brvm-subtext text-sm mb-2">Prix unitaire (FCFA)</label>
                <input
                  type="number"
                  value={tradeForm.price}
                  onChange={(e) => setTradeForm({ ...tradeForm, price: Number(e.target.value) })}
                  min={1}
                  className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-2.5 text-brvm-text text-sm focus:outline-none focus:border-brvm-green"
                />
              </div>
              {tradeForm.quantity > 0 && tradeForm.price > 0 && (
                <div className="bg-black/20 rounded-lg px-4 py-3">
                  <span className="text-brvm-muted text-sm">Total estimé : </span>
                  <span className="text-brvm-text font-bold text-sm">
                    {(tradeForm.quantity * tradeForm.price).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowTrade(null); setTradeError('') }} className="flex-1 px-4 py-2.5 border border-brvm-border text-brvm-subtext rounded-lg text-sm">Annuler</button>
              <button
                onClick={() => handleTrade(showTrade)}
                disabled={actionLoading || !tradeForm.company_id}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-60 ${showTrade === 'buy' ? 'bg-brvm-green' : 'bg-brvm-red'}`}
              >
                {actionLoading ? 'En cours...' : showTrade === 'buy' ? 'Acheter' : 'Vendre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
