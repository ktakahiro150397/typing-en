import type { FastifyInstance } from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import { parse } from 'csv-parse'
import { basename, extname } from 'node:path'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const MAX_TEXT_LENGTH = 5000
const MAX_TRANSLATION_LENGTH = 5000
const MAX_CATEGORY_COUNT = 20
const MAX_CATEGORY_LENGTH = 100

const sentenceSelect = {
  id: true,
  text: true,
  translation: true,
  note: true,
  createdAt: true,
  categories: {
    select: { category: true },
    orderBy: { category: 'asc' as const },
  },
}

function normalizeCategories(values: string[]): string[] {
  const seen = new Set<string>()
  const categories: string[] = []

  for (const value of values) {
    const category = value.trim()
    if (!category || category.length > MAX_CATEGORY_LENGTH || seen.has(category)) {
      continue
    }
    seen.add(category)
    categories.push(category)
    if (categories.length >= MAX_CATEGORY_COUNT) {
      break
    }
  }

  return categories
}

function parseCategoryText(value: string | undefined): string[] {
  return value
    ? value.split(/[\n,、]+/).map((item) => item.trim()).filter(Boolean)
    : []
}

function getFileNameCategory(filename: string | undefined): string[] {
  if (!filename) return []
  const category = basename(filename, extname(filename)).trim()
  return category ? [category] : []
}

function mapSentence(sentence: {
  id: string
  text: string
  translation: string | null
  note: string | null
  createdAt: Date
  categories: Array<{ category: string }>
}) {
  return {
    id: sentence.id,
    text: sentence.text,
    translation: sentence.translation,
    note: sentence.note,
    createdAt: sentence.createdAt,
    categories: sentence.categories.map(({ category }) => category),
  }
}

