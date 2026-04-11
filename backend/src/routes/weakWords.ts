import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const MAX_NOTE_LENGTH = 5000

const weakWordSelect = {
  id: true,
  word: true,
  missRate: true,
  isSolved: true,
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
      const body = (req.body ?? {}) as { note?: unknown; isSolved?: unknown }
      const data: { note?: string | null; isSolved?: boolean } = {}

      if ('note' in body) {
        if (typeof body.note !== 'string') {
          return reply.status(400).send({ message: 'note must be a string' })
        }
        if (body.note.length > MAX_NOTE_LENGTH) {
          return reply.status(400).send({ message: `note must be ${MAX_NOTE_LENGTH} chars or less` })
        }
        data.note = body.note.trim() || null
      }

      if ('isSolved' in body) {
        if (typeof body.isSolved !== 'boolean') {
          return reply.status(400).send({ message: 'isSolved must be a boolean' })
        }
        data.isSolved = body.isSolved
      }

      if (Object.keys(data).length === 0) {
        return reply.status(400).send({ message: 'note or isSolved is required' })
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
        data,
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
