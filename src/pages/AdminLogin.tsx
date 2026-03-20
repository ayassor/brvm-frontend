import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TrendingUp, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { login, logout, clearError } from '../store/slices/authSlice'

export default function AdminLogin() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, isAuthenticated, user } = useAppSelector((s) => s.auth)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate(from, { replace: true })
      } else {
        // Non-admin user: immediately logout to clear token from localStorage
        dispatch(logout())
        setLocalError('Accès refusé : vous n\'avez pas les droits administrateur.')
      }
    }
    return () => { dispatch(clearError()) }
  }, [isAuthenticated, user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    dispatch(login(form))
  }

  const displayError = localError || error

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0f1e2e' }}
    >
      <div className="w-full max-w-md">
        {/* Logo + badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white">
                Afrivest<span className="text-emerald-400">.io</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                <Shield size={10} />
                ADMIN
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-2">Accès réservé aux administrateurs</p>
        </div>

        <div
          className="rounded-2xl p-8 border"
          style={{ backgroundColor: '#132030', borderColor: '#1e3248' }}
        >
          {displayError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Email administrateur
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@exemple.com"
                required
                className="w-full rounded-lg px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: '#0f1e2e',
                  border: '1px solid #1e3248',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#10b981' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#1e3248' }}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg px-4 py-3 pr-11 text-white placeholder:text-slate-500 text-sm focus:outline-none transition-colors"
                  style={{
                    backgroundColor: '#0f1e2e',
                    border: '1px solid #1e3248',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#10b981' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#1e3248' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Connexion...' : 'Accéder au panneau admin'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t flex items-center justify-center gap-2 text-slate-500 text-xs" style={{ borderColor: '#1e3248' }}>
            <Shield size={12} />
            Connexion sécurisée — Accès restreint
          </div>
        </div>
      </div>
    </div>
  )
}
