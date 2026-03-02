// Auth & User
export interface User {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  subscription_type: 'free' | 'premium'
  credits_remaining: number
  is_active: boolean
  created_at: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

// Companies
export interface Company {
  id: number
  name: string
  ticker: string
  sector: string | null
  country: string | null
  description: string | null
  logo_url: string | null
  market_cap: number | null
  is_active: boolean
}

export interface StockPrice {
  id: number
  company_id: number
  date: string
  open: number | null
  close: number
  high: number | null
  low: number | null
  volume: number
}

export interface Dividend {
  id: number
  company_id: number
  amount: number
  payment_date: string
  ex_date: string | null
}

// Market
export interface MarketStock {
  id: number
  name: string
  ticker: string
  sector: string | null
  country: string | null
  current_price: number
  variation: number
  volume: number
}

export interface MarketSummary {
  total_companies: number
  advances: number
  declines: number
  unchanged: number
}

export interface MarketOverview {
  stocks: MarketStock[]
  summary: MarketSummary
}

// Portfolio
export interface Portfolio {
  id: number
  user_id: number
  name: string
  initial_capital: number
  cash_balance: number
  positions: PortfolioPosition[]
  total_value: number
  positions_value: number
  total_pnl: number
  total_pnl_percent: number
  created_at: string
}

export interface PortfolioPosition {
  id: number
  portfolio_id: number
  company_id: number
  ticker: string
  quantity: number
  avg_buy_price: number
  current_price: number
  current_value: number
  pnl: number
  pnl_percent: number
}

export interface PortfolioTransaction {
  id: number
  portfolio_id: number
  company_id: number
  ticker: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  total: number
  executed_at: string
}

// Education
export interface Course {
  id: number
  title: string
  description: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  is_paid: boolean
  price: number | null
  thumbnail_url: string | null
  is_active: boolean
}

export interface Article {
  id: number
  title: string
  content: string | null
  summary: string | null
  author: string | null
  category: string | null
  is_paid: boolean
  is_active: boolean
  created_at: string
}

export interface GlossaryTerm {
  id: number
  term: string
  definition: string
  category: string | null
}

// Subscriptions
export interface Subscription {
  id: number
  user_id: number
  plan: 'free' | 'premium'
  start_date: string
  end_date: string | null
  status: 'active' | 'cancelled' | 'expired'
  amount_paid: number
}

// API Responses
export interface ApiError {
  error: string
}

export type Period = '1d' | '1w' | '1m' | '3m' | '1y' | '5y'
