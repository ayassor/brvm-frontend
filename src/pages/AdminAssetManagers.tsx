import { useState, useEffect, useCallback } from 'react'
import {
  Search, Pencil, Trash2, Plus, X, Check,
  RefreshCw, AlertCircle, CheckCircle2, ChevronDown, Globe, Phone,
} from 'lucide-react'
import { assetManagersApi, SGIData, SGOFlat, FundData } from '../api/assetManagers.api'

// ─── Types internes ───────────────────────────────────────────────────────────

interface Toast { id: number; type: 'success' | 'error'; message: string }

type TabId = 'sgi' | 'sgo' | 'funds'

const UEMOA_COUNTRIES = [
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'SN', name: 'Sénégal' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'ML', name: 'Mali' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'TG', name: 'Togo' },
  { code: 'NE', name: 'Niger' },
  { code: 'GW', name: 'Guinée-Bissau' },
]

const FUND_CATEGORIES = ['A', 'D', 'OMLT', 'OCT', 'M', 'O', 'OATC', 'OPCR']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FlagImg({ code, country }: { code: string; country: string }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
      width={20} height={14} alt={country}
      className="rounded-sm object-cover flex-shrink-0"
      style={{ width: '20px', height: '14px' }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

// ─── Modal générique ──────────────────────────────────────────────────────────

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode }
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#132030] border border-white/10 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmProps { message: string; onConfirm: () => void; onCancel: () => void }
function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#132030] border border-white/10 rounded-xl w-full max-w-sm mx-4 p-6">
        <p className="text-white mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastList({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm shadow-lg ${
          t.type === 'success' ? 'bg-green-900/90 border border-green-700 text-green-100' : 'bg-red-900/90 border border-red-700 text-red-100'
        }`}>
          {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}

// ─── Input Field ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; placeholder?: string; type?: string
}
function Field({ label, value, onChange, required, placeholder, type = 'text' }: FieldProps) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0d1b2a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brvm-green transition-colors"
      />
    </div>
  )
}

interface SelectFieldProps {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; required?: boolean
}
function SelectField({ label, value, onChange, options, required }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-[#0d1b2a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brvm-green transition-colors appearance-none"
        >
          <option value="">— Sélectionner —</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

// ─── SGI Tab ──────────────────────────────────────────────────────────────────

function SGITab() {
  const [sgis, setSgis] = useState<SGIData[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SGIData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SGIData | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = (): Omit<SGIData, 'id'> => ({
    name: '', country: '', country_code: '', phone: null,
    website: null, min_deposit: null, opening_fees: null,
  })
  const [form, setForm] = useState<Omit<SGIData, 'id'>>(emptyForm())

  const toast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await assetManagersApi.getSGIs()
      setSgis(data)
    } catch { toast('error', 'Erreur lors du chargement des SGI.') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditTarget(null); setForm(emptyForm()); setModalOpen(true) }
  const openEdit = (sgi: SGIData) => {
    setEditTarget(sgi)
    setForm({ name: sgi.name, country: sgi.country, country_code: sgi.country_code,
      phone: sgi.phone, website: sgi.website, min_deposit: sgi.min_deposit, opening_fees: sgi.opening_fees })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.country || !form.country_code) {
      toast('error', 'Nom, pays et code pays sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await assetManagersApi.updateSGI(editTarget.id, form)
        setSgis(p => p.map(s => s.id === editTarget.id ? updated : s))
        toast('success', 'SGI modifié.')
      } else {
        const created = await assetManagersApi.createSGI(form)
        setSgis(p => [...p, created])
        toast('success', 'SGI créé.')
      }
      setModalOpen(false)
    } catch { toast('error', 'Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await assetManagersApi.deleteSGI(deleteTarget.id)
      setSgis(p => p.filter(s => s.id !== deleteTarget.id))
      toast('success', 'SGI supprimé.')
    } catch { toast('error', 'Erreur lors de la suppression.') }
    finally { setDeleteTarget(null) }
  }

  const f = (v: string | null) => v || '—'
  const filtered = sgis.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <ToastList toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher SGI…"
            className="w-full bg-[#0d1b2a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brvm-green"
          />
        </div>
        <button onClick={load} className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brvm-green hover:bg-brvm-green/80 text-white text-sm rounded-lg transition-colors">
          <Plus size={14} /> Ajouter SGI
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
              <th className="text-left py-3 px-3">Nom</th>
              <th className="text-left py-3 px-3">Pays</th>
              <th className="text-left py-3 px-3">Téléphone</th>
              <th className="text-left py-3 px-3">Dépôt min.</th>
              <th className="text-left py-3 px-3">Site web</th>
              <th className="text-right py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sgi => (
              <tr key={sgi.id} className="border-b border-white/10/50 hover:bg-white/5 transition-colors">
                <td className="py-3 px-3 text-white font-medium">{sgi.name}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <FlagImg code={sgi.country_code} country={sgi.country} />
                    <span className="text-slate-400">{sgi.country}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-400">{f(sgi.phone)}</td>
                <td className="py-3 px-3 text-slate-400">{f(sgi.min_deposit)}</td>
                <td className="py-3 px-3">
                  {sgi.website
                    ? <a href={sgi.website} target="_blank" rel="noopener noreferrer" className="text-brvm-green hover:underline flex items-center gap-1"><Globe size={12} />{sgi.website}</a>
                    : <span className="text-slate-400">—</span>}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(sgi)} className="p-1.5 text-slate-400 hover:text-brvm-green transition-colors" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(sgi)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Aucune SGI trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">{filtered.length} SGI</p>

      {/* Modal création/édition */}
      {modalOpen && (
        <Modal title={editTarget ? 'Modifier SGI' : 'Ajouter SGI'} onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Nom" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required placeholder="Ex: CORIS BOURSE" />
            <SelectField label="Pays" value={form.country_code} required
              onChange={v => {
                const c = UEMOA_COUNTRIES.find(x => x.code === v)
                setForm(p => ({ ...p, country_code: v, country: c?.name || p.country }))
              }}
              options={UEMOA_COUNTRIES.map(c => ({ value: c.code, label: c.name }))}
            />
            <Field label="Téléphone" value={form.phone || ''} onChange={v => setForm(p => ({ ...p, phone: v || null }))} placeholder="+225 XX XX XX XX XX" />
            <Field label="Site web" value={form.website || ''} onChange={v => setForm(p => ({ ...p, website: v || null }))} placeholder="https://..." />
            <Field label="Dépôt minimum" value={form.min_deposit || ''} onChange={v => setForm(p => ({ ...p, min_deposit: v || null }))} placeholder="Ex: 50 000 FCFA" />
            <Field label="Frais d'ouverture" value={form.opening_fees || ''} onChange={v => setForm(p => ({ ...p, opening_fees: v || null }))} placeholder="Ex: Gratuit" />
          </div>
          <div className="flex gap-3 justify-end mt-5">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-brvm-green hover:bg-brvm-green/80 disabled:opacity-50 text-white rounded-lg transition-colors">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {editTarget ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Supprimer « ${deleteTarget.name} » ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ─── SGO Tab ──────────────────────────────────────────────────────────────────

function SGOTab() {
  const [sgos, setSgos] = useState<SGOFlat[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SGOFlat | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SGOFlat | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = (): Omit<SGOFlat, 'id'> => ({
    name: '', country: '', country_code: '', address: null,
    phone: null, email: null, website: null, partner_sgi: null,
  })
  const [form, setForm] = useState<Omit<SGOFlat, 'id'>>(emptyForm())

  const toast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // getSGOs returns SGOData with funds; we cast to SGOFlat
      const data = await assetManagersApi.getSGOs()
      setSgos(data.map(({ id, name, country, country_code, address, phone, email, website, partner_sgi }) =>
        ({ id, name, country, country_code, address, phone, email, website, partner_sgi })
      ))
    } catch { toast('error', 'Erreur lors du chargement des SGO.') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditTarget(null); setForm(emptyForm()); setModalOpen(true) }
  const openEdit = (sgo: SGOFlat) => {
    setEditTarget(sgo)
    setForm({ name: sgo.name, country: sgo.country, country_code: sgo.country_code,
      address: sgo.address, phone: sgo.phone, email: sgo.email,
      website: sgo.website, partner_sgi: sgo.partner_sgi })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.country || !form.country_code) {
      toast('error', 'Nom, pays et code pays sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await assetManagersApi.updateSGO(editTarget.id, form)
        setSgos(p => p.map(s => s.id === editTarget.id ? updated : s))
        toast('success', 'SGO modifié.')
      } else {
        const created = await assetManagersApi.createSGO(form)
        setSgos(p => [...p, created])
        toast('success', 'SGO créé.')
      }
      setModalOpen(false)
    } catch { toast('error', 'Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await assetManagersApi.deleteSGO(deleteTarget.id)
      setSgos(p => p.filter(s => s.id !== deleteTarget.id))
      toast('success', 'SGO supprimé.')
    } catch { toast('error', 'Erreur lors de la suppression.') }
    finally { setDeleteTarget(null) }
  }

  const f = (v: string | null) => v || '—'
  const filtered = sgos.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <ToastList toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher SGO…"
            className="w-full bg-[#0d1b2a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brvm-green"
          />
        </div>
        <button onClick={load} className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brvm-green hover:bg-brvm-green/80 text-white text-sm rounded-lg transition-colors">
          <Plus size={14} /> Ajouter SGO
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
              <th className="text-left py-3 px-3">Nom</th>
              <th className="text-left py-3 px-3">Pays</th>
              <th className="text-left py-3 px-3">Téléphone</th>
              <th className="text-left py-3 px-3">Email</th>
              <th className="text-left py-3 px-3">SGI partenaire</th>
              <th className="text-right py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sgo => (
              <tr key={sgo.id} className="border-b border-white/10/50 hover:bg-white/5 transition-colors">
                <td className="py-3 px-3 text-white font-medium">{sgo.name}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <FlagImg code={sgo.country_code} country={sgo.country} />
                    <span className="text-slate-400">{sgo.country}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-400">{f(sgo.phone)}</td>
                <td className="py-3 px-3 text-slate-400">{f(sgo.email)}</td>
                <td className="py-3 px-3 text-slate-400">{f(sgo.partner_sgi)}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(sgo)} className="p-1.5 text-slate-400 hover:text-brvm-green transition-colors" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(sgo)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Aucun SGO trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">{filtered.length} SGO</p>

      {modalOpen && (
        <Modal title={editTarget ? 'Modifier SGO' : 'Ajouter SGO'} onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Nom" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required placeholder="Ex: AFRICA ASSET MANAGEMENT" />
            <SelectField label="Pays" value={form.country_code} required
              onChange={v => {
                const c = UEMOA_COUNTRIES.find(x => x.code === v)
                setForm(p => ({ ...p, country_code: v, country: c?.name || p.country }))
              }}
              options={UEMOA_COUNTRIES.map(c => ({ value: c.code, label: c.name }))}
            />
            <Field label="Adresse" value={form.address || ''} onChange={v => setForm(p => ({ ...p, address: v || null }))} placeholder="Adresse postale" />
            <Field label="Téléphone" value={form.phone || ''} onChange={v => setForm(p => ({ ...p, phone: v || null }))} placeholder="+225 XX XX XX XX XX" />
            <Field label="Email" value={form.email || ''} onChange={v => setForm(p => ({ ...p, email: v || null }))} type="email" placeholder="contact@example.com" />
            <Field label="Site web" value={form.website || ''} onChange={v => setForm(p => ({ ...p, website: v || null }))} placeholder="https://..." />
            <Field label="SGI partenaire" value={form.partner_sgi || ''} onChange={v => setForm(p => ({ ...p, partner_sgi: v || null }))} placeholder="Nom de la SGI partenaire" />
          </div>
          <div className="flex gap-3 justify-end mt-5">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-brvm-green hover:bg-brvm-green/80 disabled:opacity-50 text-white rounded-lg transition-colors">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {editTarget ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Supprimer « ${deleteTarget.name} » ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Funds Tab ────────────────────────────────────────────────────────────────

function FundsTab() {
  const [funds, setFunds] = useState<FundData[]>([])
  const [sgos, setSgos] = useState<SGOFlat[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSgo, setFilterSgo] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FundData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FundData | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = () => ({
    sgo_id: '', name: '', category: '', vl_current: '', perf_week: '',
  })
  const [form, setForm] = useState(emptyForm())

  const toast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now()
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [fundsData, sgosData] = await Promise.all([
        assetManagersApi.getFunds(),
        assetManagersApi.getSGOs(),
      ])
      setFunds(fundsData)
      setSgos(sgosData.map(({ id, name, country, country_code, address, phone, email, website, partner_sgi }) =>
        ({ id, name, country, country_code, address, phone, email, website, partner_sgi })
      ))
    } catch { toast('error', 'Erreur lors du chargement des fonds.') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const sgoName = (id: number | undefined) => sgos.find(s => s.id === id)?.name || '—'

  const openCreate = () => { setEditTarget(null); setForm(emptyForm()); setModalOpen(true) }
  const openEdit = (fund: FundData) => {
    setEditTarget(fund)
    setForm({
      sgo_id: String(fund.sgo_id || ''),
      name: fund.name,
      category: fund.category || '',
      vl_current: fund.vl_current != null ? String(fund.vl_current) : '',
      perf_week: fund.perf_week || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.sgo_id || !form.name || !form.category) {
      toast('error', 'SGO, nom et catégorie sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        sgo_id: parseInt(form.sgo_id),
        name: form.name,
        category: form.category,
        vl_current: form.vl_current ? parseFloat(form.vl_current) : null,
        perf_week: form.perf_week || null,
      }
      if (editTarget) {
        const updated = await assetManagersApi.updateFund(editTarget.id, payload)
        setFunds(p => p.map(f => f.id === editTarget.id ? updated : f))
        toast('success', 'Fonds modifié.')
      } else {
        const created = await assetManagersApi.createFund(payload)
        setFunds(p => [...p, created])
        toast('success', 'Fonds créé.')
      }
      setModalOpen(false)
    } catch { toast('error', 'Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await assetManagersApi.deleteFund(deleteTarget.id)
      setFunds(p => p.filter(f => f.id !== deleteTarget.id))
      toast('success', 'Fonds supprimé.')
    } catch { toast('error', 'Erreur lors de la suppression.') }
    finally { setDeleteTarget(null) }
  }

  const filtered = funds.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchSgo = !filterSgo || String(f.sgo_id) === filterSgo
    return matchSearch && matchSgo
  })

  return (
    <div>
      <ToastList toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher fonds…"
            className="w-full bg-[#0d1b2a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brvm-green"
          />
        </div>
        <div className="relative">
          <select value={filterSgo} onChange={e => setFilterSgo(e.target.value)}
            className="bg-[#0d1b2a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brvm-green appearance-none pr-8">
            <option value="">Tous les SGO</option>
            {sgos.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <button onClick={load} className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-brvm-green hover:bg-brvm-green/80 text-white text-sm rounded-lg transition-colors">
          <Plus size={14} /> Ajouter fonds
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
              <th className="text-left py-3 px-3">Nom du fonds</th>
              <th className="text-left py-3 px-3">SGO</th>
              <th className="text-left py-3 px-3">Catégorie</th>
              <th className="text-right py-3 px-3">VL actuelle</th>
              <th className="text-right py-3 px-3">Perf. sem.</th>
              <th className="text-right py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(fund => (
              <tr key={fund.id} className="border-b border-white/10/50 hover:bg-white/5 transition-colors">
                <td className="py-3 px-3 text-white font-medium max-w-xs truncate">{fund.name}</td>
                <td className="py-3 px-3 text-slate-400 text-xs">{sgoName(fund.sgo_id)}</td>
                <td className="py-3 px-3">
                  <span className="text-xs bg-brvm-green/20 text-brvm-green px-2 py-0.5 rounded-full">
                    {fund.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-right text-slate-400">
                  {fund.vl_current != null ? fund.vl_current.toLocaleString('fr-FR') : '—'}
                </td>
                <td className="py-3 px-3 text-right">
                  {fund.perf_week
                    ? <span className={fund.perf_week.startsWith('-') ? 'text-red-400' : 'text-green-400'}>{fund.perf_week}</span>
                    : <span className="text-slate-400">—</span>}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(fund)} className="p-1.5 text-slate-400 hover:text-brvm-green transition-colors" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(fund)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Aucun fonds trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">{filtered.length} fonds</p>

      {modalOpen && (
        <Modal title={editTarget ? 'Modifier fonds' : 'Ajouter fonds'} onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-1 gap-3">
            <SelectField label="SGO" value={form.sgo_id} required
              onChange={v => setForm(p => ({ ...p, sgo_id: v }))}
              options={sgos.map(s => ({ value: String(s.id), label: s.name }))}
            />
            <Field label="Nom du fonds" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required placeholder="Ex: AFRIQUE CROISSANCE PLUS" />
            <SelectField label="Catégorie" value={form.category} required
              onChange={v => setForm(p => ({ ...p, category: v }))}
              options={FUND_CATEGORIES.map(c => ({ value: c, label: c }))}
            />
            <Field label="VL actuelle" value={form.vl_current} onChange={v => setForm(p => ({ ...p, vl_current: v }))} type="number" placeholder="Ex: 15432.50" />
            <Field label="Perf. semaine" value={form.perf_week} onChange={v => setForm(p => ({ ...p, perf_week: v }))} placeholder="Ex: +1.23%" />
          </div>
          <div className="flex gap-3 justify-end mt-5">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-brvm-green hover:bg-brvm-green/80 disabled:opacity-50 text-white rounded-lg transition-colors">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {editTarget ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Supprimer le fonds « ${deleteTarget.name} » ? Cette action est irréversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminAssetManagers() {
  const [tab, setTab] = useState<TabId>('sgi')

  const tabs: { id: TabId; label: string }[] = [
    { id: 'sgi', label: 'SGI' },
    { id: 'sgo', label: 'SGO' },
    { id: 'funds', label: 'Fonds OPCVM' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Sociétés de Gestion</h2>
        <p className="text-sm text-slate-400 mt-1">Gérez les SGI, SGO et leurs fonds OPCVM.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-brvm-green text-brvm-green'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-[#132030] border border-white/10 rounded-xl p-4">
        {tab === 'sgi' && <SGITab />}
        {tab === 'sgo' && <SGOTab />}
        {tab === 'funds' && <FundsTab />}
      </div>
    </div>
  )
}
