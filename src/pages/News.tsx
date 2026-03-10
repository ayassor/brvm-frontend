import { useState } from 'react'
import { Newspaper, Clock, TrendingUp, TrendingDown, Tag, ExternalLink, Search } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  summary: string
  category: string
  source: string
  date: string
  isPositive?: boolean | null
  tags: string[]
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    title: 'Solibra CI : hausse de 7,5% en séance, plus forte progression du jour',
    summary: "L'action Solibra CI (SLBC) a clôturé en hausse de 7,5% à 44 075 FCFA, portée par des volumes inhabituellement élevés. Selon plusieurs analystes, cette progression reflète un regain d'intérêt des investisseurs institutionnels pour le secteur de la consommation de base.",
    category: 'Marché',
    source: 'BRVM Infos',
    date: '2026-02-27T16:30:00Z',
    isPositive: true,
    tags: ['SLBC', 'Consommation', 'Hausses'],
  },
  {
    id: 2,
    title: 'La BRVM franchit les 16 100 milliards de FCFA de capitalisation',
    summary: "La Bourse Régionale des Valeurs Mobilières affiche une capitalisation boursière de 16 105 milliards de FCFA à la clôture du 27 février 2026, en progression de 20,81% sur un an. Le BRVM Composite s'établit à 417,71 points (+0,33% sur la séance).",
    category: 'Indice',
    source: 'BRVM Officiel',
    date: '2026-02-27T17:00:00Z',
    isPositive: true,
    tags: ['Indices', 'BRVM Composite', 'Capitalisation'],
  },
  {
    id: 3,
    title: 'SODE CI : bond de 7,48%, les investisseurs saluent les perspectives du secteur eau',
    summary: "La Société de Distribution d'Eau de Côte d'Ivoire (SDCC) a progressé de 7,48% à 7 685 FCFA. Cette performance s'inscrit dans un contexte de valorisation croissante des sociétés de services publics, portées par les projets d'infrastructure du gouvernement ivoirien.",
    category: 'Marché',
    source: 'Afrique Finance',
    date: '2026-02-27T16:45:00Z',
    isPositive: true,
    tags: ['SDCC', 'Services Publics', 'Infrastructure'],
  },
  {
    id: 4,
    title: "Ecobank Transnational : résultats annuels 2025 en hausse de 12%",
    summary: "Ecobank Transnational Incorporated (ETI) a publié ses résultats annuels pour l'exercice 2025. Le bénéfice net consolidé ressort à 1,2 milliard de dollars, en progression de 12% par rapport à 2024. Le groupe affirme sa position de premier réseau bancaire panafricain avec des opérations dans 33 pays.",
    category: 'Résultats',
    source: 'Ecobank IR',
    date: '2026-02-26T09:00:00Z',
    isPositive: true,
    tags: ['ETIT', 'Résultats', 'Banque'],
  },
  {
    id: 5,
    title: 'Bank of Africa Niger recule de 2,84%, plus forte baisse de la séance',
    summary: "L'action BOAN a cédé 2,84% à 2 910 FCFA dans des volumes significatifs de 19 456 titres échangés. Cette correction intervient après plusieurs séances de hausse consécutives. Les analystes évoquent une prise de bénéfices sans remise en cause des fondamentaux de la banque.",
    category: 'Marché',
    source: 'BRVM Infos',
    date: '2026-02-27T16:30:00Z',
    isPositive: false,
    tags: ['BOAN', 'Services Financiers', 'Baisses'],
  },
  {
    id: 6,
    title: "Sonatel : dividende de 1 655 FCFA par action confirmé pour 2025",
    summary: "Sonatel (SNTS) a confirmé le versement d'un dividende net de 1 655 FCFA par action au titre de l'exercice 2025, en hausse de 9% par rapport à l'an dernier. La date de détachement est fixée au 17 mai 2026. Ce dividende représente un rendement de 5,65% au cours actuel.",
    category: 'Dividendes',
    source: 'Sonatel IR',
    date: '2026-02-25T14:00:00Z',
    isPositive: true,
    tags: ['SNTS', 'Dividende', 'Télécoms'],
  },
  {
    id: 7,
    title: "La BCEAO maintient son taux directeur à 3,5% — impact sur le marché obligataire",
    summary: "La Banque Centrale des États de l'Afrique de l'Ouest (BCEAO) a décidé de maintenir son taux directeur à 3,5% lors de sa réunion de politique monétaire. Cette décision influence les rendements sur le marché obligataire UEMOA, avec des taux longs qui se stabilisent autour de 6,2%.",
    category: 'Macro',
    source: 'BCEAO',
    date: '2026-02-24T11:00:00Z',
    isPositive: true,
    tags: ['BCEAO', 'Obligations', 'Taux'],
  },
  {
    id: 8,
    title: "Filtisac CI : rendement record de 72% — comprendre un ratio hors norme",
    summary: "Le titre FTSC affiche un rendement sur dividende de 72% selon les données officielles de la BRVM. Cette situation exceptionnelle s'explique par le niveau du dividende versé (1 726,56 FCFA) rapporté à un cours qui a été historiquement plus élevé. Les investisseurs doivent analyser ce ratio avec précaution.",
    category: 'Analyse',
    source: 'Afrivest Research',
    date: '2026-02-26T10:30:00Z',
    isPositive: null,
    tags: ['FTSC', 'Dividende', 'Analyse'],
  },
  {
    id: 9,
    title: "Orange Côte d'Ivoire : lancement d'une nouvelle offre de Mobile Money",
    summary: "Orange CI (ORAC) annonce l'expansion de ses services financiers mobiles avec le lancement d'une offre de crédit instantané via Orange Money. Ce nouveau produit vise les 15 millions d'abonnés Orange CI et renforce la position du groupe dans la fintech ouest-africaine.",
    category: 'Corporate',
    source: 'Orange CI',
    date: '2026-02-23T08:30:00Z',
    isPositive: true,
    tags: ['ORAC', 'Fintech', 'Mobile Money'],
  },
  {
    id: 10,
    title: "Rapport BRVM : 24 hausses, 18 baisses et 5 valeurs stables à la clôture du 27 février",
    summary: "La séance du 27 février 2026 s'est clôturée avec une majorité de valeurs en progression. Sur les 47 titres cotés, 24 ont progressé, 18 ont reculé et 5 sont restés inchangés. Le volume total échangé atteint 2,3 millions de titres pour une valeur de 1,78 milliard de FCFA.",
    category: 'Marché',
    source: 'BRVM Officiel',
    date: '2026-02-27T17:30:00Z',
    isPositive: true,
    tags: ['Résumé marché', 'Volumes', 'Séance'],
  },
  {
    id: 11,
    title: "Coris Bank International : objectif de cours relevé à 15 500 FCFA",
    summary: "Plusieurs maisons de courtage de la place ont relevé leur objectif de cours sur Coris Bank International (CBIBF) à 15 500 FCFA, soit un potentiel de hausse de 10% par rapport au dernier cours. La banque burkinabè affiche une croissance soutenue avec un PER de 9,38x, inférieur à la moyenne sectorielle.",
    category: 'Analyse',
    source: 'Afrivest Research',
    date: '2026-02-22T09:15:00Z',
    isPositive: true,
    tags: ['CBIBF', 'Analyse', 'Banque'],
  },
  {
    id: 12,
    title: "UEMOA : la croissance économique attendue à 6,2% en 2026",
    summary: "Selon les projections du FMI publiées ce mois, la zone UEMOA devrait enregistrer une croissance du PIB de 6,2% en 2026, soutenue par les investissements publics, la hausse des exportations agricoles et le dynamisme du secteur des services. Un contexte favorable pour les entreprises cotées à la BRVM.",
    category: 'Macro',
    source: 'FMI / BCEAO',
    date: '2026-02-20T14:00:00Z',
    isPositive: true,
    tags: ['UEMOA', 'Macro', 'Croissance'],
  },
]

