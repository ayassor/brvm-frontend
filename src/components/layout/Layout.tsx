import { Link, Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-brvm-bg text-brvm-text font-sans">
      <Navbar />
      <main className="max-w-6xl mx-auto px-8 sm:px-12 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-brvm-border mt-16 py-8 text-brvm-muted text-sm">
        <div className="max-w-6xl mx-auto px-8 sm:px-12 text-center">
          <p>© 2026 Afrivest — Investir en Afrique, simplement.</p>
          <p className="mt-1 text-xs">Données à titre informatif uniquement. Pas de conseil en investissement.</p>
          <p className="mt-3">
            <Link to="/brvm-package" className="text-xs text-brvm-muted hover:text-brvm-green transition-colors underline underline-offset-2">
              Sources de données BRVM
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
