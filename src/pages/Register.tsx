import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { register, clearError } from '../store/slices/authSlice'

export default function Register() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useAppSelector((s) => s.auth)

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
    return () => { dispatch(clearError()) }
  }, [isAuthenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(register(form))
  }

  const pwdStrength = form.password.length === 0 ? 0
    : form.password.length < 8 ? 1
    : form.password.length < 12 ? 2 : 3

  const benefits = [
    'Suivi des marchés en temps réel',
    'Simulation de portefeuille gratuite',
    '5 requêtes IA par mois incluses',
    'Accès aux cours et ressources',
  ]

  return (
    <div className="min-h-screen bg-brvm-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">
        {/* Left - benefits */}
        <div className="hidden md:block pt-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-brvm-green rounded-xl flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-brvm-text">BRVM<span className="text-brvm-green">.com</span></span>
          </Link>
          <h2 className="text-3xl font-bold text-brvm-text mb-4">
            Investissez mieux,<br />
            <span className="text-brvm-green">informé des marchés</span>
          </h2>
          <p className="text-brvm-muted text-sm mb-8">
            Rejoignez des milliers d'investisseurs qui suivent la BRVM avec notre plateforme.
          </p>
          <div className="space-y-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-brvm-green flex-shrink-0" />
                <span className="text-brvm-subtext text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right - form */}
        <div>
          <div className="text-center md:hidden mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 bg-brvm-green rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-brvm-text">BRVM<span className="text-brvm-green">.com</span></span>
            </Link>
          </div>

          <div className="bg-brvm-card border border-brvm-border rounded-2xl p-8">
            <h3 className="text-brvm-text font-bold text-xl mb-6">Créer un compte gratuit</h3>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-brvm-subtext text-sm font-medium mb-2">Nom complet</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                  minLength={2}
                  className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-3 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green transition-colors"
                />
              </div>

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
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                    className="w-full bg-black/20 border border-brvm-border rounded-lg px-4 py-3 pr-11 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brvm-muted"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= pwdStrength
                            ? pwdStrength === 1 ? 'bg-red-500' : pwdStrength === 2 ? 'bg-brvm-gold' : 'bg-brvm-green'
                            : 'bg-brvm-border'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brvm-green hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm mt-2"
              >
                {loading ? 'Création du compte...' : 'Créer mon compte gratuitement'}
              </button>
            </form>

            <p className="text-center text-brvm-muted text-sm mt-5">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-brvm-green hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
