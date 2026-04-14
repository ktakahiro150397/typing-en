import type { FastifyInstance } from 'fastify'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'
import { isAdminEmail } from '../lib/admin.js'
import { authenticateJWT } from '../middleware/authenticate.js'
import { passport } from '../passport.js'

export default async function authRoutes(app: FastifyInstance) {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

  // Register Google OAuth strategy
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              name: profile.displayName,
              email: profile.emails?.[0]?.value ?? '',
            },
            create: {
              googleId: profile.id,
              email: profile.emails?.[0]?.value ?? '',
              name: profile.displayName,
            },
          })
          done(null, user)
        } catch (err) {
          done(err as Error)
        }
      },
    ),
  )

  passport.registerUserSerializer(async (user: { id: string }) => user.id)
  passport.registerUserDeserializer(async (id: string) => {
    return prisma.user.findUnique({ where: { id } })
  })

  // Redirect to Google OAuth consent screen
  app.get(
    '/auth/google',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { preValidation: passport.authenticate('google', { scope: ['profile', 'email'] }) as any },
    async () => {},
  )

  // Google OAuth callback — sign JWT and redirect to frontend
  app.get(
    '/auth/google/callback',
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      preValidation: passport.authenticate('google', {
        failureRedirect: `${frontendUrl}?error=auth_failed`,
      }) as any,
    },
    async (req, reply) => {
      const user = req.user!
      const token = jwt.sign(
        { sub: user.id },
        process.env.JWT_SECRET ?? 'dev-secret',
        { expiresIn: '7d' },
      )
      return reply.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`)
    },
  )

  // Return current user info (JWT-protected)
  app.get(
    '/auth/me',
    { preHandler: [authenticateJWT] },
    async (req) => {
      const { id, email, name, createdAt } = req.user!
      return { id, email, name, createdAt, isAdmin: isAdminEmail(email) }
    },
  )

  // Logout — JWT is stateless; client clears localStorage
  app.post('/auth/logout', async (_req, reply) => {
    return reply.send({ ok: true })
  })
}
