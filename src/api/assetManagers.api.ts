import api from './axios'

export interface SGIData {
  id: number; name: string; country: string; country_code: string
  phone: string | null; website: string | null; min_deposit: string | null; opening_fees: string | null
}

export interface FundData {
  id: number; sgo_id?: number; name: string; cat?: string; category?: string
  vlCurrent?: number | null; vl_current?: number | null; perfWeek?: string | null; perf_week?: string | null
}

export interface SGOData {
  id: number; name: string; country: string; country_code: string
  address: string | null; phone: string | null; email: string | null
  website: string | null; partner_sgi: string | null; funds: FundData[]
}

export interface SGOFlat {
  id: number; name: string; country: string; country_code: string
  address: string | null; phone: string | null; email: string | null
  website: string | null; partner_sgi: string | null
}

export const assetManagersApi = {
  // ── GET (publics) ───────────────────────────────────────────────────────
  getSGIs: () => api.get<{ data: SGIData[] }>('/market-participants/sgis').then(r => r.data.data),
  getSGOs: () => api.get<{ data: SGOData[] }>('/market-participants/sgos').then(r => r.data.data),
  getFunds: () => api.get<{ data: FundData[] }>('/market-participants/funds').then(r => r.data.data),

  // ── SGI CRUD (admin) ────────────────────────────────────────────────────
  createSGI: (data: Omit<SGIData, 'id'>) =>
    api.post<{ data: SGIData }>('/market-participants/sgis', data).then(r => r.data.data),
  updateSGI: (id: number, data: Omit<SGIData, 'id'>) =>
    api.put<{ data: SGIData }>(`/market-participants/sgis/${id}`, data).then(r => r.data.data),
  deleteSGI: (id: number) =>
    api.delete(`/market-participants/sgis/${id}`).then(r => r.data),

  // ── SGO CRUD (admin) ────────────────────────────────────────────────────
  createSGO: (data: Omit<SGOFlat, 'id'>) =>
    api.post<{ data: SGOFlat }>('/market-participants/sgos', data).then(r => r.data.data),
  updateSGO: (id: number, data: Omit<SGOFlat, 'id'>) =>
    api.put<{ data: SGOFlat }>(`/market-participants/sgos/${id}`, data).then(r => r.data.data),
  deleteSGO: (id: number) =>
    api.delete(`/market-participants/sgos/${id}`).then(r => r.data),

  // ── Fund CRUD (admin) ───────────────────────────────────────────────────
  createFund: (data: Omit<FundData, 'id'>) =>
    api.post<{ data: FundData }>('/market-participants/funds', data).then(r => r.data.data),
  updateFund: (id: number, data: Omit<FundData, 'id'>) =>
    api.put<{ data: FundData }>(`/market-participants/funds/${id}`, data).then(r => r.data.data),
  deleteFund: (id: number) =>
    api.delete(`/market-participants/funds/${id}`).then(r => r.data),
}
