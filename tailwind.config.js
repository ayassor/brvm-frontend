/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brvm: {
          bg: '#f4f6f8',
          card: '#ffffff',
          border: '#e2e8f0',
          green: '#059669',
          red: '#dc2626',
          gold: '#d97706',
          blue: '#2563eb',
          muted: '#94a3b8',
          text: '#0f172a',
          subtext: '#475569',
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
