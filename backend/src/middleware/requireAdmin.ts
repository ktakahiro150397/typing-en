import type { FastifyReply, FastifyRequest } from 'fastify'
import { isAdminEmail } from '../lib/admin.js'

export async function requireAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!req.user || !isAdminEmail(req.user.email)) {
    return reply.status(403).send({ message: 'Forbidden' })
  }
}
