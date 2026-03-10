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

export const companiesApi = {
  list: (params?: { sector?: string; country?: string; search?: string }) =>
    api.get<Company[]>('/companies', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Company>(`/companies/${id}`).then((r) => r.data),

  getPrices: (id: number, period: Period = '1m') =>
    api.get<StockPrice[]>(`/companies/${id}/prices`, { params: { period } }).then((r) => r.data),

  /** Historique OHLCV complet par ticker — GET /api/companies/:ticker/history */
  getHistory: (ticker: string) =>
    api.get<HistoryEntry[]>(`/companies/${ticker}/history`).then((r) => r.data),

  getDividends: (id: number) =>
    api.get<Dividend[]>(`/companies/${id}/dividends`).then((r) => r.data),
}
