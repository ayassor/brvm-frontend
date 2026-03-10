import { useState } from 'react'
import { Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

// ─── Test cases : one variable changes at a time ──────────────────────────────
const TESTS = [
  {
    id: 'A',
    label: 'Référence R-package',
    desc: 'datedeb YYYY-MM-DD · xperiod "0" string',
    body: { ticker: 'SNTS', datedeb: '2025-09-01', datefin: '2026-02-27', xperiod: '0' },
  },
  {
    id: 'B',
    label: 'Date DD/MM/YYYY',
    desc: 'datedeb DD/MM/YYYY · xperiod "0" string',
    body: { ticker: 'SNTS', datedeb: '01/09/2025', datefin: '27/02/2026', xperiod: '0' },
  },
  {
    id: 'C',
    label: 'xperiod integer',
    desc: 'datedeb YYYY-MM-DD · xperiod 0 (number)',
    body: { ticker: 'SNTS', datedeb: '2025-09-01', datefin: '2026-02-27', xperiod: 0 },
  },
  {
    id: 'D',
    label: 'xperiod 7 (weekly)',
    desc: 'datedeb YYYY-MM-DD · xperiod "7"',
    body: { ticker: 'SNTS', datedeb: '2025-09-01', datefin: '2026-02-27', xperiod: '7' },
  },
  {
    id: 'E',
    label: 'Plage 2025 entière',
    desc: 'Toute l\'année 2025 · xperiod "0"',
    body: { ticker: 'SNTS', datedeb: '2025-01-01', datefin: '2025-12-31', xperiod: '0' },
  },
  {
    id: 'F',
    label: 'Court 7 jours',
    desc: '7 derniers jours · xperiod "0"',
    body: { ticker: 'SNTS', datedeb: '2026-02-21', datefin: '2026-02-27', xperiod: '0' },
  },
  {
    id: 'G',
    label: 'Ticker SGBC',
    desc: 'SGBC (SGBCI) · YYYY-MM-DD · "0"',
    body: { ticker: 'SGBC', datedeb: '2025-09-01', datefin: '2026-02-27', xperiod: '0' },
  },
  {
    id: 'H',
    label: 'Sans x-sika-ticker header',
    desc: 'Même corps, pas de header custom',
    body: { ticker: 'SNTS', datedeb: '2025-09-01', datefin: '2026-02-27', xperiod: '0' },
    skipTickerHeader: true,
  },
]

interface Result {
  id: string
  status: 'pending' | 'loading' | 'ok' | 'nodata' | 'error'
  raw: string
  rowCount: number
  elapsed: number
}

async function runTest(t: typeof TESTS[0]): Promise<Omit<Result, 'id'>> {
  const t0 = Date.now()
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!('skipTickerHeader' in t && t.skipTickerHeader)) {
      headers['x-sika-ticker'] = String(t.body.ticker)
    }
    const res = await fetch('/sikafinance/api/general/GetHistos', {
      method: 'POST',
      headers,
      body: JSON.stringify(t.body),
    })
    const elapsed = Date.now() - t0
    const text = await res.text()
    let raw = text.slice(0, 300)

    if (!res.ok) return { status: 'error', raw: `HTTP ${res.status}\n${raw}`, rowCount: 0, elapsed }

    try {
      const json = JSON.parse(text)
      if (json?.error === 'nodata' || json?.lst === '') {
        return { status: 'nodata', raw, rowCount: 0, elapsed }
      }
      const lst = json?.lst
      if (Array.isArray(lst) && lst.length === 6) {
        const n = Array.isArray(lst[0]) ? lst[0].length : 0
        return { status: 'ok', raw, rowCount: n, elapsed }
      }
      return { status: 'nodata', raw, rowCount: 0, elapsed }
    } catch {
      return { status: 'error', raw: `JSON parse error:\n${raw}`, rowCount: 0, elapsed }
    }
  } catch (e) {
    return { status: 'error', raw: String(e), rowCount: 0, elapsed: Date.now() - t0 }
  }
}

