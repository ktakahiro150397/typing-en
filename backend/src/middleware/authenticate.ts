import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'

export async function authenticateJWT(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }
  const token = authHeader.slice(7)
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
