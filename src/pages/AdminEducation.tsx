import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, BookOpen, FileText, Search, Layers, GraduationCap, DollarSign } from 'lucide-react'
import api from '../api/axios'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lesson {
  id: number
  title: string
  video_id: string | null
  order_num: number
  chapter_id: number | null
  course_id: number
}

interface Chapter {
  id: number
  title: string
  order_num: number
  course_id: number
  lessons?: Lesson[]
}

interface Course {
  id: number
  title: string
  description: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | 'coaching'
  is_paid: boolean
  price: number | null
  is_active: boolean
  chapters?: Chapter[]
}

interface Article {
  id: number
  title: string
  summary: string | null
  author: string | null
  category: string | null
  is_paid: boolean
  is_active: boolean
  created_at?: string
}

interface GlossaryTerm {
  id: number
  term: string
  definition: string
  category: string | null
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const eApi = {
  // Courses
  getCourses: () => api.get('/education/courses').then(r => r.data as any[]),
  createCourse: (data: Partial<Course>) => api.post('/education/admin/courses', data).then(r => r.data),
  updateCourse: (id: number, data: Partial<Course>) => api.put(`/education/admin/courses/${id}`, data).then(r => r.data),
  deleteCourse: (id: number) => api.delete(`/education/admin/courses/${id}`).then(r => r.data),

  // Chapters
  createChapter: (data: Partial<Chapter>) => api.post('/education/admin/chapters', data).then(r => r.data),
  updateChapter: (id: number, data: Partial<Chapter>) => api.put(`/education/admin/chapters/${id}`, data).then(r => r.data),
  deleteChapter: (id: number) => api.delete(`/education/admin/chapters/${id}`).then(r => r.data),

  // Lessons
  createLesson: (data: Partial<Lesson>) => api.post('/education/admin/lessons', data).then(r => r.data),
  updateLesson: (id: number, data: Partial<Lesson>) => api.put(`/education/admin/lessons/${id}`, data).then(r => r.data),
  deleteLesson: (id: number) => api.delete(`/education/admin/lessons/${id}`).then(r => r.data),

  // Articles
  getArticles: () => api.get('/education/articles').then(r => r.data as Article[]),
  createArticle: (data: Partial<Article>) => api.post('/education/admin/articles', data).then(r => r.data),
  updateArticle: (id: number, data: Partial<Article>) => api.put(`/education/admin/articles/${id}`, data).then(r => r.data),
  deleteArticle: (id: number) => api.delete(`/education/admin/articles/${id}`).then(r => r.data),

  // Glossary
  getGlossary: () => api.get('/education/glossary').then(r => r.data as GlossaryTerm[]),
  createGlossary: (data: Partial<GlossaryTerm>) => api.post('/education/admin/glossary', data).then(r => r.data),
  updateGlossary: (id: number, data: Partial<GlossaryTerm>) => api.put(`/education/admin/glossary/${id}`, data).then(r => r.data),
  deleteGlossary: (id: number) => api.delete(`/education/admin/glossary/${id}`).then(r => r.data),
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brvm-border">
          <h2 className="font-bold text-brvm-text text-lg">{title}</h2>
          <button onClick={onClose} className="text-brvm-muted hover:text-brvm-text transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-brvm-subtext mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-semibold text-brvm-subtext uppercase tracking-wide">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-brvm-green' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

const inputCls = "w-full border border-brvm-border rounded-lg px-3 py-2 text-sm text-brvm-text focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/20 transition"
const btnPrimary = "bg-brvm-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brvm-green/90 transition-colors"
const btnDanger = "text-brvm-red hover:bg-red-50 p-1.5 rounded-lg transition-colors"
const btnEdit = "text-brvm-subtext hover:bg-slate-100 p-1.5 rounded-lg transition-colors"

// ─── Level badge ──────────────────────────────────────────────────────────────
const levelConfig: Record<string, { label: string; cls: string }> = {
  beginner:     { label: 'Débutant',      cls: 'bg-green-100 text-green-700' },
  intermediate: { label: 'Intermédiaire', cls: 'bg-blue-100 text-blue-700' },
  advanced:     { label: 'Avancé',        cls: 'bg-orange-100 text-orange-700' },
  coaching:     { label: 'Coaching',      cls: 'bg-violet-100 text-violet-700' },
}

function LevelBadge({ level }: { level: string }) {
  const cfg = levelConfig[level] ?? { label: level, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

// ─── Structure panel ──────────────────────────────────────────────────────────
function StructurePanel({
  course,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: {
  course: Course
  onAddChapter: () => void
  onEditChapter: (ch: Chapter) => void
  onDeleteChapter: (id: number) => void
  onAddLesson: (chapterId: number) => void
  onEditLesson: (l: Lesson, chapterId: number) => void
  onDeleteLesson: (id: number) => void
}) {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null)

  return (
    <div className="mt-4 border-t border-brvm-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-brvm-subtext uppercase tracking-wider">
          Chapitres ({course.chapters?.length ?? 0})
        </p>
        <button
          onClick={onAddChapter}
          className="text-xs text-brvm-green hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Ajouter chapitre
        </button>
      </div>

      <div className="space-y-2">
        {course.chapters?.map(ch => (
          <div key={ch.id} className="border border-brvm-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
              <button
                onClick={() => setExpandedChapter(expandedChapter === ch.id ? null : ch.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <ChevronRight size={14} className={`text-brvm-muted transition-transform ${expandedChapter === ch.id ? 'rotate-90' : ''}`} />
                <span className="text-sm font-medium text-brvm-text">{ch.title}</span>
                <span className="text-xs text-brvm-muted">({ch.lessons?.length ?? 0} leçons)</span>
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => onEditChapter(ch)} className={btnEdit}><Pencil size={13} /></button>
                <button onClick={() => onDeleteChapter(ch.id)} className={btnDanger}><Trash2 size={13} /></button>
              </div>
            </div>

            {expandedChapter === ch.id && (
              <div className="p-3 space-y-2">
                {ch.lessons?.map(l => (
                  <div key={l.id} className="flex items-center gap-3 py-1.5 px-3 bg-white border border-brvm-border/50 rounded-lg">
                    <span className="text-xs text-brvm-muted w-5 text-center">{l.order_num}</span>
                    <span className="text-sm text-brvm-text flex-1">{l.title}</span>
                    {l.video_id && <span className="text-xs font-mono text-brvm-subtext bg-slate-100 px-2 py-0.5 rounded">{l.video_id}</span>}
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEditLesson(l, ch.id)} className={btnEdit}><Pencil size={13} /></button>
                      <button onClick={() => onDeleteLesson(l.id)} className={btnDanger}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => onAddLesson(ch.id)}
                  className="text-xs text-brvm-green hover:underline flex items-center gap-1 mt-2"
                >
                  <Plus size={12} /> Ajouter leçon
                </button>
              </div>
            )}
          </div>
        ))}
        {(!course.chapters || course.chapters.length === 0) && (
          <p className="text-brvm-muted text-xs text-center py-4">Aucun chapitre</p>
        )}
      </div>
    </div>
  )
}

// ─── Tab Formations ───────────────────────────────────────────────────────────
function TabFormations() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [structureOpen, setStructureOpen] = useState<number | null>(null)

  // Modals
  const [courseModal, setCourseModal] = useState<{ open: boolean; data: Partial<Course> }>({ open: false, data: {} })
  const [chapterModal, setChapterModal] = useState<{ open: boolean; courseId: number | null; data: Partial<Chapter> }>({ open: false, courseId: null, data: {} })
  const [lessonModal, setLessonModal] = useState<{ open: boolean; courseId: number | null; chapterId: number | null; data: Partial<Lesson> }>({ open: false, courseId: null, chapterId: null, data: {} })

  // Load courses with chapters/lessons
  const load = async () => {
    try {
      setLoading(true)
      const data = await eApi.getCourses()
      setCourses(data.map((c: any) => ({
        ...c,
        chapters: c.chapters?.map((ch: any) => ({
          ...ch,
          course_id: c.id,
          lessons: ch.lessons?.map((l: any) => ({
            ...l,
            course_id: c.id,
            chapter_id: ch.id,
          })) || [],
        })) || [],
      })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Course CRUD
  const saveCourse = async () => {
    const d = courseModal.data
    if (d.id) {
      await eApi.updateCourse(d.id, d)
    } else {
      await eApi.createCourse(d)
    }
    setCourseModal({ open: false, data: {} })
    load()
  }

  const deleteCourse = async (id: number) => {
    if (!confirm('Désactiver ce cours ?')) return
    await eApi.deleteCourse(id)
    load()
  }

  // Chapter CRUD
  const saveChapter = async () => {
    const d = chapterModal.data
    if (d.id) {
      await eApi.updateChapter(d.id, { title: d.title, order_num: d.order_num })
    } else {
      await eApi.createChapter({ course_id: chapterModal.courseId!, title: d.title, order_num: d.order_num || 0 })
    }
    setChapterModal({ open: false, courseId: null, data: {} })
    load()
  }

  const deleteChapter = async (id: number) => {
    if (!confirm('Supprimer ce chapitre ?')) return
    await eApi.deleteChapter(id)
    load()
  }

  // Lesson CRUD
  const saveLesson = async () => {
    const d = lessonModal.data
    if (d.id) {
      await eApi.updateLesson(d.id, d)
    } else {
      await eApi.createLesson({
        course_id: lessonModal.courseId!,
        chapter_id: lessonModal.chapterId!,
        title: d.title,
        video_id: d.video_id,
        order_num: d.order_num || 0,
      })
    }
    setLessonModal({ open: false, courseId: null, chapterId: null, data: {} })
    load()
  }

  const deleteLesson = async (id: number) => {
    if (!confirm('Supprimer cette leçon ?')) return
    await eApi.deleteLesson(id)
    load()
  }

  // helpers for structure panel callbacks
  const openAddChapter = (courseId: number, chaptersLen: number) => {
    setChapterModal({ open: true, courseId, data: { order_num: chaptersLen + 1 } })
  }
  const openEditChapter = (courseId: number, ch: Chapter) => {
    setChapterModal({ open: true, courseId, data: { ...ch } })
  }
  const openAddLesson = (courseId: number, chapterId: number, lessonsLen: number) => {
    setLessonModal({ open: true, courseId, chapterId, data: { order_num: lessonsLen + 1 } })
  }
  const openEditLesson = (courseId: number, chapterId: number, l: Lesson) => {
    setLessonModal({ open: true, courseId, chapterId, data: { ...l } })
  }

  if (loading) return <p className="text-brvm-muted text-sm text-center py-12">Chargement…</p>

  const activeCourse = structureOpen !== null ? courses.find(c => c.id === structureOpen) : null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-brvm-text text-base">Formations ({courses.length})</h2>
        <button
          onClick={() => setCourseModal({ open: true, data: { level: 'beginner', is_paid: false, is_active: true, price: 0 } })}
          className={btnPrimary}
        >
          <span className="flex items-center gap-1.5"><Plus size={14} /> Nouvelle formation</span>
        </button>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(course => {
          const totalLessons = course.chapters?.reduce((sum, ch) => sum + (ch.lessons?.length ?? 0), 0) ?? 0
          const isStructureOpen = structureOpen === course.id

          return (
            <div
              key={course.id}
              className={`bg-white rounded-2xl shadow-sm border transition-shadow hover:shadow-md overflow-hidden ${
                isStructureOpen ? 'border-brvm-green/40 shadow-md' : 'border-brvm-border'
              }`}
            >
              {/* Card header */}
              <div className="px-4 pt-4 pb-3 flex items-center gap-2 flex-wrap">
                <LevelBadge level={course.level} />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                  {course.is_active ? 'Actif' : 'Inactif'}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.is_paid ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                  {course.is_paid ? 'Premium' : 'Gratuit'}
                </span>
              </div>

              {/* Card body */}
              <div className="px-4 pb-3">
                <h3 className="font-bold text-brvm-text text-base leading-snug mb-1">{course.title}</h3>
                {course.description && (
                  <p className="text-brvm-subtext text-xs leading-relaxed line-clamp-2">{course.description}</p>
                )}
              </div>

              {/* Card footer */}
              <div className="px-4 pb-3 flex items-center gap-4 text-xs text-brvm-muted">
                <span className="flex items-center gap-1">
                  <Layers size={12} />
                  {course.chapters?.length ?? 0} chapitres
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap size={12} />
                  {totalLessons} leçons
                </span>
                {course.is_paid && course.price != null && (
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <DollarSign size={12} />
                    {course.price.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>

              {/* Card actions */}
              <div className="px-4 pb-4 flex items-center gap-2 border-t border-brvm-border/60 pt-3">
                <button
                  onClick={() => setCourseModal({ open: true, data: { ...course } })}
                  className="flex items-center gap-1.5 text-xs font-medium text-brvm-subtext hover:text-brvm-text bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil size={12} /> Modifier
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-brvm-red hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={12} /> Supprimer
                </button>
                <button
                  onClick={() => setStructureOpen(isStructureOpen ? null : course.id)}
                  className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    isStructureOpen
                      ? 'bg-brvm-green/10 text-brvm-green'
                      : 'bg-slate-50 hover:bg-slate-100 text-brvm-subtext hover:text-brvm-text'
                  }`}
                >
                  <ChevronDown size={12} className={`transition-transform ${isStructureOpen ? 'rotate-180' : ''}`} />
                  Structure
                </button>
              </div>
            </div>
          )
        })}

        {courses.length === 0 && (
          <div className="col-span-2 text-center py-16 text-brvm-muted text-sm">
            Aucune formation. Créez la première !
          </div>
        )}
      </div>

      {/* Structure panel (inline, below grid) */}
      {activeCourse && (
        <div className="mt-6 bg-white rounded-2xl border border-brvm-green/30 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-brvm-text text-sm flex items-center gap-2">
              <Layers size={15} className="text-brvm-green" />
              Structure — {activeCourse.title}
            </h3>
            <button onClick={() => setStructureOpen(null)} className="text-brvm-muted hover:text-brvm-text text-lg leading-none transition-colors">×</button>
          </div>
          <StructurePanel
            course={activeCourse}
            onAddChapter={() => openAddChapter(activeCourse.id, activeCourse.chapters?.length ?? 0)}
            onEditChapter={(ch) => openEditChapter(activeCourse.id, ch)}
            onDeleteChapter={deleteChapter}
            onAddLesson={(chapterId) => {
              const ch = activeCourse.chapters?.find(c => c.id === chapterId)
              openAddLesson(activeCourse.id, chapterId, ch?.lessons?.length ?? 0)
            }}
            onEditLesson={(l, chapterId) => openEditLesson(activeCourse.id, chapterId, l)}
            onDeleteLesson={deleteLesson}
          />
        </div>
      )}

      {/* Modal Course */}
      {courseModal.open && (
        <Modal title={courseModal.data.id ? 'Modifier la formation' : 'Nouvelle formation'} onClose={() => setCourseModal({ open: false, data: {} })}>
          <Field label="Titre">
            <input
              className={inputCls}
              value={courseModal.data.title || ''}
              onChange={e => setCourseModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))}
              placeholder="Titre de la formation"
            />
          </Field>
          <Field label="Description">
            <textarea
              className={inputCls}
              rows={3}
              value={courseModal.data.description || ''}
              onChange={e => setCourseModal(m => ({ ...m, data: { ...m.data, description: e.target.value } }))}
              placeholder="Description..."
            />
          </Field>
          <Field label="Niveau">
            <select
              className={inputCls}
              value={courseModal.data.level || 'beginner'}
              onChange={e => setCourseModal(m => ({ ...m, data: { ...m.data, level: e.target.value as Course['level'] } }))}
            >
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
              <option value="coaching">Coaching</option>
            </select>
          </Field>
          <Toggle
            label="Formation active"
            checked={!!courseModal.data.is_active}
            onChange={v => setCourseModal(m => ({ ...m, data: { ...m.data, is_active: v } }))}
          />
          <Toggle
            label="Formation payante"
            checked={!!courseModal.data.is_paid}
            onChange={v => setCourseModal(m => ({ ...m, data: { ...m.data, is_paid: v } }))}
          />
          {courseModal.data.is_paid && (
            <Field label="Prix (FCFA)">
              <input
                className={inputCls}
                type="number"
                value={courseModal.data.price || 0}
                onChange={e => setCourseModal(m => ({ ...m, data: { ...m.data, price: Number(e.target.value) } }))}
              />
            </Field>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setCourseModal({ open: false, data: {} })} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted hover:text-brvm-text transition-colors">Annuler</button>
            <button onClick={saveCourse} className={btnPrimary}>Enregistrer</button>
          </div>
        </Modal>
      )}

      {/* Modal Chapter */}
      {chapterModal.open && (
        <Modal title={chapterModal.data.id ? 'Modifier le chapitre' : 'Nouveau chapitre'} onClose={() => setChapterModal({ open: false, courseId: null, data: {} })}>
          <Field label="Titre">
            <input
              className={inputCls}
              value={chapterModal.data.title || ''}
              onChange={e => setChapterModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))}
              placeholder="Titre du chapitre"
            />
          </Field>
          <Field label="Ordre">
            <input
              className={inputCls}
              type="number"
              value={chapterModal.data.order_num || 0}
              onChange={e => setChapterModal(m => ({ ...m, data: { ...m.data, order_num: Number(e.target.value) } }))}
            />
          </Field>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setChapterModal({ open: false, courseId: null, data: {} })} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted hover:text-brvm-text transition-colors">Annuler</button>
            <button onClick={saveChapter} className={btnPrimary}>Enregistrer</button>
          </div>
        </Modal>
      )}

      {/* Modal Lesson */}
      {lessonModal.open && (
        <Modal title={lessonModal.data.id ? 'Modifier la leçon' : 'Nouvelle leçon'} onClose={() => setLessonModal({ open: false, courseId: null, chapterId: null, data: {} })}>
          <Field label="Titre">
            <input
              className={inputCls}
              value={lessonModal.data.title || ''}
              onChange={e => setLessonModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))}
              placeholder="Titre de la leçon"
            />
          </Field>
          <Field label="YouTube Video ID">
            <input
              className={inputCls}
              value={lessonModal.data.video_id || ''}
              onChange={e => setLessonModal(m => ({ ...m, data: { ...m.data, video_id: e.target.value } }))}
              placeholder="ex: dQw4w9WgXcQ"
            />
          </Field>
          <Field label="Ordre">
            <input
              className={inputCls}
              type="number"
              value={lessonModal.data.order_num || 0}
              onChange={e => setLessonModal(m => ({ ...m, data: { ...m.data, order_num: Number(e.target.value) } }))}
            />
          </Field>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setLessonModal({ open: false, courseId: null, chapterId: null, data: {} })} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted hover:text-brvm-text transition-colors">Annuler</button>
            <button onClick={saveLesson} className={btnPrimary}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Tab Articles ─────────────────────────────────────────────────────────────
function TabArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; data: Partial<Article> }>({ open: false, data: {} })

  const load = async () => {
    try { setLoading(true); setArticles(await eApi.getArticles()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    const d = modal.data
    if (d.id) await eApi.updateArticle(d.id, d)
    else await eApi.createArticle(d)
    setModal({ open: false, data: {} })
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Désactiver cet article ?')) return
    await eApi.deleteArticle(id)
    load()
  }

  if (loading) return <p className="text-brvm-muted text-sm text-center py-12">Chargement…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-brvm-text">Articles ({articles.length})</h2>
        <button onClick={() => setModal({ open: true, data: { is_paid: false, is_active: true } })} className={btnPrimary}>
          <span className="flex items-center gap-1.5"><Plus size={14} /> Nouvel article</span>
        </button>
      </div>

      <div className="space-y-3">
        {articles.map(a => (
          <div key={a.id} className="bg-white border border-brvm-border rounded-xl p-4 shadow-sm flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {a.category && <span className="text-xs bg-slate-100 text-brvm-subtext px-2 py-0.5 rounded-full">{a.category}</span>}
                {a.is_paid ? <span className="text-xs text-amber-600 font-semibold">Premium</span> : <span className="text-xs text-brvm-green font-semibold">Gratuit</span>}
              </div>
              <p className="font-semibold text-brvm-text text-sm">{a.title}</p>
              {a.summary && <p className="text-brvm-subtext text-xs mt-1 line-clamp-2">{a.summary}</p>}
              {a.author && <p className="text-brvm-muted text-xs mt-1">Par {a.author}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setModal({ open: true, data: { ...a } })} className={btnEdit}><Pencil size={14} /></button>
              <button onClick={() => del(a.id)} className={btnDanger}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {articles.length === 0 && <p className="text-brvm-muted text-sm text-center py-12">Aucun article</p>}
      </div>

      {modal.open && (
        <Modal title={modal.data.id ? 'Modifier l\'article' : 'Nouvel article'} onClose={() => setModal({ open: false, data: {} })}>
          <Field label="Titre"><input className={inputCls} value={modal.data.title || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))} /></Field>
          <Field label="Résumé"><textarea className={inputCls} rows={3} value={modal.data.summary || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, summary: e.target.value } }))} /></Field>
          <Field label="Auteur"><input className={inputCls} value={modal.data.author || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, author: e.target.value } }))} /></Field>
          <Field label="Catégorie"><input className={inputCls} value={modal.data.category || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, category: e.target.value } }))} /></Field>
          <Field label="Payant">
            <input type="checkbox" checked={!!modal.data.is_paid} onChange={e => setModal(m => ({ ...m, data: { ...m.data, is_paid: e.target.checked } }))} className="w-4 h-4" />
          </Field>
          <div className="flex gap-3 justify-end mt-2">
            <button onClick={() => setModal({ open: false, data: {} })} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted">Annuler</button>
            <button onClick={save} className={btnPrimary}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Tab Glossaire ────────────────────────────────────────────────────────────
function TabGlossaire() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; data: Partial<GlossaryTerm> }>({ open: false, data: {} })
  const [search, setSearch] = useState('')

  const load = async () => {
    try { setLoading(true); setTerms(await eApi.getGlossary()) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    const d = modal.data
    if (d.id) await eApi.updateGlossary(d.id, d)
    else await eApi.createGlossary(d)
    setModal({ open: false, data: {} })
    load()
  }

  const del = async (id: number) => {
    if (!confirm('Supprimer ce terme ?')) return
    await eApi.deleteGlossary(id)
    load()
  }

  const filtered = terms.filter(t => !search || t.term.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <p className="text-brvm-muted text-sm text-center py-12">Chargement…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-brvm-text">Glossaire ({terms.length} termes)</h2>
        <button onClick={() => setModal({ open: true, data: {} })} className={btnPrimary}>
          <span className="flex items-center gap-1.5"><Plus size={14} /> Nouveau terme</span>
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
        <input type="text" placeholder="Rechercher un terme…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-brvm-border rounded-lg pl-8 pr-4 py-2 text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition" />
      </div>

      <div className="space-y-2">
        {filtered.map(t => (
          <div key={t.id} className="bg-white border border-brvm-border rounded-xl p-4 shadow-sm flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-brvm-text text-sm">{t.term}</span>
                {t.category && <span className="text-xs bg-slate-100 text-brvm-subtext px-2 py-0.5 rounded-full">{t.category}</span>}
              </div>
              <p className="text-brvm-subtext text-xs leading-relaxed">{t.definition}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setModal({ open: true, data: { ...t } })} className={btnEdit}><Pencil size={14} /></button>
              <button onClick={() => del(t.id)} className={btnDanger}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-brvm-muted text-sm text-center py-12">Aucun terme</p>}
      </div>

      {modal.open && (
        <Modal title={modal.data.id ? 'Modifier le terme' : 'Nouveau terme'} onClose={() => setModal({ open: false, data: {} })}>
          <Field label="Terme"><input className={inputCls} value={modal.data.term || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, term: e.target.value } }))} /></Field>
          <Field label="Définition"><textarea className={inputCls} rows={4} value={modal.data.definition || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, definition: e.target.value } }))} /></Field>
          <Field label="Catégorie"><input className={inputCls} value={modal.data.category || ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, category: e.target.value } }))} /></Field>
          <div className="flex gap-3 justify-end mt-2">
            <button onClick={() => setModal({ open: false, data: {} })} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted">Annuler</button>
            <button onClick={save} className={btnPrimary}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = 'formations' | 'articles' | 'glossaire'

export default function AdminEducation() {
  const [tab, setTab] = useState<Tab>('formations')

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'formations', label: 'Formations', icon: <BookOpen size={15} /> },
    { key: 'articles',   label: 'Articles',   icon: <FileText size={15} /> },
    { key: 'glossaire',  label: 'Glossaire',  icon: <Search size={15} /> },
  ]

  return (
    <div className="bg-brvm-bg">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-brvm-text shadow-sm' : 'text-brvm-muted hover:text-brvm-subtext'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'formations' && <TabFormations />}
        {tab === 'articles'   && <TabArticles />}
        {tab === 'glossaire'  && <TabGlossaire />}
      </div>
    </div>
  )
}
