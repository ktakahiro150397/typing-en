import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const MAX_NOTE_LENGTH = 5000

const weakWordSelect = {
  id: true,
  word: true,
  missRate: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const

export default async function weakWordRoutes(app: FastifyInstance) {
  app.get(
    '/weak-words',
    { preHandler: [authenticateJWT] },
    async (req) => {
      const userId = req.user!.id
      const words = await prisma.weakWord.findMany({
        where: { userId },
        orderBy: [{ missRate: 'desc' }, { updatedAt: 'desc' }],
        select: weakWordSelect,
      })
      return { words }
    },
  )

  app.patch(
    '/weak-words/:id',
    { preHandler: [authenticateJWT] },
    async (req, reply) => {
      const userId = req.user!.id
      const { id } = req.params as { id: string }
      const { note } = req.body as { note?: unknown }

      if (typeof note !== 'string') {
        return reply.status(400).send({ message: 'note must be a string' })
      }
      if (note.length > MAX_NOTE_LENGTH) {
        return reply.status(400).send({ message: `note must be ${MAX_NOTE_LENGTH} chars or less` })
      }

      const existing = await prisma.weakWord.findUnique({
        where: { id },
        select: { userId: true },
      })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ message: 'Not found' })
      }

      const updated = await prisma.weakWord.update({
        where: { id },
        data: { note: note.trim() || null },
        select: weakWordSelect,
      })
      return updated
    },
  )

  app.delete(
    '/weak-words/:id',
    { preHandler: [authenticateJWT] },
    async (req, reply) => {
      const userId = req.user!.id
      const { id } = req.params as { id: string }

      const existing = await prisma.weakWord.findUnique({
        where: { id },
        select: { userId: true },
      })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ message: 'Not found' })
      }

      await prisma.weakWord.delete({ where: { id } })
      return reply.status(204).send()
    },
  )
}
