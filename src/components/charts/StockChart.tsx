import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import type { StockPrice, Period } from '../../types'

interface StockChartProps {
  prices: StockPrice[]
  onPeriodChange: (period: Period) => void
  currentPeriod: Period
  loading?: boolean
}

const periods: { label: string; value: Period }[] = [
  { label: '1J', value: '1d' },
  { label: '1S', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1A', value: '1y' },
  { label: '5A', value: '5y' },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brvm-card border border-brvm-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-brvm-muted text-xs mb-1">{label}</p>
        <p className="text-brvm-green font-bold text-sm">{payload[0].value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA</p>
      </div>
    )
  }
  return null
}

export default function StockChart({ prices, onPeriodChange, currentPeriod, loading }: StockChartProps) {
  const data = prices.map((p) => ({
    date: new Date(p.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    close: Number(p.close),
    volume: p.volume,
  }))

  const isPositive = data.length >= 2
    ? data[data.length - 1].close >= data[0].close
    : true

  const color = isPositive ? '#10b981' : '#ef4444'

  return (
    <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
      {/* Period selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-brvm-text font-semibold">Historique des cours</h3>
        <div className="flex gap-1 bg-black/20 rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                currentPeriod === p.value
                  ? 'bg-brvm-green text-white'
                  : 'text-brvm-muted hover:text-brvm-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brvm-border border-t-brvm-green rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-brvm-muted text-sm">
          Aucune donnée disponible pour cette période
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={(v) => v.toLocaleString('fr-FR')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorClose)"
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
