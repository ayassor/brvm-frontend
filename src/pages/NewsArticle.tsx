import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, Tag, TrendingUp, TrendingDown,
  Share2, Check, Bookmark, Printer, ChevronRight,
  Newspaper, Calendar, User, ExternalLink,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { newsApi, type NewsItem, type NewsArticleFull } from '../api/news.api'

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return "À l'instant"
  if (h < 24) return `Il y a ${h}h`
  if (d < 7) return `Il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/* ──────────────────────────────────────────────────────────────
   CATEGORY COLOR MAP
────────────────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Marché':    { bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500' },
  'Résultats': { bg: 'bg-violet-50',  text: 'text-violet-700', dot: 'bg-violet-500' },
  'Dividendes':{ bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Analyse':   { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-500' },
  'Corporate': { bg: 'bg-teal-50',    text: 'text-teal-700',   dot: 'bg-teal-500' },
  'Macro':     { bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-500' },
  'Indice':    { bg: 'bg-emerald-50', text: 'text-brvm-green', dot: 'bg-brvm-green' },
}
function catColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' }
}

/* ──────────────────────────────────────────────────────────────
   GRADIENT HERO per category
────────────────────────────────────────────────────────────── */
const HERO_GRADIENTS: Record<string, string> = {
  'Marché':    'from-blue-50 via-indigo-50 to-blue-100',
  'Résultats': 'from-violet-50 via-purple-50 to-violet-100',
  'Dividendes':'from-amber-50 via-yellow-50 to-amber-100',
  'Analyse':   'from-slate-50 via-gray-50 to-slate-100',
  'Corporate': 'from-teal-50 via-emerald-50 to-teal-100',
  'Macro':     'from-orange-50 via-amber-50 to-orange-100',
  'Indice':    'from-emerald-50 via-green-50 to-emerald-100',
}
function heroGradient(cat: string) {
  return HERO_GRADIENTS[cat] ?? 'from-slate-50 via-gray-50 to-slate-100'
}

/* ──────────────────────────────────────────────────────────────
   RELATED ARTICLE CARD
────────────────────────────────────────────────────────────── */
function RelatedCard({ item }: { item: NewsItem }) {
  const navigate = useNavigate()
  const cc = catColor(item.category)
  return (
    <button
      onClick={() => navigate(`/news/${item.id}`)}
      className="w-full text-left bg-white border border-brvm-border rounded-xl p-4 hover:border-brvm-green/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
          {item.category}
        </span>
        {item.isPositive !== null && item.isPositive !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${item.isPositive ? 'text-brvm-green' : 'text-brvm-red'}`}>
            {item.isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {item.isPositive ? 'Positif' : 'Négatif'}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-brvm-text leading-snug group-hover:text-brvm-green transition-colors line-clamp-2">
        {item.title}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <Clock size={10} className="text-brvm-muted" />
        <span className="text-[11px] text-brvm-muted">{timeAgo(item.date)}</span>
        <span className="text-brvm-muted text-[11px]">·</span>
        <span className="text-[11px] text-brvm-muted">{item.readingTime} min</span>
      </div>
    </button>
  )
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────────── */

// Shape for live-chart fake articles (passed via router state)
interface LiveArticle {
  id: number | string
  title: string
  summary: string
  body: string
  category: string
  source: string
  author?: string | null
  date: string
  isPositive?: boolean | null
  tags: string[]
  readingTime: number
}

