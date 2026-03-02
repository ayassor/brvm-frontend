import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  TrendingUp, BarChart2, BookOpen, LayoutDashboard,
  LogOut, User, Menu, X, ChevronDown, Bot, Briefcase
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { logout } from '../../store/slices/authSlice'

export default function Navbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const navItems = [
    { to: '/market', label: 'Marché', icon: <BarChart2 size={16} /> },
    { to: '/companies', label: 'Entreprises', icon: <TrendingUp size={16} /> },
    { to: '/portfolio', label: 'Simulation', icon: <Briefcase size={16} /> },
    { to: '/education', label: 'Apprendre', icon: <BookOpen size={16} /> },
    { to: '/ai', label: 'IA', icon: <Bot size={16} /> },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-brvm-card border-b border-brvm-border backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brvm-green rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="text-brvm-text font-bold text-lg tracking-tight">BRVM<span className="text-brvm-green">.com</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brvm-green/10 text-brvm-green'
                      : 'text-brvm-subtext hover:text-brvm-text hover:bg-white/5'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
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
                  <div className="absolute right-0 mt-2 w-48 bg-brvm-card border border-brvm-border rounded-xl shadow-xl py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-brvm-subtext hover:text-brvm-text hover:bg-white/5"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <hr className="border-brvm-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5"
                    >
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm text-brvm-subtext hover:text-brvm-text transition-colors">
                  Connexion
                </Link>
                <Link to="/register" className="px-4 py-2 bg-brvm-green text-white text-sm font-semibold rounded-lg hover:bg-emerald-400 transition-colors">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
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
        <div className="md:hidden border-t border-brvm-border bg-brvm-card px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-brvm-green/10 text-brvm-green' : 'text-brvm-subtext'
                }`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
          <hr className="border-brvm-border my-2" />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-brvm-subtext">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400">
                <LogOut size={15} /> Déconnexion
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm text-brvm-subtext border border-brvm-border rounded-lg">Connexion</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-2.5 bg-brvm-green text-white text-sm font-semibold rounded-lg">S'inscrire</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
