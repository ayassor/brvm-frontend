import api from './axios'

export interface SGIData {
  id: number; name: string; country: string; country_code: string
  phone: string | null; website: string | null; min_deposit: string | null; opening_fees: string | null
}

export interface FundData {
  id: number; name: string; cat: string; vlCurrent: number | null; perfWeek: string | null
}

export interface SGOData {
  id: number; name: string; country: string; country_code: string
  address: string | null; phone: string | null; email: string | null
  website: string | null; partner_sgi: string | null; funds: FundData[]
}

export const assetManagersApi = {
  getSGIs: () => api.get<{ data: SGIData[] }>('/market-participants/sgis').then(r => r.data.data),
  getSGOs: () => api.get<{ data: SGOData[] }>('/market-participants/sgos').then(r => r.data.data),
}
