import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Save, Plus, Pencil, Trash2, ChevronDown,
  BookOpen, PlayCircle, Settings, ChevronUp,
  GraduationCap, DollarSign, Layers, RefreshCw, Check, X
} from 'lucide-react'
import api from '../api/axios'

interface Lesson {
  id: number
  title: string
  video_id: string | null
  order_num: number
  chapter_id: number
  course_id: number
}

interface Chapter {
  id: number
  title: string
  order_num: number
  course_id: number
  lessons: Lesson[]
}

interface Course {
  id: number
  title: string
  description: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | 'coaching'
  is_paid: boolean
  price: number | null
  is_active: boolean
  chapters: Chapter[]
}

const eApi = {
  getCourse: (id: string) => api.get(`/education/courses/${id}`).then(r => r.data as Course),
  updateCourse: (id: number, data: Partial<Course>) => api.put(`/education/admin/courses/${id}`, data).then(r => r.data),
  createChapter: (data: { course_id: number; title: string; order_num: number }) =>
    api.post('/education/admin/chapters', data).then(r => r.data),
  updateChapter: (id: number, data: Partial<Chapter>) =>
    api.put(`/education/admin/chapters/${id}`, data).then(r => r.data),
  deleteChapter: (id: number) => api.delete(`/education/admin/chapters/${id}`).then(r => r.data),
  createLesson: (data: Partial<Lesson>) => api.post('/education/admin/lessons', data).then(r => r.data),
  updateLesson: (id: number, data: Partial<Lesson>) =>
    api.put(`/education/admin/lessons/${id}`, data).then(r => r.data),
  deleteLesson: (id: number) => api.delete(`/education/admin/lessons/${id}`).then(r => r.data),
}

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'Débutant',      color: 'bg-green-100 text-green-700 border-green-200' },
  intermediate: { label: 'Intermédiaire', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  advanced:     { label: 'Avancé',        color: 'bg-purple-100 text-purple-700 border-purple-200' },
  coaching:     { label: 'Coaching',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
}

const inputCls = "w-full border border-brvm-border rounded-lg px-3 py-2 text-sm text-brvm-text focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/20 transition bg-white"
const btnPrimary = "bg-brvm-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brvm-green/90 transition-colors flex items-center gap-2 disabled:opacity-50"
const btnDanger = "text-brvm-red hover:bg-red-50 p-1.5 rounded-lg transition-colors"
const btnEdit = "text-brvm-subtext hover:bg-slate-100 p-1.5 rounded-lg transition-colors"

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brvm-border">
          <h2 className="font-bold text-brvm-text text-lg">{title}</h2>
          <button onClick={onClose} className="text-brvm-muted hover:text-brvm-text transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
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

function LessonRow({ lesson, onEdit, onDelete }: { lesson: Lesson; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-white border border-brvm-border/60 rounded-lg group hover:border-brvm-green/30 hover:bg-brvm-green/5 transition-all">
      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-brvm-muted">{lesson.order_num}</span>
      </div>
      <PlayCircle size={14} className="text-brvm-muted flex-shrink-0" />
      <span className="text-sm text-brvm-text flex-1 font-medium">{lesson.title}</span>
      {lesson.video_id && (
        <span className="text-xs font-mono text-brvm-subtext bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {lesson.video_id}
        </span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className={btnEdit}><Pencil size={13} /></button>
        <button onClick={onDelete} className={btnDanger}><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

function ChapterCard({ chapter, totalChapters, onMoveUp, onMoveDown, onEdit, onDelete, onAddLesson, onEditLesson, onDeleteLesson }: {
  chapter: Chapter; totalChapters: number
  onMoveUp: () => void; onMoveDown: () => void
  onEdit: () => void; onDelete: () => void; onAddLesson: () => void
  onEditLesson: (l: Lesson) => void; onDeleteLesson: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-brvm-border">
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button onClick={onMoveUp} disabled={chapter.order_num <= 1}
            className="text-brvm-muted hover:text-brvm-green disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5 rounded">
            <ChevronUp size={13} />
          </button>
          <button onClick={onMoveDown} disabled={chapter.order_num >= totalChapters}
            className="text-brvm-muted hover:text-brvm-green disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5 rounded">
            <ChevronDown size={13} />
          </button>
        </div>
        <div className="w-7 h-7 rounded-lg bg-brvm-green/10 border border-brvm-green/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-brvm-green">{chapter.order_num}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brvm-text text-sm">{chapter.title}</h3>
          <p className="text-xs text-brvm-muted">{chapter.lessons.length} leçon{chapter.lessons.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className={btnEdit}><Pencil size={14} /></button>
          <button onClick={onDelete} className={btnDanger}><Trash2 size={14} /></button>
          <button onClick={() => setExpanded(v => !v)}
            className="text-brvm-muted hover:text-brvm-text p-1.5 rounded-lg hover:bg-slate-100 transition-colors ml-1">
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-3 space-y-2 bg-slate-50/50">
          {chapter.lessons.length === 0 ? (
            <p className="text-xs text-brvm-muted text-center py-3 italic">Aucune leçon dans ce chapitre</p>
          ) : chapter.lessons.map(l => (
            <LessonRow key={l.id} lesson={l} onEdit={() => onEditLesson(l)} onDelete={() => onDeleteLesson(l.id)} />
          ))}
          <button onClick={onAddLesson}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-brvm-border text-brvm-muted hover:border-brvm-green hover:text-brvm-green transition-colors text-xs font-medium mt-2">
            <Plus size={13} /> Ajouter une leçon
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminEducationCourse() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formLevel, setFormLevel] = useState<Course['level']>('beginner')
  const [formIsPaid, setFormIsPaid] = useState(false)
  const [formPrice, setFormPrice] = useState<number>(0)
  const [formIsActive, setFormIsActive] = useState(true)

  const [chapterModal, setChapterModal] = useState<{ open: boolean; data: Partial<Chapter> }>({ open: false, data: {} })
  const [lessonModal, setLessonModal] = useState<{ open: boolean; chapterId: number | null; data: Partial<Lesson> }>({ open: false, chapterId: null, data: {} })

  const load = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const data = await eApi.getCourse(courseId)
      setCourse(data)
      setFormTitle(data.title)
      setFormDesc(data.description ?? '')
      setFormLevel(data.level)
      setFormIsPaid(data.is_paid)
      setFormPrice(data.price ?? 0)
      setFormIsActive(data.is_active)
    } catch {
      setError('Impossible de charger ce cours.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [courseId])

  const saveCourse = async () => {
    if (!course) return
    setSaving(true)
    try {
      await eApi.updateCourse(course.id, {
        title: formTitle,
        description: formDesc || null,
        level: formLevel,
        is_paid: formIsPaid,
        price: formIsPaid ? formPrice : null,
        is_active: formIsActive,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      load()
    } catch { setError('Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  const saveChapter = async () => {
    if (!course) return
    const d = chapterModal.data
    if (d.id) {
      await eApi.updateChapter(d.id, { title: d.title, order_num: d.order_num })
    } else {
      await eApi.createChapter({ course_id: course.id, title: d.title!, order_num: (course.chapters?.length ?? 0) + 1 })
    }
    setChapterModal({ open: false, data: {} })
    load()
  }

  const deleteChapter = async (id: number) => {
    if (!confirm('Supprimer ce chapitre et toutes ses leçons ?')) return
    await eApi.deleteChapter(id)
    load()
  }

  const moveChapter = async (chapterId: number, direction: 'up' | 'down') => {
    if (!course) return
    const chapters = [...course.chapters].sort((a, b) => a.order_num - b.order_num)
    const idx = chapters.findIndex(c => c.id === chapterId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= chapters.length) return
    const ch = chapters[idx], swapCh = chapters[swapIdx]
    await Promise.all([
      eApi.updateChapter(ch.id, { title: ch.title, order_num: swapCh.order_num }),
      eApi.updateChapter(swapCh.id, { title: swapCh.title, order_num: ch.order_num }),
    ])
    load()
  }

  const saveLesson = async () => {
    if (!course || !lessonModal.chapterId) return
    const d = lessonModal.data
    if (d.id) {
      await eApi.updateLesson(d.id, d)
    } else {
      const chapter = course.chapters.find(c => c.id === lessonModal.chapterId)
      await eApi.createLesson({
        course_id: course.id, chapter_id: lessonModal.chapterId,
        title: d.title, video_id: d.video_id || null,
        order_num: (chapter?.lessons.length ?? 0) + 1,
      })
    }
    setLessonModal({ open: false, chapterId: null, data: {} })
    load()
  }

  const deleteLesson = async (id: number) => {
    if (!confirm('Supprimer cette leçon ?')) return
    await eApi.deleteLesson(id)
    load()
  }

  const totalLessons = course?.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0

  if (loading) return (
    <div className="min-h-screen bg-brvm-bg flex items-center justify-center">
      <div className="flex items-center gap-3 text-brvm-muted">
        <RefreshCw size={20} className="animate-spin" />
        <span className="text-sm">Chargement du cours…</span>
      </div>
    </div>
  )

  if (error || !course) return (
    <div className="min-h-screen bg-brvm-bg flex items-center justify-center">
      <div className="text-center">
        <p className="text-brvm-red mb-4">{error ?? 'Cours introuvable'}</p>
        <Link to="/admin/education" className="text-brvm-green hover:underline text-sm">← Retour aux formations</Link>
      </div>
    </div>
  )

  const levelInfo = LEVEL_MAP[course.level]

  return (
    <div className="min-h-screen bg-brvm-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-brvm-border shadow-sm">
        <div className="flex items-center gap-4 px-6 py-3">
          <Link to="/admin/education" className="flex items-center gap-1.5 text-brvm-muted hover:text-brvm-text transition-colors text-sm flex-shrink-0">
            <ArrowLeft size={16} /> Formations
          </Link>
          <span className="text-brvm-border">|</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen size={16} className="text-brvm-green flex-shrink-0" />
            <h1 className="font-bold text-brvm-text text-base truncate">{course.title}</h1>
            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${levelInfo.color}`}>{levelInfo.label}</span>
            {course.is_active
              ? <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Actif</span>
              : <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Inactif</span>
            }
          </div>
          <button onClick={saveCourse} disabled={saving} className={btnPrimary}>
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Enregistrement…</>
             : saved ? <><Check size={14} /> Enregistré !</>
             : <><Save size={14} /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Settings */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats */}
            <div className="bg-white border border-brvm-border rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-brvm-muted uppercase tracking-wider mb-4">Aperçu</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Layers size={16} />, label: 'Chapitres', value: String(course.chapters.length) },
                  { icon: <PlayCircle size={16} />, label: 'Leçons', value: String(totalLessons) },
                  { icon: <GraduationCap size={16} />, label: 'Niveau', value: levelInfo.label },
                  { icon: <DollarSign size={16} />, label: 'Prix', value: course.is_paid ? `${course.price?.toLocaleString('fr-FR')} F` : 'Gratuit' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-brvm-green mt-0.5">{s.icon}</span>
                    <div>
                      <p className="text-xs text-brvm-muted">{s.label}</p>
                      <p className="text-sm font-bold text-brvm-text">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings form */}
            <div className="bg-white border border-brvm-border rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-brvm-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings size={13} /> Paramètres
              </h2>
              <Field label="Titre du cours">
                <input className={inputCls} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Titre de la formation" />
              </Field>
              <Field label="Description">
                <textarea className={inputCls} rows={4} value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Description de la formation…" />
              </Field>
              <Field label="Niveau">
                <select className={inputCls} value={formLevel} onChange={e => setFormLevel(e.target.value as Course['level'])}>
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                  <option value="coaching">Coaching</option>
                </select>
              </Field>

              {/* Statut toggle */}
              <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-xl border border-brvm-border">
                <div>
                  <p className="text-sm font-medium text-brvm-text">Cours actif</p>
                  <p className="text-xs text-brvm-muted">Visible par les utilisateurs</p>
                </div>
                <button onClick={() => setFormIsActive(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${formIsActive ? 'bg-brvm-green' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formIsActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Payant toggle */}
              <div className="flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-xl border border-brvm-border">
                <div>
                  <p className="text-sm font-medium text-brvm-text">Cours payant</p>
                  <p className="text-xs text-brvm-muted">Accès sur abonnement/paiement</p>
                </div>
                <button onClick={() => setFormIsPaid(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${formIsPaid ? 'bg-amber-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formIsPaid ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {formIsPaid && (
                <Field label="Prix (FCFA)">
                  <input type="number" className={inputCls} value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} min={0} step={500} />
                </Field>
              )}

              <button onClick={saveCourse} disabled={saving} className={`${btnPrimary} w-full justify-center mt-2`}>
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Enregistrement…</>
                 : saved  ? <><Check size={14} /> Enregistré !</>
                 : <><Save size={14} /> Sauvegarder les paramètres</>}
              </button>
            </div>
          </div>

          {/* Right — Chapters */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-brvm-border bg-slate-50">
                <div>
                  <h2 className="font-bold text-brvm-text">Structure du cours</h2>
                  <p className="text-xs text-brvm-muted mt-0.5">
                    {course.chapters.length} chapitre{course.chapters.length !== 1 ? 's' : ''} · {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setChapterModal({ open: true, data: { order_num: course.chapters.length + 1 } })} className={btnPrimary}>
                  <Plus size={14} /> Ajouter un chapitre
                </button>
              </div>

              <div className="p-5 space-y-4">
                {course.chapters.length === 0 ? (
                  <div className="text-center py-16 text-brvm-muted">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium text-brvm-subtext">Ce cours n'a pas encore de chapitres</p>
                    <p className="text-xs mt-1">Cliquez sur "Ajouter un chapitre" pour commencer.</p>
                    <button onClick={() => setChapterModal({ open: true, data: { order_num: 1 } })} className={`${btnPrimary} mx-auto mt-4`}>
                      <Plus size={14} /> Premier chapitre
                    </button>
                  </div>
                ) : (
                  [...course.chapters]
                    .sort((a, b) => a.order_num - b.order_num)
                    .map(chapter => (
                      <ChapterCard
                        key={chapter.id}
                        chapter={chapter}
                        totalChapters={course.chapters.length}
                        onMoveUp={() => moveChapter(chapter.id, 'up')}
                        onMoveDown={() => moveChapter(chapter.id, 'down')}
                        onEdit={() => setChapterModal({ open: true, data: { ...chapter } })}
                        onDelete={() => deleteChapter(chapter.id)}
                        onAddLesson={() => setLessonModal({ open: true, chapterId: chapter.id, data: { order_num: chapter.lessons.length + 1 } })}
                        onEditLesson={l => setLessonModal({ open: true, chapterId: chapter.id, data: { ...l } })}
                        onDeleteLesson={deleteLesson}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chapitre */}
      {chapterModal.open && (
        <Modal title={chapterModal.data.id ? 'Modifier le chapitre' : 'Nouveau chapitre'} onClose={() => setChapterModal({ open: false, data: {} })}>
          <Field label="Titre du chapitre">
            <input className={inputCls} value={chapterModal.data.title || ''} autoFocus
              onChange={e => setChapterModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))}
              placeholder="Ex: Introduction à la BRVM" />
          </Field>
          <Field label="Numéro d'ordre">
            <input className={inputCls} type="number" min={1} value={chapterModal.data.order_num || 1}
              onChange={e => setChapterModal(m => ({ ...m, data: { ...m.data, order_num: Number(e.target.value) } }))} />
          </Field>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setChapterModal({ open: false, data: {} })} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted hover:text-brvm-text transition-colors">Annuler</button>
            <button onClick={saveChapter} disabled={!chapterModal.data.title} className={`${btnPrimary} disabled:opacity-50`}>Enregistrer</button>
          </div>
        </Modal>
      )}

      {/* Modal Leçon */}
      {lessonModal.open && (
        <Modal title={lessonModal.data.id ? 'Modifier la leçon' : 'Nouvelle leçon'} onClose={() => setLessonModal({ open: false, chapterId: null, data: {} })}>
          <Field label="Titre de la leçon">
            <input className={inputCls} value={lessonModal.data.title || ''} autoFocus
              onChange={e => setLessonModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))}
              placeholder="Ex: Qu'est-ce que la BRVM ?" />
          </Field>
          <Field label="YouTube Video ID">
            <input className={inputCls} value={lessonModal.data.video_id || ''}
              onChange={e => setLessonModal(m => ({ ...m, data: { ...m.data, video_id: e.target.value } }))}
              placeholder="ex: dQw4w9WgXcQ" />
            {lessonModal.data.video_id && (
              <p className="text-xs text-brvm-muted mt-1">URL : <span className="font-mono text-brvm-subtext">youtube.com/watch?v={lessonModal.data.video_id}</span></p>
            )}
          </Field>
          <Field label="Numéro d'ordre">
            <input className={inputCls} type="number" min={1} value={lessonModal.data.order_num || 1}
              onChange={e => setLessonModal(m => ({ ...m, data: { ...m.data, order_num: Number(e.target.value) } }))} />
          </Field>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setLessonModal({ open: false, chapterId: null, data: {} })} className="px-4 py-2 rounded-lg border border-brvm-border text-sm text-brvm-muted hover:text-brvm-text transition-colors">Annuler</button>
            <button onClick={saveLesson} disabled={!lessonModal.data.title} className={`${btnPrimary} disabled:opacity-50`}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
