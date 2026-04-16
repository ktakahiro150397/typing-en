import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'

const DEFAULT_PUBLIC_SESSION_COUNT = 5
const MAX_PUBLIC_SESSION_COUNT = 20

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function parseCount(value: unknown): number | null {
  if (value === undefined) {
    return DEFAULT_PUBLIC_SESSION_COUNT
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  const count = Number(value)
  if (!Number.isInteger(count) || count <= 0 || count > MAX_PUBLIC_SESSION_COUNT) {
    return null
  }

  return count
}

export default async function publicSentenceRoutes(app: FastifyInstance) {
  app.get('/public/sentences', async (req, reply) => {
    const count = parseCount((req.query as { count?: unknown }).count)
    if (count === null) {
      return reply.status(400).send({
        message: `count must be an integer between 1 and ${MAX_PUBLIC_SESSION_COUNT}`,
      })
    }

    const sentences = await prisma.sentence.findMany({
      select: {
        id: true,
        text: true,
        translation: true,
        createdAt: true,
      },
    })

    if (sentences.length === 0) {
      return reply.status(503).send({ message: '公開練習用の文章がまだありません' })
    }

    const selected = shuffle(sentences).slice(0, Math.min(count, sentences.length))

    return {
      sentences: selected.map((sentence) => ({
        id: sentence.id,
        text: sentence.text,
        translation: sentence.translation,
        note: null,
        createdAt: sentence.createdAt,
        categories: [] as string[],
      })),
      total: sentences.length,
    }
  })
}
