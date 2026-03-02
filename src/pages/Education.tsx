import { useEffect, useState } from 'react'
import { BookOpen, FileText, Search, Lock, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { educationApi } from '../api/education.api'
import type { Course, Article, GlossaryTerm } from '../types'
import Spinner from '../components/common/Spinner'

type Tab = 'courses' | 'articles' | 'glossary'

const levelColors: Record<string, string> = {
  beginner: 'bg-brvm-green/10 text-brvm-green',
  intermediate: 'bg-brvm-gold/10 text-brvm-gold',
  advanced: 'bg-brvm-red/10 text-brvm-red',
}
const levelLabels: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé'
}

export default function Education() {
  const [tab, setTab] = useState<Tab>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedGlossary, setExpandedGlossary] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [c, a, g] = await Promise.all([
          educationApi.courses(),
          educationApi.articles(),
          educationApi.glossary(),
        ])
        setCourses(c)
        setArticles(a)
        setGlossary(g)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredGlossary = glossary.filter((t) =>
    !search || t.term.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCourses = courses.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  const filteredArticles = articles.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(search.toLowerCase()))
  )

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'courses', label: 'Cours', icon: <PlayCircle size={15} /> },
    { key: 'articles', label: 'Articles', icon: <FileText size={15} /> },
    { key: 'glossary', label: 'Glossaire', icon: <BookOpen size={15} /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brvm-text">Centre d'apprentissage</h1>
        <p className="text-brvm-muted text-sm mt-1">Maîtrisez les marchés financiers africains</p>
      </div>

      {/* Tab + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-brvm-card border border-brvm-border rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch('') }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-brvm-green text-white'
                  : 'text-brvm-muted hover:text-brvm-text'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brvm-card border border-brvm-border rounded-lg pl-8 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green"
          />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* COURSES */}
          {tab === 'courses' && (
            <div>
              {filteredCourses.length === 0 ? (
                <p className="text-brvm-muted text-sm text-center py-12">Aucun cours disponible pour l'instant</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden hover:border-brvm-green/40 transition-colors group">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" />
                      ) : (
                        <div className="w-full h-36 bg-gradient-to-br from-brvm-green/10 to-brvm-blue/10 flex items-center justify-center">
                          <PlayCircle size={36} className="text-brvm-green/40" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${levelColors[course.level]}`}>
                            {levelLabels[course.level]}
                          </span>
                          {course.is_paid ? (
                            <span className="flex items-center gap-1 text-xs text-brvm-gold">
                              <Lock size={11} /> Premium
                            </span>
                          ) : (
                            <span className="text-xs text-brvm-green">Gratuit</span>
                          )}
                        </div>
                        <h3 className="text-brvm-text font-semibold text-sm leading-snug mb-2">{course.title}</h3>
                        {course.description && (
                          <p className="text-brvm-muted text-xs leading-relaxed line-clamp-2">{course.description}</p>
                        )}
                        {course.is_paid && course.price && (
                          <p className="text-brvm-gold font-bold text-sm mt-3">{Number(course.price).toLocaleString('fr-FR')} FCFA</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ARTICLES */}
          {tab === 'articles' && (
            <div className="space-y-3">
              {filteredArticles.length === 0 ? (
                <p className="text-brvm-muted text-sm text-center py-12">Aucun article disponible</p>
              ) : filteredArticles.map((article) => (
                <div key={article.id} className="bg-brvm-card border border-brvm-border rounded-xl p-5 hover:border-brvm-green/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {article.category && (
                          <span className="text-xs bg-white/5 text-brvm-muted px-2 py-0.5 rounded">{article.category}</span>
                        )}
                        {article.is_paid && (
                          <span className="flex items-center gap-1 text-xs text-brvm-gold"><Lock size={10} /> Premium</span>
                        )}
                        {!article.is_paid && (
                          <span className="text-xs text-brvm-green">Gratuit</span>
                        )}
                      </div>
                      <h3 className="text-brvm-text font-semibold text-sm mb-1">{article.title}</h3>
                      {article.summary && <p className="text-brvm-muted text-xs leading-relaxed">{article.summary}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        {article.author && <span className="text-brvm-muted text-xs">Par {article.author}</span>}
                        {article.created_at && <span className="text-brvm-muted text-xs">{new Date(article.created_at).toLocaleDateString('fr-FR')}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GLOSSARY */}
          {tab === 'glossary' && (
            <div className="space-y-2">
              {filteredGlossary.length === 0 ? (
                <p className="text-brvm-muted text-sm text-center py-12">Aucun terme trouvé</p>
              ) : filteredGlossary.map((term) => (
                <div key={term.id} className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedGlossary(expandedGlossary === term.id ? null : term.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-brvm-text font-semibold text-sm">{term.term}</span>
                      {term.category && (
                        <span className="text-xs bg-white/5 text-brvm-muted px-2 py-0.5 rounded">{term.category}</span>
                      )}
                    </div>
                    {expandedGlossary === term.id ? (
                      <ChevronUp size={16} className="text-brvm-muted flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-brvm-muted flex-shrink-0" />
                    )}
                  </button>
                  {expandedGlossary === term.id && (
                    <div className="px-5 pb-4 border-t border-brvm-border">
                      <p className="text-brvm-muted text-sm leading-relaxed pt-3">{term.definition}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
