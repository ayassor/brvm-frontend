import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Trash2, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import { companiesApi, type CompanyReport } from '../api/companies.api'
import { MOCK_COMPANIES } from '../mocks/brvm-data'

/* ── Sorted company list ── */
const SORTED_COMPANIES = [...MOCK_COMPANIES].sort((a, b) => a.ticker.localeCompare(b.ticker))

/* ── Toast ── */
interface Toast { id: number; type: 'success' | 'error'; message: string }
function ToastList({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto cursor-pointer ${
            t.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

/* ── Type badge ── */
const TYPE_LABELS: Record<CompanyReport['type'], string> = {
  annual:      'Rapport annuel',
  semi_annual: 'Rapport semestriel',
  quarterly:   'Rapport trimestriel',
}
const TYPE_COLORS: Record<CompanyReport['type'], string> = {
  annual:      'bg-violet-50 text-violet-700 border-violet-200',
  semi_annual: 'bg-blue-50 text-blue-700 border-blue-200',
  quarterly:   'bg-teal-50 text-teal-700 border-teal-200',
}

/* ── Field ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold text-brvm-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
const INPUT = 'w-full text-sm bg-slate-50 border border-brvm-border rounded-xl px-3.5 py-2 focus:outline-none focus:border-brvm-green'

/* ── Blank form ── */
const blankForm = (): Omit<CompanyReport, 'id' | 'ticker' | 'publishedAt'> => ({
  year:        new Date().getFullYear(),
  type:        'annual',
  label:       '',
  fileUrl:     '',
  fileSizeKb:  null,
  pageCount:   null,
  isPublished: true,
})

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function AdminRapports() {
  const [search,     setSearch]     = useState('')
  const [ticker,     setTicker]     = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [reports,    setReports]    = useState<CompanyReport[]>([])
  const [toasts,     setToasts]     = useState<Toast[]>([])
  const [adding,     setAdding]     = useState(false)
  const [form,       setForm]       = useState(blankForm())
  const [submitting, setSubmitting] = useState(false)

  const filteredCompanies = SORTED_COMPANIES.filter(c =>
    c.ticker.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCompany = ticker ? SORTED_COMPANIES.find(c => c.ticker === ticker) : null

  const toast = (type: Toast['type'], message: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }

  const load = useCallback(() => {
    if (!ticker) return
    setLoading(true)
    companiesApi.getReports(ticker)
      .then(r => setReports(Array.isArray(r) ? r : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [ticker])

  useEffect(() => {
    if (ticker) {
      setReports([])
      setAdding(false)
      setForm(blankForm())
      load()
    }
  }, [ticker, load])

  const submit = async () => {
    if (!ticker || !form.label.trim()) return
    setSubmitting(true)
    try {
      await companiesApi.createReport(ticker, {
        ...form,
        fileUrl:    form.fileUrl?.trim()    || null,
        fileSizeKb: form.fileSizeKb         || null,
        pageCount:  form.pageCount          || null,
      })
      toast('success', 'Rapport ajouté')
      setForm(blankForm())
      setAdding(false)
      load()
    } catch {
      toast('error', "Erreur lors de l'ajout")
    } finally {
      setSubmitting(false)
    }
  }

  const del = async (id: number) => {
    try {
      await companiesApi.deleteReport(id)
      toast('success', 'Rapport supprimé')
      setReports(p => p.filter(r => r.id !== id))
    } catch {
      toast('error', 'Erreur suppression')
    }
  }

  const fmtSize = (kb: number | null) => {
    if (!kb) return null
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} Mo` : `${kb} Ko`
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left panel: company list ── */}
      <div className="w-72 flex-shrink-0 border-r border-brvm-border bg-slate-50/50 flex flex-col h-full">
        {/* Search */}
        <div className="p-3 border-b border-brvm-border">
          <div className="flex items-center gap-2 bg-white border border-brvm-border rounded-xl px-3 py-2">
            <Search size={14} className="text-brvm-muted flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une société…"
              className="flex-1 text-xs bg-transparent focus:outline-none text-brvm-text placeholder:text-brvm-muted"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredCompanies.map(c => (
            <button
              key={c.ticker}
              onClick={() => setTicker(c.ticker)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                ticker === c.ticker
                  ? 'bg-brvm-green/10 border-l-2 border-brvm-green'
                  : 'hover:bg-slate-100 border-l-2 border-transparent'
              }`}
            >
              <span className={`font-mono text-xs font-bold w-12 flex-shrink-0 ${
                ticker === c.ticker ? 'text-brvm-green' : 'text-brvm-green/70 group-hover:text-brvm-green'
              }`}>
                {c.ticker}
              </span>
              <span className="text-xs text-brvm-subtext truncate">{c.name}</span>
            </button>
          ))}
          {filteredCompanies.length === 0 && (
            <p className="text-center text-xs text-brvm-muted py-8">Aucun résultat</p>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!ticker ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FileText size={48} className="text-brvm-muted opacity-20 mb-4" />
            <p className="text-brvm-subtext font-medium">Sélectionnez une société</p>
            <p className="text-brvm-muted text-sm mt-1">Choisissez une société dans la liste pour gérer ses rapports.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-brvm-border bg-white flex items-center gap-4 flex-shrink-0">
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-brvm-green">{selectedCompany?.ticker}</span>
                <span className="text-brvm-subtext text-sm truncate">{selectedCompany?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={load}
                  disabled={loading}
                  className="p-2 rounded-xl border border-brvm-border text-brvm-muted hover:text-brvm-text hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => { setAdding(v => !v); setForm(blankForm()) }}
                  className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white text-sm font-semibold rounded-xl hover:bg-brvm-green/90 transition-all"
                >
                  <Plus size={14} /> Ajouter un rapport
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Add form */}
              {adding && (
                <div className="bg-white border border-brvm-green/30 rounded-2xl p-6 space-y-4">
                  <p className="text-sm font-bold text-brvm-text">Nouveau rapport</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Field label="Exercice (année)">
                      <input
                        type="number"
                        value={form.year}
                        onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))}
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Type">
                      <select
                        value={form.type}
                        onChange={e => setForm(p => ({ ...p, type: e.target.value as CompanyReport['type'] }))}
                        className={INPUT}
                      >
                        <option value="annual">Rapport annuel</option>
                        <option value="semi_annual">Rapport semestriel</option>
                        <option value="quarterly">Rapport trimestriel</option>
                      </select>
                    </Field>
                    <Field label="Taille (Ko)">
                      <input
                        type="number"
                        value={form.fileSizeKb ?? ''}
                        onChange={e => setForm(p => ({ ...p, fileSizeKb: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="ex: 2048"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Nombre de pages">
                      <input
                        type="number"
                        value={form.pageCount ?? ''}
                        onChange={e => setForm(p => ({ ...p, pageCount: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="ex: 120"
                        className={INPUT}
                      />
                    </Field>
                  </div>
                  <Field label="Libellé">
                    <input
                      value={form.label}
                      onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                      placeholder="ex: Rapport Annuel 2024"
                      className={INPUT}
                    />
                  </Field>
                  <Field label="URL du fichier (optionnel)">
                    <input
                      value={form.fileUrl ?? ''}
                      onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))}
                      placeholder="https://…/rapport.pdf"
                      className={INPUT}
                    />
                  </Field>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                        className="w-4 h-4 accent-brvm-green rounded"
                      />
                      <span className="text-xs text-brvm-subtext">Publié (visible côté client)</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAdding(false)}
                        className="px-3 py-1.5 text-xs text-brvm-muted border border-brvm-border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={submit}
                        disabled={submitting || !form.label.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-brvm-green text-white text-xs font-semibold rounded-lg hover:bg-brvm-green/90 disabled:opacity-50 transition-all"
                      >
                        {submitting ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reports table */}
              <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-brvm-border bg-slate-50">
                  <p className="text-sm font-bold text-brvm-text">
                    {loading ? 'Chargement…' : `${reports.length} rapport${reports.length > 1 ? 's' : ''} — ${ticker}`}
                  </p>
                </div>

                {loading ? (
                  <div className="p-6 space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-16 text-center">
                    <FileText size={36} className="mx-auto text-brvm-muted opacity-30 mb-3" />
                    <p className="text-brvm-subtext text-sm">Aucun rapport pour {ticker}</p>
                    <p className="text-brvm-muted text-xs mt-1">Cliquez sur « Ajouter un rapport » pour créer le premier.</p>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-brvm-muted uppercase tracking-wider text-[10px] border-b border-brvm-border bg-slate-50">
                        <th className="px-4 py-3 text-left">Libellé</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-center">Année</th>
                        <th className="px-4 py-3 text-right">Taille</th>
                        <th className="px-4 py-3 text-right">Pages</th>
                        <th className="px-4 py-3 text-center">Statut</th>
                        <th className="px-4 py-3 text-center">PDF</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {[...reports].sort((a, b) => b.year - a.year).map((r, i) => (
                        <tr
                          key={r.id}
                          className={`border-t border-brvm-border transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                        >
                          <td className="px-4 py-3 font-medium text-brvm-text max-w-[200px] truncate" title={r.label}>{r.label}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[r.type]}`}>
                              {TYPE_LABELS[r.type]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-brvm-text font-semibold">{r.year}</td>
                          <td className="px-4 py-3 text-right text-brvm-muted">{fmtSize(r.fileSizeKb) ?? '—'}</td>
                          <td className="px-4 py-3 text-right text-brvm-muted">{r.pageCount ?? '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              r.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {r.isPublished ? 'Publié' : 'Brouillon'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.fileUrl ? (
                              <a
                                href={r.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-brvm-green hover:text-emerald-700 transition-colors"
                              >
                                <ExternalLink size={12} />
                              </a>
                            ) : <span className="text-brvm-muted">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => del(r.id)} className="text-brvm-muted hover:text-brvm-red transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <ToastList toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  )
}
