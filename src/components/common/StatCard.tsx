interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'green' | 'red' | 'gold' | 'blue' | 'default'
  icon?: React.ReactNode
}

const colorMap = {
  green: 'text-brvm-green',
  red: 'text-brvm-red',
  gold: 'text-brvm-gold',
  blue: 'text-brvm-blue',
  default: 'text-brvm-text',
}

export default function StatCard({ label, value, sub, color = 'default', icon }: StatCardProps) {
  return (
    <div className="bg-brvm-card border border-brvm-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-brvm-muted text-xs uppercase tracking-wider font-medium">{label}</span>
        {icon && <span className="text-brvm-muted">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-brvm-muted text-xs mt-1">{sub}</p>}
    </div>
  )
}
