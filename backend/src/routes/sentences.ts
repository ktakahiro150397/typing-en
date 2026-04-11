import type { FastifyInstance } from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import { parse } from 'csv-parse'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const MAX_TEXT_LENGTH = 5000

export default async function sentenceRoutes(app: FastifyInstance) {
  await app.register(fastifyMultipart)

  // GET /api/sentences — list user's sentences
  app.get(
    '/sentences',
    { preHandler: [authenticateJWT] },
    async (req) => {
      const userId = req.user!.id
      const [sentences, total] = await Promise.all([
        prisma.sentence.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: { id: true, text: true, note: true, createdAt: true },
        }),
        prisma.sentence.count({ where: { userId } }),
      ])
      return { sentences, total }
    },
  )

  // POST /api/sentences/import — CSV bulk import (must be before /:id)
  app.post(
    '/sentences/import',
    { preHandler: [authenticateJWT] },
    async (req, reply) => {
      const userId = req.user!.id
      const data = await req.file()
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' })
      }

      let created = 0
      let skipped = 0
      const errors: string[] = []

      const parser = data.file.pipe(
        parse({ columns: true, trim: true, skip_empty_lines: true }),
      )

      for await (const row of parser as AsyncIterable<Record<string, string>>) {
        const text = (row['text'] ?? '').trim()
        if (!text) continue
        if (text.length > MAX_TEXT_LENGTH) {
          errors.push(`Too long (${text.length} chars): "${text.slice(0, 40)}..."`)
          continue
        }
        try {
          await prisma.sentence.create({
            data: { userId, text, note: row['note'] || null },
          })
          created++
        } catch (e: unknown) {
          const err = e as { code?: string; message?: string }
          if (err.code === 'P2002') {
            skipped++
          } else {
            errors.push(`Row "${text.slice(0, 40)}": ${err.message ?? 'Unknown error'}`)
          }
        }
      }

      return { created, skipped, errors }
    },
  )

  // POST /api/sentences — create single sentence
  app.post(
    '/sentences',
    { preHandler: [authenticateJWT] },
    async (req, reply) => {
      const userId = req.user!.id
      const { text, note } = req.body as { text?: string; note?: string }

      const trimmed = (text ?? '').trim()
      if (!trimmed) {
        return reply.status(400).send({ message: 'text is required' })
      }
      if (trimmed.length > MAX_TEXT_LENGTH) {
        return reply.status(400).send({ message: `text must be ${MAX_TEXT_LENGTH} chars or less` })
      }

      try {
        const sentence = await prisma.sentence.create({
          data: { userId, text: trimmed, note: note?.trim() || null },
          select: { id: true, text: true, note: true, createdAt: true },
        })
        return reply.status(201).send(sentence)
      } catch (e: unknown) {
        const err = e as { code?: string }
        if (err.code === 'P2002') {
          return reply.status(409).send({ message: 'Duplicate sentence' })
        }
        throw e
      }
    },
  )

  // PATCH /api/sentences/:id — update text or note
  app.patch(
    '/sentences/:id',
    { preHandler: [authenticateJWT] },
    async (req, reply) => {
      const userId = req.user!.id
      const { id } = req.params as { id: string }
      const { text, note } = req.body as { text?: string; note?: string }

      const existing = await prisma.sentence.findUnique({
        where: { id },
        select: { userId: true },
      })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ message: 'Not found' })
      }

      const patch: { text?: string; note?: string | null } = {}
      if (text !== undefined) {
        const trimmed = text.trim()
        if (!trimmed) return reply.status(400).send({ message: 'text cannot be empty' })
        if (trimmed.length > MAX_TEXT_LENGTH) return reply.status(400).send({ message: `text must be ${MAX_TEXT_LENGTH} chars or less` })
        patch.text = trimmed
      }
      if (note !== undefined) {
        patch.note = note.trim() || null
      }

      try {
        const updated = await prisma.sentence.update({
          where: { id },
          data: patch,
          select: { id: true, text: true, note: true, createdAt: true },
        })
        return updated
      } catch (e: unknown) {
        const err = e as { code?: string }
        if (err.code === 'P2002') {
          return reply.status(409).send({ message: 'Duplicate sentence' })
        }
        throw e
      }
    },
  )

  // DELETE /api/sentences/:id
  app.delete(
    '/sentences/:id',
    { preHandler: [authenticateJWT] },
    async (req, reply) => {
      const userId = req.user!.id
      const { id } = req.params as { id: string }

      const existing = await prisma.sentence.findUnique({
        where: { id },
        select: { userId: true },
      })
      if (!existing || existing.userId !== userId) {
        return reply.status(404).send({ message: 'Not found' })
      }

      await prisma.sentence.delete({ where: { id } })
      return reply.status(204).send()
    },
  )
}
