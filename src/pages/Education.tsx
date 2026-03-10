import { useEffect, useState, useRef, useMemo } from 'react'
import {
  BookOpen, FileText, Search, Lock, PlayCircle,
  ChevronDown, ChevronLeft, ChevronRight, ArrowLeft,
  Clock, TrendingUp, PieChart, Users, X, Star,
} from 'lucide-react'
import { mockEducationApi as educationApi } from '../mocks/education-data'
import type { Article, GlossaryTerm } from '../types'
import Spinner from '../components/common/Spinner'

// ─── Data types ───────────────────────────────────────────────────────────────
interface LessonPart { label: string; videoId: string }
interface Lesson     { id: string; title: string; videoId: string; parts?: LessonPart[] }
interface Chapter    { id: number; title: string; lessons: Lesson[] }
type FlatLesson = Lesson & { chapterId: number; chapterTitle: string; lessonIndex: number }

interface CourseEntry {
  id: number
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'coaching'
  is_paid: boolean
  price: number | null
  isCoaching?: boolean
  chapters: Chapter[]
}

// ─── Course 0 — Les Bases ─────────────────────────────────────────────────────
const COURSE0_CHAPTERS: Chapter[] = [
  {
    id: 1, title: "Les bases de l'investissement",
    lessons: [
      { id: 'b1-l1', title: 'Les bases — Partie 1', videoId: 'rezkPsHZU-U' },
      { id: 'b1-l2', title: 'Les bases — Partie 2', videoId: '9vSIS2XMadY' },
      { id: 'b1-l3', title: 'Les bases — Partie 3', videoId: 'EmmyRBKRMwA' },
    ],
  },
]

// ─── Course 1 — Cours complet sur la BRVM ─────────────────────────────────────
const COURSE1_CHAPTERS: Chapter[] = [
  {
    id: 1, title: 'Introduction à la Bourse',
    lessons: [
      { id: 'c1-l1', title: 'Présentation et déroulé du programme',       videoId: 'hH1XSWMIuoA' },
      { id: 'c1-l2', title: "Qu'est-ce que la bourse ?",                  videoId: 'dJ4eFXeupGA' },
      { id: 'c1-l3', title: 'Le marché primaire et le marché secondaire', videoId: '8MtWodC_RQw' },
      { id: 'c1-l4', title: 'Les actions et les obligations',             videoId: 'hOufur9bu0g' },
    ],
  },
  {
    id: 2, title: 'Les gains à la BRVM',
    lessons: [
      { id: 'c2-l1', title: 'La notion de dividende',                        videoId: 'IjkP-sScIEo' },
      { id: 'c2-l2', title: 'La notion de plus-value',                       videoId: '7e5QIcSvHiE' },
      { id: 'c2-l3', title: 'Dividende vs intérêt bancaire : la différence', videoId: 'w1l2cVgsQ_M' },
    ],
  },
  {
    id: 3, title: "Stratégies d'investissement",
    lessons: [
      { id: 'c3-l1', title: 'La stratégie de rente',      videoId: 'T65OTRA2EAQ' },
      { id: 'c3-l2', title: 'La stratégie de croissance', videoId: 'k1oGmvem__8' },
    ],
  },
  {
    id: 4, title: 'Fonctionnement de la BRVM',
    lessons: [
      { id: 'c4-l1', title: 'Le bulletin de la cote — Partie 1', videoId: 'xioh5qHi-s0' },
      { id: 'c4-l2', title: 'Le bulletin de la cote — Partie 2', videoId: 'TNoBt6lftMc' },
      { id: 'c4-l3', title: 'Les indices boursiers',              videoId: 'spdc9OtgVWY' },
    ],
  },
  {
    id: 5, title: 'Le choix des actions',
    lessons: [
      { id: 'c5-l1', title: "Introduction au choix de l'action",                 videoId: 'rUBsJp-nw_g' },
      { id: 'c5-l2', title: 'Étude des performances des entreprises — Partie 1', videoId: 'nlXMLbllEwI' },
      { id: 'c5-l3', title: 'Étude des performances des entreprises — Partie 2', videoId: 'Mkn2IDep2tE' },
      { id: 'c5-l4', title: 'Étude des perspectives des entreprises — Partie 1', videoId: 'hXyO5Onxvqw' },
      { id: 'c5-l5', title: 'Étude des perspectives des entreprises — Partie 2', videoId: 'siJwEqhSx84' },
    ],
  },
  {
    id: 6, title: 'Cas pratiques et démonstrations',
    lessons: [
      { id: 'c6-l1', title: 'Analyse de BOA CI',                                        videoId: 'JianvcpoNJ0' },
      { id: 'c6-l2', title: "Présentation d'un compte titre (Coris Bourse & SGI Togo)", videoId: 'Dh_kifSGBcg' },
      { id: 'c6-l3', title: "Démonstration d'achat d'action et d'obligation",           videoId: '7FDzvn6EUyc' },
      { id: 'c6-l4', title: "Démonstration de vente d'action et d'obligation",          videoId: 'auVNUVb_nmM' },
    ],
  },
]