export default function ApiDebug() {
  const [results, setResults] = useState<Record<string, Result>>({})
  const [running, setRunning] = useState(false)

  const runAll = async () => {
    setRunning(true)
    // init all as loading
    const init: Record<string, Result> = {}
    TESTS.forEach((t) => { init[t.id] = { id: t.id, status: 'loading', raw: '', rowCount: 0, elapsed: 0 } })
    setResults(init)

    // run sequentially to avoid hammering the API
    for (const t of TESTS) {
      const r = await runTest(t)
      setResults((prev) => ({ ...prev, [t.id]: { id: t.id, ...r } }))
    }
    setRunning(false)
  }

  const StatusIcon = ({ status }: { status: Result['status'] }) => {
    if (status === 'pending') return <span className="w-5 h-5 rounded-full bg-slate-200 inline-block" />
    if (status === 'loading') return <Loader2 size={18} className="animate-spin text-blue-500" />
    if (status === 'ok')      return <CheckCircle2 size={18} className="text-emerald-500" />
    if (status === 'nodata')  return <XCircle size={18} className="text-amber-500" />
    return <XCircle size={18} className="text-red-500" />
  }

  const StatusBadge = ({ r }: { r?: Result }) => {
    if (!r) return <span className="text-xs text-brvm-muted">–</span>
    const map = {
      pending: 'bg-slate-100 text-slate-500',
      loading: 'bg-blue-50 text-blue-600',
      ok:      'bg-emerald-50 text-emerald-700',
      nodata:  'bg-amber-50 text-amber-700',
      error:   'bg-red-50 text-red-700',
    }
    const label = {
      pending: '–', loading: '…',
      ok:      `✅ ${r.rowCount} lignes (${r.elapsed}ms)`,
      nodata:  `⚠ nodata (${r.elapsed}ms)`,
      error:   `❌ erreur (${r.elapsed}ms)`,
    }
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[r.status]}`}>
        {label[r.status]}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brvm-text">Diagnostic API sikafinance</h1>
        <p className="text-brvm-subtext text-sm mt-1">
          Teste 8 combinaisons de paramètres pour identifier lesquels retournent de vraies données.
        </p>
      </div>

      <button
        onClick={runAll}
        disabled={running}
        className="flex items-center gap-2 px-5 py-2.5 bg-brvm-green text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-60"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {running ? 'Tests en cours…' : 'Lancer tous les tests'}
      </button>

      {/* Results table */}
      <div className="bg-brvm-card border border-brvm-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-brvm-border">
            <tr>
              <th className="text-left px-4 py-3 text-brvm-subtext text-xs font-semibold uppercase w-6">#</th>
              <th className="text-left px-4 py-3 text-brvm-subtext text-xs font-semibold uppercase">Variante</th>
              <th className="text-left px-4 py-3 text-brvm-subtext text-xs font-semibold uppercase hidden md:table-cell">Corps envoyé</th>
              <th className="text-left px-4 py-3 text-brvm-subtext text-xs font-semibold uppercase">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map((t) => {
              const r = results[t.id]
              return (
                <tr key={t.id} className="border-b border-brvm-border last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <StatusIcon status={r?.status ?? 'pending'} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brvm-text text-sm">{t.id} — {t.label}</p>
                    <p className="text-brvm-muted text-xs mt-0.5">{t.desc}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="text-xs text-brvm-subtext bg-slate-50 border border-brvm-border rounded px-2 py-1 block">
                      {JSON.stringify(t.body)}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge r={r} />
                    {r?.status && r.status !== 'loading' && r.status !== 'pending' && r.raw && (
                      <details className="mt-1">
                        <summary className="text-xs text-brvm-muted cursor-pointer hover:text-brvm-text">Voir réponse brute</summary>
                        <pre className="mt-1 text-xs bg-slate-950 text-green-400 rounded p-2 overflow-x-auto max-w-xs">
                          {r.raw}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Comment interpréter les résultats</p>
        <ul className="space-y-1 text-xs">
          <li>✅ <strong>Lignes retournées</strong> = cette combinaison fonctionne → on met à jour LiveChart avec ces paramètres</li>
          <li>⚠ <strong>nodata</strong> = l'API répond mais rejette les paramètres</li>
          <li>❌ <strong>Erreur</strong> = problème réseau ou proxy</li>
        </ul>
      </div>
    </div>
  )
}