export default async function sentenceRoutes(app: FastifyInstance) {
  await app.register(fastifyMultipart)

  // GET /api/sentences — list user's sentences
  app.get(
    '/sentences',
    { preHandler: [authenticateJWT, requireAdmin] },
    async () => {
      const [sentences, total] = await Promise.all([
        prisma.sentence.findMany({
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: sentenceSelect,
        }),
        prisma.sentence.count(),
      ])
      return { sentences: sentences.map(mapSentence), total }
    },
  )

  // POST /api/sentences/import — CSV bulk import (must be before /:id)
  app.post(
    '/sentences/import',
    { preHandler: [authenticateJWT, requireAdmin] },
    async (req, reply) => {
      const createdByUserId = req.user!.id
      const data = await req.file()
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' })
      }
      const fileCategories = getFileNameCategory(data.filename)

      let created = 0
      let updated = 0
      const errors: string[] = []

      const parser = data.file.pipe(
        parse({ columns: true, trim: true, skip_empty_lines: true }),
      )

      for await (const row of parser as AsyncIterable<Record<string, string>>) {
        const text = (row['text'] ?? '').trim()
        const translation = (row['translation'] ?? '').trim()
        const categories = normalizeCategories([
          ...fileCategories,
          ...parseCategoryText(row['categories']),
          ...parseCategoryText(row['category']),
        ])
        if (!text) continue
        if (text.length > MAX_TEXT_LENGTH) {
          errors.push(`Too long (${text.length} chars): "${text.slice(0, 40)}..."`)
          continue
        }
        if (translation.length > MAX_TRANSLATION_LENGTH) {
          errors.push(`Translation too long (${translation.length} chars): "${text.slice(0, 40)}..."`)
          continue
        }
        try {
          const existing = await prisma.sentence.findUnique({
            where: { text },
            select: { id: true },
          })
          await prisma.sentence.upsert({
            where: { text },
            create: {
              createdByUserId,
              text,
              translation: translation || null,
              note: row['note']?.trim() || null,
              ...(categories.length > 0
                ? {
                    categories: {
                      create: categories.map((category) => ({ category })),
                    },
                  }
                : {}),
            },
            update: {
              translation: translation || null,
              note: row['note']?.trim() || null,
              categories: {
                deleteMany: {},
                ...(categories.length > 0
                  ? {
                      create: categories.map((category) => ({ category })),
                    }
                  : {}),
              },
            },
          })
          if (existing) {
            updated++
          } else {
            created++
          }
        } catch (e: unknown) {
          const err = e as { code?: string; message?: string }
          errors.push(`Row "${text.slice(0, 40)}": ${err.message ?? 'Unknown error'}`)
        }
      }

      return { created, updated, errors }
    },
  )

  // POST /api/sentences — create single sentence
  app.post(
    '/sentences',
    { preHandler: [authenticateJWT, requireAdmin] },
    async (req, reply) => {
      const createdByUserId = req.user!.id
      const { text, translation, note, categories } = req.body as {
        text?: string
        translation?: string
        note?: string
        categories?: unknown
      }

      const trimmed = (text ?? '').trim()
      if (!trimmed) {
        return reply.status(400).send({ message: 'text is required' })
      }
      if (trimmed.length > MAX_TEXT_LENGTH) {
        return reply.status(400).send({ message: `text must be ${MAX_TEXT_LENGTH} chars or less` })
      }
      if (translation !== undefined && translation.length > MAX_TRANSLATION_LENGTH) {
        return reply.status(400).send({ message: `translation must be ${MAX_TRANSLATION_LENGTH} chars or less` })
      }
      if (categories !== undefined && !Array.isArray(categories)) {
        return reply.status(400).send({ message: 'categories must be an array' })
      }
      const normalizedCategories = normalizeCategories(
        Array.isArray(categories)
          ? categories.filter((value): value is string => typeof value === 'string')
          : [],
      )

      try {
        const sentence = await prisma.sentence.create({
          data: {
            createdByUserId,
            text: trimmed,
            translation: translation?.trim() || null,
            note: note?.trim() || null,
            ...(normalizedCategories.length > 0
              ? {
                  categories: {
                    create: normalizedCategories.map((category) => ({ category })),
                  },
                }
              : {}),
          },
          select: sentenceSelect,
        })
        return reply.status(201).send(mapSentence(sentence))
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
    { preHandler: [authenticateJWT, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string }
      const { text, translation, note, categories } = req.body as {
        text?: string
        translation?: string
        note?: string
        categories?: unknown
      }

      const existing = await prisma.sentence.findUnique({
        where: { id },
        select: { id: true },
      })
      if (!existing) {
        return reply.status(404).send({ message: 'Not found' })
      }
      if (categories !== undefined && !Array.isArray(categories)) {
        return reply.status(400).send({ message: 'categories must be an array' })
      }
      if (translation !== undefined && translation.length > MAX_TRANSLATION_LENGTH) {
        return reply.status(400).send({ message: `translation must be ${MAX_TRANSLATION_LENGTH} chars or less` })
      }

      const patch: {
        text?: string
        translation?: string | null
        note?: string | null
        categories?: {
          deleteMany: Record<string, never>
          create?: Array<{ category: string }>
        }
      } = {}
      if (text !== undefined) {
        const trimmed = text.trim()
        if (!trimmed) return reply.status(400).send({ message: 'text cannot be empty' })
        if (trimmed.length > MAX_TEXT_LENGTH) return reply.status(400).send({ message: `text must be ${MAX_TEXT_LENGTH} chars or less` })
        patch.text = trimmed
      }
      if (note !== undefined) {
        patch.note = note.trim() || null
      }
      if (translation !== undefined) {
        patch.translation = translation.trim() || null
      }
      if (categories !== undefined) {
        const normalizedCategories = normalizeCategories(
          categories.filter((value): value is string => typeof value === 'string'),
        )
        patch.categories = {
          deleteMany: {},
          ...(normalizedCategories.length > 0
            ? {
                create: normalizedCategories.map((category) => ({ category })),
              }
            : {}),
        }
      }

      try {
        const updated = await prisma.sentence.update({
          where: { id },
          data: patch,
          select: sentenceSelect,
        })
        return mapSentence(updated)
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
    { preHandler: [authenticateJWT, requireAdmin] },
    async (req, reply) => {
      const { id } = req.params as { id: string }

      const existing = await prisma.sentence.findUnique({
        where: { id },
        select: { id: true },
      })
      if (!existing) {
        return reply.status(404).send({ message: 'Not found' })
      }

      await prisma.sentence.delete({ where: { id } })
      return reply.status(204).send()
    },
  )
}
