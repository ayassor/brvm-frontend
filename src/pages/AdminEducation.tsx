import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, BookOpen, FileText, Search, Layers, GraduationCap, DollarSign, Users, ShieldCheck, X, KeyRound, Eye, EyeOff } from 'lucide-react'
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
  has_password?: boolean
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
  setCoursePassword: (id: number, password: string | null) => api.put(`/education/admin/courses/${id}/password`, { password }).then(r => r.data),

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
  const [pwModal, setPwModal] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null })

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
                {course.has_password && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    <KeyRound size={10} /> Protégé
                  </span>
                )}
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
                  onClick={() => setPwModal({ open: true, course })}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    course.has_password
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      : 'bg-slate-50 text-brvm-subtext hover:bg-slate-100 hover:text-brvm-text'
                  }`}
                  title={course.has_password ? 'Mot de passe actif' : 'Définir un mot de passe'}
                >
                  <KeyRound size={12} /> {course.has_password ? 'MDP actif' : 'MDP'}
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

      {/* Modal Mot de passe cours */}
      {pwModal.open && pwModal.course && (
        <PasswordCourseModal
          course={pwModal.course}
          onClose={() => setPwModal({ open: false, course: null })}
          onSaved={(courseId, hasPassword) => {
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, has_password: hasPassword } : c))
            setPwModal({ open: false, course: null })
          }}
        />
      )}
    </div>
  )
}

// ─── Modal Mot de passe cours ─────────────────────────────────────────────────
function PasswordCourseModal({
  course, onClose, onSaved,
}: {
  course: { id: number; title: string; has_password?: boolean }
  onClose: () => void
  onSaved: (courseId: number, hasPassword: boolean) => void
}) {
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true); setError('')
    try {
      await eApi.setCoursePassword(course.id, password)
      setSuccess('Mot de passe défini avec succès !')
      setTimeout(() => onSaved(course.id, true), 1000)
    } catch {
      setError('Erreur lors de la définition du mot de passe.')
    } finally { setLoading(false) }
  }

  const handleRemove = async () => {
    if (!confirm('Supprimer le mot de passe de ce cours ?')) return
    setLoading(true); setError('')
    try {
      await eApi.setCoursePassword(course.id, null)
      setSuccess('Mot de passe supprimé.')
      setTimeout(() => onSaved(course.id, false), 800)
    } catch {
      setError('Erreur lors de la suppression.')
    } finally { setLoading(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brvm-border">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-50 rounded-xl p-2">
              <KeyRound size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-brvm-muted">Protection par mot de passe</p>
              <h3 className="font-bold text-brvm-text text-sm leading-tight truncate max-w-[200px]">{course.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-brvm-muted hover:text-brvm-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Statut actuel */}
          <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
            course.has_password ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
          }`}>
            <KeyRound size={14} className="flex-shrink-0" />
            {course.has_password ? '🔐 Ce cours est actuellement protégé' : '🔓 Aucun mot de passe défini'}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSet} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-brvm-subtext mb-1.5 uppercase tracking-wider">
                {course.has_password ? 'Nouveau mot de passe' : 'Définir un mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Entrez le mot de passe…"
                  className="w-full border border-brvm-border rounded-xl px-4 py-2.5 pr-10 text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brvm-muted hover:text-brvm-text"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error   && <p className="text-red-500 text-xs">⚠ {error}</p>}
            {success && <p className="text-brvm-green text-xs font-semibold">✓ {success}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!password || loading}
                className="flex-1 bg-brvm-green text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-brvm-green/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <KeyRound size={14} />
                {loading ? 'Enregistrement…' : course.has_password ? 'Changer le MDP' : 'Activer le MDP'}
              </button>
              {course.has_password && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Supprimer le mot de passe"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
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

// ─── API helpers for Users & Course Access ────────────────────────────────────
interface UserResult {
  id: number
  name: string
  email: string
  role: string
  subscription_type: string
  is_active: boolean
}

interface CourseAccessEntry {
  id: number
  user_id: number
  course_id: number
  granted_by: number
  granted_at: string
  expires_at: string | null
  note: string | null
}

const uApi = {
  searchUsers: (search: string) =>
    api.get(`/users/admin/users?search=${encodeURIComponent(search)}&limit=20`).then(r => r.data as { users: UserResult[]; total: number }),
  getUserAccesses: (userId: number) =>
    api.get(`/users/admin/users/${userId}/course-access`).then(r => r.data as { user: UserResult; accesses: CourseAccessEntry[] }),
  grantAccess: (userId: number, data: { course_id: number; expires_at?: string; note?: string }) =>
    api.post(`/users/admin/users/${userId}/course-access`, data).then(r => r.data),
  revokeAccess: (userId: number, courseId: number) =>
    api.delete(`/users/admin/users/${userId}/course-access/${courseId}`).then(r => r.data),
}

// ─── Tab Accès Utilisateurs ───────────────────────────────────────────────────
function TabAccesUtilisateurs() {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const [userAccesses, setUserAccesses] = useState<CourseAccessEntry[]>([])
  const [loadingAccesses, setLoadingAccesses] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  // Grant access modal state
  const [grantModal, setGrantModal] = useState(false)
  const [grantData, setGrantData] = useState<{ course_id: number | ''; expires_at: string; note: string }>({ course_id: '', expires_at: '', note: '' })
  const [saving, setSaving] = useState(false)

  // Load paid courses for the selector
  useEffect(() => {
    eApi.getCourses().then(data => {
      setCourses(data.filter((c: any) => c.is_paid))
    }).catch(() => {})
  }, [])

  const doSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await uApi.searchUsers(search)
      setSearchResults(res.users)
      setSelectedUser(null)
      setUserAccesses([])
    } catch {
      alert('Erreur lors de la recherche.')
    } finally {
      setSearching(false)
    }
  }

  const selectUser = async (user: UserResult) => {
    setSelectedUser(user)
    setLoadingAccesses(true)
    try {
      const res = await uApi.getUserAccesses(user.id)
      setUserAccesses(res.accesses)
    } catch {
      setUserAccesses([])
    } finally {
      setLoadingAccesses(false)
    }
  }

  const handleGrant = async () => {
    if (!selectedUser || !grantData.course_id) return
    setSaving(true)
    try {
      await uApi.grantAccess(selectedUser.id, {
        course_id: grantData.course_id as number,
        expires_at: grantData.expires_at || undefined,
        note: grantData.note || undefined,
      })
      setGrantModal(false)
      setGrantData({ course_id: '', expires_at: '', note: '' })
      const res = await uApi.getUserAccesses(selectedUser.id)
      setUserAccesses(res.accesses)
    } catch {
      alert('Erreur lors de l\'attribution de l\'accès.')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (courseId: number) => {
    if (!selectedUser) return
    if (!confirm('Révoquer cet accès ?')) return
    try {
      await uApi.revokeAccess(selectedUser.id, courseId)
      const res = await uApi.getUserAccesses(selectedUser.id)
      setUserAccesses(res.accesses)
    } catch {
      alert('Erreur lors de la révocation.')
    }
  }

  const getCourseTitle = (courseId: number) => {
    const c = courses.find(x => x.id === courseId)
    return c ? c.title : `Cours #${courseId}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-brvm-text text-base flex items-center gap-2">
          <ShieldCheck size={18} className="text-brvm-green" />
          Accès Utilisateurs
        </h2>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            className={inputCls + ' pl-8'}
          />
        </div>
        <button onClick={doSearch} disabled={searching} className={btnPrimary}>
          {searching ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>

      {/* Results grid */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-brvm-subtext uppercase tracking-wider mb-3">
            Résultats ({searchResults.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {searchResults.map(user => (
              <button
                key={user.id}
                onClick={() => selectUser(user)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedUser?.id === user.id
                    ? 'border-brvm-green bg-brvm-green/5 shadow-sm'
                    : 'border-brvm-border bg-white hover:border-brvm-green/40 hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Users size={15} className="text-brvm-subtext" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brvm-text truncate">{user.name}</p>
                  <p className="text-xs text-brvm-muted truncate">{user.email}</p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    user.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected user accesses */}
      {selectedUser && (
        <div className="bg-white border border-brvm-green/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-brvm-text">{selectedUser.name}</h3>
              <p className="text-xs text-brvm-muted">{selectedUser.email}</p>
            </div>
            <button
              onClick={() => setGrantModal(true)}
              className={btnPrimary}
            >
              <span className="flex items-center gap-1.5"><Plus size={14} /> Donner accès</span>
            </button>
          </div>

          {loadingAccesses ? (
            <p className="text-brvm-muted text-sm text-center py-4">Chargement…</p>
          ) : userAccesses.length === 0 ? (
            <p className="text-brvm-muted text-sm text-center py-6">Aucun accès spécial accordé.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-brvm-subtext uppercase tracking-wider mb-2">
                Accès accordés ({userAccesses.length})
              </p>
              {userAccesses.map(access => (
                <div key={access.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-brvm-border">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brvm-text">{getCourseTitle(access.course_id)}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-brvm-muted">
                        Accordé le {new Date(access.granted_at).toLocaleDateString('fr-FR')}
                      </span>
                      {access.expires_at && (
                        <span className="text-xs text-amber-600 font-medium">
                          Expire le {new Date(access.expires_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {!access.expires_at && (
                        <span className="text-xs text-brvm-green font-medium">Sans expiration</span>
                      )}
                    </div>
                    {access.note && (
                      <p className="text-xs text-brvm-subtext mt-0.5 italic">"{access.note}"</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRevoke(access.course_id)}
                    className={btnDanger}
                    title="Révoquer l'accès"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grant access modal */}
      {grantModal && selectedUser && (
        <Modal title={`Donner accès à ${selectedUser.name}`} onClose={() => setGrantModal(false)}>
          <Field label="Cours payant">
            <select
              className={inputCls}
              value={grantData.course_id}
              onChange={e => setGrantData(d => ({ ...d, course_id: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">-- Sélectionner un cours --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} {c.price ? `(${c.price.toLocaleString('fr-FR')} FCFA)` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date d'expiration (optionnel)">
            <input
              type="datetime-local"
              className={inputCls}
              value={grantData.expires_at}
              onChange={e => setGrantData(d => ({ ...d, expires_at: e.target.value }))}
            />
          </Field>
          <Field label="Note (optionnel)">
            <input
              type="text"
              className={inputCls}
              placeholder="Ex: Accès offert, partenariat…"
              value={grantData.note}
              onChange={e => setGrantData(d => ({ ...d, note: e.target.value }))}
            />
          </Field>
          <div className="flex gap-3 justify-end mt-2">
            <button onClick={() => setGrantModal(false)} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted">Annuler</button>
            <button onClick={handleGrant} disabled={!grantData.course_id || saving} className={btnPrimary}>
              {saving ? 'Enregistrement…' : 'Accorder l\'accès'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = 'formations' | 'articles' | 'glossaire' | 'acces'

export default function AdminEducation() {
  const [tab, setTab] = useState<Tab>('formations')

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'formations', label: 'Formations', icon: <BookOpen size={15} /> },
    { key: 'articles',   label: 'Articles',   icon: <FileText size={15} /> },
    { key: 'glossaire',  label: 'Glossaire',  icon: <Search size={15} /> },
    { key: 'acces',      label: 'Accès',      icon: <ShieldCheck size={15} /> },
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
        {tab === 'acces'      && <TabAccesUtilisateurs />}
      </div>
    </div>
  )
}