/* ──────────────────────────────────────────────────────────────
   ARTICLE BODY — markdown renderer
   Dropcap appliqué sur le premier <p> via CSS first-letter
────────────────────────────────────────────────────────────── */
function ArticleBody({ body }: { body: string }) {
  let isFirst = true

  return (
    <div className="prose prose-sm max-w-none space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => {
            if (isFirst) {
              isFirst = false
              return (
                <p className="text-brvm-text leading-[1.9] text-[15px] first-letter:text-4xl first-letter:font-bold first-letter:text-brvm-green first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:mt-1">
                  {children}
                </p>
              )
            }
            return <p className="text-brvm-text leading-[1.9] text-[15px]">{children}</p>
          },
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-brvm-text mt-8 mb-3 pb-2 border-b border-brvm-border">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-brvm-text mt-6 mb-2">{children}</h3>
          ),
          strong: ({ children }) => <strong className="font-bold text-brvm-text">{children}</strong>,
          em:     ({ children }) => <em className="italic text-brvm-subtext">{children}</em>,
          del:    ({ children }) => <del className="line-through text-brvm-muted">{children}</del>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brvm-green/50 pl-5 italic text-brvm-subtext bg-brvm-green/5 py-3 pr-4 rounded-r-xl my-5">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc pl-6 space-y-1.5 text-brvm-text text-[15px]">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1.5 text-brvm-text text-[15px]">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children, className }) =>
            className ? (
              <pre className="bg-slate-50 border border-brvm-border rounded-xl px-5 py-4 text-[13px] font-mono overflow-x-auto my-5 text-brvm-text leading-relaxed">
                <code>{children}</code>
              </pre>
            ) : (
              <code className="bg-slate-100 text-brvm-text text-[13px] px-1.5 py-0.5 rounded font-mono">
                {children}
              </code>
            ),
          hr: () => <hr className="border-brvm-border my-8" />,
          a: ({ href, children }) => (
            <a href={href} className="text-brvm-green underline underline-offset-2 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-5">
              <table className="w-full text-sm border-collapse border border-brvm-border rounded-xl overflow-hidden">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => <th className="bg-brvm-bg text-left px-4 py-2.5 text-xs font-semibold text-brvm-muted uppercase tracking-wide border-b border-brvm-border">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2.5 text-brvm-text border-b border-brvm-border text-[14px]">{children}</td>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────────── */
export default function NewsArticle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [article, setArticle] = useState<NewsArticleFull | LiveArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // State passed by the caller
  const state = location.state as { article?: LiveArticle; from?: string; ticker?: string } | null
  const fromLive   = state?.from === 'live'
  const fromNews   = state?.from === 'news'
  const liveTicker = state?.ticker ?? ''

  // Live-chart articles have ids like "live-N" and carry a full article in state
  const isLive = id?.startsWith('live-')

  useEffect(() => {
    if (isLive) {
      if (state?.article) {
        setArticle(state.article)
      } else {
        setNotFound(true)
      }
      setLoading(false)
      return
    }
    newsApi.getById(id!)
      .then(data => setArticle(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brvm-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  /* ── Not found ── */
  if (notFound || !article) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <Newspaper size={48} className="text-brvm-muted opacity-30" />
        <h2 className="text-xl font-bold text-brvm-text">Article introuvable</h2>
        <p className="text-brvm-subtext text-sm">Cet article n'existe pas ou a été supprimé.</p>
        <button
          onClick={() => navigate('/news')}
          className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white rounded-lg text-sm font-medium hover:bg-brvm-green/90 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour aux actualités
        </button>
      </div>
    )
  }

  const related: NewsItem[] = (article as NewsArticleFull).related ?? []
  const cc = catColor(article.category)


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handlePrint = () => window.print()

  return (
    <div className="max-w-4xl mx-auto space-y-0">

      {/* ── Retour contextuel ────────────────────────────────────── */}
      {(fromLive || fromNews) && (
        <div className="mb-5">
          <button
            onClick={() => fromLive ? navigate('/live') : navigate('/news')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all group
              bg-white border-brvm-border text-brvm-subtext hover:border-brvm-green/40 hover:text-brvm-green hover:bg-brvm-green/5"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
            {fromLive
              ? <>Graphique live{liveTicker && <span className="font-mono font-bold ml-1 opacity-70">{liveTicker}</span>}</>
              : 'Actualités'
            }
          </button>
        </div>
      )}

      {/* ── Breadcrumb ───────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-brvm-muted mb-5 flex-wrap">
        <Link to="/" className="hover:text-brvm-text transition-colors">Accueil</Link>
        <ChevronRight size={12} />
        <Link to="/news" className="hover:text-brvm-text transition-colors">Actualités</Link>
        <ChevronRight size={12} />
        <span className={`font-medium ${cc.text}`}>{article.category}</span>
      </nav>

      {/* ── Article card ─────────────────────────────────────────── */}
      <article className="bg-white border border-brvm-border rounded-2xl overflow-hidden shadow-sm">

        {/* Hero image / gradient */}
        <div className={`h-52 bg-gradient-to-br ${heroGradient(article.category)} flex items-center justify-center relative`}>
          <Newspaper size={64} className="text-brvm-green/20" />
          {/* Sentiment pill */}
          {article.isPositive !== null && article.isPositive !== undefined && (
            <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
              article.isPositive
                ? 'bg-emerald-100 text-brvm-green border border-emerald-200'
                : 'bg-red-100 text-brvm-red border border-red-200'
            }`}>
              {article.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {article.isPositive ? 'Impact positif' : 'Impact négatif'}
            </div>
          )}
          {article.isPositive === null && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm bg-slate-100 text-slate-600 border border-slate-200">
              Impact neutre
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-7 lg:p-10">

          {/* Meta row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cc.bg} ${cc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />
              {article.category}
            </span>
            {article.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-slate-100 text-brvm-muted px-2 py-0.5 rounded-full">
                <Tag size={9} /> {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-extrabold text-brvm-text leading-tight mb-4">
            {article.title}
          </h1>

          {/* Summary / chapô */}
          <p className="text-base text-brvm-subtext leading-relaxed border-l-4 border-brvm-green/40 pl-4 mb-6 italic">
            {article.summary}
          </p>

          {/* Author / date / reading time bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-y border-brvm-border mb-8">
            <div className="flex items-center gap-4 flex-wrap">
              {article.author && (
                <div className="flex items-center gap-1.5 text-brvm-subtext text-sm">
                  <div className="w-7 h-7 bg-brvm-green/10 rounded-full flex items-center justify-center">
                    <User size={13} className="text-brvm-green" />
                  </div>
                  <span className="font-medium">{article.author}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-brvm-muted text-sm">
                <Calendar size={13} />
                <span>{fmtDate(article.date)}</span>
                <span className="opacity-50">·</span>
                <span>{fmtTime(article.date)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-brvm-muted text-sm">
                <Clock size={13} />
                <span>{article.readingTime} min de lecture</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBookmarked(b => !b)}
                title="Sauvegarder"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  bookmarked
                    ? 'bg-brvm-green/10 text-brvm-green border-brvm-green/30'
                    : 'bg-white text-brvm-muted border-brvm-border hover:border-brvm-green/30 hover:text-brvm-text'
                }`}
              >
                <Bookmark size={13} className={bookmarked ? 'fill-brvm-green' : ''} />
                {bookmarked ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
              <button
                onClick={handleShare}
                title="Copier le lien"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  copied
                    ? 'bg-brvm-green text-white border-brvm-green'
                    : 'bg-white text-brvm-muted border-brvm-border hover:border-brvm-green/30 hover:text-brvm-text'
                }`}
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                {copied ? 'Lien copié !' : 'Partager'}
              </button>
              <button
                onClick={handlePrint}
                title="Imprimer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-brvm-border bg-white text-brvm-muted hover:border-brvm-green/30 hover:text-brvm-text transition-all"
              >
                <Printer size={13} />
                Imprimer
              </button>
            </div>
          </div>

          {/* Article body */}
          <ArticleBody body={article.body ?? ''} />

          {/* Tags footer */}
          <div className="mt-10 pt-6 border-t border-brvm-border">
            <p className="text-xs font-semibold text-brvm-muted uppercase tracking-wider mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 text-xs bg-brvm-bg border border-brvm-border text-brvm-subtext px-3 py-1.5 rounded-full hover:border-brvm-green/40 hover:text-brvm-green cursor-default transition-colors"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Source */}
          <div className="mt-5 flex items-center gap-2 text-brvm-muted text-xs">
            <ExternalLink size={11} />
            <span>Source : <span className="font-semibold text-brvm-subtext">{article.source}</span></span>
          </div>
        </div>
      </article>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brvm-border rounded-xl text-sm font-medium text-brvm-subtext hover:text-brvm-text hover:border-brvm-green/30 transition-all"
        >
          <ArrowLeft size={15} />
          Retour
        </button>
        <Link
          to="/news"
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brvm-border rounded-xl text-sm font-medium text-brvm-subtext hover:text-brvm-text hover:border-brvm-green/30 transition-all"
        >
          Toutes les actualités
          <ChevronRight size={15} />
        </Link>
      </div>

      {/* ── Related articles ─────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="pt-8">
          <h2 className="text-base font-bold text-brvm-text mb-4 flex items-center gap-2">
            <Newspaper size={16} className="text-brvm-green" />
            Articles similaires
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map(item => (
              <RelatedCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <div className="pb-8" />
    </div>
  )
}
