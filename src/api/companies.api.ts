import api from './axios'
import type { Company, StockPrice, Dividend, Period } from '../types'

export const companiesApi = {
  list: (params?: { sector?: string; country?: string; search?: string }) =>
    api.get<Company[]>('/companies', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Company>(`/companies/${id}`).then((r) => r.data),

  getPrices: (id: number, period: Period = '1m') =>
    api.get<StockPrice[]>(`/companies/${id}/prices`, { params: { period } }).then((r) => r.data),

  getDividends: (id: number) =>
    api.get<Dividend[]>(`/companies/${id}/dividends`).then((r) => r.data),
}
