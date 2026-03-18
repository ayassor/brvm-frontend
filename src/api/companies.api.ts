import api from './axios'
import type { Company, StockPrice, Dividend, Period } from '../types'

export interface HistoryEntry {
  date: string
  open: number | null
  high: number | null
  low: number | null
  close: number
  previous_close: number | null
  variation: number | null
  volume: number | null
  value_traded: number | null
}

export interface FundamentalsHistoryEntry {
  year: number
  revenue_m_fcfa: number | null
  net_income_m_fcfa: number | null
  ebitda_m_fcfa: number | null
  pe_ratio: number | null
  eps_fcfa: number | null
  dividend_per_share_fcfa: number | null
}

export interface FundamentalsResponse {
  ticker: string
  market_cap_fcfa: number | null
  pe_ratio: number | null
  dividend_yield_pct: number | null
  revenue_bn_fcfa: number | null
  net_income_bn_fcfa: number | null
  net_margin_pct: number | null
  ebitda_bn_fcfa: number | null
  history: FundamentalsHistoryEntry[]
  ceo: string | null
  ceo_title: string | null
  founded: number | null
  employees: number | null
  website: string | null
  free_float_pct: number | null
  activities: string[]
  certifications: string[]
  shareholders: {
    name: string
    pct: number
    type: 'institutionnel' | 'etat' | 'fondateur' | 'public'
  }[]
  dividends: {
    year: number
    amount_fcfa: number
    payment_date: string
    ex_date: string | null
  }[]
  recent_news: {
    date: string
    headline: string
    positive: boolean | null
  }[]
}

/** Filtre un historique complet selon la période sélectionnée */
export function filterByPeriod(rows: HistoryEntry[], period: Period): HistoryEntry[] {
  if (!rows.length) return rows
  if (period === 'max') return rows
  const now    = new Date()
  const cutoff = new Date(now)
  if      (period === '1d')  cutoff.setDate(now.getDate() - 1)
  else if (period === '1w')  cutoff.setDate(now.getDate() - 7)
  else if (period === '1m')  cutoff.setMonth(now.getMonth() - 1)
  else if (period === '3m')  cutoff.setMonth(now.getMonth() - 3)
  else if (period === '6m')  cutoff.setMonth(now.getMonth() - 6)
  else if (period === '1y')  cutoff.setFullYear(now.getFullYear() - 1)
  else if (period === '3y')  cutoff.setFullYear(now.getFullYear() - 3)
  else if (period === '5y')  cutoff.setFullYear(now.getFullYear() - 5)
  else if (period === '10y') cutoff.setFullYear(now.getFullYear() - 10)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  return rows.filter(r => r.date >= cutoffStr)
}

/** Convertit un HistoryEntry en StockPrice pour le graphique */
export function toStockPrices(rows: HistoryEntry[]): StockPrice[] {
  return rows.map((r, i) => ({
    id: i,
    company_id: 0,
    date: r.date,
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
    volume: r.volume ?? 0,
  }))
}

/* ──────────────────────────────────────────────────────────────
   NOUVEAUX TYPES — Résumé / Recommandations / Annonces
────────────────────────────────────────────────────────────── */
export interface CompanyVideo {
  id: number
  ticker: string
  title: string
  url: string
  thumbnailUrl: string | null
  durationSec: number | null
  source: string | null
  publishedAt: string | null
  sortOrder: number
}

export interface CompanySummary {
  ticker: string
  executiveText: string | null
  bullCase: string[]
  bearCase: string[]
  updatedAt: string | null
}

export interface ThesisPoint {
  id: number
  body: string
  sortOrder: number
}

export type RecoConsensus = 'ACHAT FORT' | 'ACHAT' | 'NEUTRE' | 'ALLÉGEMENT' | 'VENTE'

export interface CompanyRecommendation {
  ticker: string
  consensus: RecoConsensus
  fairValue: number | null
  buyPrice: number | null
  stopLoss: number | null
  horizon: string | null
  methodology: string | null
  updatedAt: string | null
  publishedAt: string | null
  thesis: {
    bull: ThesisPoint[]
    risk: ThesisPoint[]
    exit: ThesisPoint[]
  }
}

export interface AnalystRecommendation {
  id: number
  ticker: string
  firm: string
  analystName: string | null
  consensus: RecoConsensus
  targetPrice: number | null
  publishedAt: string | null
}

export interface CompanyReport {
  id: number
  ticker: string
  year: number
  type: 'annual' | 'semi_annual' | 'quarterly'
  label: string
  fileUrl: string | null
  fileSizeKb: number | null
  pageCount: number | null
  isPublished: boolean
  publishedAt: string | null
}

