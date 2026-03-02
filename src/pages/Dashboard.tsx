import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Briefcase, BookOpen, Bot,
  Crown, ArrowRight, User, Activity
} from 'lucide-react'
import { useAppSelector } from '../hooks/useAppDispatch'
import { portfolioApi } from '../api/portfolio.api'
import { marketApi } from '../api/market.api'
import type { Portfolio, MarketStock } from '../types'
import Spinner from '../components/common/Spinner'

export default function Dashboard() {
  const { user } = useAppSelector((s) => s.auth)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [gainers, setGainers] = useState<MarketStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [ports, g] = await Promise.all([
          portfolioApi.list(),
          marketApi.movers('gainers', 3),
        ])
        setPortfolios(ports)
        setGainers(g)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalValue = portfolios.reduce((acc, p) => acc + Number(p.total_value), 0)
  const totalPnl = portfolios.reduce((acc, p) => acc + Number(p.total_pnl), 0)

  const isPremium = user?.subscription_type === 'premium'

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brvm-text">
            Bonjour, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-brvm-muted text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isPremium ? 'bg-brvm-gold/10 text-brvm-gold' : 'bg-white/5 text-brvm-muted'}`}>
          {isPremium ? <Crown size={13} /> : <User size={13} />}
          {isPremium ? 'Premium' : 'Gratuit'}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
          <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2">Portefeuilles</p>
          <p className="text-2xl font-bold text-brvm-text">{portfolios.length}</p>
        </div>
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
          <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2">Valeur totale</p>
          <p className="text-2xl font-bold text-brvm-text">
            {totalValue > 0 ? totalValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '—'}
          </p>
          {totalValue > 0 && <p className="text-brvm-muted text-xs mt-0.5">FCFA</p>}
        </div>
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
          <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2">P&L total</p>
          {totalValue > 0 ? (
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-brvm-green' : 'text-brvm-red'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </p>
          ) : <p className="text-2xl font-bold text-brvm-muted">—</p>}
        </div>
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
          <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2">Crédits IA</p>
          <p className="text-2xl font-bold text-brvm-text">{user?.credits_remaining ?? 0}</p>
          <p className="text-brvm-muted text-xs mt-0.5">{isPremium ? 'illimité' : '/ mois'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Portfolios */}
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-brvm-text font-semibold flex items-center gap-2">
              <Briefcase size={16} className="text-brvm-green" /> Mes portefeuilles
            </h2>
            <Link to="/portfolio" className="text-brvm-green text-xs flex items-center gap-1 hover:underline">
              Gérer <ArrowRight size={12} />
            </Link>
          </div>
          {portfolios.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-brvm-muted text-sm mb-3">Aucun portefeuille créé</p>
              <Link to="/portfolio" className="text-brvm-green text-sm hover:underline">Créer un portefeuille →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolios.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-brvm-border last:border-0">
                  <div>
                    <p className="text-brvm-text text-sm font-medium">{p.name}</p>
                    <p className="text-brvm-muted text-xs">{p.positions?.length ?? 0} positions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-brvm-text text-sm font-mono font-semibold">
                      {Number(p.total_value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F
                    </p>
                    <span className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${Number(p.total_pnl) >= 0 ? 'text-brvm-green' : 'text-brvm-red'}`}>
                      {Number(p.total_pnl) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Number(p.total_pnl) >= 0 ? '+' : ''}{Number(p.total_pnl).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top gainers */}
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-brvm-text font-semibold flex items-center gap-2">
              <Activity size={16} className="text-brvm-green" /> Meilleures hausses
            </h2>
            <Link to="/market" className="text-brvm-green text-xs flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {gainers.map((s) => (
              <Link key={s.id} to={`/companies/${s.id}`} className="flex items-center justify-between py-2.5 border-b border-brvm-border last:border-0 hover:opacity-80">
                <div>
                  <p className="text-brvm-green font-mono font-bold text-sm">{s.ticker}</p>
                  <p className="text-brvm-muted text-xs">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-brvm-text text-sm font-mono">{s.current_price.toLocaleString('fr-FR')} F</p>
                  <span className="text-xs font-semibold text-brvm-green flex items-center justify-end gap-0.5">
                    <TrendingUp size={10} /> +{s.variation.toFixed(2)}%
                  </span>
                </div>
              </Link>
            ))}
            {gainers.length === 0 && <p className="text-brvm-muted text-sm text-center py-4">Données non disponibles</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/market" className="bg-brvm-card border border-brvm-border rounded-xl p-5 hover:border-brvm-green/40 transition-colors group">
          <TrendingUp size={22} className="text-brvm-green mb-3" />
          <h3 className="text-brvm-text font-semibold text-sm mb-1">Explorer le marché</h3>
          <p className="text-brvm-muted text-xs">Toutes les actions cotées à la BRVM</p>
        </Link>
        <Link to="/education" className="bg-brvm-card border border-brvm-border rounded-xl p-5 hover:border-brvm-green/40 transition-colors">
          <BookOpen size={22} className="text-brvm-green mb-3" />
          <h3 className="text-brvm-text font-semibold text-sm mb-1">Apprendre</h3>
          <p className="text-brvm-muted text-xs">Cours, articles et glossaire financier</p>
        </Link>
        <Link to="/ai" className={`bg-brvm-card border rounded-xl p-5 transition-colors ${isPremium ? 'border-brvm-gold/30 hover:border-brvm-gold/50' : 'border-brvm-border hover:border-brvm-border/60'}`}>
          <Bot size={22} className={`mb-3 ${isPremium ? 'text-brvm-gold' : 'text-brvm-muted'}`} />
          <h3 className="text-brvm-text font-semibold text-sm mb-1 flex items-center gap-2">
            Assistant IA
            {!isPremium && <span className="text-xs text-brvm-muted">({user?.credits_remaining ?? 0} crédits)</span>}
          </h3>
          <p className="text-brvm-muted text-xs">Analysez les marchés avec l'IA</p>
        </Link>
      </div>

      {/* Upgrade banner for free users */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-brvm-gold/10 to-brvm-green/10 border border-brvm-gold/20 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-brvm-gold" />
              <h3 className="text-brvm-text font-semibold">Passez à Premium</h3>
            </div>
            <p className="text-brvm-muted text-sm">IA illimitée, rapports PDF, cours avancés et simulations sans limites.</p>
          </div>
          <Link to="/subscription" className="px-5 py-2.5 bg-brvm-gold text-black font-bold rounded-lg text-sm hover:bg-yellow-400 transition-colors flex-shrink-0">
            Voir les offres
          </Link>
        </div>
      )}
    </div>
  )
}
