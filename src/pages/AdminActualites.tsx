import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw,
  CheckCircle2, AlertCircle, X, Tag, Clock,
  TrendingUp, TrendingDown, Minus, Search,
  Bold, Italic, Heading2, Heading3, Quote, List, ListOrdered,
  Code, Link, Strikethrough,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { newsApi, adminNewsApi, type NewsItem, type NewsCreatePayload } from '../api/news.api'

/* ──────────────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────────────── */
const CATEGORIES = ['Marché', 'Résultats', 'Dividendes', 'Analyse', 'Corporate', 'Macro', 'Indice']

const CATEGORY_COLORS: Record<string, string> = {
  'Marché':    'bg-blue-50 text-blue-700',
  'Résultats': 'bg-violet-50 text-violet-700',
  'Dividendes':'bg-amber-50 text-amber-700',
  'Analyse':   'bg-slate-100 text-slate-700',
  'Corporate': 'bg-teal-50 text-teal-700',
  'Macro':     'bg-orange-50 text-orange-700',
  'Indice':    'bg-emerald-50 text-emerald-700',
}

/* ──────────────────────────────────────────────────────────────
   TYPES
────────────────────────────────────────────────────────────── */
interface Toast { id: number; type: 'success' | 'error'; message: string }

const EMPTY_FORM: NewsCreatePayload = {
  title: '',
  summary: '',
  body: '',
  category: 'Marché',
  source: '',
  author: '',
  publishedAt: new Date().toISOString().slice(0, 16),
  isPositive: null,
  tags: [],
  tickers: [],
  isPublished: true,
}

