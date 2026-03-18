import { useState, useEffect, useCallback } from 'react'
import {
  Search, Pencil, RefreshCw, X, Check,
  Building2, Filter, ChevronDown, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { companiesApi } from '../api/companies.api'
import api from '../api/axios'
import type { Company } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

interface CompanyExtras {
  pe_ratio: number | null
  dividend_yield: number | null
  revenue_bn_fcfa: number | null
  employees: number | null
  founded: number | null
  website: string | null
}

const SECTORS = [
  'Consommation de Base',
  'Energie',
  'Services Financiers',
  'Télécommunications',
  'Consommation Discrétionnaire',
  'Industriels',
  'Services Publics',
]

const getCompartiment = (id: number): 'Prestige' | 'Principal' =>
  id <= 12 ? 'Prestige' : 'Principal'

const formatMd = (cap: number | null): string => {
  if (cap === null) return '—'
  const md = cap / 1_000_000_000
  if (md >= 1000) return `${(md / 1000).toFixed(1)} Md FCFA`
  return `${md.toFixed(0)} Md FCFA`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditFormData {
  name: string
  sector: string
  country: string
  description: string
  market_cap: number | ''
  pe_ratio: number | ''
  dividend_yield: number | ''
  revenue_bn_fcfa: number | ''
  employees: number | ''
  founded: number | ''
  website: string
}

interface Toast {
  id: number
  type: 'success' | 'error'
  message: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSocietes() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [extrasMap, setExtrasMap] = useState<Record<number, CompanyExtras>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCompartiment, setFilterCompartiment] = useState('')
  const [sectorOpen, setSectorOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const [compartimentOpen, setCompartimentOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState<EditFormData | null>(null)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [toastCounter, setToastCounter] = useState(0)

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const allCountries = Array.from(
    new Set(companies.map(c => c.country).filter(Boolean) as string[])
  ).sort()

  // ─── Fetch from API ──────────────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await companiesApi.list()
      setCompanies(data)
    } catch {
      setError("Impossible de charger les sociétés. Vérifiez la connexion à l'API.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // ─── Toast helpers ───────────────────────────────────────────────────────────
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = toastCounter + 1
    setToastCounter(id)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  // ─── Filtering ───────────────────────────────────────────────────────────────
  const filtered = companies.filter(c => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.ticker.toLowerCase().includes(q)
    const matchSector = !filterSector || c.sector === filterSector
    const matchCountry = !filterCountry || c.country === filterCountry
    const matchComp =
      !filterCompartiment ||
      getCompartiment(c.id) === filterCompartiment
    return matchSearch && matchSector && matchCountry && matchComp
  })

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const sectorCounts = companies.reduce<Record<string, number>>((acc, c) => {
    if (c.sector) acc[c.sector] = (acc[c.sector] ?? 0) + 1
    return acc
  }, {})
  const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // ─── Open edit modal ─────────────────────────────────────────────────────────
  const openEdit = (company: Company) => {
    const extras = extrasMap[company.id] ?? {
      pe_ratio: null, dividend_yield: null, revenue_bn_fcfa: null,
      employees: null, founded: null, website: null,
    }
    setEditCompany(company)
    setFormData({
      name: company.name,
      sector: company.sector ?? '',
      country: company.country ?? '',
      description: company.description ?? '',
      market_cap: company.market_cap ?? '',
      pe_ratio: extras.pe_ratio ?? '',
      dividend_yield: extras.dividend_yield ?? '',
      revenue_bn_fcfa: extras.revenue_bn_fcfa ?? '',
      employees: extras.employees ?? '',
      founded: extras.founded ?? '',
      website: extras.website ?? '',
    })
  }

  const closeEdit = () => {
    setEditCompany(null)
    setFormData(null)
  }

  // ─── Save (PUT /api/companies/:id) ───────────────────────────────────────────
  const handleSave = async () => {
    if (!editCompany || !formData) return
    setSaving(true)
    const payload = {
      name: formData.name,
      sector: formData.sector || null,
      country: formData.country || null,
      description: formData.description || null,
      market_cap: formData.market_cap === '' ? null : Number(formData.market_cap),
      pe_ratio: formData.pe_ratio === '' ? null : Number(formData.pe_ratio),
      dividend_yield: formData.dividend_yield === '' ? null : Number(formData.dividend_yield),
      revenue_bn_fcfa: formData.revenue_bn_fcfa === '' ? null : Number(formData.revenue_bn_fcfa),
      employees: formData.employees === '' ? null : Number(formData.employees),
      founded: formData.founded === '' ? null : Number(formData.founded),
      website: formData.website || null,
    }

    try {
      await api.put(`/companies/${editCompany.id}`, payload)
      addToast('success', `${formData.name} mis à jour avec succès`)
    } catch {
      addToast('error', 'Erreur API – impossible de sauvegarder les modifications')
      setSaving(false)
      return
    }

    // Always update local state for immediate UX feedback
    setCompanies(prev =>
      prev.map(c =>
        c.id === editCompany.id
          ? {
              ...c,
              name: payload.name,
              sector: payload.sector,
              country: payload.country,
              description: payload.description,
              market_cap: payload.market_cap,
            }
          : c
      )
    )
    setExtrasMap(prev => ({
      ...prev,
      [editCompany.id]: {
        pe_ratio: payload.pe_ratio,
        dividend_yield: payload.dividend_yield,
        revenue_bn_fcfa: payload.revenue_bn_fcfa,
        employees: payload.employees,
        founded: payload.founded,
        website: payload.website,
      },
    }))

    setSaving(false)
    closeEdit()
  }

  // ─── Numeric input helper ────────────────────────────────────────────────────
  const numField = (
    key: keyof EditFormData,
    label: string,
    step = 1
  ) => (
    <div>
      <label className="block text-xs font-medium text-brvm-subtext mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={formData![key] as number | ''}
        onChange={e =>
          setFormData(prev =>
            prev
              ? { ...prev, [key]: e.target.value === '' ? '' : Number(e.target.value) }
              : prev
          )
        }
        className="w-full px-3 py-2 text-sm border border-brvm-border rounded-lg bg-white text-brvm-text
                   focus:outline-none focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-brvm-bg p-4 md:p-6">

      {/* ── Stats Row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total sociétés', value: String(companies.length || '—'), icon: Building2, color: 'text-brvm-green' },
          { label: 'Compartiment Prestige', value: String(companies.filter(c => c.id <= 12).length || '—'), icon: Building2, color: 'text-purple-600' },
          { label: 'Compartiment Principal', value: String(companies.filter(c => c.id > 12).length || '—'), icon: Building2, color: 'text-slate-600' },
          { label: 'Secteur dominant', value: topSector, icon: Filter, color: 'text-brvm-green', small: true },
        ].map(({ label, value, icon: Icon, color, small }) => (
          <div key={label} className="bg-brvm-card border border-brvm-border rounded-xl p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-brvm-bg ${color}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-brvm-muted mb-0.5">{label}</p>
              <p className={`font-bold text-brvm-text leading-tight ${small ? 'text-xs' : 'text-lg'}`}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── API Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-brvm-red text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Header & Filters ───────────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl mb-4">
        <div className="p-4 border-b border-brvm-border flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-brvm-text">Gestion des Sociétés</h1>
            <p className="text-xs text-brvm-subtext">47 valeurs BRVM</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-brvm-green/10 text-brvm-green text-xs font-semibold rounded-full border border-brvm-green/20">
              {filtered.length} société{filtered.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-brvm-border
                         rounded-lg text-brvm-subtext hover:text-brvm-text hover:bg-brvm-bg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
            <input
              type="text"
              placeholder="Rechercher par nom ou ticker…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-brvm-border rounded-lg bg-white
                         text-brvm-text placeholder:text-brvm-muted focus:outline-none
                         focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green"
            />
          </div>

          {/* Sector dropdown */}
          <div className="relative">
            <button
              onClick={() => { setSectorOpen(o => !o); setCountryOpen(false); setCompartimentOpen(false) }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-brvm-border rounded-lg
                         bg-white text-brvm-subtext hover:text-brvm-text hover:bg-brvm-bg transition-colors min-w-[150px]"
            >
              <Filter size={13} />
              <span className="flex-1 text-left truncate">{filterSector || 'Secteur'}</span>
              <ChevronDown size={13} />
            </button>
            {sectorOpen && (
              <div className="absolute z-20 top-full mt-1 left-0 w-56 bg-white border border-brvm-border
                              rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setFilterSector(''); setSectorOpen(false) }}
                  className="w-full px-3 py-2 text-sm text-left text-brvm-subtext hover:bg-brvm-bg"
                >
                  Tous les secteurs
                </button>
                {SECTORS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setFilterSector(s); setSectorOpen(false) }}
                    className={`w-full px-3 py-2 text-sm text-left transition-colors hover:bg-brvm-bg
                      ${filterSector === s ? 'text-brvm-green font-medium' : 'text-brvm-text'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Country dropdown */}
          <div className="relative">
            <button
              onClick={() => { setCountryOpen(o => !o); setSectorOpen(false); setCompartimentOpen(false) }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-brvm-border rounded-lg
                         bg-white text-brvm-subtext hover:text-brvm-text hover:bg-brvm-bg transition-colors min-w-[140px]"
            >
              <span className="flex-1 text-left truncate">{filterCountry || 'Pays'}</span>
              <ChevronDown size={13} />
            </button>
            {countryOpen && (
              <div className="absolute z-20 top-full mt-1 left-0 w-48 bg-white border border-brvm-border
                              rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setFilterCountry(''); setCountryOpen(false) }}
                  className="w-full px-3 py-2 text-sm text-left text-brvm-subtext hover:bg-brvm-bg"
                >
                  Tous les pays
                </button>
                {allCountries.map(c => (
                  <button
                    key={c}
                    onClick={() => { setFilterCountry(c); setCountryOpen(false) }}
                    className={`w-full px-3 py-2 text-sm text-left transition-colors hover:bg-brvm-bg
                      ${filterCountry === c ? 'text-brvm-green font-medium' : 'text-brvm-text'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compartiment dropdown */}
          <div className="relative">
            <button
              onClick={() => { setCompartimentOpen(o => !o); setSectorOpen(false); setCountryOpen(false) }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-brvm-border rounded-lg
                         bg-white text-brvm-subtext hover:text-brvm-text hover:bg-brvm-bg transition-colors min-w-[140px]"
            >
              <span className="flex-1 text-left truncate">{filterCompartiment || 'Compartiment'}</span>
              <ChevronDown size={13} />
            </button>
            {compartimentOpen && (
              <div className="absolute z-20 top-full mt-1 left-0 w-44 bg-white border border-brvm-border
                              rounded-lg shadow-lg py-1">
                <button
                  onClick={() => { setFilterCompartiment(''); setCompartimentOpen(false) }}
                  className="w-full px-3 py-2 text-sm text-left text-brvm-subtext hover:bg-brvm-bg"
                >
                  Tous
                </button>
                {(['Prestige', 'Principal'] as const).map(comp => (
                  <button
                    key={comp}
                    onClick={() => { setFilterCompartiment(comp); setCompartimentOpen(false) }}
                    className={`w-full px-3 py-2 text-sm text-left transition-colors hover:bg-brvm-bg
                      ${filterCompartiment === comp ? 'text-brvm-green font-medium' : 'text-brvm-text'}`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-brvm-border">
                {['#', 'Ticker', 'Société', 'Secteur', 'Pays', 'Compartiment', 'Capitalisation', 'PER', 'Rdt div.', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-brvm-muted font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((company, idx) => {
                const extras = extrasMap[company.id]
                const comp = getCompartiment(company.id)
                return (
                  <tr
                    key={company.id}
                    className="border-b border-brvm-border hover:bg-brvm-green/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-brvm-muted text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-brvm-green text-xs">{company.ticker}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-brvm-text whitespace-nowrap">{company.name}</span>
                    </td>
                    <td className="px-4 py-3 text-brvm-subtext whitespace-nowrap">
                      {company.sector ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-brvm-subtext whitespace-nowrap">
                      {company.country ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap
                          ${comp === 'Prestige'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                      >
                        {comp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brvm-subtext whitespace-nowrap text-xs">
                      {formatMd(company.market_cap)}
                    </td>
                    <td className="px-4 py-3 text-brvm-subtext whitespace-nowrap text-xs">
                      {extras?.pe_ratio != null ? extras.pe_ratio.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-3 text-brvm-subtext whitespace-nowrap text-xs">
                      {extras?.dividend_yield != null ? `${extras.dividend_yield.toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(company)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-brvm-green
                                   border border-brvm-green/30 rounded-lg hover:bg-brvm-green hover:text-white
                                   transition-colors"
                      >
                        <Pencil size={11} />
                        Éditer
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-brvm-muted text-sm">
                    Aucune société ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit slide-in panel ────────────────────────────────────────────────── */}
      {editCompany && formData && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
            onClick={closeEdit}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-40 shadow-2xl
                          flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brvm-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-brvm-green bg-brvm-green/10 px-2.5 py-1 rounded-lg text-sm">
                  {editCompany.ticker}
                </span>
                <div>
                  <p className="text-sm font-semibold text-brvm-text leading-tight">{editCompany.name}</p>
                  <p className="text-xs text-brvm-muted">
                    {getCompartiment(editCompany.id)} · ID {editCompany.id}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEdit}
                className="p-2 rounded-lg hover:bg-brvm-bg transition-colors text-brvm-muted hover:text-brvm-text"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Nom */}
              <div>
                <label className="block text-xs font-medium text-brvm-subtext mb-1">Nom de la société</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  className="w-full px-3 py-2 text-sm border border-brvm-border rounded-lg bg-white text-brvm-text
                             focus:outline-none focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green"
                />
              </div>

              {/* Secteur */}
              <div>
                <label className="block text-xs font-medium text-brvm-subtext mb-1">Secteur</label>
                <select
                  value={formData.sector}
                  onChange={e => setFormData(prev => prev ? { ...prev, sector: e.target.value } : prev)}
                  className="w-full px-3 py-2 text-sm border border-brvm-border rounded-lg bg-white text-brvm-text
                             focus:outline-none focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green"
                >
                  <option value="">— Sélectionner —</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Pays */}
              <div>
                <label className="block text-xs font-medium text-brvm-subtext mb-1">Pays</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => setFormData(prev => prev ? { ...prev, country: e.target.value } : prev)}
                  className="w-full px-3 py-2 text-sm border border-brvm-border rounded-lg bg-white text-brvm-text
                             focus:outline-none focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-brvm-subtext mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  className="w-full px-3 py-2 text-sm border border-brvm-border rounded-lg bg-white text-brvm-text
                             focus:outline-none focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green resize-none"
                />
              </div>

              {/* Financial fields – 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-brvm-subtext mb-1">Capitalisation (FCFA)</label>
                  <input
                    type="number"
                    step={1_000_000_000}
                    value={formData.market_cap}
                    onChange={e =>
                      setFormData(prev =>
                        prev ? { ...prev, market_cap: e.target.value === '' ? '' : Number(e.target.value) } : prev
                      )
                    }
                    className="w-full px-3 py-2 text-sm border border-brvm-border rounded-lg bg-white text-brvm-text
                               focus:outline-none focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green"
                  />
                </div>
                {numField('pe_ratio', 'PER', 0.01)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {numField('dividend_yield', 'Rendement div. (%)', 0.01)}
                {numField('revenue_bn_fcfa', 'Chiffre d\'affaires (Md FCFA)', 0.1)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {numField('employees', 'Employés')}
                {numField('founded', 'Fondée en')}
              </div>

              {/* Site web */}
              <div>
                <label className="block text-xs font-medium text-brvm-subtext mb-1">Site web</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={e => setFormData(prev => prev ? { ...prev, website: e.target.value } : prev)}
                  placeholder="www.example.com"
                  className="w-full px-3 py-2 text-sm border border-brvm-border rounded-lg bg-white text-brvm-text
                             focus:outline-none focus:ring-2 focus:ring-brvm-green/30 focus:border-brvm-green"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brvm-border flex-shrink-0">
              <button
                onClick={closeEdit}
                className="px-4 py-2 text-sm font-medium text-brvm-subtext border border-brvm-border
                           rounded-lg hover:bg-brvm-bg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                           bg-brvm-green rounded-lg hover:bg-brvm-green/90 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Toast notifications ────────────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                        border pointer-events-auto transition-all duration-300 min-w-[260px]
                        ${toast.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                        }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-inherit opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
