import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'

const MOCK_USER_ID = 'mock-user-local-dev'

export async function authenticateJWT(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }
  const token = authHeader.slice(7)

  // ローカル開発用モック認証: AUTH_MOCK=true かつ token が 'mock-token' の場合
  if (process.env.AUTH_MOCK === 'true' && token === 'mock-token') {
    const mockUser = await prisma.user.upsert({
      where: { id: MOCK_USER_ID },
      update: {},
      create: {
        id: MOCK_USER_ID,
        googleId: 'mock-google-id',
        email: 'mock@example.com',
        name: 'Mock User',
      },
    })
    req.user = mockUser
    return
  }

  let payload: { sub: string }
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as { sub: string }
  } catch {
    return reply.status(401).send({ message: 'Unauthorized' })
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }
  req.user = user
}
