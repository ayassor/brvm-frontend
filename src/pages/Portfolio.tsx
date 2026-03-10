import { useNavigate } from 'react-router-dom'
import { Briefcase, TrendingUp, Calculator, PieChart, ChevronRight, Check, Clock } from 'lucide-react'

const SIMULATORS = [
  {
    id: 'brvm',
    icon: Briefcase,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-brvm-green',
    title: 'Simulateur de Compte Titre BRVM',
    description:
      "Simulez un vrai compte titre sur la BRVM. Passez des ordres d'achat et de vente, gérez votre portefeuille et analysez vos performances en conditions réelles de marché.",
    features: ["Carnet d'ordres professionnel", 'Suivi portefeuille en temps réel', "Rapport d'investissement détaillé"],
    href: '/simulator/portfolio',
    available: true,
    badge: { label: 'Disponible', cls: 'bg-emerald-100 text-brvm-green' },
  },
  {
    id: 'backtest',
    icon: TrendingUp,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Backtesting de Stratégies',
    description:
      "Testez vos stratégies d'investissement sur des données historiques BRVM. Évaluez les performances passées avant de les appliquer en conditions réelles.",
    features: ['Données historiques BRVM', 'Indicateurs techniques', 'Rapport de performance'],
    href: '#',
    available: false,
    badge: { label: 'Bientôt', cls: 'bg-slate-100 text-brvm-muted' },
  },
  {
    id: 'dca',
    icon: Calculator,
    iconBg: 'bg-blue-100',
    iconColor: 'text-brvm-blue',
    title: 'Calculateur DCA',
    description:
      "Simulez une stratégie d'investissement progressif (Dollar-Cost Averaging) sur les actions BRVM. Visualisez l'impact de versements réguliers sur le long terme.",
    features: ['Versements programmés', 'Courbe de croissance', 'Comparaison de scénarios'],
    href: '#',
    available: false,
    badge: { label: 'Bientôt', cls: 'bg-slate-100 text-brvm-muted' },
  },
  {
    id: 'optimize',
    icon: PieChart,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Optimisateur de Portefeuille',
    description:
      'Analysez et optimisez la composition de votre portefeuille. Minimisez le risque pour un rendement cible selon la théorie moderne du portefeuille.',
    features: ['Frontière efficiente', 'Diversification optimale', 'Analyse risque / rendement'],
    href: '#',
    available: false,
    badge: { label: 'Bientôt', cls: 'bg-slate-100 text-brvm-muted' },
  },
]

export default function PortfolioPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brvm-text">Outils de Simulation</h1>
        <p className="text-brvm-subtext text-sm mt-1">
          Pratiquez l'investissement sans risque réel sur la BRVM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SIMULATORS.map((sim) => {
          const Icon = sim.icon
          return (
            <div
              key={sim.id}
              className={`bg-brvm-card border border-brvm-border rounded-xl p-6 shadow-sm flex flex-col gap-4 ${
                sim.available
                  ? 'hover:border-brvm-green/40 hover:shadow-md transition-all cursor-pointer'
                  : 'opacity-75'
              }`}
              onClick={() => sim.available && navigate(sim.href)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className={`w-11 h-11 ${sim.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={sim.iconColor} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sim.badge.cls}`}>
                  {sim.badge.label}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-brvm-text font-bold text-base mb-2">{sim.title}</h2>
                <p className="text-brvm-subtext text-sm leading-relaxed">{sim.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-1.5">
                {sim.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-brvm-subtext">
                    <Check size={13} className="text-brvm-green flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {sim.available ? (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(sim.href) }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-brvm-green text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors"
                >
                  Lancer le simulateur <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-brvm-muted rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  <Clock size={14} /> Bientôt disponible
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