// ─── Course 2 — Comprendre et investir dans les FCP ───────────────────────────
const COURSE2_CHAPTERS: Chapter[] = [
  {
    id: 1, title: 'Comprendre les produits',
    lessons: [
      { id: 'd1-l1', title: "Les bases de l'investissement", videoId: 'Zyj-rPldWQI' },
      {
        id: 'd1-l2', title: 'Fonctionnement des FCP', videoId: 'eCjZRR4XNGU',
        parts: [
          { label: 'Partie 1', videoId: 'eCjZRR4XNGU' },
          { label: 'Partie 2', videoId: 'ViNCs3i727Q' },
        ],
      },
    ],
  },
  {
    id: 2, title: 'Guide pas-à-pas',
    lessons: [
      { id: 'd2-l1', title: 'Simulation',            videoId: 'TiQPMT3bA9M' },
      { id: 'd2-l2', title: 'Inscription',           videoId: 'VyMJeBHxzzU' },
      { id: 'd2-l3', title: "Démo d'investissement", videoId: 'sFYju9KVZow' },
      { id: 'd2-l4', title: 'Retirer son argent',    videoId: 'OVgrft4XnIU' },
    ],
  },
]

// ─── Catalog ──────────────────────────────────────────────────────────────────
const COURSES_CATALOG: CourseEntry[] = [
  {
    id: 0,
    title: 'Les Bases',
    description: "Commencez ici. Les fondamentaux de l'investissement expliqués simplement, sans jargon. Idéal pour découvrir la BRVM.",
    level: 'beginner',
    is_paid: false,
    price: null,
    chapters: COURSE0_CHAPTERS,
  },
  {
    id: 1,
    title: 'Cours complet sur la BRVM',
    description: "Le programme complet : actions, obligations, stratégies, fonctionnement de la bourse et analyses de cas pratiques sur 6 chapitres.",
    level: 'beginner',
    is_paid: true,
    price: 40000,
    chapters: COURSE1_CHAPTERS,
  },
  {
    id: 2,
    title: 'Comprendre et investir dans les FCP',
    description: "Tout sur les Fonds Communs de Placement : fonctionnement, simulation, inscription et premiers investissements guidés pas-à-pas.",
    level: 'intermediate',
    is_paid: true,
    price: 15000,
    chapters: COURSE2_CHAPTERS,
  },
  {
    id: 3,
    title: 'Coaching Personnalisé',
    description: "Un accompagnement 100 % sur mesure selon vos objectifs, votre budget et votre niveau. Tarif adapté à chaque profil.",
    level: 'coaching',
    is_paid: false,
    price: null,
    isCoaching: true,
    chapters: [],
  },
]

// ─── Card visuals ──────────────────────────────────────────────────────────────
const CARD_GRADIENT: Record<number, string> = {
  0: 'linear-gradient(135deg, #10b981 0%, #059669 55%, #047857 100%)',
  1: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 55%, #4338ca 100%)',
  2: 'linear-gradient(135deg, #f59e0b 0%, #d97706 55%, #b45309 100%)',
  3: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 55%, #6d28d9 100%)',
}

