import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { learningHttp } from './server/learningHttp.ts'
import { library } from './src/learning/content/curriculum.ts'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    server: {
      fs: {
        deny: ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**',
          '**/server/**', '**/api/**', '**/src/learning/content/**', '**/test/**', '**/scripts/**', '**/supabase/**'],
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'fingestao-biblioteca',
        resolveId: id => id === 'virtual:biblioteca-financeira' ? '\0' + id : undefined,
        load: id => id === '\0virtual:biblioteca-financeira' ? 'export default ' + JSON.stringify(library) : undefined,
      },
      {
        name: 'fingestao-aprendizado',
        configureServer(server) {
          server.middlewares.use('/api/aprendizado', (request, response) => void learningHttp(request, response, env))
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/aprendizado', (request, response) => void learningHttp(request, response, env))
        },
      },
    ],
  }
})

