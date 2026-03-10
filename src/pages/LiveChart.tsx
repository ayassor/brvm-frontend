import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  createChart, ColorType, CrosshairMode, LineStyle, PriceScaleMode,
  type IChartApi, type ISeriesApi, type Time,
} from 'lightweight-charts'
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown, Search, X, Settings2, Plus, BarChart2, LineChart, Building2, Newspaper, Zap, Target } from 'lucide-react'
import { filterByPeriod, type HistoryEntry } from '../api/companies.api'
import type { Company, Period } from '../types'

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const fmtP = (v: number | null | undefined) =>
  v == null ? '—' : Math.round(v).toLocaleString('fr-FR')
const fmtV = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)} M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)} k` : String(v)

/* ══════════════════════════════════════════════════════════════
   TA CALCULATIONS
══════════════════════════════════════════════════════════════ */
function calcSMA(v: number[], p: number): (number | null)[] {
  return v.map((_, i) => {
    if (i < p - 1) return null
    return v.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0) / p
  })
}

function calcEMA(v: number[], p: number): number[] {
  if (v.length === 0) return []
  const k = 2 / (p + 1)
  const res = new Array(v.length).fill(0) as number[]
  let ema = v.slice(0, Math.min(p, v.length)).reduce((a, b) => a + b, 0) / Math.min(p, v.length)
  for (let i = 0; i < Math.min(p, v.length); i++) res[i] = ema
  for (let i = p; i < v.length; i++) { ema = v[i] * k + ema * (1 - k); res[i] = ema }
  return res
}

function calcWMA(v: number[], p: number): (number | null)[] {
  return v.map((_, i) => {
    if (i < p - 1) return null
    const denom = (p * (p + 1)) / 2
    return v.slice(i - p + 1, i + 1).reduce((s, val, j) => s + val * (j + 1), 0) / denom
  })
}

function calcBB(v: number[], p = 20, mult = 2) {
  const mid = calcSMA(v, p)
  const upper: (number | null)[] = [], lower: (number | null)[] = []
  v.forEach((_, i) => {
    if (mid[i] == null) { upper.push(null); lower.push(null); return }
    const slice = v.slice(i - p + 1, i + 1)
    const m = mid[i]!
    const std = Math.sqrt(slice.reduce((s, x) => s + (x - m) ** 2, 0) / p)
    upper.push(m + mult * std); lower.push(m - mult * std)
  })
  return { upper, middle: mid, lower }
}

function calcRSI(v: number[], p = 14): (number | null)[] {
  const res: (number | null)[] = new Array(v.length).fill(null)
  if (v.length < p + 1) return res
  let ag = 0, al = 0
  for (let i = 1; i <= p; i++) { const d = v[i] - v[i - 1]; if (d > 0) ag += d; else al -= d }
  ag /= p; al /= p
  res[p] = al === 0 ? 100 : 100 - 100 / (1 + ag / al)
  for (let i = p + 1; i < v.length; i++) {
    const d = v[i] - v[i - 1]
    ag = (ag * (p - 1) + Math.max(0, d)) / p
    al = (al * (p - 1) + Math.max(0, -d)) / p
    res[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al)
  }
  return res
}

function calcMACD(v: number[], fast = 12, slow = 26, signal = 9) {
  const ef = calcEMA(v, fast), es = calcEMA(v, slow)
  const macd = ef.map((f, i) => f - es[i])
  const sig  = calcEMA(macd, signal)
  return { macd, signal: sig, histogram: macd.map((m, i) => m - sig[i]) }
}

function calcStoch(h: number[], l: number[], c: number[], k = 14, d = 3) {
  const kLine: (number | null)[] = c.map((cv, i) => {
    if (i < k - 1) return null
    const hh = Math.max(...h.slice(i - k + 1, i + 1))
    const ll = Math.min(...l.slice(i - k + 1, i + 1))
    return hh === ll ? 50 : ((cv - ll) / (hh - ll)) * 100
  })
  const kNonNull = kLine.map(v => v ?? 0)
  return { k: kLine, d: calcSMA(kNonNull, d) }
}

function calcCCI(h: number[], l: number[], c: number[], p = 20): (number | null)[] {
  return c.map((_, i) => {
    if (i < p - 1) return null
    const slice = c.slice(i - p + 1, i + 1).map((ci, j) => (h[i - p + 1 + j] + l[i - p + 1 + j] + ci) / 3)
    const tp = (h[i] + l[i] + c[i]) / 3
    const mean = slice.reduce((a, b) => a + b, 0) / p
    const md = slice.reduce((a, b) => a + Math.abs(b - mean), 0) / p
    return md === 0 ? 0 : (tp - mean) / (0.015 * md)
  })
}

function calcROC(v: number[], p = 12): (number | null)[] {
  return v.map((_, i) => {
    if (i < p) return null
    const prev = v[i - p]
    return prev === 0 ? 0 : ((v[i] - prev) / prev) * 100
  })
}

function calcWilliamsR(h: number[], l: number[], c: number[], p = 14): (number | null)[] {
  return c.map((cv, i) => {
    if (i < p - 1) return null
    const hh = Math.max(...h.slice(i - p + 1, i + 1))
    const ll = Math.min(...l.slice(i - p + 1, i + 1))
    return hh === ll ? -50 : ((hh - cv) / (hh - ll)) * -100
  })
}

function calcOBV(c: number[], vol: number[]): number[] {
  const res: number[] = [0]
  for (let i = 1; i < c.length; i++) {
    const prev = res[i - 1]
    if (c[i] > c[i - 1]) res.push(prev + vol[i])
    else if (c[i] < c[i - 1]) res.push(prev - vol[i])
    else res.push(prev)
  }
  return res
}

function calcVWAP(h: number[], l: number[], c: number[], vol: number[]): number[] {
  let cpv = 0, cv = 0
  return c.map((ci, i) => {
    const tp = (h[i] + l[i] + ci) / 3
    cpv += tp * vol[i]; cv += vol[i]
    return cv === 0 ? ci : cpv / cv
  })
}

function calcMFI(h: number[], l: number[], c: number[], vol: number[], p = 14): (number | null)[] {
  const tp = c.map((ci, i) => (h[i] + l[i] + ci) / 3)
  const mf = tp.map((t, i) => t * vol[i])
  return tp.map((_, i) => {
    if (i < p) return null
    let pos = 0, neg = 0
    for (let j = i - p + 1; j <= i; j++) {
      if (j === 0) continue
      if (tp[j] > tp[j - 1]) pos += mf[j]
      else neg += mf[j]
    }
    return neg === 0 ? 100 : 100 - 100 / (1 + pos / neg)
  })
}

function calcCMF(h: number[], l: number[], c: number[], vol: number[], p = 20): (number | null)[] {
  const mfv = c.map((ci, i) => {
    const range = h[i] - l[i]
    return range === 0 ? 0 : ((ci - l[i] - (h[i] - ci)) / range) * vol[i]
  })
  return c.map((_, i) => {
    if (i < p - 1) return null
    const sumMFV = mfv.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0)
    const sumVol = vol.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0)
    return sumVol === 0 ? 0 : sumMFV / sumVol
  })
}

function calcATR(h: number[], l: number[], c: number[], p = 14): (number | null)[] {
  if (h.length < 2) return new Array(h.length).fill(null)
  const tr = h.map((hi, i) => {
    if (i === 0) return hi - l[i]
    return Math.max(hi - l[i], Math.abs(hi - c[i - 1]), Math.abs(l[i] - c[i - 1]))
  })
  return calcSMA(tr, p)
}

function calcADX(h: number[], l: number[], c: number[], p = 14) {
  const n = c.length
  const adx: (number | null)[] = new Array(n).fill(null)
  const pdi: (number | null)[] = new Array(n).fill(null)
  const ndi: (number | null)[] = new Array(n).fill(null)
  if (n < p * 2 + 1) return { adx, pdi, ndi }

  const tr: number[] = [], pdm: number[] = [], ndm: number[] = []
  for (let i = 1; i < n; i++) {
    const upMove = h[i] - h[i - 1]
    const downMove = l[i - 1] - l[i]
    pdm.push(upMove > downMove && upMove > 0 ? upMove : 0)
    ndm.push(downMove > upMove && downMove > 0 ? downMove : 0)
    tr.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])))
  }

  let atr = tr.slice(0, p).reduce((a, b) => a + b, 0)
  let aPdm = pdm.slice(0, p).reduce((a, b) => a + b, 0)
  let aNdm = ndm.slice(0, p).reduce((a, b) => a + b, 0)

  const dx: number[] = []
  for (let i = p; i < tr.length; i++) {
    atr = atr - atr / p + tr[i]
    aPdm = aPdm - aPdm / p + pdm[i]
    aNdm = aNdm - aNdm / p + ndm[i]
    const pdiV = atr === 0 ? 0 : (aPdm / atr) * 100
    const ndiV = atr === 0 ? 0 : (aNdm / atr) * 100
    pdi[i + 1] = pdiV
    ndi[i + 1] = ndiV
    const denom = pdiV + ndiV
    dx.push(denom === 0 ? 0 : Math.abs(pdiV - ndiV) / denom * 100)
  }
  // ADX = SMA of DX over p periods
  for (let i = 0; i < dx.length; i++) {
    if (i >= p - 1) {
      adx[i + p + 1] = dx.slice(i - p + 1, i + 1).reduce((a, b) => a + b, 0) / p
    }
  }
  return { adx, pdi, ndi }
}

function calcKeltner(h: number[], l: number[], c: number[], p = 20, mult = 2) {
  const middle = calcEMA(c, p)
  const atr    = calcATR(h, l, c, p)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  middle.forEach((m, i) => {
    const a = atr[i]
    if (a == null) { upper.push(null); lower.push(null) }
    else { upper.push(m + mult * a); lower.push(m - mult * a) }
  })
  return { upper, middle: middle as (number | null)[], lower }
}

function calcIchimoku(h: number[], l: number[], p1 = 9, p2 = 26, p3 = 52) {
  const mid = (arr: number[], i: number, p: number) => {
    if (i < p - 1) return null
    const slice = arr.slice(i - p + 1, i + 1)
    return (Math.max(...slice.map((_, j) => h[i - p + 1 + j])) + Math.min(...slice.map((_, j) => l[i - p + 1 + j]))) / 2
  }
  const tenkan:  (number | null)[] = h.map((_, i) => mid(h, i, p1))
  const kijun:   (number | null)[] = h.map((_, i) => mid(h, i, p2))
  const senkouA: (number | null)[] = tenkan.map((t, i) => t != null && kijun[i] != null ? (t + kijun[i]!) / 2 : null)
  const senkouB: (number | null)[] = h.map((_, i) => mid(h, i, p3))
  return { tenkan, kijun, senkouA, senkouB }
}

function calcLinReg(v: number[], p: number) {
  const line: (number | null)[] = []
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  v.forEach((_, i) => {
    if (i < p - 1) { line.push(null); upper.push(null); lower.push(null); return }
    const slice = v.slice(i - p + 1, i + 1)
    const n = slice.length
    const mx = (n - 1) / 2
    const my = slice.reduce((a, b) => a + b, 0) / n
    let ssxy = 0, ssx = 0
    for (let j = 0; j < n; j++) { ssxy += (j - mx) * (slice[j] - my); ssx += (j - mx) ** 2 }
    const b = ssx === 0 ? 0 : ssxy / ssx
    const a = my - b * mx
    const fitted = slice.map((_, j) => a + b * j)
    const lastFit = fitted[n - 1]
    const std = Math.sqrt(slice.reduce((s, y, j) => s + (y - fitted[j]) ** 2, 0) / n)
    line.push(lastFit)
    upper.push(lastFit + 2 * std)
    lower.push(lastFit - 2 * std)
  })
  return { line, upper, lower }
}

function calcPivots(h: number[], l: number[], c: number[]): { pp: number; r1: number; r2: number; s1: number; s2: number }[] {
  return c.map((_, i) => {
    const pp = (h[i] + l[i] + c[i]) / 3
    return {
      pp,
      r1: 2 * pp - l[i],
      r2: pp + (h[i] - l[i]),
      s1: 2 * pp - h[i],
      s2: pp - (h[i] - l[i]),
    }
  })
}

/* ══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
══════════════════════════════════════════════════════════════ */
type ChartStyle = 'area' | 'line' | 'candles'
type DrawTool   = 'pointer' | 'trend' | 'horizontal' | 'vertical' | 'rect' | 'fib' | 'erase'
interface DrawPoint { price: number; time: string }
interface Drawing   { id: string; type: DrawTool; color: string; p1: DrawPoint; p2: DrawPoint }

type IndicatorId =
  | 'mm' | 'macd' | 'bb' | 'ichimoku' | 'adx' | 'rsi' | 'stoch'
  | 'cci' | 'roc' | 'williams' | 'obv' | 'vwap' | 'mfi' | 'cmf'
  | 'atr' | 'keltner' | 'pivot' | 'linreg'

interface ParamDef {
  key: string
  label: string
  type: 'number' | 'select'
  options?: { value: number; label: string }[]
  min?: number
  max?: number
  step?: number
}

interface IndicatorDef {
  id: IndicatorId
  label: string
  category: 'Tendance' | 'Momentum' | 'Volume' | 'Volatilité' | 'Support/Rés.'
  desc: string
  isOsc: boolean
  defaultColor: string
  params: ParamDef[]
}

interface ActiveIndicator {
  instanceId: string
  type: IndicatorId
  params: Record<string, number | string>
  color: string
  visible: boolean
}

const CHART_H = 400
const OSC_H   = 130

const FIB_LEVELS = [
  { r: 0, label: '0%', color: '#ef4444' },
  { r: 0.236, label: '23.6%', color: '#f97316' },
  { r: 0.382, label: '38.2%', color: '#eab308' },
  { r: 0.5,   label: '50%',   color: '#10b981' },
  { r: 0.618, label: '61.8%', color: '#3b82f6' },
  { r: 0.786, label: '78.6%', color: '#8b5cf6' },
  { r: 1,     label: '100%',  color: '#ef4444' },
]

const PERIODS: { label: string; value: Period }[] = [
  { label: '1M', value: '1m' }, { label: '3M', value: '3m' }, { label: '6M', value: '6m' },
  { label: '1A', value: '1y' }, { label: '3A', value: '3y' }, { label: '5A', value: '5y' },
  { label: '10A', value: '10y' }, { label: 'MAX', value: 'max' },
]

const STYLES: { label: string; value: ChartStyle; icon: string }[] = [
  { label: 'Zone',    value: 'area',    icon: '◿' },
  { label: 'Ligne',   value: 'line',    icon: '╱' },
  { label: 'Bougies', value: 'candles', icon: '▌' },
]

const DRAW_TOOLS: { value: DrawTool; label: string; icon: string }[] = [
  { value: 'pointer',    label: 'Sélection',   icon: '↖' },
  { value: 'trend',      label: 'Tendance',    icon: '╱' },
  { value: 'horizontal', label: 'Horizontale', icon: '─' },
  { value: 'vertical',   label: 'Verticale',   icon: '│' },
  { value: 'rect',       label: 'Zone',        icon: '▭' },
  { value: 'fib',        label: 'Fibonacci',   icon: 'φ' },
  { value: 'erase',      label: 'Effacer',     icon: '✕' },
]

const DRAW_COLORS = ['#ef4444','#f97316','#eab308','#10b981','#3b82f6','#8b5cf6','#94a3b8','#ffffff']

const INDICATOR_DEFS: IndicatorDef[] = [
  {
    id: 'mm', label: 'Moyenne Mobile', category: 'Tendance',
    desc: 'SMA / EMA / WMA sur période configurable\nLisse le prix pour identifier la tendance directrice',
    isOsc: false, defaultColor: '#f59e0b',
    params: [
      { key: 'period', label: 'Période', type: 'number', min: 2, max: 500, step: 1 },
      { key: 'maType', label: 'Type', type: 'select', options: [{ value: 0, label: 'SMA' }, { value: 1, label: 'EMA' }, { value: 2, label: 'WMA' }] },
    ],
  },
  {
    id: 'macd', label: 'MACD', category: 'Tendance',
    desc: 'Moving Average Convergence/Divergence (12,26,9)\nCroisements MACD/Signal comme signaux d\'entrée',
    isOsc: true, defaultColor: '#3b82f6',
    params: [
      { key: 'fast',   label: 'Rapide', type: 'number', min: 2, max: 100, step: 1 },
      { key: 'slow',   label: 'Lent',   type: 'number', min: 2, max: 200, step: 1 },
      { key: 'signal', label: 'Signal', type: 'number', min: 2, max: 50,  step: 1 },
    ],
  },
  {
    id: 'bb', label: 'Bollinger Bands', category: 'Volatilité',
    desc: 'Bandes de Bollinger (période, ±écart-type)\nMesure la volatilité et signale les excès de prix',
    isOsc: false, defaultColor: '#06b6d4',
    params: [
      { key: 'period', label: 'Période', type: 'number', min: 2, max: 200, step: 1 },
      { key: 'mult',   label: 'Mult σ',  type: 'number', min: 0.5, max: 5, step: 0.5 },
    ],
  },
  {
    id: 'ichimoku', label: 'Ichimoku', category: 'Tendance',
    desc: 'Nuage Ichimoku (Tenkan/Kijun/Senkou A & B)\nSystème complet de support, résistance et tendance',
    isOsc: false, defaultColor: '#8b5cf6',
    params: [
      { key: 'tenkan', label: 'Tenkan', type: 'number', min: 2, max: 100, step: 1 },
      { key: 'kijun',  label: 'Kijun',  type: 'number', min: 2, max: 200, step: 1 },
      { key: 'senkou', label: 'Senkou', type: 'number', min: 2, max: 500, step: 1 },
    ],
  },
  {
    id: 'adx', label: 'ADX', category: 'Tendance',
    desc: 'Average Directional Index + DI+/DI-\nMesure la force de la tendance (>25 = tendance forte)',
    isOsc: true, defaultColor: '#f59e0b',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 2, max: 100, step: 1 }],
  },
  {
    id: 'rsi', label: 'RSI', category: 'Momentum',
    desc: 'Relative Strength Index (0–100)\n>70 surachat, <30 survente — divergences puissantes',
    isOsc: true, defaultColor: '#8b5cf6',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 2, max: 100, step: 1 }],
  },
  {
    id: 'stoch', label: 'Stochastique', category: 'Momentum',
    desc: 'Stochastique %K/%D — compare la clôture au range récent\n>80 surachat, <20 survente',
    isOsc: true, defaultColor: '#3b82f6',
    params: [
      { key: 'k', label: '%K', type: 'number', min: 2, max: 100, step: 1 },
      { key: 'd', label: '%D', type: 'number', min: 1, max: 20,  step: 1 },
    ],
  },
  {
    id: 'cci', label: 'CCI', category: 'Momentum',
    desc: 'Commodity Channel Index — mesure l\'écart au prix typique moyen\n>100 surachet, <-100 survendu',
    isOsc: true, defaultColor: '#ec4899',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 2, max: 200, step: 1 }],
  },
  {
    id: 'roc', label: 'ROC', category: 'Momentum',
    desc: 'Rate Of Change — variation en % sur n périodes\nMesure la vélocité du prix',
    isOsc: true, defaultColor: '#14b8a6',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 1, max: 200, step: 1 }],
  },
  {
    id: 'williams', label: 'Williams %R', category: 'Momentum',
    desc: 'Williams %R — oscillateur de momentum (−100 à 0)\n>−20 surachat, <−80 survendu',
    isOsc: true, defaultColor: '#f97316',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 2, max: 100, step: 1 }],
  },
  {
    id: 'obv', label: 'OBV', category: 'Volume',
    desc: 'On Balance Volume — cumule le volume selon la direction\nDivergences OBV/prix = signaux forts',
    isOsc: true, defaultColor: '#10b981',
    params: [],
  },
  {
    id: 'vwap', label: 'VWAP', category: 'Volume',
    desc: 'Volume Weighted Average Price — prix moyen pondéré par le volume\nRéférence institutionnelle',
    isOsc: false, defaultColor: '#94a3b8',
    params: [],
  },
  {
    id: 'mfi', label: 'MFI', category: 'Volume',
    desc: 'Money Flow Index — RSI pondéré par le volume (0–100)\n>80 surachat, <20 survendu',
    isOsc: true, defaultColor: '#6366f1',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 2, max: 100, step: 1 }],
  },
  {
    id: 'cmf', label: 'CMF', category: 'Volume',
    desc: 'Chaikin Money Flow — flux monétaire sur n périodes\n>0 = pression acheteuse, <0 = vendeuse',
    isOsc: true, defaultColor: '#0ea5e9',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 2, max: 100, step: 1 }],
  },
  {
    id: 'atr', label: 'ATR', category: 'Volatilité',
    desc: 'Average True Range — volatilité absolue sur n périodes\nUtile pour calibrer les stops',
    isOsc: true, defaultColor: '#f97316',
    params: [{ key: 'period', label: 'Période', type: 'number', min: 2, max: 100, step: 1 }],
  },
  {
    id: 'keltner', label: 'Keltner', category: 'Volatilité',
    desc: 'Bandes de Keltner (EMA ± ATR × mult)\nAlternative aux Bollinger — moins de faux signaux',
    isOsc: false, defaultColor: '#a855f7',
    params: [
      { key: 'period', label: 'Période', type: 'number', min: 2, max: 200, step: 1 },
      { key: 'mult',   label: 'Mult ATR', type: 'number', min: 0.5, max: 5, step: 0.5 },
    ],
  },
  {
    id: 'pivot', label: 'Pivots', category: 'Support/Rés.',
    desc: 'Points pivots (PP, R1/R2, S1/S2) calculés sur chaque bougie\nNiveaux de support/résistance clés',
    isOsc: false, defaultColor: '#94a3b8',
    params: [],
  },
  {
    id: 'linreg', label: 'Droite de Régression', category: 'Tendance',
    desc: 'Régression linéaire glissante + canaux ±2σ\nIdentifie la tendance statistique et ses limites',
    isOsc: false, defaultColor: '#f59e0b',
    params: [
      { key: 'period', label: 'Période', type: 'number', min: 5, max: 500, step: 1 },
      { key: 'channels', label: 'Canaux ±2σ', type: 'select', options: [{ value: 1, label: 'Oui' }, { value: 0, label: 'Non' }] },
    ],
  },
]

const DEFAULT_PARAMS: Record<IndicatorId, Record<string, number | string>> = {
  mm:       { period: 20, maType: 0 },
  macd:     { fast: 12, slow: 26, signal: 9 },
  bb:       { period: 20, mult: 2 },
  ichimoku: { tenkan: 9, kijun: 26, senkou: 52 },
  adx:      { period: 14 },
  rsi:      { period: 14 },
  stoch:    { k: 14, d: 3 },
  cci:      { period: 20 },
  roc:      { period: 12 },
  williams: { period: 14 },
  obv:      {},
  vwap:     {},
  mfi:      { period: 14 },
  cmf:      { period: 20 },
  atr:      { period: 14 },
  keltner:  { period: 20, mult: 2 },
  pivot:    {},
  linreg:   { period: 50, channels: 1 },
}

function indicatorLabel(ind: ActiveIndicator): string {
  const def = INDICATOR_DEFS.find(d => d.id === ind.type)!
  switch (ind.type) {
    case 'mm': {
      const tp = Number(ind.params.maType) === 1 ? 'EMA' : Number(ind.params.maType) === 2 ? 'WMA' : 'SMA'
      return `MM ${ind.params.period} ${tp}`
    }
    case 'macd':    return `MACD (${ind.params.fast},${ind.params.slow},${ind.params.signal})`
    case 'bb':      return `BB (${ind.params.period}, ${ind.params.mult})`
    case 'ichimoku':return `Ichimoku (${ind.params.tenkan},${ind.params.kijun},${ind.params.senkou})`
    case 'adx':     return `ADX ${ind.params.period}`
    case 'rsi':     return `RSI ${ind.params.period}`
    case 'stoch':   return `Stoch (${ind.params.k},${ind.params.d})`
    case 'cci':     return `CCI ${ind.params.period}`
    case 'roc':     return `ROC ${ind.params.period}`
    case 'williams':return `W%R ${ind.params.period}`
    case 'obv':     return 'OBV'
    case 'vwap':    return 'VWAP'
    case 'mfi':     return `MFI ${ind.params.period}`
    case 'cmf':     return `CMF ${ind.params.period}`
    case 'atr':     return `ATR ${ind.params.period}`
    case 'keltner': return `Keltner (${ind.params.period}, ${ind.params.mult})`
    case 'pivot':   return 'Pivots'
    case 'linreg':  return `LR ${ind.params.period}`
    default:        return def?.label ?? ind.type
  }
}

let _instanceCounter = 0
function nextId(): string { return `ind_${++_instanceCounter}_${Date.now()}` }

/* ══════════════════════════════════════════════════════════════
   CHART FACTORY
══════════════════════════════════════════════════════════════ */
function makeChart(el: HTMLElement, height: number): IChartApi {
  return createChart(el, {
    height,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#64748b',
      fontFamily: "'Inter', 'system-ui', sans-serif",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: '#f1f5f9', style: LineStyle.Solid },
      horzLines: { color: '#f1f5f9', style: LineStyle.Solid },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: '#94a3b8', labelBackgroundColor: '#334155' },
      horzLine: { color: '#94a3b8', labelBackgroundColor: '#334155' },
    },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, timeVisible: false, secondsVisible: false, barSpacing: 8 },
    handleScroll: true,
    handleScale: true,
  })
}

/* ══════════════════════════════════════════════════════════════
   CANVAS DRAWING HELPERS  (no React render — no crash possible)
══════════════════════════════════════════════════════════════ */
function canvasDraw(
  ctx: CanvasRenderingContext2D,
  d: Drawing,
  preview: boolean,
  w: number, h: number,
  px: (p: DrawPoint) => { x: number; y: number },
) {
  try {
    const { x: x1, y: y1 } = px(d.p1)
    const { x: x2, y: y2 } = px(d.p2)
    ctx.save()
    ctx.globalAlpha = preview ? 0.55 : 1
    switch (d.type) {
      case 'trend': {
        const slope = x2 !== x1 ? (y2 - y1) / (x2 - x1) : 0
        const yL = y1 - x1 * slope, yR = y1 + (w - x1) * slope
        ctx.globalAlpha = preview ? 0.25 : 0.35
        ctx.strokeStyle = d.color; ctx.lineWidth = 1; ctx.setLineDash([5, 4])
        ctx.beginPath(); ctx.moveTo(0, yL); ctx.lineTo(w, yR); ctx.stroke()
        ctx.globalAlpha = preview ? 0.55 : 1
        ctx.lineWidth = 2; ctx.setLineDash([])
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
        ctx.fillStyle = d.color
        ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI * 2); ctx.fill()
        break
      }
      case 'horizontal': {
        ctx.strokeStyle = d.color; ctx.lineWidth = 1.5; ctx.setLineDash([7, 3])
        ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(w, y1); ctx.stroke()
        ctx.setLineDash([]); ctx.fillStyle = d.color
        ctx.fillRect(4, y1 - 9, 72, 16)
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(Math.round(d.p1.price).toLocaleString('fr-FR'), 40, y1)
        break
      }
      case 'vertical': {
        ctx.strokeStyle = d.color; ctx.lineWidth = 1.5; ctx.setLineDash([7, 3])
        ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, h); ctx.stroke()
        break
      }
      case 'rect': {
        const rx = Math.min(x1, x2), ry = Math.min(y1, y2)
        const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1)
        ctx.setLineDash([]); ctx.fillStyle = d.color
        ctx.globalAlpha = preview ? 0.08 : 0.12
        ctx.fillRect(rx, ry, rw, rh)
        ctx.globalAlpha = preview ? 0.55 : 1
        ctx.strokeStyle = d.color; ctx.lineWidth = 1.5
        ctx.strokeRect(rx, ry, rw, rh)
        break
      }
      case 'fib': {
        const xL = Math.min(x1, x2), xR = Math.max(x1, x2)
        FIB_LEVELS.forEach(f => {
          try {
            const price = d.p1.price + f.r * (d.p2.price - d.p1.price)
            const fy = px({ ...d.p1, price }).y
            ctx.strokeStyle = f.color; ctx.lineWidth = 1; ctx.setLineDash([5, 3])
            ctx.globalAlpha = preview ? 0.4 : 0.85
            ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(w, fy); ctx.stroke()
            ctx.setLineDash([]); ctx.fillStyle = f.color
            ctx.globalAlpha = preview ? 0.4 : 0.9
            ctx.fillRect(xL, fy - 8, 38, 14)
            ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(f.label, xL + 19, fy)
            ctx.fillStyle = f.color; ctx.textAlign = 'left'
            ctx.globalAlpha = preview ? 0.4 : 1
            ctx.fillText(Math.round(price).toLocaleString('fr-FR'), xR + 4, fy)
          } catch { /* skip bad fib level */ }
        })
        break
      }
    }
    ctx.restore()
  } catch { /* skip bad drawing */ }
}

function hitTest(
  d: Drawing,
  cx: number, cy: number,
  px: (p: DrawPoint) => { x: number; y: number },
): boolean {
  try {
    const { x: x1, y: y1 } = px(d.p1)
    const { x: x2, y: y2 } = px(d.p2)
    const T = 8
    switch (d.type) {
      case 'horizontal': return Math.abs(cy - y1) < T
      case 'vertical':   return Math.abs(cx - x1) < T
      case 'trend': {
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        if (len === 0) return false
        return Math.abs((y2 - y1) * cx - (x2 - x1) * cy + x2 * y1 - y2 * x1) / len < T
      }
      case 'rect': {
        const rx = Math.min(x1, x2), ry = Math.min(y1, y2)
        return cx >= rx && cx <= rx + Math.abs(x2-x1) && cy >= ry && cy <= ry + Math.abs(y2-y1)
      }
      case 'fib': return FIB_LEVELS.some(f => {
        try {
          const fy = px({ ...d.p1, price: d.p1.price + f.r * (d.p2.price - d.p1.price) }).y
          return Math.abs(cy - fy) < T
        } catch { return false }
      })
      default: return false
    }
  } catch { return false }
}

/* ══════════════════════════════════════════════════════════════
   STYLE PICKER COMPONENT
══════════════════════════════════════════════════════════════ */
interface StylePickerProps {
  value: ChartStyle
  onChange: (v: ChartStyle) => void
}
function StylePicker({ value, onChange }: StylePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cur = STYLES.find(s => s.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brvm-border rounded-lg text-xs font-semibold text-brvm-subtext hover:border-brvm-green/50 transition-colors"
      >
        <span className="font-mono leading-none">{cur.icon}</span>
        <span>{cur.label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-brvm-border rounded-xl shadow-xl z-50 overflow-hidden py-1 min-w-[120px]">
          {STYLES.map(s => (
            <button key={s.value} onClick={() => { onChange(s.value); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${s.value === value ? 'text-brvm-green font-bold' : 'text-brvm-subtext'}`}>
              <span className="font-mono leading-none">{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   DRAW PICKER COMPONENT
══════════════════════════════════════════════════════════════ */
interface DrawPickerProps {
  value: DrawTool
  onChange: (v: DrawTool) => void
  color: string
  onColor: (c: string) => void
}
function DrawPicker({ value, onChange, color, onColor }: DrawPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cur = DRAW_TOOLS.find(t => t.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${value !== 'pointer' ? 'border-brvm-green bg-brvm-green/5 text-brvm-green' : 'border-brvm-border bg-white text-brvm-subtext hover:border-brvm-green/50'}`}
        >
          <span className="font-mono leading-none">{cur.icon}</span>
          <span className="hidden sm:inline">{cur.label}</span>
          <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-brvm-border rounded-xl shadow-xl z-50 overflow-hidden py-1 min-w-[140px]">
            {DRAW_TOOLS.map(t => (
              <button key={t.value} onClick={() => { onChange(t.value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${t.value === value ? 'text-brvm-green font-bold' : 'text-brvm-subtext'}`}>
                <span className="font-mono text-sm leading-none w-4 text-center">{t.icon}</span>{t.label}
              </button>
            ))}
            <div className="border-t border-brvm-border mx-2 my-1" />
            <div className="px-3 py-2 flex flex-wrap gap-1.5">
              {DRAW_COLORS.map(c => (
                <button key={c} onClick={() => onColor(c)}
                  className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-brvm-text scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   INDICATOR PICKER COMPONENT
══════════════════════════════════════════════════════════════ */
interface IndicatorPickerProps {
  indicators: ActiveIndicator[]
  onAdd: (type: IndicatorId) => void
}
function IndicatorPicker({ indicators, onAdd }: IndicatorPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const q = search.toLowerCase()
  const filtered = INDICATOR_DEFS.filter(d => !q || d.label.toLowerCase().includes(q) || d.id.includes(q) || d.category.toLowerCase().includes(q))
  const categories: IndicatorDef['category'][] = ['Tendance', 'Momentum', 'Volume', 'Volatilité', 'Support/Rés.']

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(v => !v); setSearch('') }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${open ? 'border-brvm-green bg-brvm-green/5 text-brvm-green' : 'border-brvm-border bg-white text-brvm-subtext hover:border-brvm-green/50'}`}
      >
        <Plus size={13} />
        Indicateurs
        {indicators.length > 0 && (
          <span className="bg-brvm-green text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {indicators.length}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-brvm-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-brvm-border">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brvm-muted" />
              <input
                autoFocus type="text" placeholder="Rechercher un indicateur…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:ring-2 focus:ring-brvm-green/20"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-80 py-1">
            {categories.map(cat => {
              const items = filtered.filter(d => d.category === cat)
              if (items.length === 0) return null
              return (
                <div key={cat}>
                  <p className="px-3 py-1 text-[10px] font-bold text-brvm-muted uppercase tracking-wider">{cat}</p>
                  {items.map(def => (
                    <button key={def.id}
                      onClick={() => { onAdd(def.id); setOpen(false) }}
                      className="w-full flex items-start gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: def.defaultColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-brvm-subtext">{def.label}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-brvm-muted font-medium">{def.isOsc ? 'OSC' : 'OVL'}</span>
                        </div>
                        <p className="text-[10px] text-brvm-muted leading-snug mt-0.5">{def.desc.split('\n')[0]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            })}
            {filtered.length === 0 && <p className="text-center py-6 text-brvm-muted text-xs">Aucun résultat</p>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PARAM EDITOR COMPONENT
══════════════════════════════════════════════════════════════ */
const PARAM_COLORS = [
  '#ef4444','#f97316','#eab308','#10b981','#06b6d4','#3b82f6',
  '#8b5cf6','#ec4899','#94a3b8','#f59e0b','#14b8a6','#6366f1',
  '#a855f7','#0ea5e9','#84cc16','#ffffff',
]

interface ParamEditorProps {
  indicator: ActiveIndicator
  onApply: (params: Record<string, number | string>, color: string) => void
  onClose: () => void
}
function ParamEditor({ indicator, onApply, onClose }: ParamEditorProps) {
  const def = INDICATOR_DEFS.find(d => d.id === indicator.type)!
  const [local, setLocal] = useState<Record<string, number | string>>({ ...indicator.params })
  const [color, setColor] = useState(indicator.color)

  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-brvm-border rounded-xl shadow-xl p-3 min-w-[200px]" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-bold text-brvm-text mb-2">{def?.label ?? indicator.type}</p>
      {def?.params.map(p => (
        <div key={p.key} className="mb-2">
          <label className="block text-[10px] text-brvm-muted mb-1">{p.label}</label>
          {p.type === 'select' ? (
            <select
              value={String(local[p.key] ?? '')}
              onChange={e => setLocal(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
              className="w-full bg-slate-50 border border-brvm-border rounded-lg px-2 py-1 text-xs text-brvm-text focus:outline-none focus:ring-2 focus:ring-brvm-green/20"
            >
              {p.options?.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min={p.min} max={p.max} step={p.step ?? 1}
              value={local[p.key] as number}
              onChange={e => setLocal(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
              className="w-full bg-slate-50 border border-brvm-border rounded-lg px-2 py-1 text-xs text-brvm-text focus:outline-none focus:ring-2 focus:ring-brvm-green/20"
            />
          )}
        </div>
      ))}
      {/* Color picker */}
      <div className="mb-2">
        <label className="block text-[10px] text-brvm-muted mb-1">Couleur</label>
        <div className="flex flex-wrap gap-1.5">
          {PARAM_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-brvm-text scale-110' : 'border-transparent'}`}
              style={{ background: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #cbd5e1' : undefined }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => { onApply(local, color); onClose() }}
          className="flex-1 bg-brvm-green text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-brvm-green/90 transition-colors"
        >
          Appliquer
        </button>
        <button onClick={onClose} className="px-2 py-1.5 text-xs text-brvm-muted hover:text-brvm-text">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   INDICATOR CHIPS ROW
══════════════════════════════════════════════════════════════ */
interface ChipsRowProps {
  indicators: ActiveIndicator[]
  activeOscTab: string | null
  onToggleVisible: (id: string) => void
  onRemove: (id: string) => void
  onUpdateParams: (id: string, params: Record<string, number | string>, color: string) => void
  onSetOscTab: (id: string) => void
}
function ChipsRow({ indicators, activeOscTab, onToggleVisible, onRemove, onUpdateParams, onSetOscTab }: ChipsRowProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (indicators.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-brvm-border bg-slate-50/40">
      {indicators.map(ind => {
        const def = INDICATOR_DEFS.find(d => d.id === ind.type)
        const isEditing = editingId === ind.instanceId
        const isActiveOsc = def?.isOsc && activeOscTab === ind.instanceId
        return (
          <div
            key={ind.instanceId}
            className={`relative flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-xs cursor-pointer select-none transition-colors ${isEditing ? 'border-brvm-green shadow-sm' : 'border-brvm-border hover:border-brvm-green/50'}`}
            onClick={() => setEditingId(isEditing ? null : ind.instanceId)}
          >
            {/* Dot */}
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ind.color, opacity: ind.visible ? 1 : 0.35 }} />
            {/* Label */}
            <span className={`font-semibold ${ind.visible ? (isActiveOsc ? 'text-brvm-green' : 'text-brvm-subtext') : 'text-brvm-muted'}`}>
              {indicatorLabel(ind)}
            </span>
            {/* Osc tab switch */}
            {def?.isOsc && (
              <button
                onClick={e => { e.stopPropagation(); onSetOscTab(ind.instanceId) }}
                className={`transition-colors ${isActiveOsc ? 'text-brvm-green' : 'text-brvm-muted hover:text-brvm-green'}`}
                title="Afficher dans l'oscillateur"
              >
                <BarChart2 size={11} className={ind.visible ? '' : 'opacity-30'} />
              </button>
            )}
            {/* Visibility */}
            <button
              onClick={e => { e.stopPropagation(); onToggleVisible(ind.instanceId) }}
              className="text-brvm-muted hover:text-brvm-text transition-colors"
              title={ind.visible ? 'Masquer' : 'Afficher'}
            >
              <Settings2 size={11} className={isEditing ? 'text-brvm-green' : ''} />
            </button>
            {/* Remove */}
            <button
              onClick={e => { e.stopPropagation(); onRemove(ind.instanceId) }}
              className="text-brvm-muted hover:text-red-500 transition-colors"
              title="Supprimer"
            >
              <X size={11} />
            </button>
            {/* Param editor popover */}
            {isEditing && (
              <ParamEditor
                indicator={ind}
                onApply={(params, color) => onUpdateParams(ind.instanceId, params, color)}
                onClose={() => setEditingId(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════ */
export default function LiveChart() {
  /* ── UI state ── */
  const [companies,  setCompanies]  = useState<Company[]>([])
  const [ticker,     setTicker]     = useState('UNXC')
  const [search,     setSearch]     = useState('')
  const [dropOpen,   setDropOpen]   = useState(false)
  const [mainTab,    setMainTab]    = useState<'ta'|'fa'|'news'|'summary'|'reco'>('ta')
  const dropRef = useRef<HTMLDivElement>(null)

  /* ── Data state ── */
  const [allData,    setAllData]    = useState<HistoryEntry[]>([])
  const [period,     setPeriod]     = useState<Period>('1y')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  /* ── Indicator state ── */
  const [indicators,   setIndicators]   = useState<ActiveIndicator[]>([])
  const [activeOscTab, setActiveOscTab] = useState<string | null>(null)

  /* ── Drawing state ── */
  const [drawTool,   setDrawTool]   = useState<DrawTool>('pointer')
  const [drawColor,  setDrawColor]  = useState('#ef4444')
  const [drawings,   setDrawings]   = useState<Drawing[]>([])
  const [inProgress, setInProgress] = useState<Drawing | null>(null)
  const [overlayV,   setOverlayV]   = useState(0)

  /* ── Chart refs — main ── */
  const chartDivRef    = useRef<HTMLDivElement>(null)
  const chartRef       = useRef<IChartApi | null>(null)
  const priceSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Area'> | ISeriesApi<'Line'> | null>(null)
  const volSeriesRef   = useRef<ISeriesApi<'Histogram'> | null>(null)
  const [seriesV,    setSeriesV]    = useState(0)
  const [chartSize,  setChartSize]  = useState({ w: 0, h: CHART_H })

  /* ── Chart refs — oscillator ── */
  const oscDivRef = useRef<HTMLDivElement>(null)
  const oscRef    = useRef<IChartApi | null>(null)

  /* ── Indicator series maps ── */
  const indicatorSeriesMap = useRef<Map<string, ISeriesApi<'Line'| 'Area' | 'Histogram'>[]>>(new Map())
  const oscSeriesMap       = useRef<Map<string, ISeriesApi<'Line' | 'Histogram'>[]>>(new Map())

  /* ── Canvas drawing overlay ── */
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)

  /* ── Drawing refs (avoid stale closures) ── */
  const drawToolRef    = useRef<DrawTool>('pointer')
  const drawColorRef   = useRef('#ef4444')
  const inProgressRef  = useRef<Drawing | null>(null)
  const canvasBoundsRef = useRef<DOMRect | null>(null)
  const toPixelRef     = useRef<(p: DrawPoint) => { x: number; y: number }>(() => ({ x: 0, y: 0 }))

  useEffect(() => { drawToolRef.current  = drawTool  }, [drawTool])
  useEffect(() => { drawColorRef.current = drawColor }, [drawColor])

  /* ── Close company dropdown on outside click ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* ── Fetch companies ── */
  useEffect(() => {
    fetch('/api/companies').then(r => r.json())
      .then(j => setCompanies(Array.isArray(j) ? j : (j.data ?? []))).catch(() => {})
  }, [])

  /* ── Load history ── */
  const load = useCallback(async (t: string) => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/companies/${t}/history`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setAllData(Array.isArray(json) ? json : (json.data ?? []))
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally     { setLoading(false) }
  }, [])
  useEffect(() => { load(ticker) }, [ticker, load])

  /* ── Main chart init (mount only) ── */
  useEffect(() => {
    if (!chartDivRef.current) return
    const chart = makeChart(chartDivRef.current, CHART_H)
    chartRef.current = chart

    const vol = chart.addHistogramSeries({
      color: '#10b98155',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    } as Parameters<IChartApi['addHistogramSeries']>[0])
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    volSeriesRef.current = vol

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => setOverlayV(v => v + 1))

    const obs = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      chart.applyOptions({ width: w })
      setChartSize({ w, h: CHART_H })
    })
    obs.observe(chartDivRef.current)

    return () => {
      obs.disconnect()
      chart.remove()
      chartRef.current = null
      priceSeriesRef.current = null
      volSeriesRef.current = null
    }
  }, [])

  /* ── Oscillator chart — always in DOM, only populated when needed ── */
  useEffect(() => {
    if (!oscDivRef.current) return
    const osc = makeChart(oscDivRef.current, OSC_H)
    osc.applyOptions({
      rightPriceScale: {
        mode: PriceScaleMode.Normal,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    })
    oscRef.current = osc

    const h1 = (r: { from: number; to: number } | null) => { if (r) osc.timeScale().setVisibleLogicalRange(r) }
    const h2 = (r: { from: number; to: number } | null) => { if (r) chartRef.current?.timeScale().setVisibleLogicalRange(r) }
    chartRef.current?.timeScale().subscribeVisibleLogicalRangeChange(h1)
    osc.timeScale().subscribeVisibleLogicalRangeChange(h2)

    const obs = new ResizeObserver(([e]) => osc.applyOptions({ width: e.contentRect.width }))
    obs.observe(oscDivRef.current)

    return () => {
      obs.disconnect()
      chartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(h1)
      osc.timeScale().unsubscribeVisibleLogicalRangeChange(h2)
      osc.remove()
      oscRef.current = null
    }
  }, [])

  /* ── Price series — recreated when chartStyle changes ── */
  useEffect(() => {
    const chart = chartRef.current; if (!chart) return
    if (priceSeriesRef.current) {
      try { chart.removeSeries(priceSeriesRef.current) } catch {}
      priceSeriesRef.current = null
    }
    if (chartStyle === 'candles') {
      priceSeriesRef.current = chart.addCandlestickSeries({
        upColor: '#10b981', downColor: '#ef4444',
        borderUpColor: '#10b981', borderDownColor: '#ef4444',
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
      })
    } else if (chartStyle === 'area') {
      priceSeriesRef.current = chart.addAreaSeries({
        lineColor: '#10b981', topColor: '#10b98130', bottomColor: '#10b98100',
        lineWidth: 2 as const,
      })
    } else {
      priceSeriesRef.current = chart.addLineSeries({ color: '#10b981', lineWidth: 2 as const })
    }
    setSeriesV(v => v + 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartStyle])

  /* ── Filtered data ── */
  const filteredData = useMemo(
    () => [...filterByPeriod(allData, period)].sort((a, b) => a.date.localeCompare(b.date)),
    [allData, period],
  )

  /* ── Push price + volume data ── */
  useEffect(() => {
    const series = priceSeriesRef.current, vol = volSeriesRef.current
    if (!series || !filteredData.length) return
    try {
      if (chartStyle === 'candles') {
        (series as ISeriesApi<'Candlestick'>).setData(filteredData.map(d => ({
          time: d.date as Time,
          open:  Number(d.open)  || Number(d.close),
          high:  Number(d.high)  || Number(d.close),
          low:   Number(d.low)   || Number(d.close),
          close: Number(d.close),
        })))
      } else {
        (series as ISeriesApi<'Area'> | ISeriesApi<'Line'>).setData(
          filteredData.map(d => ({ time: d.date as Time, value: Number(d.close) }))
        )
      }
      vol?.setData(filteredData.map(d => ({
        time: d.date as Time,
        value: Number(d.volume) || 0,
        color: Number(d.close) >= Number(d.open ?? d.close) ? '#10b98155' : '#ef444455',
      })))
      chartRef.current?.timeScale().fitContent()
    } catch { /* series was removed */ }
  }, [filteredData, seriesV, chartStyle])

  /* ── All indicator series (overlay + oscillator) ── */
  useEffect(() => {
    const chart = chartRef.current
    const osc   = oscRef.current
    if (!chart) return

    // Remove all existing overlay series
    indicatorSeriesMap.current.forEach(arr =>
      arr.forEach(s => { try { chart.removeSeries(s) } catch {} })
    )
    indicatorSeriesMap.current.clear()

    // Remove all existing oscillator series
    oscSeriesMap.current.forEach(arr =>
      arr.forEach(s => { try { osc?.removeSeries(s) } catch {} })
    )
    oscSeriesMap.current.clear()

    if (!filteredData.length) return

    const closes  = filteredData.map(d => Number(d.close))
    const highs   = filteredData.map(d => Number(d.high  ?? d.close))
    const lows    = filteredData.map(d => Number(d.low   ?? d.close))
    const volumes = filteredData.map(d => Number(d.volume) || 0)
    const times   = filteredData.map(d => d.date as Time)

    // Helper: add line series to main chart
    const addLine = (
      values: (number | null)[],
      color: string,
      lw: 1 | 2 | 3 = 1,
    ): ISeriesApi<'Line'> => {
      const s = chart.addLineSeries({
        color, lineWidth: lw,
        lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false,
      })
      s.setData(
        values.map((v, i) => v != null ? { time: times[i], value: v } : null)
              .filter((x): x is { time: Time; value: number } => x != null)
      )
      return s
    }

    // Helper: add line series to oscillator chart
    const addOscLine = (
      values: (number | null)[],
      color: string,
      lw: 1 | 2 | 3 = 2,
    ): ISeriesApi<'Line'> => {
      if (!osc) throw new Error('no osc')
      const s = osc.addLineSeries({
        color, lineWidth: lw, lastValueVisible: true, priceLineVisible: false,
      })
      s.setData(
        values.map((v, i) => v != null ? { time: times[i], value: v } : null)
              .filter((x): x is { time: Time; value: number } => x != null)
      )
      return s
    }

    for (const ind of indicators) {
      if (!ind.visible) continue
      const def = INDICATOR_DEFS.find(d => d.id === ind.type)
      if (!def) continue

      if (!def.isOsc) {
        /* ── OVERLAY indicators ── */
        switch (ind.type) {
          case 'mm': {
            const p = Number(ind.params.period)
            const mt = Number(ind.params.maType)
            const vals = mt === 1 ? calcEMA(closes, p) : mt === 2 ? calcWMA(closes, p) : calcSMA(closes, p)
            indicatorSeriesMap.current.set(ind.instanceId, [addLine(vals, ind.color, 2)])
            break
          }
          case 'bb': {
            const { upper, middle, lower } = calcBB(closes, Number(ind.params.period), Number(ind.params.mult))
            const fill = chart.addAreaSeries({
              lineColor: 'transparent', topColor: `${ind.color}18`, bottomColor: `${ind.color}10`,
              lineWidth: 1 as const, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false,
            })
            fill.setData(
              upper.map((v, i) => v != null ? { time: times[i], value: v } : null)
                   .filter((x): x is { time: Time; value: number } => x != null)
            )
            const u = addLine(upper, ind.color, 1)
            const m = addLine(middle, `${ind.color}88`, 1)
            const lo = addLine(lower, ind.color, 1)
            indicatorSeriesMap.current.set(ind.instanceId, [fill, u, m, lo])
            break
          }
          case 'vwap': {
            indicatorSeriesMap.current.set(ind.instanceId, [addLine(calcVWAP(highs, lows, closes, volumes), ind.color, 2)])
            break
          }
          case 'ichimoku': {
            const { tenkan, kijun, senkouA, senkouB } = calcIchimoku(
              highs, lows, Number(ind.params.tenkan), Number(ind.params.kijun), Number(ind.params.senkou)
            )
            const t = addLine(tenkan, '#ef4444', 1)
            const k = addLine(kijun,  '#3b82f6', 1)
            const sA = addLine(senkouA, '#10b98155', 1)
            const sB = addLine(senkouB, '#ef444455', 1)
            indicatorSeriesMap.current.set(ind.instanceId, [t, k, sA, sB])
            break
          }
          case 'keltner': {
            const { upper, middle, lower } = calcKeltner(highs, lows, closes, Number(ind.params.period), Number(ind.params.mult))
            const u  = addLine(upper,  ind.color, 1)
            const m  = addLine(middle, `${ind.color}88`, 1)
            const lo = addLine(lower,  ind.color, 1)
            indicatorSeriesMap.current.set(ind.instanceId, [u, m, lo])
            break
          }
          case 'pivot': {
            const pivots = calcPivots(highs, lows, closes)
            const pp  = addLine(pivots.map(p => p.pp),  '#94a3b8', 1)
            const r1  = addLine(pivots.map(p => p.r1),  '#10b981', 1)
            const r2  = addLine(pivots.map(p => p.r2),  '#10b98180', 1)
            const s1  = addLine(pivots.map(p => p.s1),  '#ef4444', 1)
            const s2  = addLine(pivots.map(p => p.s2),  '#ef444480', 1)
            indicatorSeriesMap.current.set(ind.instanceId, [pp, r1, r2, s1, s2])
            break
          }
          case 'linreg': {
            const { line, upper, lower } = calcLinReg(closes, Number(ind.params.period))
            const lr = addLine(line, ind.color, 2)
            const series: ISeriesApi<'Line' | 'Area' | 'Histogram'>[] = [lr]
            if (Number(ind.params.channels) === 1) {
              series.push(addLine(upper, `${ind.color}88`, 1))
              series.push(addLine(lower, `${ind.color}88`, 1))
            }
            indicatorSeriesMap.current.set(ind.instanceId, series)
            break
          }
        }
      } else {
        /* ── OSCILLATOR indicators — only render if this is the active tab ── */
        if (ind.instanceId !== activeOscTab || !osc) continue

        switch (ind.type) {
          case 'rsi': {
            const vals = calcRSI(closes, Number(ind.params.period))
            const s = addOscLine(vals, ind.color, 2)
            s.createPriceLine({ price: 70, color: '#ef444488', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '70' })
            s.createPriceLine({ price: 30, color: '#10b98188', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '30' })
            s.createPriceLine({ price: 50, color: '#94a3b844', lineWidth: 1 as const, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' })
            osc.priceScale('right').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } })
            oscSeriesMap.current.set(ind.instanceId, [s])
            break
          }
          case 'macd': {
            const { macd, signal, histogram } = calcMACD(closes, Number(ind.params.fast), Number(ind.params.slow), Number(ind.params.signal))
            const hist = osc.addHistogramSeries({ lastValueVisible: false, priceLineVisible: false } as Parameters<IChartApi['addHistogramSeries']>[0])
            hist.setData(histogram.map((v, i) => ({ time: times[i], value: v, color: v >= 0 ? '#10b981aa' : '#ef4444aa' })))
            const macdLine = addOscLine(macd,   '#3b82f6', 2)
            const sigLine  = addOscLine(signal, '#f59e0b', 2)
            oscSeriesMap.current.set(ind.instanceId, [hist, macdLine, sigLine])
            break
          }
          case 'stoch': {
            const { k: kv, d: dv } = calcStoch(highs, lows, closes, Number(ind.params.k), Number(ind.params.d))
            const kLine = addOscLine(kv, '#3b82f6', 2)
            kLine.createPriceLine({ price: 80, color: '#ef444488', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '80' })
            kLine.createPriceLine({ price: 20, color: '#10b98188', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '20' })
            const dLine = addOscLine(dv, '#f59e0b', 2)
            oscSeriesMap.current.set(ind.instanceId, [kLine, dLine])
            break
          }
          case 'adx': {
            const { adx, pdi, ndi } = calcADX(highs, lows, closes, Number(ind.params.period))
            const adxLine = addOscLine(adx, '#f59e0b', 2)
            const pdiLine = addOscLine(pdi, '#10b981', 1)
            const ndiLine = addOscLine(ndi, '#ef4444', 1)
            adxLine.createPriceLine({ price: 25, color: '#94a3b888', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '25' })
            oscSeriesMap.current.set(ind.instanceId, [adxLine, pdiLine, ndiLine])
            break
          }
          case 'cci': {
            const vals = calcCCI(highs, lows, closes, Number(ind.params.period))
            const s = addOscLine(vals, ind.color, 2)
            s.createPriceLine({ price: 100, color: '#ef444488', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '100' })
            s.createPriceLine({ price: -100, color: '#10b98188', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '-100' })
            oscSeriesMap.current.set(ind.instanceId, [s])
            break
          }
          case 'roc': {
            const vals = calcROC(closes, Number(ind.params.period))
            const s = addOscLine(vals, ind.color, 2)
            s.createPriceLine({ price: 0, color: '#94a3b888', lineWidth: 1 as const, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' })
            oscSeriesMap.current.set(ind.instanceId, [s])
            break
          }
          case 'williams': {
            const vals = calcWilliamsR(highs, lows, closes, Number(ind.params.period))
            const s = addOscLine(vals, ind.color, 2)
            s.createPriceLine({ price: -20, color: '#ef444488', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '-20' })
            s.createPriceLine({ price: -80, color: '#10b98188', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '-80' })
            oscSeriesMap.current.set(ind.instanceId, [s])
            break
          }
          case 'obv': {
            const vals = calcOBV(closes, volumes)
            oscSeriesMap.current.set(ind.instanceId, [addOscLine(vals, ind.color, 2)])
            break
          }
          case 'mfi': {
            const vals = calcMFI(highs, lows, closes, volumes, Number(ind.params.period))
            const s = addOscLine(vals, ind.color, 2)
            s.createPriceLine({ price: 80, color: '#ef444488', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '80' })
            s.createPriceLine({ price: 20, color: '#10b98188', lineWidth: 1 as const, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '20' })
            oscSeriesMap.current.set(ind.instanceId, [s])
            break
          }
          case 'cmf': {
            const vals = calcCMF(highs, lows, closes, volumes, Number(ind.params.period))
            const s = addOscLine(vals, ind.color, 2)
            s.createPriceLine({ price: 0, color: '#94a3b888', lineWidth: 1 as const, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' })
            oscSeriesMap.current.set(ind.instanceId, [s])
            break
          }
          case 'atr': {
            const vals = calcATR(highs, lows, closes, Number(ind.params.period))
            oscSeriesMap.current.set(ind.instanceId, [addOscLine(vals, ind.color, 2)])
            break
          }
        }
        osc.timeScale().fitContent()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, indicators, seriesV, activeOscTab])

  /* ── Indicator actions ── */
  const addIndicator = useCallback((type: IndicatorId) => {
    const def = INDICATOR_DEFS.find(d => d.id === type)!
    const newInd: ActiveIndicator = {
      instanceId: nextId(),
      type,
      params: { ...DEFAULT_PARAMS[type] },
      color: def.defaultColor,
      visible: true,
    }
    setIndicators(prev => [...prev, newInd])
    if (def.isOsc) setActiveOscTab(newInd.instanceId)
  }, [])

  const removeIndicator = useCallback((instanceId: string) => {
    setIndicators(prev => prev.filter(i => i.instanceId !== instanceId))
    setActiveOscTab(prev => prev === instanceId ? null : prev)
  }, [])

  const toggleVisible = useCallback((instanceId: string) => {
    setIndicators(prev => prev.map(i => i.instanceId === instanceId ? { ...i, visible: !i.visible } : i))
  }, [])

  const updateParams = useCallback((instanceId: string, params: Record<string, number | string>, color: string) => {
    setIndicators(prev => prev.map(i => i.instanceId === instanceId ? { ...i, params, color } : i))
  }, [])

  const hasOscillators = indicators.some(i => {
    const def = INDICATOR_DEFS.find(d => d.id === i.type)
    return def?.isOsc && i.visible
  })

  /* ── Coordinate helpers ── */
  // Keep a ref to filteredData so fromClient can pick a fallback time without extra deps
  const filteredDataRef = useRef(filteredData)
  useEffect(() => { filteredDataRef.current = filteredData }, [filteredData])

  const toPixel = useCallback((p: DrawPoint): { x: number; y: number } => {
    try {
      const x = p.time ? (chartRef.current?.timeScale().timeToCoordinate(p.time as Time) ?? 0) : 0
      const y = priceSeriesRef.current?.priceToCoordinate(p.price) ?? 0
      return { x: x ?? 0, y: y ?? 0 }
    } catch {
      return { x: 0, y: 0 }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayV, seriesV])

  // Keep toPixelRef in sync so canvas useEffect and handleMD always use the latest version
  useEffect(() => { toPixelRef.current = toPixel }, [toPixel])

  /* ── Canvas: redraw all drawings imperatively (no React render crash possible) ── */
  useEffect(() => {
    const canvas = drawCanvasRef.current
    if (!canvas || chartSize.w === 0) return
    canvas.width  = chartSize.w
    canvas.height = chartSize.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const px = toPixelRef.current
    drawings.forEach(d => canvasDraw(ctx, d, false, chartSize.w, chartSize.h, px))
    if (inProgress) canvasDraw(ctx, inProgress, true, chartSize.w, chartSize.h, px)
  }, [drawings, inProgress, overlayV, seriesV, chartSize])

  const fromClient = useCallback((clientX: number, clientY: number): DrawPoint => {
    const rect  = canvasBoundsRef.current!
    const price = priceSeriesRef.current?.coordinateToPrice(clientY - rect.top) ?? 0
    const rawTime = chartRef.current?.timeScale().coordinateToTime(clientX - rect.left) as string | null
    const fd = filteredDataRef.current
    const time = rawTime ?? (fd.length ? fd[fd.length - 1].date : '')
    return { price: price ?? 0, time }
  }, [])

  const handleMD = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const tool  = drawToolRef.current
    const color = drawColorRef.current
    if (tool === 'pointer') return
    canvasBoundsRef.current = e.currentTarget.getBoundingClientRect()

    if (tool === 'erase') {
      const rect = canvasBoundsRef.current
      const cx = e.clientX - rect.left, cy = e.clientY - rect.top
      const px = toPixelRef.current
      setDrawings(prev => {
        const idx = prev.findIndex(d => hitTest(d, cx, cy, px))
        if (idx === -1) return prev
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
      })
      return
    }

    const pt = fromClient(e.clientX, e.clientY)
    if (!pt.time) return

    if (tool === 'horizontal' || tool === 'vertical') {
      setDrawings(prev => [...prev, { id: Date.now().toString(), type: tool, color, p1: pt, p2: pt }])
      return
    }

    const d: Drawing = { id: Date.now().toString(), type: tool, color, p1: pt, p2: pt }
    inProgressRef.current = d; setInProgress(d)

    const move = (ev: MouseEvent) => {
      if (!inProgressRef.current) return
      const u = { ...inProgressRef.current, p2: fromClient(ev.clientX, ev.clientY) }
      inProgressRef.current = u; setInProgress(u)
    }
    const up = () => {
      if (inProgressRef.current) {
        setDrawings(prev => [...prev, inProgressRef.current!])
        inProgressRef.current = null; setInProgress(null)
      }
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [fromClient])

  /* ── Stats ── */
  const last      = filteredData[filteredData.length - 1] ?? null
  const first     = filteredData[0] ?? null
  const current   = last  ? Number(last.close)  : null
  const prevClose = last  ? Number(last.previous_close) : null
  const dailyVar  = current != null && prevClose && prevClose > 0 ? ((current - prevClose) / prevClose) * 100 : null
  const isPos     = (dailyVar ?? 0) >= 0
  const high      = filteredData.length ? filteredData.reduce((m, d) => Math.max(m, Number(d.high ?? d.close)), -Infinity) : null
  const low       = filteredData.length ? filteredData.reduce((m, d) => Math.min(m, Number(d.low  ?? d.close)),  Infinity) : null
  const totalVol  = filteredData.reduce((s, d) => s + (Number(d.volume) || 0), 0)
  const periodVar = first && last && Number(first.close) > 0 ? ((Number(last.close) - Number(first.close)) / Number(first.close)) * 100 : null
  const companyName = companies.find(c => c.ticker === ticker)?.name ?? ''

  /* ── Oscillator tabs ── */
  const oscIndicators = indicators.filter(i => {
    const def = INDICATOR_DEFS.find(d => d.id === i.type)
    return def?.isOsc && i.visible
  })
  // Auto-switch active tab if current one disappears
  useEffect(() => {
    if (activeOscTab && !oscIndicators.find(i => i.instanceId === activeOscTab)) {
      setActiveOscTab(oscIndicators.length > 0 ? oscIndicators[oscIndicators.length - 1].instanceId : null)
    }
  }, [oscIndicators, activeOscTab])

  /* ── Particle data (stable, no re-render cost) ── */
  const PARTICLES = [
    { l: '4%',  t: '9%',  s: 6,  c: 'rgba(5,150,105,0.35)',   d: 9,  dl: 0   },
    { l: '11%', t: '28%', s: 5,  c: 'rgba(37,99,235,0.28)',   d: 12, dl: 1.8 },
    { l: '21%', t: '65%', s: 8,  c: 'rgba(5,150,105,0.22)',   d: 10, dl: 3.2 },
    { l: '33%', t: '14%', s: 5,  c: 'rgba(217,119,6,0.28)',   d: 14, dl: 0.6 },
    { l: '47%', t: '72%', s: 6,  c: 'rgba(37,99,235,0.22)',   d: 11, dl: 2.4 },
    { l: '58%', t: '38%', s: 5,  c: 'rgba(5,150,105,0.28)',   d: 13, dl: 4.1 },
    { l: '70%', t: '18%', s: 8,  c: 'rgba(139,92,246,0.22)',  d: 8,  dl: 1.2 },
    { l: '80%', t: '58%', s: 5,  c: 'rgba(5,150,105,0.32)',   d: 15, dl: 2.8 },
    { l: '91%', t: '32%', s: 6,  c: 'rgba(37,99,235,0.25)',   d: 9,  dl: 3.7 },
    { l: '16%', t: '88%', s: 5,  c: 'rgba(217,119,6,0.22)',   d: 12, dl: 5.2 },
    { l: '54%', t: '6%',  s: 7,  c: 'rgba(5,150,105,0.2)',    d: 7,  dl: 0.9 },
    { l: '87%', t: '82%', s: 5,  c: 'rgba(139,92,246,0.25)',  d: 11, dl: 3.1 },
    { l: '39%', t: '50%', s: 6,  c: 'rgba(37,99,235,0.2)',    d: 16, dl: 1.5 },
    { l: '63%', t: '90%', s: 7,  c: 'rgba(5,150,105,0.25)',   d: 10, dl: 6.0 },
    { l: '96%', t: '12%', s: 5,  c: 'rgba(217,119,6,0.2)',    d: 13, dl: 4.4 },
    { l: '27%', t: '42%', s: 6,  c: 'rgba(139,92,246,0.2)',   d: 9,  dl: 2.0 },
    { l: '74%', t: '75%', s: 5,  c: 'rgba(5,150,105,0.28)',   d: 11, dl: 0.3 },
    { l: '8%',  t: '55%', s: 8,  c: 'rgba(37,99,235,0.18)',   d: 14, dl: 3.9 },
  ]

  return (
    <>
    {/* ── Ambient background (fixed, behind everything) ─────── */}
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {/* Base gradient */}
      <div className="absolute inset-0" style={{
        background: [
          'radial-gradient(ellipse 80% 55% at 8% 0%, rgba(5,150,105,0.045) 0%, transparent 65%)',
          'radial-gradient(ellipse 60% 45% at 92% 15%, rgba(37,99,235,0.035) 0%, transparent 60%)',
          'radial-gradient(ellipse 55% 65% at 48% 105%, rgba(139,92,246,0.025) 0%, transparent 65%)',
          'radial-gradient(ellipse 40% 40% at 75% 80%, rgba(217,119,6,0.02) 0%, transparent 55%)',
          'linear-gradient(160deg, #f6fdf9 0%, #f8fafc 50%, #f5f8ff 100%)',
        ].join(', '),
      }} />

      {/* Dot grid */}
      <div className="live-grid" />

      {/* Soft glowing orbs */}
      <div className="live-orb" style={{
        width: 680, height: 680,
        top: '-15%', left: '-8%',
        background: 'radial-gradient(circle, rgba(5,150,105,0.055) 0%, transparent 70%)',
        animationDuration: '18s',
      }} />
      <div className="live-orb-alt" style={{
        width: 520, height: 520,
        top: '5%', right: '-10%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 70%)',
        animationDuration: '22s',
      }} />
      <div className="live-orb" style={{
        width: 440, height: 440,
        bottom: '-12%', left: '35%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.035) 0%, transparent 70%)',
        animationDuration: '15s',
        animationDelay: '-7s',
      }} />
      <div className="live-orb-alt" style={{
        width: 320, height: 320,
        bottom: '10%', right: '15%',
        background: 'radial-gradient(circle, rgba(217,119,6,0.03) 0%, transparent 70%)',
        animationDuration: '19s',
        animationDelay: '-4s',
      }} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="live-particle"
          style={{
            left: p.l, top: p.t,
            width: p.s, height: p.s,
            background: p.c,
            boxShadow: `0 0 ${p.s * 4}px ${p.c}`,
            animationDuration: `${p.d}s`,
            animationDelay: `-${p.dl}s`,
          }}
        />
      ))}

      {/* Thin diagonal shimmer lines */}
      <div className="absolute inset-0" style={{
        background: [
          'linear-gradient(110deg, transparent 35%, rgba(5,150,105,0.025) 50%, transparent 65%)',
          'linear-gradient(70deg,  transparent 25%, rgba(37,99,235,0.02)  42%, transparent 58%)',
        ].join(', '),
      }} />
    </div>

    {/* ── Page content ── */}
    <div className="relative space-y-5" style={{ zIndex: 2 }}>

      {/* ── Company dropdown ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-xs" ref={dropRef}>
          <button
            onClick={() => { setDropOpen(v => !v); setSearch('') }}
            className="w-full flex items-center justify-between gap-3 bg-brvm-card border border-brvm-border rounded-xl px-4 py-3 hover:border-brvm-green transition-colors"
          >
            <div className="text-left">
              <p className="font-bold text-brvm-green font-mono text-sm">{ticker}</p>
              <p className="text-brvm-muted text-xs truncate">{companyName || '—'}</p>
            </div>
            <ChevronDown size={16} className={`text-brvm-muted flex-shrink-0 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-brvm-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-2 border-b border-brvm-border">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
                  <input
                    autoFocus type="text" placeholder="Ticker ou société…" value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg pl-8 pr-3 py-2 text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:ring-2 focus:ring-brvm-green/20"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-64">
                {companies
                  .filter(c => { const q = search.toLowerCase(); return !q || c.ticker.toLowerCase().includes(q) || (c.name ?? '').toLowerCase().includes(q) })
                  .map(c => (
                    <button key={c.ticker} onClick={() => { setTicker(c.ticker); setDropOpen(false) }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${c.ticker === ticker ? 'bg-brvm-green/5' : ''}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-brvm-green">{c.ticker}</span>
                          {c.ticker === ticker && <span className="w-1.5 h-1.5 bg-brvm-green rounded-full" />}
                        </div>
                        <p className="text-brvm-subtext text-xs truncate">{c.name}</p>
                      </div>
                      {c.sector && <span className="text-brvm-muted text-xs shrink-0">{c.sector.slice(0, 14)}</span>}
                    </button>
                  ))}
                {companies.length === 0 && <p className="text-center py-6 text-brvm-muted text-sm">Chargement…</p>}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-brvm-muted text-sm hidden sm:block">{allData.length} séances</p>
          <button onClick={() => load(ticker)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-brvm-card border border-brvm-border rounded-lg text-brvm-subtext text-sm hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-4 sm:col-span-2">
          <p className="text-brvm-muted text-xs mb-1">Cours de clôture</p>
          <p className="text-3xl font-bold text-brvm-text font-mono">{fmtP(current)}</p>
          <p className="text-brvm-muted text-xs mt-0.5">FCFA</p>
        </div>
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-4">
          <p className="text-brvm-muted text-xs mb-1">Variation</p>
          {dailyVar != null
            ? <div className={`flex items-center gap-1 ${isPos ? 'text-brvm-green' : 'text-brvm-red'}`}>
                {isPos ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                <span className="text-xl font-bold">{isPos ? '+' : ''}{dailyVar.toFixed(2)}%</span>
              </div>
            : <span className="text-brvm-muted text-xl font-bold">—</span>}
          {periodVar != null && <p className="text-xs text-brvm-muted mt-0.5">Période : {periodVar >= 0 ? '+' : ''}{periodVar.toFixed(2)}%</p>}
        </div>
        <div className="bg-brvm-card border border-brvm-border rounded-xl p-4">
          <p className="text-brvm-muted text-xs mb-2">Haut / Bas</p>
          <p className="text-emerald-600 font-mono font-bold text-sm">{fmtP(high)}</p>
          <p className="text-red-500 font-mono font-semibold text-sm mt-0.5">{fmtP(low)}</p>
          <p className="text-brvm-muted text-xs mt-1">Vol. {fmtV(totalVol)}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Erreur : {error}
        </div>
      )}

      {/* ── Tab nav — standalone, outside the card ── */}
      {(() => {
        const tabs: { id: typeof mainTab; label: string; icon: React.ReactNode }[] = [
          { id: 'ta',      label: 'Analyse Technique',    icon: <LineChart  size={15} /> },
          { id: 'fa',      label: 'Analyse Fondamentale',  icon: <Building2  size={15} /> },
          { id: 'news',    label: 'Dernières actualités',  icon: <Newspaper  size={15} /> },
          { id: 'summary', label: 'Résumé rapide',        icon: <Zap        size={15} /> },
          { id: 'reco',    label: 'Recommandations',      icon: <Target     size={15} /> },
        ]
        return (
          <div className="flex justify-center">
            <div className="flex items-center gap-1 bg-brvm-card border border-brvm-border rounded-lg p-1 overflow-x-auto">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setMainTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0
                    ${mainTab === t.id
                      ? 'bg-brvm-green text-white shadow-sm'
                      : 'text-brvm-subtext hover:text-brvm-text hover:bg-slate-100'}`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Chart card ── */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl shadow-sm">

        {/* ── Toolbar Row 1: StylePicker + Periods + IndicatorPicker + DrawPicker ── */}
        <div className={`flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 border-b border-brvm-border ${mainTab !== 'ta' ? 'hidden' : ''}`}>
          <StylePicker value={chartStyle} onChange={setChartStyle} />

          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-0.5 flex-wrap">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${period === p.value ? 'bg-brvm-green text-white shadow-sm' : 'text-brvm-muted hover:text-brvm-text'}`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <IndicatorPicker indicators={indicators} onAdd={addIndicator} />
            <DrawPicker value={drawTool} onChange={setDrawTool} color={drawColor} onColor={setDrawColor} />
          </div>

          <p className="text-brvm-muted text-xs tabular-nums hidden sm:block w-full text-right">
            {filteredData.length} pts
          </p>
        </div>

        {/* ── Toolbar Row 2: Active indicator chips ── */}
        <div className={mainTab !== 'ta' ? 'hidden' : ''}>
        <ChipsRow
          indicators={indicators}
          activeOscTab={activeOscTab}
          onToggleVisible={toggleVisible}
          onRemove={removeIndicator}
          onUpdateParams={updateParams}
          onSetOscTab={id => setActiveOscTab(id)}
        />

        </div>{/* end chips wrapper */}

        {/* ── Chart body (TA only) ── */}
        <div className={`px-3 py-3 ${mainTab !== 'ta' ? 'hidden' : ''}`}>
          <div style={{ position: 'relative' }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20" style={{ height: CHART_H }}>
                <RefreshCw size={24} className="animate-spin text-brvm-green" />
              </div>
            )}
            <div ref={chartDivRef} style={{ width: '100%', height: CHART_H }} />
            {/* Canvas overlay — dessin impératif, jamais de crash React */}
            <canvas
              ref={drawCanvasRef}
              onMouseDown={handleMD}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: chartSize.w || '100%', height: CHART_H,
                cursor: drawTool === 'pointer' ? 'default' : drawTool === 'erase' ? 'crosshair' : 'crosshair',
                pointerEvents: drawTool === 'pointer' ? 'none' : 'all',
                zIndex: 10,
              }}
            />
          </div>

          {/* ── Oscillator pane — always in DOM, shown/hidden via display ── */}
          <div style={{ display: hasOscillators ? 'block' : 'none' }}>
            <div className="mt-1 border-t border-brvm-border pt-1">
              {/* Oscillator tabs */}
              {oscIndicators.length > 1 && (
                <div className="flex items-center gap-1 px-1 mb-1 flex-wrap">
                  {oscIndicators.map(ind => (
                    <button key={ind.instanceId}
                      onClick={() => setActiveOscTab(ind.instanceId)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${activeOscTab === ind.instanceId ? 'bg-brvm-green text-white' : 'text-brvm-muted hover:text-brvm-text bg-slate-100'}`}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: ind.color }} />
                      {indicatorLabel(ind)}
                    </button>
                  ))}
                  <button onClick={() => {
                    indicators.filter(i => INDICATOR_DEFS.find(d => d.id === i.type)?.isOsc).forEach(i => removeIndicator(i.instanceId))
                  }} className="ml-auto text-[10px] text-red-500 hover:text-red-700 font-medium px-1">
                    Tout effacer
                  </button>
                </div>
              )}
              {oscIndicators.length === 1 && (
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-xs font-semibold text-brvm-subtext flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: oscIndicators[0].color }} />
                    {indicatorLabel(oscIndicators[0])}
                  </span>
                  <button onClick={() => removeIndicator(oscIndicators[0].instanceId)} className="text-brvm-muted hover:text-brvm-text text-xs px-1">✕</button>
                </div>
              )}
              <div ref={oscDivRef} style={{ width: '100%', height: OSC_H }} />
            </div>
          </div>

          {/* When no oscillators, still mount the div (hidden) so the chart stays initialized */}
        </div>

        {/* ══ ANALYSE FONDAMENTALE ══ */}
        {mainTab === 'fa' && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Capitalisation', value: current ? `${(current * 1e6 / 1e9).toFixed(1)} Md FCFA` : '—', sub: 'Estimée' },
                { label: 'PER', value: '12.4×', sub: 'Price / Earnings' },
                { label: 'P/B', value: '1.8×', sub: 'Price / Book' },
                { label: 'ROE', value: '14.2 %', sub: 'Return on Equity' },
                { label: 'Marge nette', value: '8.6 %', sub: 'Résultat / CA' },
                { label: 'Rendement div.', value: '3.4 %', sub: 'Dividende / Cours' },
              ].map(m => (
                <div key={m.label} className="bg-slate-50 rounded-xl p-4 border border-brvm-border">
                  <p className="text-[10px] text-brvm-muted uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-lg font-bold text-brvm-text font-mono">{m.value}</p>
                  <p className="text-[10px] text-brvm-muted mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl border border-brvm-border p-4">
              <p className="text-xs font-bold text-brvm-text mb-3">Résultats annuels (Md FCFA)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-brvm-muted border-b border-brvm-border">
                    {['Exercice','Chiffre d\'affaires','EBITDA','Résultat net','BPA'].map(h => (
                      <th key={h} className="text-left py-1.5 pr-4 font-semibold">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-brvm-border">
                    {[
                      { yr: '2023', ca: '48.2', ebitda: '12.1', rn: '4.2', bpa: '420' },
                      { yr: '2024', ca: '52.7', ebitda: '13.8', rn: '4.9', bpa: '490' },
                      { yr: '2025e', ca: '57.4', ebitda: '15.2', rn: '5.4', bpa: '540' },
                    ].map(r => (
                      <tr key={r.yr} className="text-brvm-subtext">
                        <td className="py-2 pr-4 font-semibold text-brvm-text">{r.yr}</td>
                        <td className="py-2 pr-4 font-mono">{r.ca}</td>
                        <td className="py-2 pr-4 font-mono">{r.ebitda}</td>
                        <td className="py-2 pr-4 font-mono text-brvm-green">{r.rn}</td>
                        <td className="py-2 font-mono">{r.bpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ ACTUALITÉS ══ */}
        {mainTab === 'news' && (
          <div className="p-5 space-y-3">
            {[
              { date: '06 mars 2026', title: `${companyName || ticker} : résultats annuels en hausse de 12%`, tag: 'Résultats', pos: true, body: 'Le groupe a publié des résultats annuels solides, portés par la croissance de ses activités principales et une maîtrise des coûts opérationnels.' },
              { date: '28 fév. 2026', title: 'BRVM : les valeurs financières résistent à la volatilité régionale', tag: 'Marché', pos: null, body: 'Dans un contexte de volatilité sur les marchés ouest-africains, les valeurs du secteur financier ont démontré une résilience notable.' },
              { date: '20 fév. 2026', title: `${ticker} : dividende de 450 FCFA par action annoncé`, tag: 'Dividende', pos: true, body: 'Le conseil d\'administration a approuvé la distribution d\'un dividende ordinaire en hausse par rapport à l\'exercice précédent.' },
              { date: '14 fév. 2026', title: 'Perspectives économiques UEMOA 2026 : croissance attendue à 6.1%', tag: 'Macro', pos: null, body: 'La BCEAO maintient ses projections de croissance pour la zone UEMOA, soutenues par les investissements infrastructurels.' },
              { date: '05 fév. 2026', title: `${ticker} : nomination d'un nouveau directeur général`, tag: 'Corporate', pos: null, body: 'Le groupe a annoncé la nomination d\'un nouveau directeur général, succédant au titulaire après 8 ans à la tête de l\'entreprise.' },
            ].map((n, i) => (
              <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-brvm-border hover:border-brvm-green/40 transition-colors cursor-pointer">
                <div className={`w-1 rounded-full flex-shrink-0 ${n.pos === true ? 'bg-brvm-green' : n.pos === false ? 'bg-brvm-red' : 'bg-brvm-muted'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-brvm-muted font-semibold">{n.tag}</span>
                    <span className="text-[10px] text-brvm-muted">{n.date}</span>
                  </div>
                  <p className="text-xs font-semibold text-brvm-text leading-snug">{n.title}</p>
                  <p className="text-[11px] text-brvm-muted mt-1 leading-relaxed">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ RÉSUMÉ RAPIDE ══ */}
        {mainTab === 'summary' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl border border-brvm-border p-4 space-y-3">
                <p className="text-xs font-bold text-brvm-text">Données de marché</p>
                {[
                  { label: 'Cours actuel',    value: `${fmtP(current)} FCFA` },
                  { label: 'Variation jour',  value: dailyVar != null ? `${dailyVar >= 0 ? '+' : ''}${dailyVar.toFixed(2)} %` : '—', color: dailyVar != null ? (dailyVar >= 0 ? 'text-brvm-green' : 'text-brvm-red') : '' },
                  { label: `Perf. ${PERIODS.find(p => p.value === period)?.label ?? period}`, value: periodVar != null ? `${periodVar >= 0 ? '+' : ''}${periodVar.toFixed(2)} %` : '—', color: periodVar != null ? (periodVar >= 0 ? 'text-brvm-green' : 'text-brvm-red') : '' },
                  { label: 'Plus haut période', value: `${fmtP(high)} FCFA` },
                  { label: 'Plus bas période',  value: `${fmtP(low)} FCFA` },
                  { label: 'Volume total',     value: fmtV(totalVol) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center text-xs border-b border-brvm-border/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-brvm-muted">{r.label}</span>
                    <span className={`font-semibold font-mono ${r.color ?? 'text-brvm-text'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl border border-brvm-border p-4 space-y-3">
                <p className="text-xs font-bold text-brvm-text">Signaux techniques</p>
                {[
                  { label: 'Tendance court terme', value: (periodVar ?? 0) >= 0 ? 'Haussière' : 'Baissière', color: (periodVar ?? 0) >= 0 ? 'text-brvm-green' : 'text-brvm-red' },
                  { label: 'MM20 vs cours', value: 'Au-dessus', color: 'text-brvm-green' },
                  { label: 'MM50 vs cours', value: 'Au-dessus', color: 'text-brvm-green' },
                  { label: 'RSI(14) estimé', value: '58', color: 'text-brvm-subtext' },
                  { label: 'Volume relatif', value: 'Normal', color: 'text-brvm-muted' },
                  { label: 'Support clé', value: `${fmtP(low)} FCFA`, color: 'text-brvm-subtext' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center text-xs border-b border-brvm-border/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-brvm-muted">{r.label}</span>
                    <span className={`font-semibold ${r.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-brvm-border p-4">
              <p className="text-xs font-bold text-brvm-text mb-2">Contexte</p>
              <p className="text-xs text-brvm-subtext leading-relaxed">
                {companyName || ticker} évolue dans un contexte de marché globalement favorable sur la BRVM.
                Le titre affiche une performance {(periodVar ?? 0) >= 0 ? 'positive' : 'négative'} sur la période sélectionnée,
                avec des volumes {totalVol > 50000 ? 'élevés' : 'modérés'} témoignant d'un intérêt {totalVol > 50000 ? 'soutenu' : 'limité'} des investisseurs.
                Les indicateurs techniques de tendance restent globalement constructifs.
              </p>
            </div>
          </div>
        )}

        {/* ══ RECOMMANDATIONS ══ */}
        {mainTab === 'reco' && (
          <div className="p-5 space-y-4">
            {/* Consensus */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-brvm-green/5 border border-brvm-green/20 rounded-xl p-5 flex flex-col items-center justify-center min-w-[140px]">
                <p className="text-[10px] text-brvm-muted uppercase tracking-wider mb-2">Consensus</p>
                <p className="text-2xl font-bold text-brvm-green">ACHAT</p>
                <p className="text-xs text-brvm-muted mt-1">4 analystes</p>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                {[
                  { label: 'Achat', count: 3, color: 'bg-brvm-green', pct: 75 },
                  { label: 'Neutre', count: 1, color: 'bg-amber-400', pct: 25 },
                  { label: 'Vente', count: 0, color: 'bg-brvm-red', pct: 0 },
                ].map(r => (
                  <div key={r.label} className="bg-slate-50 border border-brvm-border rounded-xl p-3 text-center">
                    <p className="text-xs text-brvm-muted mb-2">{r.label}</p>
                    <p className="text-xl font-bold text-brvm-text">{r.count}</p>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Objectifs de cours */}
            <div className="bg-slate-50 border border-brvm-border rounded-xl p-4">
              <p className="text-xs font-bold text-brvm-text mb-3">Objectifs de cours (FCFA)</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-center">
                  <p className="text-[10px] text-brvm-muted">Bas</p>
                  <p className="font-mono font-bold text-sm text-brvm-subtext">{fmtP(current ? current * 0.88 : null)}</p>
                </div>
                <div className="flex-1 relative h-2 bg-slate-200 rounded-full">
                  <div className="absolute inset-y-0 left-[30%] right-[25%] bg-brvm-green/30 rounded-full" />
                  {current && <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-brvm-green rounded-full border-2 border-white shadow" style={{ left: '48%' }} />}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-brvm-muted">Haut</p>
                  <p className="font-mono font-bold text-sm text-brvm-subtext">{fmtP(current ? current * 1.22 : null)}</p>
                </div>
              </div>
              <p className="text-center text-xs text-brvm-muted">
                Objectif médian : <span className="font-bold text-brvm-text font-mono">{fmtP(current ? current * 1.12 : null)} FCFA</span>
                &nbsp;·&nbsp; Potentiel : <span className="text-brvm-green font-semibold">+12%</span>
              </p>
            </div>
            {/* Avis analystes */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-brvm-text">Avis des analystes</p>
              {[
                { firm: 'Afrivest Research', rec: 'Achat', target: current ? Math.round(current * 1.15) : 0, date: 'fév. 2026', note: 'Valorisation attractive, profil risque/rendement favorable' },
                { firm: 'Hudson & Associates', rec: 'Achat', target: current ? Math.round(current * 1.12) : 0, date: 'jan. 2026', note: 'Bons fondamentaux, dividende en croissance régulière' },
                { firm: 'BNP Paribas BRVM', rec: 'Achat', target: current ? Math.round(current * 1.10) : 0, date: 'jan. 2026', note: 'Secteur solide, maintien de la recommandation positive' },
                { firm: 'SGBCI Capital', rec: 'Neutre', target: current ? Math.round(current * 1.04) : 0, date: 'déc. 2025', note: 'Cours proche de notre objectif, passage à neutre' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-brvm-border rounded-xl text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold text-white text-[10px] ${a.rec === 'Achat' ? 'bg-brvm-green' : a.rec === 'Vente' ? 'bg-brvm-red' : 'bg-amber-400'}`}>{a.rec}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brvm-subtext">{a.firm}</p>
                    <p className="text-brvm-muted text-[10px] truncate">{a.note}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-brvm-text">{fmtP(a.target)}</p>
                    <p className="text-[10px] text-brvm-muted">{a.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  )
}
