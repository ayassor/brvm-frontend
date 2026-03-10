import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface EndpointResult {
  url: string
  status: number | null
  elapsed: number | null
  error: string | null
  raw: string | null
}

const TICKER = 'SNTS'

const ENDPOINTS = [
  `/api/companies/tickers`,
  `/api/companies/indices`,
  `/api/companies/marche`,
  `/api/companies/${TICKER}/live?period=daily`,
  `/api/companies/${TICKER}/details`,
]

async function fetchEndpoint(url: string): Promise<EndpointResult> {
  const t0 = Date.now()
  try {
    const res = await fetch(url)
    const elapsed = Date.now() - t0
    const text = await res.text()
    let pretty = text
    try {
      pretty = JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      // not JSON, show raw text
    }
    return { url, status: res.status, elapsed, error: null, raw: pretty }
  } catch (e) {
    return { url, status: null, elapsed: Date.now() - t0, error: String(e), raw: null }
  }
}

export default function LiveApiDebug() {
  const [results, setResults] = useState<EndpointResult[]>([])
  const [loading, setLoading] = useState(false)

  async function runAll() {
    setLoading(true)
    setResults([])
    const all = await Promise.all(ENDPOINTS.map(fetchEndpoint))
    setResults(all)
    setLoading(false)
  }

  useEffect(() => { runAll() }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brvm-text">Debug API Gateway — Réponses brutes</h1>
          <p className="text-brvm-subtext text-sm mt-1">
            Appelle les 5 endpoints de <code className="bg-slate-100 px-1 rounded">localhost:5000</code> et affiche les réponses telles quelles.
          </p>
        </div>
        <button
          onClick={runAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-brvm-green text-white font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-60 transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Chargement…' : 'Relancer'}
        </button>
      </div>

      {loading && results.length === 0 && (
        <div className="flex items-center gap-3 text-brvm-subtext">
          <RefreshCw size={18} className="animate-spin text-brvm-green" />
          Appel des endpoints en cours…
        </div>
      )}

      {results.map((r, i) => (
        <div key={r.url} className="bg-white border border-brvm-border rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-brvm-border flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-brvm-text text-xs bg-brvm-green/10 text-brvm-green px-2 py-1 rounded">
                #{i + 1}
              </span>
              <code className="text-sm font-mono text-brvm-text">{r.url}</code>
            </div>
            <div className="flex items-center gap-3">
              {r.elapsed != null && (
                <span className="text-xs text-brvm-muted">{r.elapsed} ms</span>
              )}
              {r.status != null && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  r.status >= 200 && r.status < 300
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  HTTP {r.status}
                </span>
              )}
              {r.error && (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">
                  ERREUR RÉSEAU
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            {r.error ? (
              <pre className="text-xs text-red-600 bg-red-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {r.error}
              </pre>
            ) : r.raw ? (
              <pre className="text-xs text-green-300 bg-slate-950 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                {r.raw}
              </pre>
            ) : (
              <p className="text-brvm-muted text-sm">Réponse vide</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
