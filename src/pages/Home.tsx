import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, BarChart2, Briefcase, BookOpen, ArrowRight, Activity } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { fetchMarketOverview, fetchMovers } from '../store/slices/marketSlice'
import Spinner from '../components/common/Spinner'

function VariationBadge({ value }: { value: number }) {
  const isPos = value >= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPos ? 'text-brvm-green' : 'text-brvm-red'}`}>
      {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPos ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

export default function Home() {
  const dispatch = useAppDispatch()
  const { overview, gainers, losers, loading } = useAppSelector((s) => s.market)

  useEffect(() => {
    dispatch(fetchMarketOverview())
    dispatch(fetchMovers())
  }, [dispatch])

  const features = [
    { icon: <BarChart2 size={24} />, title: 'Analyses en temps réel', desc: 'Graphiques interactifs, indicateurs techniques, données historiques complètes.' },
    { icon: <Briefcase size={24} />, title: 'Simulation de portefeuille', desc: 'Entraînez-vous avec du capital fictif avant d\'investir réellement.' },
    { icon: <BookOpen size={24} />, title: 'Formation complète', desc: 'Des cours pour débutants aux analyses avancées, progressez à votre rythme.' },
  ]

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 bg-brvm-green/10 border border-brvm-green/20 text-brvm-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Activity size={12} />
          Marché en direct · BRVM
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-brvm-text mb-4 leading-tight">
          La bourse africaine,<br />
          <span className="text-brvm-green">enfin accessible</span>
        </h1>
        <p className="text-brvm-muted max-w-xl mx-auto text-base mb-8">
          Suivez les entreprises cotées sur la BRVM, analysez les marchés, gérez votre portefeuille et apprenez à investir intelligemment.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/register" className="px-6 py-3 bg-brvm-green text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors text-sm">
            Commencer gratuitement
          </Link>
          <Link to="/market" className="px-6 py-3 border border-brvm-border text-brvm-subtext font-semibold rounded-xl hover:bg-white/5 transition-colors text-sm flex items-center gap-2">
            Voir le marché <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Market summary */}
      {loading ? (
        <Spinner />
      ) : overview ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-brvm-text font-semibold text-lg">Aperçu du marché</h2>
            <Link to="/market" className="text-brvm-green text-sm flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4 text-center">
              <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">Sociétés</p>
              <p className="text-2xl font-bold text-brvm-text">{overview.summary.total_companies}</p>
            </div>
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4 text-center">
              <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">En hausse</p>
              <p className="text-2xl font-bold text-brvm-green">{overview.summary.advances}</p>
            </div>
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4 text-center">
              <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">En baisse</p>
              <p className="text-2xl font-bold text-brvm-red">{overview.summary.declines}</p>
            </div>
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-4 text-center">
              <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">Stables</p>
              <p className="text-2xl font-bold text-brvm-muted">{overview.summary.unchanged}</p>
            </div>
          </div>

          {/* Top movers */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-brvm-green" />
                <h3 className="text-brvm-text font-semibold text-sm">Meilleures hausses</h3>
              </div>
              <div className="space-y-2">
                {gainers.slice(0, 5).map((s) => (
                  <Link key={s.id} to={`/companies/${s.id}`} className="flex items-center justify-between py-2 border-b border-brvm-border last:border-0 hover:opacity-80 transition-opacity">
                    <div>
                      <p className="text-brvm-text text-sm font-semibold">{s.ticker}</p>
                      <p className="text-brvm-muted text-xs">{s.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brvm-text text-sm font-mono">{s.current_price.toLocaleString('fr-FR')} F</p>
                      <VariationBadge value={s.variation} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={16} className="text-brvm-red" />
                <h3 className="text-brvm-text font-semibold text-sm">Plus fortes baisses</h3>
              </div>
              <div className="space-y-2">
                {losers.slice(0, 5).map((s) => (
                  <Link key={s.id} to={`/companies/${s.id}`} className="flex items-center justify-between py-2 border-b border-brvm-border last:border-0 hover:opacity-80 transition-opacity">
                    <div>
                      <p className="text-brvm-text text-sm font-semibold">{s.ticker}</p>
                      <p className="text-brvm-muted text-xs">{s.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-brvm-text text-sm font-mono">{s.current_price.toLocaleString('fr-FR')} F</p>
                      <VariationBadge value={s.variation} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Features */}
      <section>
        <h2 className="text-brvm-text font-bold text-2xl text-center mb-8">Tout ce dont vous avez besoin</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-brvm-card border border-brvm-border rounded-xl p-6">
              <div className="w-12 h-12 bg-brvm-green/10 rounded-xl flex items-center justify-center text-brvm-green mb-4">
                {f.icon}
              </div>
              <h3 className="text-brvm-text font-semibold mb-2">{f.title}</h3>
              <p className="text-brvm-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brvm-green/10 to-brvm-blue/10 border border-brvm-green/20 rounded-2xl p-10 text-center">
        <h2 className="text-2xl font-bold text-brvm-text mb-3">Prêt à commencer ?</h2>
        <p className="text-brvm-muted text-sm mb-6">Inscription gratuite · Aucune carte bancaire requise</p>
        <Link to="/register" className="inline-flex px-8 py-3 bg-brvm-green text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors text-sm">
          Créer un compte gratuit
        </Link>
      </section>
    </div>
  )
}
