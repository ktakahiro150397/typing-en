import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const MAX_WORD_LENGTH = 200
const MAX_NOTE_LENGTH = 5000

const weakWordSelect = {
  id: true,
  word: true,
  missRate: true,
  activeDurationMs: true,
  msPerChar: true,
  stallCount: true,
  stallDurationMs: true,
  weaknessScore: true,
  primaryReason: true,
  isSolved: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const

export default async function weakWordRoutes(app: FastifyInstance) {
  app.post(
    '/weak-words',
    { preHandler: [authenticateJWT] },
    async (req, reply) => {
      const userId = req.user!.id
      const body = (req.body ?? {}) as { word?: unknown; note?: unknown }

      if (typeof body.word !== 'string' || !body.word.trim()) {
        return reply.status(400).send({ message: 'word is required' })
      }

      const word = body.word.trim()
      if (word.length > MAX_WORD_LENGTH) {
        return reply.status(400).send({ message: `word must be ${MAX_WORD_LENGTH} chars or less` })
      }
      if (/\s/.test(word)) {
        return reply.status(400).send({ message: 'word must be a single token without spaces' })
      }

      let note: string | null = null
      if ('note' in body) {
        if (typeof body.note !== 'string') {
          return reply.status(400).send({ message: 'note must be a string' })
        }
        if (body.note.length > MAX_NOTE_LENGTH) {
          return reply.status(400).send({ message: `note must be ${MAX_NOTE_LENGTH} chars or less` })
        }
        note = body.note.trim() || null
      }

      const existing = await prisma.weakWord.findUnique({
        where: { userId_word: { userId, word } },
        select: weakWordSelect,
      })
      if (existing) {
        return reply.status(200).send({ word: existing, created: false })
      }

      const created = await prisma.weakWord.create({
        data: {
          userId,
          word,
          note,
          missRate: 0,
          activeDurationMs: 0,
          msPerChar: 0,
          stallCount: 0,
          stallDurationMs: 0,
          weaknessScore: 0,
          primaryReason: null,
          isSolved: false,
        },
        select: weakWordSelect,
      })

      return reply.status(201).send({ word: created, created: true })
    },
  )

  app.get(
    '/weak-words',
    { preHandler: [authenticateJWT] },
    async (req) => {
      const userId = req.user!.id
      const words = await prisma.weakWord.findMany({
        where: { userId },
        orderBy: [{ weaknessScore: 'desc' }, { updatedAt: 'desc' }],
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
