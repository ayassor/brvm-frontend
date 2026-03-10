import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Shield, Building2, Landmark } from 'lucide-react'

interface Bond {
  id: number
  name: string
  issuer: string
  type: 'Etat' | 'Corporate'
  country: string
  isin: string
  coupon: number
  maturity: string
  price: number
  yield: number
  variation: number
  volume_fcfa: number
  rating: string | null
  outstanding_bn: number
}

const MOCK_BONDS: Bond[] = [
  // États
  {
    id: 1, name: "CIV 6.50% 2029", issuer: "République de Côte d'Ivoire", type: 'Etat',
    country: "Côte d'Ivoire", isin: "CI0000006512", coupon: 6.50, maturity: "2029-06-15",
    price: 98.75, yield: 6.82, variation: 0.12, volume_fcfa: 485_000_000, rating: "B+", outstanding_bn: 250,
  },
  {
    id: 2, name: "SEN 5.90% 2031", issuer: "République du Sénégal", type: 'Etat',
    country: "Sénégal", isin: "SN0000005912", coupon: 5.90, maturity: "2031-03-20",
    price: 96.40, yield: 6.45, variation: -0.08, volume_fcfa: 320_000_000, rating: "B+", outstanding_bn: 175,
  },
  {
    id: 3, name: "BEN 7.00% 2030", issuer: "République du Bénin", type: 'Etat',
    country: "Bénin", isin: "BJ0000007003", coupon: 7.00, maturity: "2030-09-30",
    price: 101.20, yield: 6.72, variation: 0.05, volume_fcfa: 198_000_000, rating: "B", outstanding_bn: 120,
  },
  {
    id: 4, name: "MLI 6.20% 2028", issuer: "République du Mali", type: 'Etat',
    country: "Mali", isin: "ML0000006204", coupon: 6.20, maturity: "2028-12-10",
    price: 94.80, yield: 7.15, variation: -0.15, volume_fcfa: 145_000_000, rating: "B-", outstanding_bn: 100,
  },
  {
    id: 5, name: "BFA 6.75% 2029", issuer: "République du Burkina Faso", type: 'Etat',
    country: "Burkina Faso", isin: "BF0000006754", coupon: 6.75, maturity: "2029-07-15",
    price: 91.50, yield: 8.10, variation: -0.20, volume_fcfa: 88_000_000, rating: "CCC+", outstanding_bn: 85,
  },
  {
    id: 6, name: "TGO 6.00% 2032", issuer: "République du Togo", type: 'Etat',
    country: "Togo", isin: "TG0000006001", coupon: 6.00, maturity: "2032-04-22",
    price: 95.60, yield: 6.58, variation: 0.03, volume_fcfa: 112_000_000, rating: "B", outstanding_bn: 95,
  },
  {
    id: 7, name: "NER 6.40% 2028", issuer: "République du Niger", type: 'Etat',
    country: "Niger", isin: "NE0000006405", coupon: 6.40, maturity: "2028-10-05",
    price: 89.30, yield: 8.45, variation: -0.30, volume_fcfa: 62_000_000, rating: "CCC", outstanding_bn: 65,
  },
  {
    id: 8, name: "GNB 7.25% 2027", issuer: "République de Guinée-Bissau", type: 'Etat',
    country: "Guinée-Bissau", isin: "GW0000007251", coupon: 7.25, maturity: "2027-11-30",
    price: 97.80, yield: 7.58, variation: 0.00, volume_fcfa: 28_000_000, rating: "B-", outstanding_bn: 30,
  },
  // Corporate
  {
    id: 9, name: "SNTS 5.50% 2027", issuer: "Sonatel", type: 'Corporate',
    country: "Sénégal", isin: "SN0000055003", coupon: 5.50, maturity: "2027-05-20",
    price: 99.20, yield: 5.72, variation: 0.08, volume_fcfa: 245_000_000, rating: "BB-", outstanding_bn: 75,
  },
  {
    id: 10, name: "ETIT 6.10% 2026", issuer: "Ecobank Transnational", type: 'Corporate',
    country: "Togo", isin: "TG0000061009", coupon: 6.10, maturity: "2026-09-15",
    price: 99.80, yield: 6.22, variation: 0.02, volume_fcfa: 185_000_000, rating: "B+", outstanding_bn: 60,
  },
  {
    id: 11, name: "ORAC 5.80% 2028", issuer: "Orange Côte d'Ivoire", type: 'Corporate',
    country: "Côte d'Ivoire", isin: "CI0000058007", coupon: 5.80, maturity: "2028-03-10",
    price: 98.50, yield: 6.02, variation: 0.15, volume_fcfa: 158_000_000, rating: "BB-", outstanding_bn: 50,
  },
  {
    id: 12, name: "SGBC 5.25% 2027", issuer: "Société Générale CI", type: 'Corporate',
    country: "Côte d'Ivoire", isin: "CI0000052504", coupon: 5.25, maturity: "2027-08-25",
    price: 97.90, yield: 5.78, variation: -0.05, volume_fcfa: 132_000_000, rating: "BB-", outstanding_bn: 45,
  },
  {
    id: 13, name: "CBIBF 6.00% 2028", issuer: "Coris Bank International", type: 'Corporate',
    country: "Burkina Faso", isin: "BF0000060006", coupon: 6.00, maturity: "2028-11-12",
    price: 96.30, yield: 6.58, variation: -0.10, volume_fcfa: 88_000_000, rating: "B", outstanding_bn: 35,
  },
  {
    id: 14, name: "PALC 5.75% 2026", issuer: "Palm CI", type: 'Corporate',
    country: "Côte d'Ivoire", isin: "CI0000057504", coupon: 5.75, maturity: "2026-07-20",
    price: 100.10, yield: 5.68, variation: 0.05, volume_fcfa: 75_000_000, rating: "B+", outstanding_bn: 25,
  },
]

