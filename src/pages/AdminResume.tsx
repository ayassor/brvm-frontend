import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Trash2, RefreshCw, Save, ChevronDown } from 'lucide-react'
import { companiesApi } from '../api/companies.api'
import { MOCK_COMPANIES } from '../mocks/brvm-data'

/* ── Toast ── */
interface Toast { id: number; type: 'success' | 'error'; message: string }
function ToastList({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} onClick={() => onRemove(t.id)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto cursor-pointer ${
            t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

/* ── Editable array list ── */
function ArrayEditor({
  label, color, items, onChange,
}: { label: string; color: string; items: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (!t) return
    onChange([...items, t])
    setDraft('')
  }
  return (
    <div className="space-y-2">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>{label}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <textarea
              rows={2}
              value={item}
              onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }}
              className="flex-1 text-xs text-brvm-subtext bg-slate-50 border border-brvm-border rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:border-brvm-green"
            />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="mt-1.5 text-brvm-muted hover:text-brvm-red opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Ajouter un point…"
          className="flex-1 text-xs bg-white border border-brvm-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brvm-green"
        />
        <button onClick={add} className="px-3 py-1.5 bg-brvm-green/10 text-brvm-green border border-brvm-green/20 rounded-lg hover:bg-brvm-green/20 transition-colors">
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── Ticker dropdown ── */
const TICKERS = MOCK_COMPANIES.map(c => ({ ticker: c.ticker, name: c.name })).sort((a, b) => a.ticker.localeCompare(b.ticker))

function TickerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]   = useState(false)
  const [q,    setQ]      = useState('')
  const filtered = TICKERS.filter(t => t.ticker.includes(q.toUpperCase()) || t.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-brvm-border rounded-xl text-sm font-semibold text-brvm-text hover:border-brvm-green/40 transition-colors min-w-[200px]">
        <span className="font-mono text-brvm-green">{value}</span>
        <span className="text-brvm-muted text-xs truncate">{TICKERS.find(t => t.ticker === value)?.name}</span>
        <ChevronDown size={14} className="ml-auto text-brvm-muted" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-72 bg-white border border-brvm-border rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="p-2 border-b border-brvm-border">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
              <Search size={13} className="text-brvm-muted" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…"
                className="flex-1 bg-transparent text-xs focus:outline-none text-brvm-text" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(t => (
              <button key={t.ticker} onClick={() => { onChange(t.ticker); setOpen(false); setQ('') }}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left transition-colors ${t.ticker === value ? 'bg-brvm-green/5' : ''}`}>
                <span className="font-mono text-xs font-bold text-brvm-green w-12">{t.ticker}</span>
                <span className="text-xs text-brvm-subtext truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function AdminResume() {
  const [ticker,       setTicker]      = useState('UNXC')
  const [loading,      setLoading]     = useState(false)
  const [saving,       setSaving]      = useState(false)
  const [toasts,       setToasts]      = useState<Toast[]>([])
  const [executiveText, setExecutiveText] = useState('')
  const [bullCase,     setBullCase]    = useState<string[]>([])
  const [bearCase,     setBearCase]    = useState<string[]>([])
  const [updatedAt,    setUpdatedAt]   = useState<string | null>(null)

  const toast = (type: Toast['type'], message: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }

  const load = useCallback(() => {
    setLoading(true)
    companiesApi.getSummary(ticker)
      .then(s => {
        setExecutiveText(s.executiveText ?? '')
        setBullCase(s.bullCase)
        setBearCase(s.bearCase)
        setUpdatedAt(s.updatedAt)
      })
      .catch(() => {
        setExecutiveText(''); setBullCase([]); setBearCase([]); setUpdatedAt(null)
      })
      .finally(() => setLoading(false))
  }, [ticker])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      await companiesApi.putSummary(ticker, { executiveText, bullCase, bearCase })
      toast('success', 'Résumé enregistré avec succès')
      load()
    } catch {
      toast('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-brvm-border bg-white flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-brvm-text">Résumé analytique</h1>
          <p className="text-brvm-subtext text-xs mt-0.5">Texte exécutif + cas haussier / baissier par valeur</p>
        </div>
        <div className="flex items-center gap-3">
          <TickerSelect value={ticker} onChange={setTicker} />
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl border border-brvm-border text-brvm-muted hover:text-brvm-text hover:bg-slate-50 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={save} disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white text-sm font-semibold rounded-xl hover:bg-brvm-green/90 disabled:opacity-50 transition-all">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-28 bg-slate-100 rounded-xl" />
            <div className="grid grid-cols-2 gap-6 mt-6">
              {[0, 1].map(i => <div key={i} className="h-40 bg-slate-100 rounded-xl" />)}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl space-y-6">
            {updatedAt && (
              <p className="text-[11px] text-brvm-muted">
                Dernière mise à jour : {new Date(updatedAt).toLocaleString('fr-FR')}
              </p>
            )}

            {/* Texte exécutif */}
            <div className="bg-white border border-brvm-border rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-brvm-text">Résumé exécutif</p>
              <p className="text-[10px] text-brvm-muted">Présentation générale de la société (2–5 phrases).</p>
              <textarea
                rows={6}
                value={executiveText}
                onChange={e => setExecutiveText(e.target.value)}
                placeholder="Présentation de la société…"
                className="w-full text-sm text-brvm-subtext bg-slate-50 border border-brvm-border rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:border-brvm-green"
              />
            </div>

            {/* Bull / Bear */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-brvm-border rounded-2xl p-5">
                <ArrayEditor label="✅ Cas haussier" color="text-brvm-green" items={bullCase} onChange={setBullCase} />
              </div>
              <div className="bg-white border border-brvm-border rounded-2xl p-5">
                <ArrayEditor label="⚠ Cas baissier" color="text-brvm-red" items={bearCase} onChange={setBearCase} />
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastList toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  )
}
