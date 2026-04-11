import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyPassport from '@fastify/passport'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(cookie, {
  secret: process.env.JWT_SECRET ?? 'dev-secret',
})

// Session is required by @fastify/passport for the OAuth callback handshake.
// Minimum 32-char secret required by @fastify/session.
const sessionSecret = process.env.JWT_SECRET ?? 'dev-secret-must-be-32chars-long!!'
await app.register(fastifySession, {
  secret: sessionSecret,
  cookie: { secure: false },
  saveUninitialized: false,
})

await app.register(fastifyPassport.initialize())
await app.register(fastifyPassport.secureSession())

// Health check
app.get('/health', async () => ({ status: 'ok' }))

// Routes
await app.register(import('./routes/auth.js'))
await app.register(import('./routes/sentences.js'), { prefix: '/api' })
// await app.register(import('./routes/weakWords.js'), { prefix: '/api' })
await app.register(import('./routes/sessions.js'), { prefix: '/api' })
// await app.register(import('./routes/stats.js'), { prefix: '/api' })

const port = Number(process.env.PORT ?? 3000)
await app.listen({ port, host: '0.0.0.0' })
