import { useState, useEffect, useRef } from 'react'
import {
  Search, Save, Plus, X, BarChart2, RefreshCw,
  AlertCircle, CheckCircle2, Pencil, ChevronDown,
  Trash2,
} from 'lucide-react'
import { companiesApi } from '../api/companies.api'
import api from '../api/axios'
import type { Company } from '../types'

type ShareholderType = 'institutionnel' | 'etat' | 'fondateur' | 'public'
interface Shareholder { name: string; pct: number; type: ShareholderType }

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */

interface FinancialYear {
  year: string
  revenue_m_fcfa: number | null
  net_income_m_fcfa: number | null
  ebitda_m_fcfa: number | null
  pe_ratio: number | null
  eps_fcfa: number | null
  dividend_per_share_fcfa: number | null
}

interface Dividend {
  id: number
  year: number
  amount_fcfa: number
  payment_date: string
  ex_date?: string | null
}

// positive: true = positif, false = négatif, null = neutre
interface NewsItem {
  id: number
  date: string
  headline: string
  positive: boolean | null
}

interface FondamentauxForm {
  // Section 1 – Métriques financières
  pe_ratio: string
  dividend_yield_pct: string
  revenue_bn_fcfa: string
  net_income_bn_fcfa: string
  ebitda_bn_fcfa: string
  net_margin_pct: string
  free_float_pct: string
  // Section 2 – Informations entreprise
  ceo: string
  ceo_title: string
  founded: string
  employees: string
  website: string
  shares_count: string
  // Section 3 – Activités
  activities: string[]
  // Section 4 – Certifications
  certifications: string[]
  // Section 5 – Actionnaires
  shareholders: Shareholder[]
  // Section 6 – Historique financier
  history: FinancialYear[]
}

const HISTORY_YEARS: string[] = ['2021', '2022', '2023', '2024', '2025e']

const SHAREHOLDER_COLORS: Record<Shareholder['type'], string> = {
  institutionnel: 'bg-blue-500',
  public:         'bg-brvm-green',
  etat:           'bg-orange-500',
  fondateur:      'bg-violet-500',
}