const CATEGORIES = ['Tous', 'Marché', 'Résultats', 'Dividendes', 'Analyse', 'Corporate', 'Macro', 'Indice']

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return "À l'instant"
  if (h < 24) return `Il y a ${h}h`
  if (d < 7) return `Il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function News() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tous')

  const filtered = MOCK_NEWS.filter((n) => {
    const matchCat = category === 'Tous' || n.category === category
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  const featured = MOCK_NEWS[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brvm-text">Actualités</h1>
          <p className="text-brvm-subtext text-sm mt-1">Marchés, entreprises et économie UEMOA</p>
        </div>
        <div className="relative sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
          <input
            type="text"
            placeholder="Rechercher une actualité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-brvm-border rounded-lg pl-8 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/20 transition"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              category === cat
                ? 'bg-brvm-green text-white'
                : 'bg-white border border-brvm-border text-brvm-subtext hover:border-brvm-green/40 hover:text-brvm-green'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured article (first, only when no filter active) */}
      {category === 'Tous' && !search && (
        <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="h-40 bg-gradient-to-br from-emerald-50 via-blue-50 to-emerald-100 flex items-center justify-center">
            <Newspaper size={48} className="text-brvm-green/30 group-hover:text-brvm-green/50 transition-colors" />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs bg-brvm-green/10 text-brvm-green px-2.5 py-0.5 rounded-full font-semibold">
                À la une
              </span>
              <span className="text-xs bg-slate-100 text-brvm-subtext px-2.5 py-0.5 rounded-full font-medium">
                {featured.category}
              </span>
              {featured.isPositive !== undefined && featured.isPositive !== null && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${featured.isPositive ? 'text-brvm-green' : 'text-brvm-red'}`}>
                  {featured.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {featured.isPositive ? 'Positif' : 'Négatif'}
                </span>
              )}
            </div>
            <h2 className="text-brvm-text font-bold text-lg leading-snug mb-2 group-hover:text-brvm-green transition-colors">
              {featured.title}
            </h2>
            <p className="text-brvm-subtext text-sm leading-relaxed line-clamp-2 mb-4">{featured.summary}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-brvm-muted text-xs flex items-center gap-1">
                  <Clock size={11} /> {timeAgo(featured.date)}
                </span>
                <span className="text-brvm-muted text-xs">{featured.source}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {featured.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-slate-100 text-brvm-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Tag size={9} /> {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Articles list */}
      {filtered.length === 0 ? (
        <p className="text-brvm-muted text-sm text-center py-12">Aucune actualité trouvée</p>
      ) : (
        <div className="space-y-3">
          {(category === 'Tous' && !search ? filtered.slice(1) : filtered).map((item) => (
            <div
              key={item.id}
              className="bg-white border border-brvm-border rounded-xl p-5 hover:border-brvm-green/30 hover:shadow-sm transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-slate-100 text-brvm-subtext px-2.5 py-0.5 rounded-full font-medium">
                      {item.category}
                    </span>
                    {item.isPositive !== undefined && item.isPositive !== null && (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold ${item.isPositive ? 'text-brvm-green' : 'text-brvm-red'}`}>
                        {item.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {item.isPositive ? 'Positif' : 'Négatif'}
                      </span>
                    )}
                  </div>
                  {/* Title */}
                  <h3 className="text-brvm-text font-semibold text-sm leading-snug mb-1.5 group-hover:text-brvm-green transition-colors">
                    {item.title}
                  </h3>
                  {/* Summary */}
                  <p className="text-brvm-subtext text-xs leading-relaxed line-clamp-2 mb-3">{item.summary}</p>
                  {/* Footer */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-brvm-muted text-xs flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(item.date)}
                      </span>
                      <span className="text-brvm-muted text-xs">{item.source}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-brvm-muted px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-brvm-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-brvm-muted text-xs text-center pb-2">
        Données simulées à des fins de démonstration · Sources : BRVM, BCEAO, Reuters Afrique
      </p>
    </div>
  )
}
