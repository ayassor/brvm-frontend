import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Newspaper, Clock, TrendingUp, TrendingDown, Tag, Search } from 'lucide-react'
import { newsApi, type NewsItem, type NewsCategoryCount } from '../api/news.api'

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
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tous')
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [categories, setCategories] = useState<NewsCategoryCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Load categories once
  useEffect(() => {
    newsApi.getCategories().then(setCategories).catch(() => {})
  }, [])

  // Load articles whenever filters change (debounce search)
  useEffect(() => {
    setLoading(true)
    setError(false)
    const params: Parameters<typeof newsApi.list>[0] = { limit: 50 }
    if (category !== 'Tous') params.category = category
    if (search) params.search = search

    const t = setTimeout(() => {
      newsApi.list(params)
        .then(({ articles: data }) => { setArticles(data); setLoading(false) })
        .catch(() => { setError(true); setLoading(false) })
    }, search ? 400 : 0)

    return () => clearTimeout(t)
  }, [category, search])

  const catLabels = ['Tous', ...categories.map(c => c.name)]
  const featured = articles[0]
  const showFeatured = category === 'Tous' && !search && !!featured

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
        {catLabels.map((cat) => (
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
            {cat !== 'Tous' && (
              <span className="ml-1.5 opacity-60">
                {categories.find(c => c.name === cat)?.count ?? ''}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading / error */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brvm-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <p className="text-brvm-muted text-sm text-center py-12">
          Impossible de charger les actualités.
        </p>
      )}

      {!loading && !error && (
        <>
          {/* Featured article */}
          {showFeatured && (
            <div
              onClick={() => navigate(`/news/${featured.id}`, { state: { from: 'news' } })}
              className="bg-white border border-brvm-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-brvm-green/30 transition-all cursor-pointer group"
            >
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
                    <span className="text-brvm-muted text-xs flex items-center gap-1">
                      <Clock size={9} /> {featured.readingTime} min
                    </span>
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
          {articles.length === 0 ? (
            <p className="text-brvm-muted text-sm text-center py-12">Aucune actualité trouvée</p>
          ) : (
            <div className="space-y-3">
              {(showFeatured ? articles.slice(1) : articles).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/news/${item.id}`, { state: { from: 'news' } })}
                  className="bg-white border border-brvm-border rounded-xl p-5 hover:border-brvm-green/30 hover:shadow-sm transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
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
                      <h3 className="text-brvm-text font-semibold text-sm leading-snug mb-1.5 group-hover:text-brvm-green transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-brvm-subtext text-xs leading-relaxed line-clamp-2 mb-3">{item.summary}</p>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-brvm-muted text-xs flex items-center gap-1">
                            <Clock size={10} /> {timeAgo(item.date)}
                          </span>
                          <span className="text-brvm-muted text-xs">{item.source}</span>
                          <span className="text-brvm-muted text-xs">{item.readingTime} min</span>
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
                    <div className="w-8 h-8 bg-brvm-green/5 border border-brvm-green/20 rounded-lg flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Newspaper size={14} className="text-brvm-green" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-brvm-muted text-xs text-center pb-2">
        Sources : BRVM, BCEAO, Reuters Afrique
      </p>
    </div>
  )
}