type FilterType = 'Tous' | 'Etat' | 'Corporate'

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return null
  const color = rating.startsWith('BB') ? 'bg-blue-50 text-blue-600'
    : rating.startsWith('B+') || rating === 'B' ? 'bg-amber-50 text-brvm-gold'
    : rating.startsWith('CCC') ? 'bg-red-50 text-brvm-red'
    : 'bg-slate-100 text-brvm-subtext'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{rating}</span>
}

export default function Bonds() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('Tous')
  const [sortBy, setSortBy] = useState<'yield' | 'price' | 'variation'>('yield')

  const filtered = MOCK_BONDS
    .filter(b => {
      const matchType = filter === 'Tous' || b.type === filter
      const matchSearch = !search ||
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.issuer.toLowerCase().includes(search.toLowerCase()) ||
        b.country.toLowerCase().includes(search.toLowerCase())
      return matchType && matchSearch
    })
    .sort((a, b) => {
      if (sortBy === 'yield') return b.yield - a.yield
      if (sortBy === 'price') return b.price - a.price
      return b.variation - a.variation
    })

  const govBonds = MOCK_BONDS.filter(b => b.type === 'Etat')
  const corpBonds = MOCK_BONDS.filter(b => b.type === 'Corporate')
  const avgYieldGov = govBonds.reduce((s, b) => s + b.yield, 0) / govBonds.length
  const avgYieldCorp = corpBonds.reduce((s, b) => s + b.yield, 0) / corpBonds.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brvm-text">Obligations</h1>
        <p className="text-brvm-subtext text-sm mt-1">Marché obligataire UEMOA · données simulées</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-brvm-border rounded-xl p-4 shadow-sm">
          <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">Titres cotés</p>
          <p className="text-2xl font-extrabold text-brvm-text">{MOCK_BONDS.length}</p>
          <p className="text-brvm-muted text-xs mt-0.5">obligations</p>
        </div>
        <div className="bg-white border border-brvm-border rounded-xl p-4 shadow-sm">
          <p className="text-brvm-muted text-xs uppercase tracking-wider mb-1">Encours total</p>
          <p className="text-2xl font-extrabold text-brvm-text">
            {MOCK_BONDS.reduce((s, b) => s + b.outstanding_bn, 0).toLocaleString('fr-FR')}
          </p>
          <p className="text-brvm-muted text-xs mt-0.5">milliards FCFA</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
          <p className="text-brvm-green text-xs uppercase tracking-wider font-semibold mb-1">Taux moy. État</p>
          <p className="text-2xl font-extrabold text-brvm-green">{avgYieldGov.toFixed(2)}%</p>
          <p className="text-emerald-400 text-xs mt-0.5">rendement moyen</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
          <p className="text-blue-600 text-xs uppercase tracking-wider font-semibold mb-1">Taux moy. Corporate</p>
          <p className="text-2xl font-extrabold text-blue-600">{avgYieldCorp.toFixed(2)}%</p>
          <p className="text-blue-400 text-xs mt-0.5">rendement moyen</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
          {(['Tous', 'Etat', 'Corporate'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-white text-brvm-text shadow-sm' : 'text-brvm-muted hover:text-brvm-subtext'
              }`}
            >
              {f === 'Etat' ? <Landmark size={13} /> : f === 'Corporate' ? <Building2 size={13} /> : <Shield size={13} />}
              {f === 'Etat' ? 'Souverains' : f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center ml-auto">
          <span className="text-brvm-muted text-xs">Trier par :</span>
          {[
            { key: 'yield', label: 'Rendement' },
            { key: 'price', label: 'Prix' },
            { key: 'variation', label: 'Variation' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as typeof sortBy)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === key ? 'bg-brvm-green text-white' : 'bg-white border border-brvm-border text-brvm-subtext hover:border-brvm-green/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
        <input
          type="text"
          placeholder="Rechercher un émetteur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-brvm-border rounded-lg pl-8 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/20 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-brvm-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-slate-50 border-b border-brvm-border text-xs font-semibold text-brvm-muted uppercase tracking-wider">
          <span>Obligation / Émetteur</span>
          <span className="text-right">Prix</span>
          <span className="text-right">Coupon</span>
          <span className="text-right">Rendement</span>
          <span className="text-right">Variation</span>
          <span className="text-right">Notation</span>
        </div>
        <div className="divide-y divide-brvm-border">
          {filtered.map((bond) => (
            <div
              key={bond.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors items-center"
            >
              {/* Name */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  bond.type === 'Etat' ? 'bg-blue-50' : 'bg-amber-50'
                }`}>
                  {bond.type === 'Etat'
                    ? <Landmark size={14} className="text-blue-600" />
                    : <Building2 size={14} className="text-brvm-gold" />
                  }
                </div>
                <div>
                  <p className="text-brvm-text text-sm font-semibold">{bond.name}</p>
                  <p className="text-brvm-muted text-xs">{bond.issuer} · Échéance {new Date(bond.maturity).getFullYear()}</p>
                </div>
              </div>
              {/* Price */}
              <p className="text-right text-brvm-text text-sm font-mono font-semibold">{bond.price.toFixed(2)}</p>
              {/* Coupon */}
              <p className="text-right text-brvm-text text-sm font-mono">{bond.coupon.toFixed(2)}%</p>
              {/* Yield */}
              <p className="text-right text-brvm-blue text-sm font-mono font-semibold">{bond.yield.toFixed(2)}%</p>
              {/* Variation */}
              <p className={`text-right text-sm font-semibold flex items-center justify-end gap-0.5 ${
                bond.variation > 0 ? 'text-brvm-green' : bond.variation < 0 ? 'text-brvm-red' : 'text-brvm-muted'
              }`}>
                {bond.variation > 0 ? <TrendingUp size={12} /> : bond.variation < 0 ? <TrendingDown size={12} /> : null}
                {bond.variation > 0 ? '+' : ''}{bond.variation.toFixed(2)}
              </p>
              {/* Rating */}
              <div className="flex justify-end">
                <RatingBadge rating={bond.rating} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-brvm-muted text-xs text-center pb-2">
        Données simulées · Les prix sont exprimés en % du nominal · Source : BRVM Obligataire
      </p>
    </div>
  )
}