/* ──────────────────────────────────────────────────────────────
   TOAST
────────────────────────────────────────────────────────────── */
function ToastList({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
            t.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {t.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {t.message}
          <button onClick={() => onRemove(t.id)} className="ml-2 opacity-50 hover:opacity-100">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   TAG INPUT
────────────────────────────────────────────────────────────── */
function TagInput({
  label, values, onChange, placeholder,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex gap-1.5 flex-wrap mb-1.5">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 text-xs bg-brvm-green/10 text-brvm-green border border-brvm-green/20 px-2 py-0.5 rounded-full">
            <Tag size={9} />
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="hover:text-brvm-red ml-0.5">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Ajouter…'}
          className="flex-1 text-sm border border-brvm-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-brvm-green focus:ring-1 focus:ring-brvm-green/20"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded-lg bg-brvm-green/10 text-brvm-green text-xs font-semibold hover:bg-brvm-green/20 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   MARKDOWN EDITOR
────────────────────────────────────────────────────────────── */
type FmtAction = 'bold' | 'italic' | 'strike' | 'h2' | 'h3' | 'quote' | 'ul' | 'ol' | 'code' | 'codeblock' | 'link' | 'hr'

function applyFormat(
  ta: HTMLTextAreaElement,
  type: FmtAction,
  onChange: (v: string) => void,
) {
  const { value, selectionStart: ss, selectionEnd: se } = ta
  const sel   = value.slice(ss, se)
  const before = value.slice(0, ss)
  const after  = value.slice(se)

  // Find start-of-line index
  const lineStart = before.lastIndexOf('\n') + 1

  let insert = ''
  let cursorAt = ss  // where to place cursor after

  const inline = (open: string, close: string, placeholder: string) => {
    if (sel) {
      insert = open + sel + close
      cursorAt = ss + insert.length
    } else {
      insert = open + placeholder + close
      cursorAt = ss + open.length
    }
    return before + insert + after
  }

  const linePrefix = (prefix: string) => {
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    cursorAt = ss + prefix.length
    return newVal
  }

  let newVal = value

  switch (type) {
    case 'bold':       newVal = inline('**', '**', 'texte gras'); break
    case 'italic':     newVal = inline('*',  '*',  'texte italique'); break
    case 'strike':     newVal = inline('~~', '~~', 'texte barré'); break
    case 'code':       newVal = inline('`',  '`',  'code'); break
    case 'h2':         newVal = linePrefix('## '); break
    case 'h3':         newVal = linePrefix('### '); break
    case 'quote':      newVal = linePrefix('> '); break
    case 'ul':         newVal = linePrefix('- '); break
    case 'ol':         newVal = linePrefix('1. '); break
    case 'link': {
      if (sel) {
        insert = `[${sel}](url)`
        cursorAt = ss + insert.length - 4  // position inside (url)
      } else {
        insert = '[texte](url)'
        cursorAt = ss + 1
      }
      newVal = before + insert + after
      break
    }
    case 'codeblock': {
      const fence = '```\n'
      insert = fence + (sel || 'code') + '\n```'
      cursorAt = ss + fence.length
      newVal = before + insert + after
      break
    }
    case 'hr': {
      insert = '\n\n---\n\n'
      cursorAt = ss + insert.length
      newVal = before + insert + after
      break
    }
  }

  onChange(newVal)
  requestAnimationFrame(() => {
    ta.setSelectionRange(cursorAt, cursorAt)
    ta.focus()
  })
}

const TOOLBAR: { type: FmtAction; icon: React.ReactNode; title: string; sep?: boolean }[] = [
  { type: 'h2',        icon: <Heading2 size={14} />,     title: 'Titre 2 (##)' },
  { type: 'h3',        icon: <Heading3 size={14} />,     title: 'Titre 3 (###)' },
  { type: 'bold',      icon: <Bold     size={14} />,     title: 'Gras (**)', sep: true },
  { type: 'italic',    icon: <Italic   size={14} />,     title: 'Italique (*)' },
  { type: 'strike',    icon: <Strikethrough size={14} />,title: 'Barré (~~)' },
  { type: 'quote',     icon: <Quote    size={14} />,     title: 'Citation (>)', sep: true },
  { type: 'ul',        icon: <List     size={14} />,     title: 'Liste à puces (-)' },
  { type: 'ol',        icon: <ListOrdered size={14} />,  title: 'Liste numérotée (1.)' },
  { type: 'code',      icon: <Code     size={14} />,     title: 'Code inline (`)', sep: true },
  { type: 'codeblock', icon: <span className="text-[11px] font-mono font-bold">{ '```' }</span>, title: 'Bloc de code' },
  { type: 'link',      icon: <Link     size={14} />,     title: 'Lien ([text](url))' },
  { type: 'hr',        icon: <Minus    size={14} />,     title: 'Séparateur (---)' },
]

function MarkdownEditor({
  value,
  onChange,
  required,
}: {
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const wordCount   = value.trim().split(/\s+/).filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-brvm-muted uppercase tracking-wide">
          Corps de l'article {required && <span className="text-brvm-red">*</span>}
        </label>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${tab === 'edit' ? 'bg-white shadow text-brvm-text' : 'text-brvm-muted hover:text-brvm-text'}`}
          >
            Éditer
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${tab === 'preview' ? 'bg-white shadow text-brvm-text' : 'text-brvm-muted hover:text-brvm-text'}`}
          >
            Aperçu
          </button>
        </div>
      </div>

      {tab === 'edit' && (
        <div className="border border-brvm-border rounded-xl overflow-hidden focus-within:border-brvm-green focus-within:ring-1 focus-within:ring-brvm-green/20 transition-all">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-brvm-border flex-wrap">
            {TOOLBAR.map((btn, i) => (
              <div key={btn.type} className="flex items-center">
                {btn.sep && i > 0 && <div className="w-px h-4 bg-brvm-border mx-1" />}
                <button
                  type="button"
                  title={btn.title}
                  onMouseDown={e => {
                    e.preventDefault() // keep textarea focus
                    if (taRef.current) applyFormat(taRef.current, btn.type, onChange)
                  }}
                  className="p-1.5 rounded-md text-brvm-muted hover:bg-white hover:text-brvm-text hover:shadow-sm transition-all"
                >
                  {btn.icon}
                </button>
              </div>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            ref={taRef}
            required={required}
            minLength={100}
            rows={14}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={'## Introduction\n\nPremier paragraphe…\n\n## Développement\n\nDeuxième paragraphe avec **texte en gras** et *italique*…'}
            className="w-full text-sm px-4 py-3 focus:outline-none font-mono resize-y bg-white leading-relaxed"
            style={{ minHeight: '280px' }}
          />
        </div>
      )}

      {tab === 'preview' && (
        <div className="border border-brvm-border rounded-xl min-h-[280px] bg-white px-6 py-5">
          {value.trim() ? (
            <div className="prose prose-sm max-w-none article-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => <h2 className="text-lg font-bold text-brvm-text mt-6 mb-2 pb-1 border-b border-brvm-border">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-brvm-text mt-5 mb-2">{children}</h3>,
                  p:  ({ children }) => <p  className="text-brvm-text leading-relaxed text-[14px] mb-3">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-brvm-text">{children}</strong>,
                  em:     ({ children }) => <em     className="italic text-brvm-subtext">{children}</em>,
                  del:    ({ children }) => <del    className="line-through text-brvm-muted">{children}</del>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-brvm-green/40 pl-4 italic text-brvm-subtext my-3 bg-brvm-green/5 py-2 rounded-r-lg">{children}</blockquote>,
                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-brvm-text text-[14px]">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-brvm-text text-[14px]">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  code: ({ children, className }) => className ? (
                    <pre className="bg-slate-50 border border-brvm-border rounded-lg px-4 py-3 text-[13px] font-mono overflow-x-auto my-3 text-brvm-text">{children}</pre>
                  ) : (
                    <code className="bg-slate-100 text-brvm-text text-[12px] px-1.5 py-0.5 rounded font-mono">{children}</code>
                  ),
                  hr: () => <hr className="border-brvm-border my-5" />,
                  a:  ({ href, children }) => <a href={href} className="text-brvm-green underline hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
                }}
              >{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-brvm-muted text-sm italic text-center py-10">Rien à afficher — écrivez du contenu dans l'onglet Éditer.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-brvm-muted">Markdown supporté : **gras**, *italique*, ## titres, - listes, &gt; citations, `code`</p>
        <p className="text-[10px] text-brvm-muted flex items-center gap-1">
          <Clock size={9} /> {wordCount} mots · {readingTime} min
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   ARTICLE FORM
────────────────────────────────────────────────────────────── */
function ArticleForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: NewsCreatePayload
  onSave: (data: NewsCreatePayload) => Promise<void>
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<NewsCreatePayload>(initial)

  const set = <K extends keyof NewsCreatePayload>(key: K, value: NewsCreatePayload[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">
          Titre <span className="text-brvm-red">*</span>
        </label>
        <input
          required
          maxLength={500}
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Titre de l'article…"
          className="w-full text-sm border border-brvm-border rounded-lg px-3 py-2 focus:outline-none focus:border-brvm-green focus:ring-1 focus:ring-brvm-green/20"
        />
        <p className="text-right text-[10px] text-brvm-muted mt-0.5">{form.title.length}/500</p>
      </div>

      {/* Summary */}
      <div>
        <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">
          Résumé <span className="text-brvm-red">*</span>
        </label>
        <textarea
          required
          maxLength={1000}
          rows={3}
          value={form.summary}
          onChange={e => set('summary', e.target.value)}
          placeholder="Résumé court visible dans les listes…"
          className="w-full text-sm border border-brvm-border rounded-lg px-3 py-2 focus:outline-none focus:border-brvm-green focus:ring-1 focus:ring-brvm-green/20 resize-none"
        />
        <p className="text-right text-[10px] text-brvm-muted mt-0.5">{form.summary.length}/1000</p>
      </div>

      {/* Body */}
      <MarkdownEditor
        value={form.body}
        onChange={v => set('body', v)}
        required
      />

      {/* Category / Source / Author / Date — 2-col grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">
            Catégorie <span className="text-brvm-red">*</span>
          </label>
          <select
            required
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="w-full text-sm border border-brvm-border rounded-lg px-3 py-2 focus:outline-none focus:border-brvm-green bg-white"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">
            Source <span className="text-brvm-red">*</span>
          </label>
          <input
            required
            value={form.source}
            onChange={e => set('source', e.target.value)}
            placeholder="BRVM Infos, Reuters…"
            className="w-full text-sm border border-brvm-border rounded-lg px-3 py-2 focus:outline-none focus:border-brvm-green focus:ring-1 focus:ring-brvm-green/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">
            Auteur
          </label>
          <input
            value={form.author ?? ''}
            onChange={e => set('author', e.target.value || null)}
            placeholder="Rédaction Afrivest…"
            className="w-full text-sm border border-brvm-border rounded-lg px-3 py-2 focus:outline-none focus:border-brvm-green focus:ring-1 focus:ring-brvm-green/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">
            Date de publication <span className="text-brvm-red">*</span>
          </label>
          <input
            required
            type="datetime-local"
            value={form.publishedAt}
            onChange={e => set('publishedAt', e.target.value)}
            className="w-full text-sm border border-brvm-border rounded-lg px-3 py-2 focus:outline-none focus:border-brvm-green focus:ring-1 focus:ring-brvm-green/20"
          />
        </div>
      </div>

      {/* Sentiment */}
      <div>
        <label className="block text-xs font-semibold text-brvm-muted uppercase tracking-wide mb-1.5">Sentiment marché</label>
        <div className="flex gap-2">
          {([
            { value: true,  label: 'Positif',  icon: <TrendingUp  size={12} />, cls: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
            { value: false, label: 'Négatif',  icon: <TrendingDown size={12} />, cls: 'border-red-300 bg-red-50 text-red-700' },
            { value: null,  label: 'Neutre',   icon: <Minus size={12} />,       cls: 'border-slate-300 bg-slate-50 text-slate-600' },
          ] as { value: boolean | null; label: string; icon: React.ReactNode; cls: string }[]).map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => set('isPositive', opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                form.isPositive === opt.value ? opt.cls + ' ring-2 ring-offset-1 ring-current/30' : 'border-brvm-border bg-white text-brvm-muted hover:border-brvm-green/30'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags / Tickers */}
      <div className="grid grid-cols-2 gap-4">
        <TagInput
          label="Tags"
          values={form.tags ?? []}
          onChange={v => set('tags', v)}
          placeholder="SLBC, Consommation…"
        />
        <TagInput
          label="Tickers liés"
          values={form.tickers ?? []}
          onChange={v => set('tickers', v)}
          placeholder="ETIT, SLBC…"
        />
      </div>

      {/* Published */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          onClick={() => set('isPublished', !form.isPublished)}
          className={`w-10 h-5 rounded-full transition-colors relative ${form.isPublished ? 'bg-brvm-green' : 'bg-slate-200'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm text-brvm-text font-medium">
          {form.isPublished ? 'Publier immédiatement' : 'Enregistrer comme brouillon'}
        </span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-brvm-border">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-brvm-green text-white rounded-lg text-sm font-semibold hover:bg-brvm-green/90 disabled:opacity-50 transition-colors"
        >
          {saving && <RefreshCw size={13} className="animate-spin" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-brvm-subtext border border-brvm-border rounded-lg hover:border-brvm-green/30 hover:text-brvm-text transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

/* ──────────────────────────────────────────────────────────────
   MAIN MODULE
────────────────────────────────────────────────────────────── */
export default function AdminActualites() {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [editTarget, setEditTarget] = useState<NewsItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const toast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now()
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = search ? { search, limit: 50 } : { limit: 50 }
    newsApi.list(params)
      .then(({ articles: data }) => setArticles(data))
      .catch(() => toast('error', 'Impossible de charger les articles'))
      .finally(() => setLoading(false))
  }, [search, toast])

  useEffect(() => { load() }, [load])

  /* ── Save (create or update) ── */
  const handleSave = async (data: NewsCreatePayload) => {
    setSaving(true)
    try {
      const payload: NewsCreatePayload = {
        ...data,
        publishedAt: new Date(data.publishedAt).toISOString(),
        author: data.author || null,
      }
      if (editTarget) {
        await adminNewsApi.update(editTarget.id, payload)
        toast('success', 'Article mis à jour')
      } else {
        await adminNewsApi.create(payload)
        toast('success', 'Article créé')
      }
      setView('list')
      setEditTarget(null)
      load()
    } catch {
      toast('error', 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  /* ── Publish / Unpublish ── */
  const handleTogglePublish = async (article: NewsItem, currentlyPublished: boolean) => {
    try {
      if (currentlyPublished) {
        await adminNewsApi.unpublish(article.id)
        toast('success', 'Article dépublié')
      } else {
        await adminNewsApi.publish(article.id)
        toast('success', 'Article publié')
      }
      load()
    } catch {
      toast('error', 'Erreur lors du changement de statut')
    }
  }

  /* ── Delete ── */
  const handleDelete = async (id: number) => {
    try {
      await adminNewsApi.delete(id)
      toast('success', 'Article supprimé')
      setDeleteConfirm(null)
      load()
    } catch {
      toast('error', 'Erreur lors de la suppression')
    }
  }

  /* ── Edit — build form initial state ── */
  const openEdit = (article: NewsItem) => {
    setEditTarget(article)
    setView('edit')
  }

  const editInitial: NewsCreatePayload = editTarget
    ? {
        title:       editTarget.title,
        summary:     editTarget.summary,
        body:        '',              // body not in list — will be empty; user re-fills or fetches
        category:    editTarget.category,
        source:      editTarget.source,
        author:      editTarget.author ?? null,
        publishedAt: editTarget.date.slice(0, 16),
        isPositive:  editTarget.isPositive ?? null,
        tags:        editTarget.tags,
        tickers:     [],
        isPublished: true,
      }
    : EMPTY_FORM

  /* ──────────────────────────────────────────────────────────── */
  return (
    <div className="p-8 space-y-6 min-h-full">
      <ToastList toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brvm-text">Actualités</h1>
          <p className="text-brvm-subtext text-sm mt-0.5">Gérer les articles publiés sur Afrivest</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => { setEditTarget(null); setView('create') }}
            className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white rounded-lg text-sm font-semibold hover:bg-brvm-green/90 transition-colors"
          >
            <Plus size={15} />
            Nouvel article
          </button>
        )}
        {view !== 'list' && (
          <button
            onClick={() => { setView('list'); setEditTarget(null) }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-brvm-subtext border border-brvm-border rounded-lg hover:border-brvm-green/30 hover:text-brvm-text transition-colors"
          >
            <X size={14} />
            Annuler
          </button>
        )}
      </div>

      {/* ── CREATE / EDIT FORM ── */}
      {(view === 'create' || view === 'edit') && (
        <div className="bg-white border border-brvm-border rounded-2xl p-6">
          <h2 className="text-base font-bold text-brvm-text mb-5">
            {view === 'create' ? 'Créer un article' : `Modifier — ${editTarget?.title.slice(0, 50)}…`}
          </h2>
          {view === 'edit' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
              <AlertCircle size={13} />
              Le corps de l'article n'est pas chargé depuis la liste. Saisissez-le à nouveau ou laissez vide pour ne pas le modifier.
            </div>
          )}
          <ArticleForm
            initial={editTarget ? editInitial : EMPTY_FORM}
            onSave={handleSave}
            onCancel={() => { setView('list'); setEditTarget(null) }}
            saving={saving}
          />
        </div>
      )}

      {/* ── LIST ── */}
      {view === 'list' && (
        <>
          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-8 pr-4 py-2 text-sm border border-brvm-border rounded-lg focus:outline-none focus:border-brvm-green focus:ring-1 focus:ring-brvm-green/20"
            />
          </div>

          {/* Table */}
          <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={20} className="animate-spin text-brvm-muted" />
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-brvm-muted text-sm">
                Aucun article trouvé.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-brvm-bg border-b border-brvm-border">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-brvm-muted uppercase tracking-wide">Titre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brvm-muted uppercase tracking-wide w-28">Catégorie</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brvm-muted uppercase tracking-wide w-36">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-brvm-muted uppercase tracking-wide w-24">Sentiment</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-brvm-muted uppercase tracking-wide w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brvm-border">
                  {articles.map(article => (
                    <tr key={article.id} className="hover:bg-brvm-bg/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-brvm-text line-clamp-1 max-w-xs">{article.title}</div>
                        <div className="text-xs text-brvm-muted mt-0.5 flex items-center gap-2">
                          <span>{article.source}</span>
                          {article.author && <><span>·</span><span>{article.author}</span></>}
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Clock size={9} />{article.readingTime} min</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {article.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-brvm-subtext whitespace-nowrap">
                        {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        {article.isPositive === true && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-brvm-green">
                            <TrendingUp size={11} /> Positif
                          </span>
                        )}
                        {article.isPositive === false && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-brvm-red">
                            <TrendingDown size={11} /> Négatif
                          </span>
                        )}
                        {(article.isPositive === null || article.isPositive === undefined) && (
                          <span className="text-[11px] text-brvm-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          {/* Publish / Unpublish — API doesn't return isPublished in list so we use publish to re-publish */}
                          <button
                            onClick={() => handleTogglePublish(article, true)}
                            title="Dépublier"
                            className="p-1.5 rounded-lg text-brvm-muted hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          >
                            <EyeOff size={14} />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(article, false)}
                            title="Republier"
                            className="p-1.5 rounded-lg text-brvm-muted hover:bg-emerald-50 hover:text-brvm-green transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(article)}
                            title="Modifier"
                            className="p-1.5 rounded-lg text-brvm-muted hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          {deleteConfirm === article.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(article.id)}
                                className="px-2 py-1 rounded-lg bg-brvm-red text-white text-[11px] font-bold hover:opacity-90 transition-opacity"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1 rounded-lg text-brvm-muted hover:text-brvm-text"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(article.id)}
                              title="Supprimer"
                              className="p-1.5 rounded-lg text-brvm-muted hover:bg-red-50 hover:text-brvm-red transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs text-brvm-muted">
            {articles.length} article{articles.length > 1 ? 's' : ''} · La suppression est logique (dépublication)
          </p>
        </>
      )}
    </div>
  )
}
