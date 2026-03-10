import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Briefcase, BookOpen, Bot,
  Crown, ArrowRight, User, Activity
} from 'lucide-react'
import { useAppSelector } from '../hooks/useAppDispatch'
// TODO: remplacer par les vrais API quand le backend est prêt
import { mockMarketApi } from '../mocks/brvm-data'
import type { MarketStock } from '../types'
import Spinner from '../components/common/Spinner'

export default function Dashboard() {
  const { user } = useAppSelector((s) => s.auth)
  const [gainers, setGainers] = useState<MarketStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockMarketApi.movers('gainers', 3).then(setGainers).finally(() => setLoading(false))
  }, [])

  const isPremium = user?.subscription_type === 'premium'

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brvm-text">
            Bonjour, {user?.name?.split(' ')[0] ?? 'Investisseur'} 👋
          </h1>
          <p className="text-brvm-subtext text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
          isPremium ? 'bg-amber-50 text-brvm-gold border border-amber-200' : 'bg-slate-100 text-brvm-subtext'
        }`}>
          {isPremium ? <Crown size={13} /> : <User size={13} />}
          {isPremium ? 'Premium' : 'Gratuit'}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Portefeuilles', value: '0', sub: 'créés' },
          { label: 'Valeur totale', value: '—', sub: 'FCFA' },
          { label: 'P&L total', value: '—', sub: 'non calculable' },
          { label: 'Crédits IA', value: String(user?.credits_remaining ?? 5), sub: isPremium ? 'illimité' : '/ mois' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
            <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl font-bold text-brvm-text">{value}</p>
            <p className="text-brvm-muted text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Portfolios placeholder */}
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-brvm-text font-semibold flex items-center gap-2">
              <Briefcase size={16} className="text-brvm-green" /> Mes portefeuilles
            </h2>
            <Link to="/portfolio" className="text-brvm-green text-xs flex items-center gap-1 hover:underline">
              Gérer <ArrowRight size={12} />
            </Link>
          </div>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase size={20} className="text-brvm-muted" />
            </div>
            <p className="text-brvm-subtext text-sm mb-3">Aucun portefeuille créé</p>
            <Link to="/portfolio" className="inline-flex px-4 py-2 bg-brvm-green text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors">
              Créer un portefeuille
            </Link>
          </div>
        </div>

        {/* Top gainers */}
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-brvm-text font-semibold flex items-center gap-2">
              <Activity size={16} className="text-brvm-green" /> Meilleures hausses
            </h2>
            <Link to="/market" className="text-brvm-green text-xs flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {gainers.map((s) => (
              <Link
                key={s.id}
                to={`/market/${s.id}`}
                className="flex items-center justify-between py-2.5 px-2 rounded-lg border-b border-brvm-border last:border-0 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-brvm-green font-mono font-bold text-sm">{s.ticker}</p>
                  <p className="text-brvm-muted text-xs">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-brvm-text text-sm font-mono font-semibold">{s.current_price.toLocaleString('fr-FR')} F</p>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-brvm-green">
                    <TrendingUp size={10} /> +{s.variation.toFixed(2)}%
                  </span>
                </div>
              </Link>
            ))}
            {gainers.length === 0 && (
              <p className="text-brvm-muted text-sm text-center py-4">Données non disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          to="/market"
          className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm hover:border-brvm-green/50 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-brvm-green" />
          </div>
          <h3 className="text-brvm-text font-semibold text-sm mb-1">Explorer le marché</h3>
          <p className="text-brvm-muted text-xs">Toutes les actions cotées à la BRVM</p>
        </Link>
        <Link
          to="/education"
          className="bg-brvm-card border border-brvm-border rounded-xl p-5 shadow-sm hover:border-brvm-green/50 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
            <BookOpen size={20} className="text-brvm-green" />
          </div>
          <h3 className="text-brvm-text font-semibold text-sm mb-1">Apprendre</h3>
          <p className="text-brvm-muted text-xs">Cours, articles et glossaire financier</p>
        </Link>
        <div className={`bg-brvm-card border rounded-xl p-5 shadow-sm ${isPremium ? 'border-amber-200' : 'border-brvm-border'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isPremium ? 'bg-amber-50' : 'bg-slate-100'}`}>
            <Bot size={20} className={isPremium ? 'text-brvm-gold' : 'text-brvm-muted'} />
          </div>
          <h3 className="text-brvm-text font-semibold text-sm mb-1 flex items-center gap-2">
            Assistant IA
            {!isPremium && <span className="text-xs text-brvm-muted">({user?.credits_remaining ?? 5} crédits)</span>}
          </h3>
          <p className="text-brvm-muted text-xs">Analysez les marchés avec l'IA</p>
        </div>
      </div>

      {/* Upgrade banner */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-brvm-gold" />
              <h3 className="text-brvm-text font-semibold">Passez à Premium</h3>
            </div>
            <p className="text-brvm-subtext text-sm">IA illimitée, rapports PDF, cours avancés et simulations sans limites.</p>
          </div>
          <button className="px-5 py-2.5 bg-brvm-gold text-white font-bold rounded-lg text-sm hover:bg-amber-500 transition-colors flex-shrink-0">
            Voir les offres
          </button>
        </div>
      )}
    </div>
  )
}
