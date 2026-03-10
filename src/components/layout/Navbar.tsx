import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  TrendingUp, BarChart2, BookOpen, LayoutDashboard,
  LogOut, User, Menu, X, ChevronDown, Bot, Briefcase,
  Newspaper, Building, Landmark, LineChart, Wifi, Database,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { logout } from '../../store/slices/authSlice'

export default function Navbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [marketOpen, setMarketOpen] = useState(false)
  const marketRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (marketRef.current && !marketRef.current.contains(e.target as Node)) setMarketOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setMarketOpen(false)
    setUserMenuOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const isMarketActive = location.pathname.startsWith('/market') || location.pathname.startsWith('/bonds') || location.pathname.startsWith('/live')

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-brvm-border shadow-sm">
      <div className="max-w-7xl mx-auto px-8 sm:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-brvm-green rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="text-brvm-text font-bold text-lg tracking-tight">
              Afri<span className="text-brvm-green">vest</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">

            {/* Marché (dropdown) */}
            <div className="relative" ref={marketRef}>
              <button
                onClick={() => setMarketOpen(!marketOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isMarketActive
                    ? 'bg-brvm-green/10 text-brvm-green'
                    : 'text-brvm-subtext hover:text-brvm-text hover:bg-slate-100'
                }`}
              >
                <BarChart2 size={16} />
                Marché
                <ChevronDown size={13} className={`transition-transform duration-150 ${marketOpen ? 'rotate-180' : ''}`} />
              </button>

              {marketOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-brvm-border rounded-xl shadow-lg py-1.5 z-50">
                  <p className="px-4 pt-1 pb-2 text-xs font-semibold text-brvm-muted uppercase tracking-wider">
                    Instruments
                  </p>
                  <Link
                    to="/market"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-brvm-subtext hover:text-brvm-text hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <LineChart size={13} className="text-brvm-green" />
                    </div>
                    <div>
                      <p className="font-medium text-brvm-text">Actions</p>
                      <p className="text-xs text-brvm-muted">47 valeurs cotées</p>
                    </div>
                  </Link>
                  <Link
                    to="/bonds"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-brvm-subtext hover:text-brvm-text hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Landmark size={13} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-brvm-text">Obligations</p>
                      <p className="text-xs text-brvm-muted">Marché obligataire UEMOA</p>
                    </div>
                  </Link>
                  <div className="mx-3 border-t border-brvm-border my-1" />
                  <p className="px-4 pt-1 pb-2 text-xs font-semibold text-brvm-muted uppercase tracking-wider">
                    Analyse
                  </p>
                  <Link
                    to="/live"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-brvm-subtext hover:text-brvm-text hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Wifi size={13} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-brvm-text">Cours en direct</p>
                      <p className="text-xs text-brvm-muted">OHLCV réel · sikafinance</p>
                    </div>
                  </Link>
                  <Link
                    to="/data-import"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-brvm-subtext hover:text-brvm-text hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Database size={13} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-brvm-text">Import données</p>
                      <p className="text-xs text-brvm-muted">Excel + JSON → SQL</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Actualités */}
            <NavLink
              to="/news"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brvm-green/10 text-brvm-green'
                    : 'text-brvm-subtext hover:text-brvm-text hover:bg-slate-100'
                }`
              }
            >
              <Newspaper size={16} />
              Actualités
            </NavLink>

            {/* Sociétés de Gestion */}
            <NavLink
              to="/asset-managers"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brvm-green/10 text-brvm-green'
                    : 'text-brvm-subtext hover:text-brvm-text hover:bg-slate-100'
                }`
              }
            >
              <Building size={16} />
              <span className="hidden lg:inline">Sociétés de Gestion</span>
              <span className="lg:hidden">Gestion</span>
            </NavLink>

            {/* Apprendre */}
            <NavLink
              to="/education"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brvm-green/10 text-brvm-green'
                    : 'text-brvm-subtext hover:text-brvm-text hover:bg-slate-100'
                }`
              }
            >
              <BookOpen size={16} />
              Apprendre
            </NavLink>

            {/* IA */}
            <NavLink
              to="/ai"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brvm-green/10 text-brvm-green'
                    : 'text-brvm-subtext hover:text-brvm-text hover:bg-slate-100'
                }`
              }
            >
              <Bot size={16} />
              IA
            </NavLink>

            {/* Simulation – dernier */}
            <NavLink
              to="/portfolio"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brvm-green/10 text-brvm-green'
                    : 'text-brvm-subtext hover:text-brvm-text hover:bg-slate-100'
                }`
              }
            >
              <Briefcase size={16} />
              Simulation
            </NavLink>
          </div>

          {/* Right: auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-brvm-green/20 flex items-center justify-center">
                    <User size={14} className="text-brvm-green" />
                  </div>
                  <span className="text-sm text-brvm-text font-medium">{user?.name?.split(' ')[0]}</span>
                  {user?.subscription_type === 'premium' && (
                    <span className="text-xs bg-brvm-gold/20 text-brvm-gold px-1.5 py-0.5 rounded font-semibold">PRO</span>
                  )}
                  <ChevronDown size={14} className="text-brvm-muted" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-brvm-border rounded-xl shadow-lg py-1">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brvm-subtext hover:text-brvm-text hover:bg-slate-100"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <hr className="border-brvm-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-100"
                    >
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm text-brvm-subtext hover:text-brvm-text transition-colors font-medium">
                  Connexion
                </Link>
                <Link to="/register" className="px-4 py-2 bg-brvm-green text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden text-brvm-subtext p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brvm-border bg-white px-4 py-3 space-y-0.5">
          {/* Marché section */}
          <p className="text-xs font-semibold text-brvm-muted uppercase tracking-wider px-3 pt-2 pb-1">Marché</p>
          <NavLink
            to="/market"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`
            }
          >
            <LineChart size={15} /> Actions
          </NavLink>
          <NavLink
            to="/bonds"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`
            }
          >
            <Landmark size={15} /> Obligations
          </NavLink>
          <NavLink
            to="/live"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`
            }
          >
            <Wifi size={15} /> Cours en direct
          </NavLink>

          <div className="h-px bg-brvm-border my-2" />

          <NavLink to="/news" onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`}>
            <Newspaper size={15} /> Actualités
          </NavLink>
          <NavLink to="/asset-managers" onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`}>
            <Building size={15} /> Sociétés de Gestion
          </NavLink>
          <NavLink to="/education" onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`}>
            <BookOpen size={15} /> Apprendre
          </NavLink>
          <NavLink to="/ai" onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`}>
            <Bot size={15} /> Assistant IA
          </NavLink>
          <NavLink to="/portfolio" onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'}`}>
            <Briefcase size={15} /> Simulation
          </NavLink>

          <div className="h-px bg-brvm-border my-2" />

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-brvm-subtext">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400">
                <LogOut size={15} /> Déconnexion
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 text-sm text-brvm-subtext border border-brvm-border rounded-lg font-medium">
                Connexion
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 bg-brvm-green text-white text-sm font-semibold rounded-lg">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
