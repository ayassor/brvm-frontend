import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Trash2, RefreshCw, Save, Target } from 'lucide-react'
import {
  companiesApi,
  type RecoConsensus, type AnalystRecommendation,
} from '../api/companies.api'
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

/* ── Consensus ── */
const CONSENSUS_OPTS: RecoConsensus[] = ['ACHAT FORT', 'ACHAT', 'NEUTRE', 'ALLÉGEMENT', 'VENTE']
const CONSENSUS_COLORS: Record<RecoConsensus, string> = {
  'ACHAT FORT': 'bg-emerald-500 text-white',
  'ACHAT':      'bg-emerald-100 text-emerald-800',
  'NEUTRE':     'bg-slate-100 text-slate-700',
  'ALLÉGEMENT': 'bg-amber-100 text-amber-800',
  'VENTE':      'bg-red-100 text-red-800',
}

function ConsensusBadge({ v }: { v: RecoConsensus }) {
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CONSENSUS_COLORS[v]}`}>{v}</span>
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

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function AdminRecommandations() {
  const [search,      setSearch]     = useState('')
  const [ticker,      setTicker]     = useState<string | null>(null)
  const [loading,     setLoading]    = useState(false)
  const [saving,      setSaving]     = useState(false)
  const [toasts,      setToasts]     = useState<Toast[]>([])

  /* Reco Afrivest */
  const [consensus,   setConsensus]  = useState<RecoConsensus>('NEUTRE')
  const [fairValue,   setFairValue]  = useState('')
  const [buyPrice,    setBuyPrice]   = useState('')
  const [stopLoss,    setStopLoss]   = useState('')
  const [horizon,     setHorizon]    = useState('')
  const [methodology, setMethodology] = useState('')

  /* Analysts */
  const [analysts,    setAnalysts]   = useState<AnalystRecommendation[]>([])
  const [draftFirm,   setDraftFirm]  = useState('')
  const [draftName,   setDraftName]  = useState('')
  const [draftReco,   setDraftReco]  = useState<RecoConsensus>('NEUTRE')
  const [draftTarget, setDraftTarget] = useState('')
  const [draftDate,   setDraftDate]  = useState(new Date().toISOString().slice(0, 10))
  const [addingReco,  setAddingReco] = useState(false)

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

  const resetForm = () => {
    setConsensus('NEUTRE'); setFairValue(''); setBuyPrice(''); setStopLoss(''); setHorizon(''); setMethodology('')
    setAnalysts([])
    setAddingReco(false)
  }

  const load = useCallback(() => {
    if (!ticker) return
    setLoading(true)
    Promise.all([
      companiesApi.getRecommendation(ticker).catch(() => null),
      companiesApi.getAnalystRecommendations(ticker).catch(() => []),
    ]).then(([r, a]) => {
      if (r) {
        setConsensus(r.consensus ?? 'NEUTRE')
        setFairValue(r.fairValue != null ? String(r.fairValue) : '')
        setBuyPrice(r.buyPrice   != null ? String(r.buyPrice)  : '')
        setStopLoss(r.stopLoss   != null ? String(r.stopLoss)  : '')
        setHorizon(r.horizon     ?? '')
        setMethodology(r.methodology ?? '')
      } else {
        setConsensus('NEUTRE'); setFairValue(''); setBuyPrice(''); setStopLoss(''); setHorizon(''); setMethodology('')
      }
      setAnalysts(Array.isArray(a) ? a : [])
    }).finally(() => setLoading(false))
  }, [ticker])

  useEffect(() => {
    if (ticker) {
      resetForm()
      load()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker])

  const save = async () => {
    if (!ticker) return
    setSaving(true)
    try {
      await companiesApi.putRecommendation(ticker, {
        consensus,
        fairValue:   fairValue   ? Number(fairValue)  : null,
        buyPrice:    buyPrice    ? Number(buyPrice)   : null,
        stopLoss:    stopLoss    ? Number(stopLoss)   : null,
        horizon:     horizon     || null,
        methodology: methodology || null,
      })
      toast('success', 'Recommandation enregistrée')
      load()
    } catch {
      toast('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const addAnalyst = async () => {
    if (!ticker || !draftFirm.trim()) return
    try {
      await companiesApi.createAnalystReco(ticker, {
        firm:        draftFirm.trim(),
        analystName: draftName.trim() || null,
        consensus:   draftReco,
        targetPrice: draftTarget ? Number(draftTarget) : null,
        publishedAt: draftDate ? new Date(draftDate).toISOString() : null,
      })
      toast('success', 'Analyste ajouté')
      setDraftFirm(''); setDraftName(''); setDraftTarget(''); setAddingReco(false)
      load()
    } catch {
      toast('error', "Erreur lors de l'ajout")
    }
  }

  const deleteAnalyst = async (id: number) => {
    try {
      await companiesApi.deleteAnalystReco(id)
      toast('success', 'Supprimé')
      setAnalysts(p => p.filter(a => a.id !== id))
    } catch {
      toast('error', 'Erreur suppression')
    }
  }

  const upside = fairValue && buyPrice
    ? ((Number(fairValue) - Number(buyPrice)) / Number(buyPrice) * 100).toFixed(1)
    : null

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
            <Target size={48} className="text-brvm-muted opacity-20 mb-4" />
            <p className="text-brvm-subtext font-medium">Sélectionnez une société</p>
            <p className="text-brvm-muted text-sm mt-1">Choisissez une société pour gérer ses recommandations.</p>
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
                  onClick={save}
                  disabled={saving || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white text-sm font-semibold rounded-xl hover:bg-brvm-green/90 disabled:opacity-50 transition-all"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="space-y-4 animate-pulse max-w-4xl">
                  <div className="h-24 bg-slate-100 rounded-2xl" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                  </div>
                  <div className="h-32 bg-slate-100 rounded-2xl" />
                </div>
              ) : (
                <div className="max-w-4xl space-y-6">

                  {/* ── Afrivest reco ── */}
                  <div className="bg-white border border-brvm-border rounded-2xl p-6 space-y-5">
                    <p className="text-sm font-bold text-brvm-text">Recommandation Afrivest</p>

                    <Field label="Consensus">
                      <div className="flex flex-wrap gap-2">
                        {CONSENSUS_OPTS.map(c => (
                          <button
                            key={c}
                            onClick={() => setConsensus(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              consensus === c
                                ? CONSENSUS_COLORS[c] + ' border-transparent shadow-sm'
                                : 'bg-white border-brvm-border text-brvm-subtext hover:border-brvm-green/30'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Objectif de cours (FCFA)">
                        <input
                          type="number"
                          value={fairValue}
                          onChange={e => setFairValue(e.target.value)}
                          placeholder="ex: 2800"
                          className={INPUT}
                        />
                      </Field>
                      <Field label="Prix d'achat conseillé">
                        <input
                          type="number"
                          value={buyPrice}
                          onChange={e => setBuyPrice(e.target.value)}
                          placeholder="ex: 2600"
                          className={INPUT}
                        />
                      </Field>
                      <Field label="Stop-loss">
                        <input
                          type="number"
                          value={stopLoss}
                          onChange={e => setStopLoss(e.target.value)}
                          placeholder="ex: 2200"
                          className={INPUT}
                        />
                      </Field>
                    </div>

                    {upside && (
                      <p className="text-xs text-brvm-green font-semibold">
                        Potentiel : +{upside}% depuis le prix d'achat conseillé
                      </p>
                    )}

                    <Field label="Horizon de placement">
                      <input
                        value={horizon}
                        onChange={e => setHorizon(e.target.value)}
                        placeholder="ex: Moyen terme (6–18 mois)"
                        className={INPUT}
                      />
                    </Field>

                    <Field label="Méthodologie / Thèse">
                      <textarea
                        rows={4}
                        value={methodology}
                        onChange={e => setMethodology(e.target.value)}
                        placeholder="Description de la méthode de valorisation, thèse d'investissement…"
                        className={INPUT + ' resize-none'}
                      />
                    </Field>
                  </div>

                  {/* ── Analysts ── */}
                  <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-brvm-border">
                      <p className="text-sm font-bold text-brvm-text">Recommandations analystes ({analysts.length})</p>
                      <button
                        onClick={() => setAddingReco(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brvm-green/10 text-brvm-green border border-brvm-green/20 rounded-lg text-xs font-semibold hover:bg-brvm-green/20 transition-colors"
                      >
                        <Plus size={13} /> Ajouter
                      </button>
                    </div>

                    {/* Add analyst form */}
                    {addingReco && (
                      <div className="p-5 border-b border-brvm-border bg-slate-50 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Field label="Société d'analyse">
                            <input
                              value={draftFirm}
                              onChange={e => setDraftFirm(e.target.value)}
                              placeholder="ex: CGF Bourse"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="Analyste (opt.)">
                            <input
                              value={draftName}
                              onChange={e => setDraftName(e.target.value)}
                              placeholder="Prénom Nom"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="Objectif (FCFA)">
                            <input
                              type="number"
                              value={draftTarget}
                              onChange={e => setDraftTarget(e.target.value)}
                              placeholder="ex: 2750"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="Date publication">
                            <input
                              type="date"
                              value={draftDate}
                              onChange={e => setDraftDate(e.target.value)}
                              className={INPUT}
                            />
                          </Field>
                        </div>
                        <Field label="Consensus">
                          <div className="flex flex-wrap gap-2">
                            {CONSENSUS_OPTS.map(c => (
                              <button
                                key={c}
                                onClick={() => setDraftReco(c)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                  draftReco === c
                                    ? CONSENSUS_COLORS[c] + ' border-transparent'
                                    : 'bg-white border-brvm-border text-brvm-subtext hover:border-brvm-green/30'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </Field>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setAddingReco(false)}
                            className="px-3 py-1.5 text-xs text-brvm-muted hover:text-brvm-text border border-brvm-border rounded-lg transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={addAnalyst}
                            className="px-4 py-1.5 bg-brvm-green text-white text-xs font-semibold rounded-lg hover:bg-brvm-green/90 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Analyst list */}
                    {analysts.length === 0 ? (
                      <div className="py-12 text-center text-brvm-muted text-sm">
                        Aucune recommandation analyste pour cette valeur
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-brvm-muted uppercase tracking-wider text-[10px] border-b border-brvm-border">
                            <th className="px-4 py-3 text-left">Société</th>
                            <th className="px-4 py-3 text-left">Analyste</th>
                            <th className="px-4 py-3 text-center">Consensus</th>
                            <th className="px-4 py-3 text-right">Objectif</th>
                            <th className="px-4 py-3 text-right">Date</th>
                            <th className="px-4 py-3 w-10" />
                          </tr>
                        </thead>
                        <tbody>
                          {analysts.map((a, i) => (
                            <tr key={a.id} className={`border-t border-brvm-border ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                              <td className="px-4 py-2.5 font-semibold text-brvm-text">{a.firm}</td>
                              <td className="px-4 py-2.5 text-brvm-subtext">{a.analystName ?? '—'}</td>
                              <td className="px-4 py-2.5 text-center"><ConsensusBadge v={a.consensus} /></td>
                              <td className="px-4 py-2.5 text-right font-mono text-brvm-text">
                                {a.targetPrice ? a.targetPrice.toLocaleString('fr-FR') + ' F' : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-right text-brvm-muted">
                                {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('fr-FR') : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  onClick={() => deleteAnalyst(a.id)}
                                  className="text-brvm-muted hover:text-brvm-red transition-colors"
                                >
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
              )}
            </div>
          </>
        )}
      </div>

      <ToastList toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  )
}