const SHAREHOLDER_LABELS: Record<Shareholder['type'], string> = {
  institutionnel: 'Institutionnel',
  public:         'Public',
  etat:           'État',
  fondateur:      'Fondateur',
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

function buildEmptyForm(): FondamentauxForm {
  return {
    pe_ratio: '', dividend_yield_pct: '', revenue_bn_fcfa: '',
    net_income_bn_fcfa: '', ebitda_bn_fcfa: '', net_margin_pct: '',
    free_float_pct: '', ceo: '', ceo_title: '', founded: '',
    employees: '', website: '', shares_count: '',
    activities: [], certifications: [],
    shareholders: [],
    history: HISTORY_YEARS.map(y => ({
      year: y, revenue_m_fcfa: null, net_income_m_fcfa: null,
      ebitda_m_fcfa: null, pe_ratio: null, eps_fcfa: null,
      dividend_per_share_fcfa: null,
    })),
  }
}

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
interface ToastState {
  type: 'success' | 'error'
  message: string
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AdminFondamentaux() {
  const [search,      setSearch]      = useState('')
  const [selectedId,  setSelectedId]  = useState<number | null>(null)
  const [form,        setForm]        = useState<FondamentauxForm | null>(null)
  const [savedForm,   setSavedForm]   = useState<string>('')
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState<ToastState | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [newCert,     setNewCert]     = useState('')
  const [addingAct,   setAddingAct]   = useState(false)
  const [addingCert,  setAddingCert]  = useState(false)
  const actInputRef  = useRef<HTMLInputElement>(null)
  const certInputRef = useRef<HTMLInputElement>(null)

  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [companiesWithData, setCompaniesWithData] = useState<Set<number>>(new Set())

  // Dividendes state
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [addingDividend, setAddingDividend] = useState(false)
  const [newDividend, setNewDividend] = useState({ year: '', amount: '', payment_date: '', ex_date: '' })
  const [savingDividend, setSavingDividend] = useState(false)

  // Actualités state
  const [news, setNews] = useState<NewsItem[]>([])
  const [addingNews, setAddingNews] = useState(false)
  // 'true'=positif, 'false'=négatif, 'null'=neutre (strings for select value)
  const [newNewsItem, setNewNewsItem] = useState({ date: '', headline: '', sentimentStr: 'null' })
  const [savingNews, setSavingNews] = useState(false)

  const companies = allCompanies.filter(c =>
    c.ticker.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Load company list on mount
  useEffect(() => {
    companiesApi.list()
      .then(data => setAllCompanies(data))
      .catch(() => showToast('error', "Impossible de charger la liste des sociétés"))
  }, [])

  const isDirty = form !== null && JSON.stringify(form) !== savedForm

  /* ── Show toast then auto-hide ─────────────────────────────── */
  function showToast(type: ToastState['type'], message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── Load company data ─────────────────────────────────────── */
  async function loadCompany(id: number) {
    setLoading(true)
    setSelectedId(id)
    setDividends([])
    setNews([])
    try {
      const company = allCompanies.find(c => c.id === id)
      if (!company) throw new Error('Société introuvable')

      const json = await companiesApi.getFundamentals(company.ticker)

      const data: FondamentauxForm = {
        pe_ratio:           json.pe_ratio           != null ? String(json.pe_ratio)           : '',
        dividend_yield_pct: json.dividend_yield_pct != null ? String(json.dividend_yield_pct) : '',
        revenue_bn_fcfa:    json.revenue_bn_fcfa    != null ? String(json.revenue_bn_fcfa)    : '',
        net_income_bn_fcfa: json.net_income_bn_fcfa != null ? String(json.net_income_bn_fcfa) : '',
        ebitda_bn_fcfa:     json.ebitda_bn_fcfa     != null ? String(json.ebitda_bn_fcfa)     : '',
        net_margin_pct:     json.net_margin_pct     != null ? String(json.net_margin_pct)     : '',
        free_float_pct:     json.free_float_pct     != null ? String(json.free_float_pct)     : '',
        ceo:                json.ceo      ?? '',
        ceo_title:          json.ceo_title ?? '',
        founded:            json.founded  != null ? String(json.founded)   : '',
        employees:          json.employees != null ? String(json.employees) : '',
        website:            json.website  ?? '',
        shares_count:       json.shares_count != null ? String(json.shares_count) : '',
        activities:         Array.isArray(json.activities)     ? json.activities     : [],
        certifications:     Array.isArray(json.certifications) ? json.certifications : [],
        shareholders:       Array.isArray(json.shareholders)   ? json.shareholders   : [],
        history: HISTORY_YEARS.map(y => {
          const found = (json.history ?? []).find((h: { year: number }) => String(h.year) === y.replace('e', ''))
          return found
            ? { year: y, revenue_m_fcfa: found.revenue_m_fcfa, net_income_m_fcfa: found.net_income_m_fcfa,
                ebitda_m_fcfa: found.ebitda_m_fcfa, pe_ratio: found.pe_ratio,
                eps_fcfa: found.eps_fcfa, dividend_per_share_fcfa: found.dividend_per_share_fcfa }
            : { year: y, revenue_m_fcfa: null, net_income_m_fcfa: null,
                ebitda_m_fcfa: null, pe_ratio: null, eps_fcfa: null, dividend_per_share_fcfa: null }
        }),
      }

      setForm(data)
      setSavedForm(JSON.stringify(data))
      setCompaniesWithData(prev => new Set([...prev, id]))

      // Load dividends and news from fundamentals response
      if (Array.isArray(json.dividends)) setDividends(json.dividends)
      if (Array.isArray(json.recent_news)) setNews(json.recent_news)
    } catch {
      showToast('error', 'Impossible de charger les données depuis l\'API')
      const empty = buildEmptyForm()
      setForm(empty)
      setSavedForm(JSON.stringify(empty))
    } finally {
      setLoading(false)
    }
  }

  /* ── Save ──────────────────────────────────────────────────── */
  async function handleSave() {
    if (!form || !selectedId) return
    const company = allCompanies.find(c => c.id === selectedId)
    if (!company) return

    // Validate shareholders total
    const totalPct = form.shareholders.reduce((s, sh) => s + sh.pct, 0)
    if (totalPct > 100.01) {
      showToast('error', `Total actionnaires : ${totalPct.toFixed(1)}% > 100%`)
      return
    }

    setSaving(true)
    try {
      await Promise.all([
        // Infos société
        api.put(`/admin/companies/${company.ticker}`, {
          ceo:            form.ceo,
          ceo_title:      form.ceo_title,
          founded:        form.founded        ? parseInt(form.founded)        : null,
          employees:      form.employees      ? parseInt(form.employees)      : null,
          website:        form.website,
          free_float_pct: form.free_float_pct ? parseFloat(form.free_float_pct) : null,
          activities:     form.activities,
          certifications: form.certifications,
          shares_count:   form.shares_count   ? parseInt(form.shares_count)   : null,
        }),
        // Historique financier
        api.put(`/admin/companies/${company.ticker}/financial-history`,
          form.history.map(h => ({
            year:                    parseInt(h.year.replace('e', '')),
            revenue_m_fcfa:          h.revenue_m_fcfa,
            net_income_m_fcfa:       h.net_income_m_fcfa,
            ebitda_m_fcfa:           h.ebitda_m_fcfa,
            pe_ratio:                h.pe_ratio,
            eps_fcfa:                h.eps_fcfa,
            dividend_per_share_fcfa: h.dividend_per_share_fcfa,
          }))
        ),
        // Actionnariat
        api.put(`/admin/companies/${company.ticker}/shareholders`, form.shareholders),
      ])

      setSavedForm(JSON.stringify(form))
      showToast('success', `Données de ${company.ticker} enregistrées avec succès`)
    } catch {
      showToast('error', `Erreur API – impossible de sauvegarder ${company.ticker}`)
    } finally {
      setSaving(false)
    }
  }

  /* ── Generic field updater ─────────────────────────────────── */
  function setField<K extends keyof FondamentauxForm>(key: K, value: FondamentauxForm[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : null)
  }

  /* ── Activities ────────────────────────────────────────────── */
  function addActivity() {
    const trimmed = newActivity.trim()
    if (!trimmed || !form) return
    setField('activities', [...form.activities, trimmed])
    setNewActivity('')
    setAddingAct(false)
  }

  function removeActivity(idx: number) {
    if (!form) return
    setField('activities', form.activities.filter((_, i) => i !== idx))
  }

  /* ── Certifications ────────────────────────────────────────── */
  function addCert() {
    const trimmed = newCert.trim()
    if (!trimmed || !form) return
    setField('certifications', [...form.certifications, trimmed])
    setNewCert('')
    setAddingCert(false)
  }

  function removeCert(idx: number) {
    if (!form) return
    setField('certifications', form.certifications.filter((_, i) => i !== idx))
  }

  /* ── Shareholders ──────────────────────────────────────────── */
  function addShareholder() {
    if (!form) return
    setField('shareholders', [
      ...form.shareholders,
      { name: '', pct: 0, type: 'institutionnel' as const },
    ])
  }

  function removeShareholder(idx: number) {
    if (!form) return
    setField('shareholders', form.shareholders.filter((_, i) => i !== idx))
  }

  function updateShareholder(idx: number, key: keyof Shareholder, value: string | number) {
    if (!form) return
    const updated = form.shareholders.map((sh, i) => {
      if (i !== idx) return sh
      if (key === 'pct') return { ...sh, pct: parseFloat(String(value)) || 0 }
      return { ...sh, [key]: value }
    })
    setField('shareholders', updated)
  }

  /* ── History ───────────────────────────────────────────────── */
  function updateHistory(
    yearIdx: number,
    key: keyof Omit<FinancialYear, 'year'>,
    value: string
  ) {
    if (!form) return
    const updated = form.history.map((row, i) => {
      if (i !== yearIdx) return row
      const n = value === '' ? null : parseFloat(value.replace(',', '.'))
      return { ...row, [key]: isNaN(n as number) ? null : n }
    })
    setField('history', updated)
  }

  /* ── Dividendes ────────────────────────────────────────────── */
  async function handleAddDividend() {
    const company = selectedId ? allCompanies.find(c => c.id === selectedId) : null
    if (!company) return
    if (!newDividend.year || !newDividend.amount || !newDividend.payment_date) {
      showToast('error', 'Année, montant et date de paiement sont requis')
      return
    }
    setSavingDividend(true)
    try {
      const res = await api.post(`/admin/companies/${company.ticker}/dividends`, {
        year:         parseInt(newDividend.year),
        amount_fcfa:  parseFloat(newDividend.amount),
        payment_date: newDividend.payment_date,
        ex_date:      newDividend.ex_date || null,
      })
      setDividends(prev => [...prev, res.data])
      setNewDividend({ year: '', amount: '', payment_date: '', ex_date: '' })
      setAddingDividend(false)
      showToast('success', 'Dividende ajouté')
    } catch {
      showToast('error', 'Impossible d\'ajouter le dividende')
    } finally {
      setSavingDividend(false)
    }
  }

  async function handleDeleteDividend(id: number) {
    const company = selectedId ? allCompanies.find(c => c.id === selectedId) : null
    if (!company) return
    try {
      await api.delete(`/admin/companies/${company.ticker}/dividends/${id}`)
      setDividends(prev => prev.filter(d => d.id !== id))
      showToast('success', 'Dividende supprimé')
    } catch {
      showToast('error', 'Impossible de supprimer le dividende')
    }
  }

  /* ── Actualités ────────────────────────────────────────────── */
  async function handleAddNews() {
    const company = selectedId ? allCompanies.find(c => c.id === selectedId) : null
    if (!company) return
    if (!newNewsItem.date || !newNewsItem.headline) {
      showToast('error', 'Date et titre sont requis')
      return
    }
    const positiveVal = newNewsItem.sentimentStr === 'true' ? true : newNewsItem.sentimentStr === 'false' ? false : null
    setSavingNews(true)
    try {
      const res = await api.post(`/admin/companies/${company.ticker}/news`, {
        date:     newNewsItem.date,
        headline: newNewsItem.headline,
        positive: positiveVal,
      })
      setNews(prev => [res.data, ...prev].slice(0, 10))
      setNewNewsItem({ date: '', headline: '', sentimentStr: 'null' })
      setAddingNews(false)
      showToast('success', 'Actualité ajoutée')
    } catch {
      showToast('error', 'Impossible d\'ajouter l\'actualité')
    } finally {
      setSavingNews(false)
    }
  }

  async function handleDeleteNews(id: number) {
    const company = selectedId ? allCompanies.find(c => c.id === selectedId) : null
    if (!company) return
    try {
      await api.delete(`/admin/companies/${company.ticker}/news/${id}`)
      setNews(prev => prev.filter(n => n.id !== id))
      showToast('success', 'Actualité supprimée')
    } catch {
      showToast('error', 'Impossible de supprimer l\'actualité')
    }
  }

  /* ── Focus new-item inputs when shown ──────────────────────── */
  useEffect(() => { if (addingAct  && actInputRef.current)  actInputRef.current.focus()  }, [addingAct])
  useEffect(() => { if (addingCert && certInputRef.current) certInputRef.current.focus() }, [addingCert])

  const selectedCompany = selectedId ? allCompanies.find(c => c.id === selectedId) : null
  const shareholderTotal = form ? form.shareholders.reduce((s, sh) => s + sh.pct, 0) : 0

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-full bg-brvm-bg overflow-hidden relative">

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-white border-brvm-border text-brvm-green'
            : 'bg-white border-red-200 text-brvm-red'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="text-brvm-green flex-shrink-0" />
            : <AlertCircle  size={16} className="text-brvm-red flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          LEFT COLUMN — company list
      ══════════════════════════════════════════════════════════ */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-brvm-border flex flex-col">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-brvm-border">
          <h2 className="font-bold text-brvm-text text-sm mb-3">Sociétés ({allCompanies.length})</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-1">
          {companies.map(c => {
            const active = selectedId === c.id
            const dataOk = companiesWithData.has(c.id)
            return (
              <button
                key={c.id}
                onClick={() => loadCompany(c.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                  active
                    ? 'bg-brvm-green/10 border-l-2 border-brvm-green'
                    : 'border-l-2 border-transparent hover:bg-brvm-bg'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold font-mono ${active ? 'text-brvm-green' : 'text-brvm-text'}`}>
                    {c.ticker}
                  </p>
                  <p className="text-[11px] text-brvm-subtext truncate">{c.name}</p>
                </div>
                <div
                  title={dataOk ? 'Données chargées depuis API' : 'Non chargé'}
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${dataOk ? 'bg-brvm-green' : 'bg-gray-300'}`}
                />
              </button>
            )
          })}

          {companies.length === 0 && (
            <p className="text-center text-brvm-muted text-xs py-8">Aucune société trouvée</p>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          RIGHT COLUMN — edit form
      ══════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── Empty state ────────────────────────────────────── */}
        {!selectedId && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-brvm-muted">
            <BarChart2 size={44} className="opacity-20" />
            <p className="text-sm">Sélectionnez une société pour éditer ses données fondamentales</p>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────── */}
        {selectedId && loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-brvm-muted">
            <RefreshCw size={28} className="animate-spin text-brvm-green" />
            <p className="text-sm">Chargement des données…</p>
          </div>
        )}

        {/* ── Form ───────────────────────────────────────────── */}
        {selectedId && !loading && form && (
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brvm-border bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-brvm-text">{selectedCompany?.ticker}</h1>
                    <span className="text-brvm-subtext text-sm">{selectedCompany?.name}</span>
                    {isDirty && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full border border-orange-200">
                        Modifications non sauvegardées
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brvm-muted mt-0.5">{selectedCompany?.sector}</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white text-sm font-semibold rounded-lg hover:bg-brvm-green/90 disabled:opacity-60 transition-colors"
              >
                {saving
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Save size={14} />}
                Enregistrer tout
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* ─── SECTION 1 : Métriques financières ─────────── */}
              <Section title="Métriques financières actuelles">
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { label: 'PER',                  key: 'pe_ratio',           unit: ''  },
                    { label: 'Rendement dividende',  key: 'dividend_yield_pct', unit: '%' },
                    { label: 'CA',                   key: 'revenue_bn_fcfa',    unit: 'Md FCFA' },
                    { label: 'Résultat net',         key: 'net_income_bn_fcfa', unit: 'Md FCFA' },
                    { label: 'EBITDA',               key: 'ebitda_bn_fcfa',     unit: 'Md FCFA' },
                    { label: 'Marge nette',          key: 'net_margin_pct',     unit: '%' },
                    { label: 'Flottant',             key: 'free_float_pct',     unit: '%' },
                  ] as { label: string; key: keyof FondamentauxForm; unit: string }[]).map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-brvm-subtext mb-1">
                        {f.label}{f.unit ? <span className="text-brvm-muted ml-1">({f.unit})</span> : null}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={form[f.key] as string}
                        onChange={e => setField(f.key, e.target.value as FondamentauxForm[typeof f.key])}
                        placeholder="--"
                        className="w-full px-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </Section>

              {/* ─── SECTION 2 : Informations entreprise ───────── */}
              <Section title="Informations entreprise">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-brvm-subtext mb-1">CEO</label>
                    <input
                      type="text"
                      value={form.ceo}
                      onChange={e => setField('ceo', e.target.value)}
                      placeholder="Nom du dirigeant"
                      className="w-full px-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brvm-subtext mb-1">Titre CEO</label>
                    <input
                      type="text"
                      value={form.ceo_title}
                      onChange={e => setField('ceo_title', e.target.value)}
                      placeholder="Directeur Général"
                      className="w-full px-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brvm-subtext mb-1">Année de fondation</label>
                    <input
                      type="number"
                      value={form.founded}
                      onChange={e => setField('founded', e.target.value)}
                      placeholder="ex : 1985"
                      className="w-full px-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brvm-subtext mb-1">Effectif employés</label>
                    <input
                      type="number"
                      value={form.employees}
                      onChange={e => setField('employees', e.target.value)}
                      placeholder="ex : 1200"
                      className="w-full px-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brvm-subtext mb-1">Site web</label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={e => setField('website', e.target.value)}
                      placeholder="www.exemple.ci"
                      className="w-full px-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-brvm-subtext mb-1">
                      Nombre de titres en circulation
                    </label>
                    <input
                      type="number"
                      value={form.shares_count}
                      onChange={e => setField('shares_count', e.target.value)}
                      placeholder="ex : 10000000"
                      className="w-full px-3 py-2 bg-brvm-bg border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                    />
                  </div>
                </div>
              </Section>

              {/* ─── SECTION 3 : Activités ──────────────────────── */}
              <Section title="Activités">
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.activities.map((act, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-brvm-bg border border-brvm-border rounded-full text-xs text-brvm-text"
                    >
                      {act}
                      <button
                        onClick={() => removeActivity(i)}
                        className="text-brvm-muted hover:text-brvm-red transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {form.activities.length === 0 && !addingAct && (
                    <p className="text-xs text-brvm-muted italic">Aucune activité renseignée</p>
                  )}
                </div>

                {addingAct ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={actInputRef}
                      type="text"
                      value={newActivity}
                      onChange={e => setNewActivity(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addActivity(); if (e.key === 'Escape') { setAddingAct(false); setNewActivity('') } }}
                      placeholder="Nouvelle activité…"
                      className="flex-1 px-3 py-1.5 bg-brvm-bg border border-brvm-green rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none"
                    />
                    <button onClick={addActivity} className="px-3 py-1.5 bg-brvm-green text-white text-xs font-semibold rounded-lg hover:bg-brvm-green/90 transition-colors">Ajouter</button>
                    <button onClick={() => { setAddingAct(false); setNewActivity('') }} className="px-3 py-1.5 bg-brvm-bg border border-brvm-border text-brvm-subtext text-xs rounded-lg hover:bg-gray-100 transition-colors">Annuler</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingAct(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-brvm-border rounded-lg text-xs text-brvm-muted hover:border-brvm-green hover:text-brvm-green transition-colors"
                  >
                    <Plus size={13} />
                    Ajouter une activité
                  </button>
                )}
              </Section>

              {/* ─── SECTION 4 : Certifications ─────────────────── */}
              <Section title="Certifications">
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.certifications.map((cert, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-brvm-bg border border-brvm-border rounded-full text-xs text-brvm-text"
                    >
                      {cert}
                      <button
                        onClick={() => removeCert(i)}
                        className="text-brvm-muted hover:text-brvm-red transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {form.certifications.length === 0 && !addingCert && (
                    <p className="text-xs text-brvm-muted italic">Aucune certification renseignée</p>
                  )}
                </div>

                {addingCert ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={certInputRef}
                      type="text"
                      value={newCert}
                      onChange={e => setNewCert(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addCert(); if (e.key === 'Escape') { setAddingCert(false); setNewCert('') } }}
                      placeholder="Nouvelle certification…"
                      className="flex-1 px-3 py-1.5 bg-brvm-bg border border-brvm-green rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none"
                    />
                    <button onClick={addCert} className="px-3 py-1.5 bg-brvm-green text-white text-xs font-semibold rounded-lg hover:bg-brvm-green/90 transition-colors">Ajouter</button>
                    <button onClick={() => { setAddingCert(false); setNewCert('') }} className="px-3 py-1.5 bg-brvm-bg border border-brvm-border text-brvm-subtext text-xs rounded-lg hover:bg-gray-100 transition-colors">Annuler</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCert(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-brvm-border rounded-lg text-xs text-brvm-muted hover:border-brvm-green hover:text-brvm-green transition-colors"
                  >
                    <Plus size={13} />
                    Ajouter une certification
                  </button>
                )}
              </Section>

              {/* ─── SECTION 5 : Actionnaires ───────────────────── */}
              <Section title="Actionnaires">
                {/* Total warning */}
                {shareholderTotal > 100.01 && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-brvm-red">
                    <AlertCircle size={13} />
                    Total actionnaires : {shareholderTotal.toFixed(1)}% &gt; 100%
                  </div>
                )}

                {form.shareholders.length > 0 && (
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-brvm-muted border-b border-brvm-border">
                          <th className="pb-2 pr-4 font-medium">Nom</th>
                          <th className="pb-2 pr-4 font-medium w-24">% Capital</th>
                          <th className="pb-2 pr-4 font-medium w-36">Type</th>
                          <th className="pb-2 font-medium w-32">Part</th>
                          <th className="pb-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.shareholders.map((sh, i) => (
                          <tr key={i} className="border-b border-brvm-border/50">
                            <td className="py-2 pr-4">
                              <input
                                type="text"
                                value={sh.name}
                                onChange={e => updateShareholder(i, 'name', e.target.value)}
                                placeholder="Nom actionnaire"
                                className="w-full px-2 py-1.5 bg-brvm-bg border border-brvm-border rounded text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={sh.pct || ''}
                                onChange={e => updateShareholder(i, 'pct', e.target.value)}
                                placeholder="0"
                                className="w-full px-2 py-1.5 bg-brvm-bg border border-brvm-border rounded text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <div className="relative">
                                <select
                                  value={sh.type}
                                  onChange={e => updateShareholder(i, 'type', e.target.value as Shareholder['type'])}
                                  className="w-full appearance-none px-2 py-1.5 bg-brvm-bg border border-brvm-border rounded text-sm text-brvm-text focus:outline-none focus:border-brvm-green transition-colors pr-7"
                                >
                                  <option value="institutionnel">Institutionnel</option>
                                  <option value="public">Public</option>
                                  <option value="etat">État</option>
                                  <option value="fondateur">Fondateur</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brvm-muted pointer-events-none" />
                              </div>
                            </td>
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-brvm-bg rounded-full overflow-hidden border border-brvm-border">
                                  <div
                                    className={`h-full rounded-full transition-all ${SHAREHOLDER_COLORS[sh.type]}`}
                                    style={{ width: `${Math.min(sh.pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-brvm-muted w-10 text-right tabular-nums">
                                  {sh.pct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-center">
                              <button
                                onClick={() => removeShareholder(i)}
                                className="text-brvm-muted hover:text-brvm-red transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Legend */}
                {form.shareholders.length > 0 && (
                  <div className="flex items-center gap-4 mb-3">
                    {(Object.entries(SHAREHOLDER_LABELS) as [Shareholder['type'], string][]).map(([type, label]) => (
                      <div key={type} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${SHAREHOLDER_COLORS[type]}`} />
                        <span className="text-xs text-brvm-muted">{label}</span>
                      </div>
                    ))}
                    <span className={`ml-auto text-xs font-semibold ${shareholderTotal > 100.01 ? 'text-brvm-red' : 'text-brvm-subtext'}`}>
                      Total : {shareholderTotal.toFixed(1)}%
                    </span>
                  </div>
                )}

                <button
                  onClick={addShareholder}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-brvm-border rounded-lg text-xs text-brvm-muted hover:border-brvm-green hover:text-brvm-green transition-colors"
                >
                  <Plus size={13} />
                  Ajouter actionnaire
                </button>
              </Section>

              {/* ─── SECTION 6 : Historique financier ──────────── */}
              <Section title="Historique financier (5 ans)">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-brvm-muted border-b border-brvm-border">
                        <th className="pb-2 pr-3 font-medium w-16">Année</th>
                        <th className="pb-2 pr-3 font-medium">CA (M FCFA)</th>
                        <th className="pb-2 pr-3 font-medium">Résultat net (M FCFA)</th>
                        <th className="pb-2 pr-3 font-medium">EBITDA (M FCFA)</th>
                        <th className="pb-2 pr-3 font-medium w-20">PER</th>
                        <th className="pb-2 pr-3 font-medium">BPA (FCFA)</th>
                        <th className="pb-2 font-medium">Dividende/action (FCFA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.history.map((row, i) => (
                        <tr key={row.year} className={`border-b border-brvm-border/40 ${i % 2 === 1 ? 'bg-brvm-bg/50' : ''}`}>
                          <td className="py-2 pr-3">
                            <span className={`text-xs font-semibold font-mono ${row.year.endsWith('e') ? 'text-brvm-green' : 'text-brvm-text'}`}>
                              {row.year}
                            </span>
                          </td>
                          {([
                            'revenue_m_fcfa',
                            'net_income_m_fcfa',
                            'ebitda_m_fcfa',
                            'pe_ratio',
                            'eps_fcfa',
                            'dividend_per_share_fcfa',
                          ] as (keyof Omit<FinancialYear, 'year'>)[]).map(key => (
                            <td key={key} className="py-1.5 pr-3">
                              <input
                                type="number"
                                step="any"
                                value={row[key] ?? ''}
                                onChange={e => updateHistory(i, key, e.target.value)}
                                placeholder="--"
                                className="w-full px-2 py-1.5 bg-brvm-bg border border-brvm-border rounded text-sm text-brvm-text placeholder:text-brvm-muted/60 focus:outline-none focus:border-brvm-green transition-colors tabular-nums"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* ─── SECTION 7 : Dividendes ─────────────────────── */}
              <Section title="Dividendes">
                {dividends.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-brvm-muted border-b border-brvm-border">
                          <th className="pb-2 pr-4 font-medium w-20">Année</th>
                          <th className="pb-2 pr-4 font-medium">Montant (FCFA)</th>
                          <th className="pb-2 pr-4 font-medium">Date de paiement</th>
                          <th className="pb-2 pr-4 font-medium">Date ex-dividende</th>
                          <th className="pb-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dividends.map(d => (
                          <tr key={d.id} className="border-b border-brvm-border/40">
                            <td className="py-2 pr-4">
                              <span className="text-xs font-semibold font-mono text-brvm-text">{d.year}</span>
                            </td>
                            <td className="py-2 pr-4 tabular-nums text-brvm-text text-sm">
                              {d.amount_fcfa.toLocaleString('fr-FR')}
                            </td>
                            <td className="py-2 pr-4 text-brvm-subtext text-xs">{d.payment_date}</td>
                            <td className="py-2 pr-4 text-brvm-subtext text-xs">{d.ex_date ?? '—'}</td>
                            <td className="py-2 text-center">
                              <button
                                onClick={() => handleDeleteDividend(d.id)}
                                className="text-brvm-muted hover:text-brvm-red transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {dividends.length === 0 && !addingDividend && (
                  <p className="text-xs text-brvm-muted italic mb-3">Aucun dividende enregistré</p>
                )}

                {addingDividend ? (
                  <div className="bg-brvm-bg border border-brvm-border rounded-lg p-4 mb-3">
                    <p className="text-xs font-semibold text-brvm-text mb-3">Nouveau dividende</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-brvm-subtext mb-1">Année *</label>
                        <input
                          type="number"
                          value={newDividend.year}
                          onChange={e => setNewDividend(p => ({ ...p, year: e.target.value }))}
                          placeholder="2024"
                          className="w-full px-3 py-2 bg-white border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brvm-subtext mb-1">Montant FCFA *</label>
                        <input
                          type="number"
                          step="any"
                          value={newDividend.amount}
                          onChange={e => setNewDividend(p => ({ ...p, amount: e.target.value }))}
                          placeholder="500"
                          className="w-full px-3 py-2 bg-white border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brvm-subtext mb-1">Date de paiement *</label>
                        <input
                          type="date"
                          value={newDividend.payment_date}
                          onChange={e => setNewDividend(p => ({ ...p, payment_date: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-brvm-border rounded-lg text-sm text-brvm-text focus:outline-none focus:border-brvm-green transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brvm-subtext mb-1">Date ex-dividende (optionnel)</label>
                        <input
                          type="date"
                          value={newDividend.ex_date}
                          onChange={e => setNewDividend(p => ({ ...p, ex_date: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-brvm-border rounded-lg text-sm text-brvm-text focus:outline-none focus:border-brvm-green transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddDividend}
                        disabled={savingDividend}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brvm-green text-white text-xs font-semibold rounded-lg hover:bg-brvm-green/90 disabled:opacity-60 transition-colors"
                      >
                        {savingDividend ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                        Enregistrer
                      </button>
                      <button
                        onClick={() => { setAddingDividend(false); setNewDividend({ year: '', amount: '', payment_date: '', ex_date: '' }) }}
                        className="px-3 py-1.5 bg-white border border-brvm-border text-brvm-subtext text-xs rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingDividend(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-brvm-border rounded-lg text-xs text-brvm-muted hover:border-brvm-green hover:text-brvm-green transition-colors"
                  >
                    <Plus size={13} />
                    Ajouter un dividende
                  </button>
                )}
              </Section>

              {/* ─── SECTION 8 : Actualités ─────────────────────── */}
              <Section title="Actualités récentes">
                {news.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {news.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 px-3 py-2.5 bg-brvm-bg border border-brvm-border rounded-lg"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            item.positive === true  ? 'bg-brvm-green' :
                            item.positive === false ? 'bg-brvm-red' :
                            'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-brvm-muted mb-0.5">{item.date}</p>
                          <p className="text-sm text-brvm-text leading-snug">{item.headline}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNews(item.id)}
                          className="flex-shrink-0 text-brvm-muted hover:text-brvm-red transition-colors mt-0.5"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {news.length === 0 && !addingNews && (
                  <p className="text-xs text-brvm-muted italic mb-3">Aucune actualité enregistrée</p>
                )}

                {addingNews ? (
                  <div className="bg-brvm-bg border border-brvm-border rounded-lg p-4 mb-3">
                    <p className="text-xs font-semibold text-brvm-text mb-3">Nouvelle actualité</p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-brvm-subtext mb-1">Date *</label>
                        <input
                          type="date"
                          value={newNewsItem.date}
                          onChange={e => setNewNewsItem(p => ({ ...p, date: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-brvm-border rounded-lg text-sm text-brvm-text focus:outline-none focus:border-brvm-green transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brvm-subtext mb-1">Sentiment</label>
                        <div className="relative">
                          <select
                            value={newNewsItem.sentimentStr}
                            onChange={e => setNewNewsItem(p => ({ ...p, sentimentStr: e.target.value }))}
                            className="w-full appearance-none px-3 py-2 bg-white border border-brvm-border rounded-lg text-sm text-brvm-text focus:outline-none focus:border-brvm-green transition-colors pr-8"
                          >
                            <option value="true">Positif</option>
                            <option value="null">Neutre</option>
                            <option value="false">Négatif</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brvm-muted pointer-events-none" />
                        </div>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-brvm-subtext mb-1">Titre / Headline *</label>
                        <input
                          type="text"
                          value={newNewsItem.headline}
                          onChange={e => setNewNewsItem(p => ({ ...p, headline: e.target.value }))}
                          placeholder="Ex : Résultats annuels en hausse de 12%..."
                          className="w-full px-3 py-2 bg-white border border-brvm-border rounded-lg text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddNews}
                        disabled={savingNews}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brvm-green text-white text-xs font-semibold rounded-lg hover:bg-brvm-green/90 disabled:opacity-60 transition-colors"
                      >
                        {savingNews ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                        Enregistrer
                      </button>
                      <button
                        onClick={() => { setAddingNews(false); setNewNewsItem({ date: '', headline: '', sentimentStr: 'null' }) }}
                        className="px-3 py-1.5 bg-white border border-brvm-border text-brvm-subtext text-xs rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingNews(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-brvm-border rounded-lg text-xs text-brvm-muted hover:border-brvm-green hover:text-brvm-green transition-colors"
                  >
                    <Plus size={13} />
                    Ajouter une actualité
                  </button>
                )}
              </Section>

            </div>
          </>
        )}
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SECTION WRAPPER
══════════════════════════════════════════════════════════════ */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="bg-white border border-brvm-border rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-brvm-border hover:bg-brvm-bg/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pencil size={13} className="text-brvm-muted" />
          <h3 className="text-sm font-semibold text-brvm-text">{title}</h3>
        </div>
        <ChevronDown
          size={15}
          className={`text-brvm-muted transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
        />
      </button>
      {!collapsed && <div className="p-5">{children}</div>}
    </div>
  )
}
