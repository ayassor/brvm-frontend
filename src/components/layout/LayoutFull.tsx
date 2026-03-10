import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function LayoutFull() {
  return (
    <div className="h-screen flex flex-col bg-white text-brvm-text font-sans overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