export interface CompanyAnnouncement {
  id: number
  ticker: string
  category: string
  title: string
  body: string
  publishedAt: string
  isPublished: boolean
  source: string | null
}

export const companiesApi = {
  list: (params?: { sector?: string; country?: string; search?: string }) =>
    api.get<{ data: Company[] }>('/companies', { params }).then((r) => r.data.data),

  getById: (id: number) =>
    api.get<{ data: Company }>(`/companies/${id}`).then((r) => r.data.data),

  getPrices: (id: number, period: Period = '1m') =>
    api.get<{ data: StockPrice[] }>(`/companies/${id}/prices`, { params: { period } }).then((r) => r.data.data),

  /** Historique OHLCV complet par ticker — GET /api/companies/:ticker/history */
  getHistory: (ticker: string) =>
    api.get<{ data: HistoryEntry[] }>(`/companies/${ticker}/history`).then((r) => r.data.data),

  getDividends: (id: number) =>
    api.get<{ data: Dividend[] }>(`/companies/${id}/dividends`).then((r) => r.data.data),

  /** Données fondamentales complètes — GET /api/companies/:ticker/fundamentals */
  getFundamentals: (ticker: string) =>
    api.get<{ data: FundamentalsResponse }>(`/companies/${ticker}/fundamentals`).then((r) => r.data.data),

  /** GET /api/companies/:ticker/videos */
  getVideos: (ticker: string) =>
    api.get<{ data: CompanyVideo[] }>(`/companies/${ticker}/videos`).then(r => r.data.data),

  /** GET /api/companies/:ticker/summary */
  getSummary: (ticker: string) =>
    api.get<{ data: CompanySummary }>(`/companies/${ticker}/summary`).then(r => {
      const s = r.data.data
      const parseArr = (v: unknown): string[] => {
        if (Array.isArray(v)) return v
        if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch { return [] } }
        return []
      }
      return { ...s, bullCase: parseArr(s.bullCase), bearCase: parseArr(s.bearCase) }
    }),

  /** GET /api/companies/:ticker/recommendation */
  getRecommendation: (ticker: string) =>
    api.get<{ data: CompanyRecommendation }>(`/companies/${ticker}/recommendation`).then(r => r.data.data),

  /** GET /api/companies/:ticker/analyst-recommendations */
  getAnalystRecommendations: (ticker: string) =>
    api.get<{ data: AnalystRecommendation[] }>(`/companies/${ticker}/analyst-recommendations`).then(r => r.data.data),

  /** GET /api/companies/:ticker/reports */
  getReports: (ticker: string) =>
    api.get<{ data: CompanyReport[] }>(`/companies/${ticker}/reports`).then(r => r.data.data),

  /** GET /api/companies/:ticker/announcements */
  getAnnouncements: (ticker: string, params?: { page?: number; limit?: number; category?: string }) =>
    api.get<{ data: CompanyAnnouncement[] }>(`/companies/${ticker}/announcements`, { params }).then(r => r.data.data),

  /** PUT /api/companies/:ticker/summary */
  putSummary: (ticker: string, body: { executiveText: string; bullCase: string[]; bearCase: string[] }) =>
    api.put<{ data: CompanySummary }>(`/companies/${ticker}/summary`, body).then(r => r.data.data),

  /** PUT /api/companies/:ticker/recommendation */
  putRecommendation: (ticker: string, body: Partial<Omit<CompanyRecommendation, 'ticker' | 'updatedAt' | 'publishedAt' | 'thesis'>>) =>
    api.put<{ data: CompanyRecommendation }>(`/companies/${ticker}/recommendation`, body).then(r => r.data.data),

  /** POST /api/companies/:ticker/analyst-recommendations */
  createAnalystReco: (ticker: string, body: Omit<AnalystRecommendation, 'id' | 'ticker'>) =>
    api.post<{ data: AnalystRecommendation }>(`/companies/${ticker}/analyst-recommendations`, body).then(r => r.data.data),

  /** DELETE /api/companies/analyst-recommendations/:id */
  deleteAnalystReco: (id: number) =>
    api.delete(`/companies/analyst-recommendations/${id}`),

  /** POST /api/companies/:ticker/reports */
  createReport: (ticker: string, body: Omit<CompanyReport, 'id' | 'ticker' | 'publishedAt'>) =>
    api.post<{ data: CompanyReport }>(`/companies/${ticker}/reports`, body).then(r => r.data.data),

  /** DELETE /api/companies/reports/:id */
  deleteReport: (id: number) =>
    api.delete(`/companies/reports/${id}`),
}
