import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(cookie, {
  secret: process.env.JWT_SECRET ?? 'dev-secret',
})

// Health check
app.get('/health', async () => ({ status: 'ok' }))

// Routes (Phase 2 以降で追加)
// await app.register(import('./routes/auth.js'))
// await app.register(import('./routes/sentences.js'), { prefix: '/api' })
// await app.register(import('./routes/weakWords.js'), { prefix: '/api' })
// await app.register(import('./routes/sessions.js'), { prefix: '/api' })
// await app.register(import('./routes/stats.js'), { prefix: '/api' })

const port = Number(process.env.PORT ?? 3000)
await app.listen({ port, host: '0.0.0.0' })
