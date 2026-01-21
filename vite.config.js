import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    strictPort: true,  // Don't use another port if 3003 is busy
    host: true,
    proxy: {
      '/api': {
        // Proxy to Vercel Dev Server running on port 3000
        // Start with: vercel dev
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  define: {
    // Support REACT_APP_* prefix for compatibility with Create React App patterns
    // This allows process.env.REACT_APP_* to work in development
    'process.env': process.env,
  },
})

