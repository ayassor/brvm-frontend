// Générateur d'historique financier déterministe (LCG seeded)
// Produit 5 ans de données cohérentes à partir de la valeur actuelle

export interface YearDataPoint {
  year: string
  value: number
}

function lcgRng(seed: number): () => number {
  let s = ((seed * 1664525 + 1013904223) & 0xffffffff) >>> 0
  return () => {
    s = ((1664525 * s + 1013904223) & 0xffffffff) >>> 0
    return s / 0x100000000
  }
}

/**
 * Génère un historique annuel sur `years` ans (2021→2025) en travaillant
 * à rebours depuis `current` (valeur 2025). Le résultat est trié du plus
 * ancien au plus récent.
 */
export function buildHistory(
  current: number,
  seed: number,
  years = 5,
  avgGrowth = 0.06,
  volatility = 0.10,
): YearDataPoint[] {
  const rng = lcgRng(seed)
  // Génère (years-1) taux de croissance annuels
  const rates = Array.from({ length: years - 1 }, () =>
    avgGrowth + (rng() - 0.5) * 2 * volatility,
  )
  const pts: YearDataPoint[] = []
  let v = current
  for (let i = 0; i < years; i++) {
    pts.unshift({ year: String(2025 - i), value: Math.round(v * 10) / 10 })
    if (i < years - 1) v = v / (1 + rates[i])
  }
  return pts
}

export const getRevenueHistory   = (v: number, id: number) => buildHistory(v, id * 7,  5, 0.07, 0.09)
export const getNetIncomeHistory = (v: number, id: number) => buildHistory(v, id * 13, 5, 0.08, 0.15)
export const getEbitdaHistory    = (v: number, id: number) => buildHistory(v, id * 11, 5, 0.07, 0.10)
export const getPerHistory       = (v: number, id: number) => buildHistory(v, id * 17, 5, 0.02, 0.18)
export const getDividendHistory  = (v: number, id: number) => buildHistory(v, id * 19, 5, 0.06, 0.12)
