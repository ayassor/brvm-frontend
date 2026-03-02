/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brvm: {
          bg: '#0a0e1a',
          card: '#111827',
          border: '#1f2937',
          green: '#10b981',
          red: '#ef4444',
          gold: '#f59e0b',
          blue: '#3b82f6',
          muted: '#6b7280',
          text: '#f9fafb',
          subtext: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
