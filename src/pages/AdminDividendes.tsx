import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, Trash2, Pencil, Check, X,
  TrendingUp, RefreshCw, AlertCircle, CheckCircle2, ChevronDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { companiesApi } from '../api/companies.api'
import api from '../api/axios'
import type { Company } from '../types'

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface DividendEntry {
  id: number
  year: number
  amount_fcfa: number
  payment_date: string
  ex_date: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function fmtFcfa(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' FCFA'
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

/* ══════════════════════════════════════════════════════════════
   TOAST HOOK
══════════════════════════════════════════════════════════════ */
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  function push(message: string, type: 'success' | 'error') {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  return { toasts, push }
}

/* ══════════════════════════════════════════════════════════════
   COMPANY SELECTOR DROPDOWN
══════════════════════════════════════════════════════════════ */
interface SelectorProps {
  selectedId: number | null
  onChange: (id: number) => void
  companies: Company[]
}

function CompanySelector({ selectedId, onChange, companies }: SelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = companies.find(c => c.id === selectedId) ?? null

  const filtered = companies.filter(c => {
    const q = query.toLowerCase()
    return c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setQuery('') }}
        className="w-full flex items-center justify-between gap-2 bg-white border border-brvm-border rounded-xl px-4 py-3 text-left hover:border-brvm-green transition-colors"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="font-mono font-bold text-brvm-green text-sm">{selected.ticker}</span>
            <span className="text-brvm-text text-sm truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-brvm-muted text-sm">Choisir une société…</span>
        )}
        <ChevronDown
          size={16}
          className={`text-brvm-muted flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-brvm-border rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-brvm-border">
            <Search size={14} className="text-brvm-muted flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 text-sm outline-none text-brvm-text placeholder-brvm-muted"
            />
          </div>
          {/* List */}
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-brvm-muted text-sm text-center">Aucun résultat</li>
            ) : filtered.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.id)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                    c.id === selectedId ? 'bg-emerald-50' : ''
                  }`}
                >
                  <span className="font-mono font-bold text-brvm-green text-xs w-14 flex-shrink-0">{c.ticker}</span>
                  <span className="text-brvm-text text-sm truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   STATS CARDS
══════════════════════════════════════════════════════════════ */
interface StatsProps {
  dividends: DividendEntry[]
}

function StatsCards({ dividends }: StatsProps) {
  if (dividends.length === 0) return null

  const sorted = [...dividends].sort((a, b) => b.year - a.year)
  const latest = sorted[0]
  const previous = sorted[1] ?? null

  const yoyGrowth = previous
    ? ((latest.amount_fcfa - previous.amount_fcfa) / previous.amount_fcfa) * 100
    : null

  const yearsWithDividend = dividends.filter(d => d.amount_fcfa > 0).length

  const cards = [
    {
      label: 'Dernier dividende',
      value: fmtFcfa(latest.amount_fcfa),
      sub: `Exercice ${latest.year}`,
      color: 'text-brvm-green',
    },
    {
      label: 'Croissance YoY',
      value: yoyGrowth !== null
        ? `${yoyGrowth >= 0 ? '+' : ''}${yoyGrowth.toFixed(1)} %`
        : '—',
      sub: previous ? `vs ${previous.year}: ${fmtFcfa(previous.amount_fcfa)}` : "Pas d'année précédente",
      color: yoyGrowth === null ? 'text-brvm-muted' : yoyGrowth >= 0 ? 'text-brvm-green' : 'text-brvm-red',
    },
    {
      label: 'Années de versement',
      value: `${yearsWithDividend}`,
      sub: yearsWithDividend > 1 ? 'versements enregistrés' : 'versement enregistré',
      color: 'text-brvm-text',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <div key={i} className="bg-white border border-brvm-border rounded-xl p-4">
          <p className="text-brvm-muted text-[11px] uppercase tracking-wider mb-2">{card.label}</p>
          <p className={`text-xl font-bold font-mono ${card.color}`}>{card.value}</p>
          <p className="text-brvm-subtext text-xs mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MINI CHART
══════════════════════════════════════════════════════════════ */
interface MiniChartProps {
  dividends: DividendEntry[]
}

function MiniChart({ dividends }: MiniChartProps) {
  if (dividends.length < 2) return null

  const data = [...dividends]
    .sort((a, b) => a.year - b.year)
    .map(d => ({ année: String(d.year), amount: d.amount_fcfa }))

  return (
    <div className="bg-white border border-brvm-border rounded-xl p-4">
      <p className="text-brvm-muted text-[11px] uppercase tracking-wider mb-3">Historique graphique</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="année"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip
            formatter={(value: number) => [fmtFcfa(value), 'Montant']}
            labelFormatter={(label: string) => `Exercice ${label}`}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="amount" fill="#059669" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ADD FORM
══════════════════════════════════════════════════════════════ */
interface AddFormProps {
  onAdd: (entry: Omit<DividendEntry, 'id'>) => void
}

interface FormState {
  year: string
  amount_fcfa: string
  payment_date: string
  ex_date: string
}

const EMPTY_FORM: FormState = { year: '', amount_fcfa: '', payment_date: '', ex_date: '' }

function AddForm({ onAdd }: AddFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Set<keyof FormState>>(new Set())

  function handleChange(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const s = new Set(prev); s.delete(field); return s })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors = new Set<keyof FormState>()
    if (!form.year || isNaN(Number(form.year))) newErrors.add('year')
    if (!form.amount_fcfa || isNaN(Number(form.amount_fcfa)) || Number(form.amount_fcfa) <= 0) newErrors.add('amount_fcfa')
    if (!form.payment_date) newErrors.add('payment_date')
    if (!form.ex_date) newErrors.add('ex_date')

    if (newErrors.size > 0) { setErrors(newErrors); return }

    onAdd({
      year: parseInt(form.year, 10),
      amount_fcfa: parseFloat(form.amount_fcfa),
      payment_date: form.payment_date,
      ex_date: form.ex_date,
    })
    setForm(EMPTY_FORM)
    setErrors(new Set())
  }

  const fieldCls = (field: keyof FormState) =>
    `w-full border rounded-lg px-3 py-2 text-sm text-brvm-text outline-none transition-colors ${
      errors.has(field)
        ? 'border-brvm-red focus:border-brvm-red bg-red-50'
        : 'border-brvm-border focus:border-brvm-green'
    }`

  return (
    <div className="bg-white border border-brvm-border rounded-xl p-5">
      <p className="text-brvm-text font-semibold text-sm mb-4 flex items-center gap-2">
        <Plus size={16} className="text-brvm-green" />
        Ajouter un versement
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-brvm-muted text-[11px] uppercase tracking-wider block mb-1">
              Exercice
            </label>
            <input
              type="number"
              placeholder="2026"
              value={form.year}
              onChange={e => handleChange('year', e.target.value)}
              className={fieldCls('year')}
              min={1990}
              max={2100}
            />
          </div>
          <div>
            <label className="text-brvm-muted text-[11px] uppercase tracking-wider block mb-1">
              Montant / action (FCFA)
            </label>
            <input
              type="number"
              placeholder="500"
              value={form.amount_fcfa}
              onChange={e => handleChange('amount_fcfa', e.target.value)}
              className={fieldCls('amount_fcfa')}
              min={0}
              step="0.01"
            />
          </div>
          <div>
            <label className="text-brvm-muted text-[11px] uppercase tracking-wider block mb-1">
              Date de paiement
            </label>
            <input
              type="date"
              value={form.payment_date}
              onChange={e => handleChange('payment_date', e.target.value)}
              className={fieldCls('payment_date')}
            />
          </div>
          <div>
            <label className="text-brvm-muted text-[11px] uppercase tracking-wider block mb-1">
              Date ex-dividende
            </label>
            <input
              type="date"
              value={form.ex_date}
              onChange={e => handleChange('ex_date', e.target.value)}
              className={fieldCls('ex_date')}
            />
          </div>
        </div>
        {errors.size > 0 && (
          <p className="text-brvm-red text-xs mb-3 flex items-center gap-1.5">
            <AlertCircle size={13} />
            Tous les champs sont obligatoires et doivent être valides.
          </p>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 bg-brvm-green text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95"
        >
          <Plus size={15} />
          Ajouter
        </button>
      </form>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   DIVIDEND TABLE
══════════════════════════════════════════════════════════════ */
interface TableProps {
  dividends: DividendEntry[]
  onUpdate: (id: number, entry: Partial<DividendEntry>) => void
  onDelete: (id: number) => void
}

interface EditState {
  year: string
  amount_fcfa: string
  payment_date: string
  ex_date: string
}

function DividendTable({ dividends, onUpdate, onDelete }: TableProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState>({ year: '', amount_fcfa: '', payment_date: '', ex_date: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  function startEdit(d: DividendEntry) {
    setEditingId(d.id)
    setEditState({
      year: String(d.year),
      amount_fcfa: String(d.amount_fcfa),
      payment_date: d.payment_date,
      ex_date: d.ex_date,
    })
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit(id: number) {
    onUpdate(id, {
      year: parseInt(editState.year, 10) || 0,
      amount_fcfa: parseFloat(editState.amount_fcfa) || 0,
      payment_date: editState.payment_date,
      ex_date: editState.ex_date,
    })
    setEditingId(null)
  }

  function handleDeleteClick(id: number) {
    if (confirmDeleteId === id) {
      onDelete(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      // Reset confirmation after 3s if no second click
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000)
    }
  }

  const editInputCls = 'w-full border border-brvm-green rounded px-2 py-1 text-xs font-mono text-brvm-text outline-none bg-emerald-50'

  return (
    <div className="bg-white border border-brvm-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-brvm-border">
              <th className="px-4 py-3 text-left text-brvm-muted text-[10px] uppercase tracking-wider font-semibold w-20">
                Exercice
              </th>
              <th className="px-4 py-3 text-right text-brvm-muted text-[10px] uppercase tracking-wider font-semibold">
                Montant / action
              </th>
              <th className="px-4 py-3 text-left text-brvm-muted text-[10px] uppercase tracking-wider font-semibold">
                Date de paiement
              </th>
              <th className="px-4 py-3 text-left text-brvm-muted text-[10px] uppercase tracking-wider font-semibold">
                Date ex-dividende
              </th>
              <th className="px-4 py-3 text-center text-brvm-muted text-[10px] uppercase tracking-wider font-semibold w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {dividends.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-brvm-muted">
                  <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun dividende enregistré pour cette société.</p>
                </td>
              </tr>
            ) : dividends.map(d => (
              <tr key={d.id} className="border-b border-brvm-border hover:bg-slate-50 transition-colors">
                {/* Exercice */}
                <td className="px-4 py-3">
                  {editingId === d.id ? (
                    <input
                      type="number"
                      value={editState.year}
                      onChange={e => setEditState(prev => ({ ...prev, year: e.target.value }))}
                      className={editInputCls}
                    />
                  ) : (
                    <span className="font-mono font-semibold text-brvm-text">{d.year}</span>
                  )}
                </td>

                {/* Montant */}
                <td className="px-4 py-3 text-right">
                  {editingId === d.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editState.amount_fcfa}
                      onChange={e => setEditState(prev => ({ ...prev, amount_fcfa: e.target.value }))}
                      className={editInputCls + ' text-right'}
                    />
                  ) : (
                    <span className="font-mono font-bold text-brvm-green">
                      {d.amount_fcfa.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} FCFA
                    </span>
                  )}
                </td>

                {/* Date paiement */}
                <td className="px-4 py-3">
                  {editingId === d.id ? (
                    <input
                      type="date"
                      value={editState.payment_date}
                      onChange={e => setEditState(prev => ({ ...prev, payment_date: e.target.value }))}
                      className={editInputCls}
                    />
                  ) : (
                    <span className="text-brvm-text text-sm">{fmtDate(d.payment_date)}</span>
                  )}
                </td>

                {/* Date ex-div */}
                <td className="px-4 py-3">
                  {editingId === d.id ? (
                    <input
                      type="date"
                      value={editState.ex_date}
                      onChange={e => setEditState(prev => ({ ...prev, ex_date: e.target.value }))}
                      className={editInputCls}
                    />
                  ) : (
                    <span className="text-brvm-subtext text-sm">{fmtDate(d.ex_date)}</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    {editingId === d.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(d.id)}
                          title="Enregistrer"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 text-brvm-green hover:bg-brvm-green hover:text-white transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          title="Annuler"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-brvm-muted hover:bg-slate-200 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(d)}
                          title="Modifier"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-brvm-muted hover:bg-slate-100 hover:text-brvm-text transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(d.id)}
                          title={confirmDeleteId === d.id ? 'Confirmer la suppression' : 'Supprimer'}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            confirmDeleteId === d.id
                              ? 'bg-red-100 text-brvm-red hover:bg-brvm-red hover:text-white'
                              : 'text-brvm-muted hover:bg-red-50 hover:text-brvm-red'
                          }`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   TOAST RENDERER
══════════════════════════════════════════════════════════════ */
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-fade-in ${
            t.type === 'success' ? 'bg-brvm-green' : 'bg-brvm-red'
          }`}
        >
          {t.type === 'success'
            ? <CheckCircle2 size={16} className="flex-shrink-0" />
            : <AlertCircle size={16} className="flex-shrink-0" />
          }
          {t.message}
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function AdminDividendes() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dividends, setDividends] = useState<DividendEntry[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const { toasts, push } = useToasts()

  const selectedCompany = companies.find(c => c.id === selectedId) ?? null

  // Load companies on mount
  useEffect(() => {
    companiesApi.list()
      .then(data => setCompanies(data))
      .catch(() => push('Impossible de charger la liste des sociétés', 'error'))
  }, [])

  // Load dividends when company changes
  useEffect(() => {
    if (selectedId === null) { setDividends([]); return }
    setLoading(true)

    companiesApi.getDividends(selectedId)
      .then(data => {
        const entries: DividendEntry[] = data.map(d => ({
          id: d.id,
          year: parseInt(d.payment_date.slice(0, 4), 10),
          amount_fcfa: d.amount,
          payment_date: d.payment_date,
          ex_date: d.ex_date ?? '',
        }))
        setDividends(entries.sort((a, b) => b.year - a.year))
        setLoading(false)
      })
      .catch(() => {
        push('Impossible de charger les dividendes', 'error')
        setDividends([])
        setLoading(false)
      })
  }, [selectedId])

  // ── Add ─────────────────────────────────────────────────────────────────────
  function handleAdd(entry: Omit<DividendEntry, 'id'>) {
    if (selectedId === null) return

    const optimisticId = Date.now()
    const newEntry: DividendEntry = { id: optimisticId, ...entry }
    setDividends(prev => [newEntry, ...prev].sort((a, b) => b.year - a.year))

    api.post(`/companies/${selectedId}/dividends`, entry)
      .then(res => {
        const saved = res.data as DividendEntry
        setDividends(prev =>
          prev.map(d => d.id === optimisticId ? saved : d)
            .sort((a, b) => b.year - a.year)
        )
        push('Dividende ajouté avec succès', 'success')
      })
      .catch(() => {
        setDividends(prev => prev.filter(d => d.id !== optimisticId))
        push('Erreur API – impossible d\'ajouter le dividende', 'error')
      })
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  function handleUpdate(id: number, partial: Partial<DividendEntry>) {
    if (selectedId === null) return

    const previous = dividends.find(d => d.id === id)
    setDividends(prev =>
      prev.map(d => d.id === id ? { ...d, ...partial } : d)
        .sort((a, b) => b.year - a.year)
    )

    api.put(`/companies/${selectedId}/dividends/${id}`, partial)
      .then(() => push('Modifications enregistrées', 'success'))
      .catch(() => {
        if (previous) setDividends(prev => prev.map(d => d.id === id ? previous : d))
        push('Erreur API – impossible de sauvegarder', 'error')
      })
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  function handleDelete(id: number) {
    if (selectedId === null) return

    const snapshot = dividends.find(d => d.id === id)
    setDividends(prev => prev.filter(d => d.id !== id))

    api.delete(`/companies/${selectedId}/dividends/${id}`)
      .then(() => push('Dividende supprimé', 'success'))
      .catch(() => {
        if (snapshot) setDividends(prev => [...prev, snapshot].sort((a, b) => b.year - a.year))
        push('Erreur API – impossible de supprimer', 'error')
      })
  }

  return (
    <div className="min-h-screen bg-brvm-bg">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-brvm-border">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-brvm-text">Gestion des Dividendes</h1>
              <p className="text-brvm-subtext text-sm mt-0.5">
                Consultez et modifiez l'historique des dividendes par société cotée.
              </p>
            </div>
            {/* Selector in header row on wide screens */}
            <CompanySelector selectedId={selectedId} onChange={setSelectedId} companies={companies} />
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* Empty state — no company selected */}
        {selectedId === null && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <TrendingUp size={48} className="text-brvm-muted opacity-30 mb-4" />
            <p className="text-brvm-subtext text-base font-medium">
              Sélectionnez une société pour gérer ses dividendes
            </p>
            <p className="text-brvm-muted text-sm mt-1">
              Utilisez le sélecteur en haut de page pour choisir une valeur.
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedId !== null && loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-brvm-subtext">
            <RefreshCw size={20} className="animate-spin text-brvm-green" />
            <span className="text-sm">Chargement des dividendes…</span>
          </div>
        )}

        {/* Content when company selected and loaded */}
        {selectedId !== null && !loading && (
          <>
            {/* Company badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-brvm-border rounded-xl px-4 py-2.5">
                <span className="font-mono font-bold text-brvm-green text-sm">
                  {selectedCompany?.ticker}
                </span>
                <span className="text-brvm-subtext text-xs">—</span>
                <span className="text-brvm-text text-sm font-medium">{selectedCompany?.name}</span>
              </div>
              <span className="text-brvm-muted text-xs">
                {dividends.length} versement{dividends.length !== 1 ? 's' : ''} enregistré{dividends.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Stats cards */}
            <StatsCards dividends={dividends} />

            {/* Mini chart */}
            <MiniChart dividends={dividends} />

            {/* Table */}
            <DividendTable
              dividends={dividends}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />

            {/* Add form */}
            <AddForm onAdd={handleAdd} />
          </>
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
