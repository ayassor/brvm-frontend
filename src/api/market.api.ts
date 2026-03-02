import api from './axios'
import type { MarketOverview, MarketStock } from '../types'

export const marketApi = {
  overview: () =>
    api.get<MarketOverview>('/market/overview').then((r) => r.data),

  movers: (type: 'gainers' | 'losers', limit = 5) =>
    api.get<MarketStock[]>('/market/movers', { params: { type, limit } }).then((r) => r.data),

  mostActive: (limit = 5) =>
    api.get<MarketStock[]>('/market/most-active', { params: { limit } }).then((r) => r.data),
}
