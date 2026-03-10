import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, BarChart2, Briefcase,
  BookOpen, ArrowRight, Activity, ShieldCheck, Zap
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { fetchMarketOverview, fetchMovers } from '../store/slices/marketSlice'
import Spinner from '../components/common/Spinner'

function VariationBadge({ value }: { value: number }) {
  const isPos = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
      isPos ? 'bg-emerald-50 text-brvm-green' : 'bg-red-50 text-brvm-red'
    }`}>
      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
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
    {
      icon: <BarChart2 size={22} />,
      title: 'Analyses en temps réel',
      desc: 'Graphiques interactifs, historique des cours et indicateurs techniques pour toutes les valeurs BRVM.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: <Briefcase size={22} />,
      title: 'Simulation de portefeuille',
      desc: 'Entraînez-vous avec du capital fictif avant d\'investir réellement. Achetez, vendez, suivez vos P&L.',
      color: 'bg-emerald-50 text-brvm-green',
    },
    {
      icon: <BookOpen size={22} />,
      title: 'Formation complète',
      desc: 'Des cours pour débutants aux analyses avancées, articles de fond et glossaire financier.',
      color: 'bg-amber-50 text-brvm-gold',
    },
    {
      icon: <Zap size={22} />,
      title: 'Assistant IA',
      desc: 'Posez vos questions sur les marchés et les entreprises, obtenez des analyses instantanées.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: <ShieldCheck size={22} />,
      title: 'Données fiables',
      desc: 'Cours, dividendes, rapports financiers et actualités issus des sources officielles de la BRVM.',
      color: 'bg-slate-100 text-brvm-subtext',
    },
    {
      icon: <Activity size={22} />,
      title: 'Suivi du marché',
      desc: 'Vue d\'ensemble en temps réel : meilleures hausses, baisses et valeurs les plus actives du jour.',
      color: 'bg-rose-50 text-rose-500',
    },
  ]

  return (
    <div className="space-y-14">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative text-center pt-14 pb-10 overflow-hidden">
        {/* Fond gradient décoratif */}
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[600px] bg-brvm-green/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Badge live */}
          <div className="inline-flex items-center gap-2 bg-white border border-brvm-green/30 text-brvm-green text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm">
            <span className="w-2 h-2 bg-brvm-green rounded-full animate-pulse" />
            Marché en direct · BRVM · UEMOA
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-brvm-text mb-5 leading-[1.1] tracking-tight">
            La bourse africaine,
            <br />
            <span className="text-brvm-green">enfin accessible.</span>
          </h1>

          <p className="text-brvm-subtext max-w-2xl mx-auto text-lg mb-10 leading-relaxed">
            Suivez les entreprises cotées sur la BRVM, analysez les marchés,
            simulez votre portefeuille et apprenez à investir avec confiance.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-brvm-green text-white font-bold rounded-xl hover:bg-emerald-500 transition-all text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Commencer gratuitement
            </Link>
            <Link
              to="/market"
              className="px-8 py-3.5 bg-white border border-brvm-border text-brvm-subtext font-semibold rounded-xl hover:border-brvm-green/40 hover:text-brvm-green transition-all text-sm flex items-center gap-2 shadow-sm"
            >
              Explorer le marché <ArrowRight size={15} />
            </Link>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            {[
              { value: '47', label: 'entreprises cotées' },
              { value: '8', label: 'pays UEMOA' },
              { value: '1998', label: 'depuis' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-brvm-text">{value}</p>
                <p className="text-brvm-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Aperçu du marché ─────────────────────────────────────────────── */}
      {loading ? (
        <Spinner />
      ) : overview ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-brvm-text font-bold text-xl">Aperçu du marché</h2>
              <p className="text-brvm-muted text-sm mt-0.5">Séance du jour · données simulées</p>
            </div>
            <Link
              to="/market"
              className="flex items-center gap-1.5 text-brvm-green text-sm font-semibold hover:underline"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>

          {/* Stat cards colorées */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-brvm-border rounded-2xl p-5 shadow-sm">
              <p className="text-brvm-muted text-xs uppercase tracking-wider mb-2">Sociétés</p>
              <p className="text-3xl font-extrabold text-brvm-text">{overview.summary.total_companies}</p>
              <p className="text-brvm-muted text-xs mt-1">cotées à la BRVM</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <p className="text-brvm-green text-xs uppercase tracking-wider font-semibold mb-2">En hausse</p>
              <p className="text-3xl font-extrabold text-brvm-green">{overview.summary.advances}</p>
              <p className="text-emerald-400 text-xs mt-1">actions positives</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
              <p className="text-brvm-red text-xs uppercase tracking-wider font-semibold mb-2">En baisse</p>
              <p className="text-3xl font-extrabold text-brvm-red">{overview.summary.declines}</p>
              <p className="text-red-300 text-xs mt-1">actions négatives</p>
            </div>
            <div className="bg-slate-50 border border-brvm-border rounded-2xl p-5 shadow-sm">
              <p className="text-brvm-muted text-xs uppercase tracking-wider font-semibold mb-2">Stables</p>
              <p className="text-3xl font-extrabold text-brvm-subtext">{overview.summary.unchanged}</p>
              <p className="text-brvm-muted text-xs mt-1">sans variation</p>
            </div>
          </div>

          {/* Top movers */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Gainers */}
            <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-brvm-border bg-emerald-50/60">
                <div className="w-7 h-7 bg-brvm-green rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <h3 className="text-brvm-text font-bold text-sm">Meilleures hausses</h3>
              </div>
              <div className="divide-y divide-brvm-border">
                {gainers.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    to={`/market/${s.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-emerald-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-brvm-green font-bold font-mono text-xs flex-shrink-0">
                        {s.ticker.slice(0, 3)}
                      </span>
                      <div>
                        <p className="text-brvm-text text-sm font-semibold">{s.ticker}</p>
                        <p className="text-brvm-muted text-xs truncate max-w-[140px]">{s.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-brvm-text text-sm font-mono font-semibold">{s.current_price.toLocaleString('fr-FR')} F</p>
                      <VariationBadge value={s.variation} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-brvm-border bg-red-50/60">
                <div className="w-7 h-7 bg-brvm-red rounded-lg flex items-center justify-center">
                  <TrendingDown size={14} className="text-white" />
                </div>
                <h3 className="text-brvm-text font-bold text-sm">Plus fortes baisses</h3>
              </div>
              <div className="divide-y divide-brvm-border">
                {losers.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    to={`/market/${s.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-red-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-brvm-red font-bold font-mono text-xs flex-shrink-0">
                        {s.ticker.slice(0, 3)}
                      </span>
                      <div>
                        <p className="text-brvm-text text-sm font-semibold">{s.ticker}</p>
                        <p className="text-brvm-muted text-xs truncate max-w-[140px]">{s.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-brvm-text text-sm font-mono font-semibold">{s.current_price.toLocaleString('fr-FR')} F</p>
                      <VariationBadge value={s.variation} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-brvm-text mb-3">Tout ce dont vous avez besoin</h2>
          <p className="text-brvm-subtext text-base max-w-xl mx-auto">
            Une plateforme complète pour suivre, apprendre et simuler vos investissements sur la BRVM.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-brvm-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-brvm-text font-bold mb-2">{f.title}</h3>
              <p className="text-brvm-subtext text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brvm-green to-emerald-600 rounded-3xl p-12 text-center shadow-xl shadow-emerald-500/20">
        {/* Décoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <ShieldCheck size={12} /> Inscription 100% gratuite
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Prêt à commencer ?</h2>
          <p className="text-emerald-100 text-sm mb-8">
            Rejoignez la plateforme et investissez mieux sur les marchés africains.
            <br />Aucune carte bancaire requise.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-brvm-green font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow-lg"
            >
              Créer un compte gratuit
            </Link>
            <Link
              to="/market"
              className="px-8 py-3.5 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
            >
              Voir le marché <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
