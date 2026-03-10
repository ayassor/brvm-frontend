import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/sikafinance': {
        target: 'https://www.sikafinance.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/sikafinance/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Read the ticker passed as a custom header from the frontend
            const ticker = String(req.headers['x-sika-ticker'] ?? 'SNTS').toUpperCase()

            // Set headers that match exactly what the R BRVM package sends
            proxyReq.setHeader('Origin', 'https://www.sikafinance.com')
            proxyReq.setHeader('Referer', `https://www.sikafinance.com/marches/historiques/${ticker}`)
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0')
            proxyReq.setHeader('Accept', '*/*')
            proxyReq.setHeader('Accept-Language', 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3')
            proxyReq.setHeader('Sec-Fetch-Dest', 'empty')
            proxyReq.setHeader('Sec-Fetch-Mode', 'cors')
            proxyReq.setHeader('Sec-Fetch-Site', 'same-origin')
            proxyReq.setHeader('Connection', 'keep-alive')

            // Remove the custom header before forwarding to sikafinance
            proxyReq.removeHeader('x-sika-ticker')
          })
        },
      },
    },
  },
})
