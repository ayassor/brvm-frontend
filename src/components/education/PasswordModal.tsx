import { useState, useEffect, useRef } from 'react'
import { Lock, X, Eye, EyeOff, Loader } from 'lucide-react'
import { educationApi } from '../../api/education.api'

interface PasswordModalProps {
  courseId: number
  courseTitle: string
  onSuccess: () => void
  onClose: () => void
}

export default function PasswordModal({ courseId, courseTitle, onSuccess, onClose }: PasswordModalProps) {
  const [password, setPassword]   = useState('')
  const [show,     setShow]       = useState(false)
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    setTimeout(() => inputRef.current?.focus(), 100)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const res = await educationApi.unlockCourse(courseId, password)
      if (res.success) onSuccess()
      else setError('Mot de passe incorrect.')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="relative px-6 py-6 text-white"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/20 rounded-xl p-2.5">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Accès protégé</p>
              <h2 className="text-white font-bold text-base leading-tight">{courseTitle}</h2>
            </div>
          </div>
          <p className="text-white/60 text-xs mt-2">
            Ce cours est protégé par un mot de passe. Entrez-le pour y accéder.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brvm-subtext mb-1.5 uppercase tracking-wider">
              Mot de passe
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Entrez le mot de passe…"
                className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:ring-2 transition ${
                  error
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-brvm-border focus:border-brvm-green focus:ring-brvm-green/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brvm-muted hover:text-brvm-text transition-colors"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-red-500 text-xs flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-brvm-green text-white font-semibold py-3 rounded-xl text-sm hover:bg-brvm-green/90 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Lock size={15} />}
            {loading ? 'Vérification…' : 'Déverrouiller'}
          </button>
        </form>
      </div>
    </div>
  )
}
