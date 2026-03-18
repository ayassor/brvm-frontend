import api from './axios'

/* ──────────────────────────────────────────────────────────────
   TYPES
────────────────────────────────────────────────────────────── */
export interface NewsItem {
  id: number
  title: string
  summary: string
  body?: string           // absent dans les listes, présent dans getById
  category: string
  source: string
  author?: string | null
  date: string            // ISO 8601
  isPositive?: boolean | null
  tags: string[]
  readingTime: number
}

export interface NewsArticleFull extends NewsItem {
  body: string
  related: Omit<NewsItem, 'body'>[]
}

export interface NewsListMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface NewsListParams {
  page?: number
  limit?: number
  category?: string
  tag?: string
  ticker?: string
  search?: string
  sort?: 'date_desc' | 'date_asc' | 'views_desc'
}

export interface NewsCategoryCount {
  name: string
  count: number
}

export interface NewsCreatePayload {
  title: string
  summary: string
  body: string
  category: string
  source: string
  author?: string | null
  publishedAt: string          // ISO 8601
  isPositive?: boolean | null
  tags?: string[]
  tickers?: string[]
  isPublished?: boolean
}

/* ──────────────────────────────────────────────────────────────
   API
────────────────────────────────────────────────────────────── */
export const newsApi = {
  /** GET /api/news — liste paginée */
  list: (params?: NewsListParams) =>
    api.get<{ data: NewsItem[]; meta: NewsListMeta }>('/news', { params })
      .then(r => ({ articles: r.data.data, meta: r.data.meta })),

  /** GET /api/news/:id — article complet + related */
  getById: (id: number | string) =>
    api.get<{ data: NewsArticleFull }>(`/news/${id}`)
      .then(r => r.data.data),

  /** GET /api/news/categories */
  getCategories: () =>
    api.get<{ data: NewsCategoryCount[] }>('/news/categories')
      .then(r => r.data.data),

  /** GET /api/companies/:ticker/news */
  getByTicker: (ticker: string, limit = 10) =>
    api.get<{ data: NewsItem[] }>(`/companies/${ticker}/news`, { params: { limit } })
      .then(r => r.data.data),
}

/* ──────────────────────────────────────────────────────────────
   ADMIN API  (Bearer token admin requis)
────────────────────────────────────────────────────────────── */
export const adminNewsApi = {
  /** POST /api/admin/news */
  create: (payload: NewsCreatePayload) =>
    api.post<{ data: NewsArticleFull }>('/admin/news', payload)
      .then(r => r.data.data),

  /** PUT /api/admin/news/:id */
  update: (id: number, payload: Partial<NewsCreatePayload>) =>
    api.put<{ data: NewsArticleFull }>(`/admin/news/${id}`, payload)
      .then(r => r.data.data),

  /** DELETE /api/admin/news/:id — suppression logique */
  delete: (id: number) =>
    api.delete<{ data: { success: boolean } }>(`/admin/news/${id}`)
      .then(r => r.data.data),

  /** POST /api/admin/news/:id/publish */
  publish: (id: number) =>
    api.post<{ data: { id: number; isPublished: boolean } }>(`/admin/news/${id}/publish`)
      .then(r => r.data.data),

  /** POST /api/admin/news/:id/unpublish */
  unpublish: (id: number) =>
    api.post<{ data: { id: number; isPublished: boolean } }>(`/admin/news/${id}/unpublish`)
      .then(r => r.data.data),
}