function CardIcon({ id }: { id: number }) {
  const cls = 'text-white'
  if (id === 0) return <BookOpen size={38} className={cls} strokeWidth={1.5} />
  if (id === 1) return <TrendingUp size={38} className={cls} strokeWidth={1.5} />
  if (id === 2) return <PieChart size={38} className={cls} strokeWidth={1.5} />
  return <Users size={38} className={cls} strokeWidth={1.5} />
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Débutant', intermediate: 'Intermédiaire', coaching: 'Sur mesure',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function flattenLessons(chapters: Chapter[]): FlatLesson[] {
  return chapters.flatMap((ch) =>
    ch.lessons.map((l, i) => ({ ...l, chapterId: ch.id, chapterTitle: ch.title, lessonIndex: i }))
  )
}
function countLessons(chapters: Chapter[]) {
  return chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
}

type Tab = 'courses' | 'articles' | 'glossary'

// ─── Coaching modal ───────────────────────────────────────────────────────────
function CoachingModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const perks = [
    { icon: '🎯', text: 'Programme entièrement adapté à vos objectifs' },
    { icon: '📊', text: 'Analyse de votre portefeuille en temps réel' },
    { icon: '📅', text: 'Sessions individuelles en visioconférence' },
    { icon: '📈', text: "Plan d'investissement sur mesure" },
    { icon: '🔔', text: 'Suivi hebdomadaire et reporting personnalisé' },
    { icon: '⚡', text: 'Accès prioritaire à nos analyses de marché' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div
          className="relative px-6 py-7 text-white"
          style={{ background: CARD_GRADIENT[3] }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 rounded-xl p-2.5">
              <Users size={22} />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Offre Premium</p>
              <h2 className="text-white font-bold text-xl">Coaching Personnalisé</h2>
            </div>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Un accompagnement 100 % sur mesure, pensé pour vous. Que vous soyez débutant ou investisseur confirmé, nous adaptons chaque aspect à votre profil.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-brvm-subtext text-xs font-semibold uppercase tracking-wider mb-3">Ce que peut inclure votre coaching</p>
          <div className="space-y-2.5 mb-5">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base">{p.icon}</span>
                <span className="text-brvm-text text-sm">{p.text}</span>
              </div>
            ))}
          </div>

          {/* Price note */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-start gap-3 mb-5">
            <Star size={16} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-violet-700 text-sm leading-relaxed">
              Le tarif est établi sur devis, en fonction de vos besoins et de la durée de l'accompagnement. Contactez-nous pour obtenir une proposition personnalisée.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="https://wa.me/+225XXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-brvm-green text-white font-semibold py-2.5 rounded-xl text-sm text-center hover:bg-brvm-green/90 transition-colors shadow-sm"
            >
              Nous contacter sur WhatsApp
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brvm-border text-brvm-muted text-sm hover:text-brvm-text hover:border-brvm-text/30 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Paywall overlay ──────────────────────────────────────────────────────────
function PaywallOverlay({ course }: { course: CourseEntry }) {
  return (
    <div className="aspect-video relative overflow-hidden rounded-t-xl">
      {/* Fake cinematic video background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)' }}
      >
        {/* Ambient color glows */}
        <div className="absolute inset-0 opacity-50" style={{
          background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.35) 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(16,185,129,0.2) 0%, transparent 50%)',
        }} />
        {/* Fake blurred play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 blur-sm">
          <div className="w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center">
            <div className="ml-1.5 border-l-[20px] border-l-white/70 border-y-[12px] border-y-transparent" />
          </div>
        </div>
        {/* Fake blurred bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/80 to-transparent blur-[1px] opacity-50">
          <div className="absolute bottom-3 left-5 right-5">
            <div className="h-0.5 bg-white/25 rounded-full mb-2 w-full">
              <div className="h-full w-[38%] bg-white/50 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm bg-white/35" />
              <div className="w-10 h-1.5 rounded bg-white/25" />
              <div className="ml-auto w-6 h-3 rounded bg-white/25" />
            </div>
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[3px] px-6 text-center"
           style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center mb-5 shadow-xl">
          <Lock size={28} className="text-white" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Contenu réservé</h3>
        <p className="text-white/65 text-sm leading-relaxed mb-6 max-w-xs">
          Achetez ce cours pour débloquer l'accès à toutes les vidéos et progresser à votre rythme.
        </p>
        <div className="flex flex-col items-center gap-3">
          <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">Prix d'accès</span>
          <span className="bg-white text-slate-900 font-extrabold text-2xl px-7 py-2.5 rounded-2xl shadow-lg">
            {course.price?.toLocaleString('fr-FR')} FCFA
          </span>
          <button className="bg-brvm-green text-white font-semibold px-8 py-2.5 rounded-xl text-sm hover:bg-brvm-green/90 transition-colors shadow-lg mt-1">
            Acheter ce cours
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Education() {
  const [tab, setTab]           = useState<Tab>('courses')
  const [articles, setArticles] = useState<Article[]>([])
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [expandedGlossary, setExpandedGlossary] = useState<number | null>(null)

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedId, setSelectedId]             = useState<string>('')
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [activePart, setActivePart]             = useState(0)
  const [showCoachingModal, setShowCoachingModal] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([educationApi.articles(), educationApi.glossary()])
      .then(([a, g]) => { setArticles(a); setGlossary(g) })
      .finally(() => setLoading(false))
  }, [])

  const selectedCourse = useMemo(
    () => COURSES_CATALOG.find((c) => c.id === selectedCourseId) ?? null,
    [selectedCourseId],
  )
  const courseChapters = selectedCourse?.chapters ?? []
  const allLessons     = useMemo(() => flattenLessons(courseChapters), [courseChapters])
  const totalLessons   = allLessons.length

  const currentIdx    = allLessons.findIndex((l) => l.id === selectedId)
  const currentLesson = allLessons[currentIdx] ?? null
  const prevLesson    = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson    = currentIdx < totalLessons - 1 ? allLessons[currentIdx + 1] : null
  const activeVideoId = currentLesson?.parts
    ? currentLesson.parts[activePart]?.videoId
    : currentLesson?.videoId

  const handleCardClick = (course: CourseEntry) => {
    if (course.isCoaching) { setShowCoachingModal(true); return }
    const firstLesson = course.chapters[0]?.lessons[0]
    setSelectedCourseId(course.id)
    setSelectedId(firstLesson?.id ?? '')
    setExpandedChapters(new Set([course.chapters[0]?.id ?? 1]))
    setActivePart(0)
  }

  const handleBack = () => { setSelectedCourseId(null); setSelectedId('') }

  const handleSelect = (lesson: FlatLesson) => {
    if (selectedCourse?.is_paid) return  // locked — show paywall only
    setSelectedId(lesson.id)
    setActivePart(0)
    setExpandedChapters((prev) => new Set([...prev, lesson.chapterId]))
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const toggleChapter = (id: number) =>
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const filteredArticles = articles.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredGlossary = glossary.filter((t) =>
    !search || t.term.toLowerCase().includes(search.toLowerCase())
  )

  const totalCourseLessons = COURSES_CATALOG.filter(c => !c.isCoaching)
    .reduce((s, c) => s + countLessons(c.chapters), 0)

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge: string }[] = [
    { key: 'courses',  label: 'Formations', icon: <PlayCircle size={15} />, badge: `${COURSES_CATALOG.length}` },
    { key: 'articles', label: 'Articles',   icon: <FileText size={15} />,  badge: String(articles.length) },
    { key: 'glossary', label: 'Glossaire',  icon: <BookOpen size={15} />,  badge: String(glossary.length) },
  ]

  return (
    <div className="space-y-5">
      {showCoachingModal && <CoachingModal onClose={() => setShowCoachingModal(false)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brvm-text">Centre d'apprentissage</h1>
        <p className="text-brvm-subtext text-sm mt-1">
          Maîtrisez les marchés financiers africains · {totalCourseLessons} leçons vidéo
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(''); if (t.key !== 'courses') setSelectedCourseId(null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-brvm-text shadow-sm' : 'text-brvm-muted hover:text-brvm-subtext'
              }`}
            >
              {t.icon} {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key ? 'bg-brvm-green/10 text-brvm-green' : 'bg-slate-200 text-brvm-muted'
              }`}>
                {t.badge}
              </span>
            </button>
          ))}
        </div>
        {tab !== 'courses' && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
            <input
              type="text" placeholder="Rechercher..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-brvm-border rounded-lg pl-8 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/20 transition"
            />
          </div>
        )}
      </div>

      {/* ── FORMATIONS ─────────────────────────────────────────────────────── */}
      {tab === 'courses' && (
        <>
          {/* ── Catalog ── */}
          {selectedCourseId === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {COURSES_CATALOG.map((course, index) => {
                const lessonCount  = countLessons(course.chapters)
                const chapterCount = course.chapters.length
                return (
                  <button
                    key={course.id}
                    onClick={() => handleCardClick(course)}
                    className="bg-white border border-brvm-border rounded-2xl overflow-hidden text-left hover:shadow-xl hover:border-transparent hover:-translate-y-0.5 transition-all duration-200 group flex flex-col shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative h-44 w-full overflow-hidden flex-shrink-0"
                      style={{ background: CARD_GRADIENT[course.id] }}
                    >
                      {/* Decorative circles */}
                      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
                      <div className="absolute top-8 left-10 w-10 h-10 rounded-full bg-white/10" />

                      {/* Formation number */}
                      <div className="absolute top-3.5 left-3.5 bg-black/25 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        Formation {index + 1}
                      </div>

                      {/* Price / Free badge — prominent */}
                      {course.isCoaching ? (
                        <div className="absolute top-3.5 right-3.5 bg-white text-violet-700 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md border border-violet-100 tracking-wide">
                          SUR DEVIS
                        </div>
                      ) : course.is_paid ? (
                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-white text-amber-600 font-extrabold px-3 py-1.5 rounded-xl shadow-md border border-amber-100">
                          <Lock size={10} className="flex-shrink-0" />
                          <span className="text-xs tracking-wide">{course.price?.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      ) : (
                        <div className="absolute top-3.5 right-3.5 bg-white text-emerald-600 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md border border-emerald-100 tracking-wide">
                          GRATUIT
                        </div>
                      )}

                      {/* Level badge */}
                      <div
                        className="absolute bottom-3.5 left-3.5 text-white text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}
                      >
                        {LEVEL_LABEL[course.level]}
                      </div>

                      {/* Center icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:scale-110 transition-transform duration-200">
                          <CardIcon id={course.id} />
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="text-brvm-text font-bold text-sm leading-snug group-hover:text-brvm-green transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-brvm-subtext text-xs leading-relaxed line-clamp-3 flex-1">
                        {course.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-brvm-border mt-1">
                        {course.isCoaching ? (
                          <span className="text-xs text-brvm-muted">Offre personnalisée</span>
                        ) : (
                          <div className="flex items-center gap-2.5 text-xs text-brvm-muted">
                            <span className="flex items-center gap-1">
                              <BookOpen size={10} /> {chapterCount} ch.
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {lessonCount} leçons
                            </span>
                          </div>
                        )}
                        <span className="text-xs font-semibold text-brvm-green flex items-center gap-1 group-hover:gap-2 transition-all">
                          Accéder <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Player view ── */}
          {selectedCourseId !== null && selectedCourse && (
            <>
              {/* Breadcrumb */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-brvm-muted hover:text-brvm-text transition-colors"
                >
                  <ArrowLeft size={16} /> Toutes les formations
                </button>
                <span className="text-brvm-border">·</span>
                <span className="text-sm font-semibold text-brvm-text">{selectedCourse.title}</span>
                {selectedCourse.is_paid && (
                  <>
                    <span className="text-brvm-border">·</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      <Lock size={10} /> {selectedCourse.price?.toLocaleString('fr-FR')} FCFA
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-5 items-start">
                {/* Sidebar */}
                <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
                  <div className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-brvm-border bg-slate-50 flex items-center justify-between">
                      <p className="text-xs font-semibold text-brvm-subtext uppercase tracking-wider truncate mr-2">
                        {selectedCourse.title}
                      </p>
                      <span className="text-xs text-brvm-muted bg-white border border-brvm-border rounded-full px-2 py-0.5 flex-shrink-0">
                        {totalLessons} leçons
                      </span>
                    </div>

                    {selectedCourse.is_paid && (
                      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                        <Lock size={12} className="text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-amber-700 font-medium">Achetez le cours pour débloquer</span>
                      </div>
                    )}

                    <div className="overflow-y-auto max-h-[65vh] lg:max-h-[72vh]">
                      {courseChapters.map((ch) => {
                        const isOpen    = expandedChapters.has(ch.id)
                        const hasActive = ch.lessons.some((l) => l.id === selectedId)
                        return (
                          <div key={ch.id} className="border-b border-brvm-border last:border-0">
                            <button
                              onClick={() => toggleChapter(ch.id)}
                              className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                                hasActive && !selectedCourse.is_paid ? 'bg-brvm-green/5' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                  hasActive && !selectedCourse.is_paid ? 'bg-brvm-green text-white' : 'bg-slate-200 text-brvm-subtext'
                                }`}>
                                  {ch.id}
                                </span>
                                <span className="text-xs font-semibold text-brvm-text leading-snug line-clamp-2">
                                  {ch.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs text-brvm-muted">{ch.lessons.length}</span>
                                <ChevronDown size={13} className={`text-brvm-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {isOpen && (
                              <div className="border-t border-brvm-border/60">
                                {ch.lessons.map((lesson, idx) => {
                                  const isActive = lesson.id === selectedId && !selectedCourse.is_paid
                                  const flat = allLessons.find((l) => l.id === lesson.id)!
                                  return (
                                    <button
                                      key={lesson.id}
                                      onClick={() => handleSelect(flat)}
                                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors border-b border-brvm-border/30 last:border-0 ${
                                        selectedCourse.is_paid
                                          ? 'bg-slate-50 text-brvm-muted cursor-default opacity-70'
                                          : isActive
                                            ? 'bg-brvm-green/10 text-brvm-green'
                                            : 'bg-slate-50 hover:bg-slate-100 text-brvm-subtext'
                                      }`}
                                    >
                                      <span className={`flex-shrink-0 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                        isActive ? 'bg-brvm-green text-white' : 'bg-slate-200 text-brvm-muted'
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <span className={`text-xs leading-snug flex-1 ${isActive ? 'font-semibold' : ''}`}>
                                        {lesson.title}
                                      </span>
                                      {selectedCourse.is_paid
                                        ? <Lock size={11} className="flex-shrink-0 text-amber-400" />
                                        : lesson.parts && (
                                          <span className="ml-auto flex-shrink-0 text-[10px] bg-slate-200 text-brvm-muted px-1.5 py-0.5 rounded-full font-medium">
                                            {lesson.parts.length} parties
                                          </span>
                                        )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </aside>

                {/* Player or Paywall */}
                <div className="flex-1 min-w-0 max-w-2xl" ref={playerRef}>
                  {selectedCourse.is_paid ? (
                    <div className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm">
                      <PaywallOverlay course={selectedCourse} />
                      {/* Course info below paywall */}
                      <div className="p-5 border-t border-brvm-border">
                        <h2 className="text-brvm-text font-bold text-lg">{selectedCourse.title}</h2>
                        <p className="text-brvm-subtext text-sm mt-1">{selectedCourse.description}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-brvm-muted">
                          <span className="flex items-center gap-1"><BookOpen size={12} /> {courseChapters.length} chapitres</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {totalLessons} leçons</span>
                        </div>
                      </div>
                    </div>
                  ) : currentLesson ? (
                    <div className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm">
                      <div className="aspect-video bg-slate-900 w-full">
                        <iframe
                          key={activeVideoId}
                          src={`https://www.youtube.com/embed/${activeVideoId}?rel=0&modestbranding=1`}
                          title={currentLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-semibold text-brvm-green bg-brvm-green/10 px-2 py-0.5 rounded-full">
                            Chapitre {currentLesson.chapterId}
                          </span>
                          <span className="text-xs text-brvm-muted">{currentLesson.chapterTitle}</span>
                        </div>
                        <h2 className="text-brvm-text font-bold text-lg leading-tight">{currentLesson.title}</h2>

                        {currentLesson.parts && (
                          <div className="flex gap-2 mt-3">
                            {currentLesson.parts.map((part, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActivePart(idx)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                  activePart === idx
                                    ? 'bg-brvm-green text-white border-brvm-green'
                                    : 'border-brvm-border text-brvm-muted hover:text-brvm-text hover:border-brvm-text/30'
                                }`}
                              >
                                {part.label}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 pt-4 border-t border-brvm-border">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-brvm-muted">Progression</span>
                              <span className="text-xs text-brvm-subtext font-medium">
                                {currentIdx + 1} / {totalLessons}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brvm-green rounded-full transition-all duration-300"
                                style={{ width: `${((currentIdx + 1) / totalLessons) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => prevLesson && handleSelect(prevLesson)}
                              disabled={!prevLesson}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-subtext hover:text-brvm-text hover:border-brvm-text/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft size={15} /> Précédente
                            </button>
                            <div className="flex-1 text-center">
                              {prevLesson && (
                                <p className="text-[10px] text-brvm-muted truncate hidden sm:block">
                                  ← {prevLesson.title}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => nextLesson && handleSelect(nextLesson)}
                              disabled={!nextLesson}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brvm-green text-white text-sm font-semibold hover:bg-brvm-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                              Suivante <ChevronRight size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── ARTICLES + GLOSSAIRE ──────────────────────────────────────────── */}
      {tab !== 'courses' && (
        loading ? <Spinner /> : (
          <>
            {tab === 'articles' && (
              <div className="space-y-3">
                {filteredArticles.length === 0 ? (
                  <p className="text-brvm-muted text-sm text-center py-12">Aucun article trouvé</p>
                ) : filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white border border-brvm-border rounded-xl p-5 hover:border-brvm-green/30 hover:shadow-sm transition-all cursor-pointer shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {article.category && (
                            <span className="text-xs bg-slate-100 text-brvm-subtext px-2.5 py-0.5 rounded-full font-medium">{article.category}</span>
                          )}
                          {article.is_paid
                            ? <span className="flex items-center gap-1 text-xs text-brvm-gold font-semibold bg-amber-50 px-2 py-0.5 rounded-full"><Lock size={10} /> Premium</span>
                            : <span className="text-xs text-brvm-green font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Gratuit</span>}
                        </div>
                        <h3 className="text-brvm-text font-semibold text-sm mb-1.5">{article.title}</h3>
                        {article.summary && <p className="text-brvm-subtext text-xs leading-relaxed">{article.summary}</p>}
                        <div className="flex items-center gap-3 mt-3">
                          {article.author && <span className="text-brvm-muted text-xs">Par {article.author}</span>}
                          {article.created_at && (
                            <span className="text-brvm-muted text-xs">
                              {new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <FileText size={18} className="text-brvm-muted flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'glossary' && (
              <div className="space-y-2">
                {filteredGlossary.length === 0 ? (
                  <p className="text-brvm-muted text-sm text-center py-12">Aucun terme trouvé</p>
                ) : filteredGlossary.map((term) => (
                  <div key={term.id} className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedGlossary(expandedGlossary === term.id ? null : term.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-brvm-text font-semibold text-sm">{term.term}</span>
                        {term.category && (
                          <span className="text-xs bg-slate-100 text-brvm-subtext px-2.5 py-0.5 rounded-full font-medium">{term.category}</span>
                        )}
                      </div>
                      <ChevronDown size={16} className={`text-brvm-muted flex-shrink-0 transition-transform duration-200 ${expandedGlossary === term.id ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGlossary === term.id && (
                      <div className="px-5 pb-4 border-t border-brvm-border bg-slate-50">
                        <p className="text-brvm-subtext text-sm leading-relaxed pt-3">{term.definition}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}
