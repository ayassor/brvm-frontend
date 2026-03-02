import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-brvm-bg text-brvm-text font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-brvm-border mt-16 py-8 text-center text-brvm-muted text-sm">
        <p>© 2025 BRVM.com — Bourse Régionale des Valeurs Mobilières</p>
        <p className="mt-1 text-xs">Données à titre informatif uniquement. Pas de conseil en investissement.</p>
      </footer>
    </div>
  )
}
