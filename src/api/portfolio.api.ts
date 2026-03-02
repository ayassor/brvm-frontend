import api from './axios'
import type { Portfolio, PortfolioTransaction } from '../types'

export const portfolioApi = {
  list: () =>
    api.get<Portfolio[]>('/portfolios').then((r) => r.data),

  create: (data: { name?: string; initial_capital: number }) =>
    api.post<Portfolio>('/portfolios', data).then((r) => r.data),

  getById: (id: number) =>
    api.get<Portfolio>(`/portfolios/${id}`).then((r) => r.data),

  buy: (id: number, data: { company_id: number; ticker: string; quantity: number; price: number }) =>
    api.post(`/portfolios/${id}/buy`, data).then((r) => r.data),

  sell: (id: number, data: { company_id: number; ticker: string; quantity: number; price: number }) =>
    api.post(`/portfolios/${id}/sell`, data).then((r) => r.data),

  transactions: (id: number) =>
    api.get<PortfolioTransaction[]>(`/portfolios/${id}/transactions`).then((r) => r.data),
}
