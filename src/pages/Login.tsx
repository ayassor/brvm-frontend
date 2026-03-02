import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { login, clearError } from '../store/slices/authSlice'

export default function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, isAuthenticated } = useAppSelector((s) => s.auth)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
    return () => { dispatch(clearError()) }
  }, [isAuthenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(login(form))
  }

  return (
    <div className="min-h-screen bg-brvm-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-brvm-green rounded-xl flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-brvm-text">BRVM<span className="text-brvm-green">.com</span></span>
          </Link>
          <p className="text-brvm-muted mt-3 text-sm">Connectez-vous à votre compte</p>
        </div>

        <div className="bg-brvm-card border border-brvm-border rounded-2xl p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-brvm-subtext text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="vous@exemple.com"
                required
                className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-3 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green transition-colors"
              />
            </div>

            <div>
              <label className="block text-brvm-subtext text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-3 pr-11 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brvm-muted hover:text-brvm-subtext"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brvm-green hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-brvm-muted text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-brvm-green hover:underline font-medium">
              S'inscrire gratuitement
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
