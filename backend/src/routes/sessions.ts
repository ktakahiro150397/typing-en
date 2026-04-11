import type { User } from '@prisma/client'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const VALID_MODES = ['sentence', 'random', 'weak_word'] as const

type Mode = (typeof VALID_MODES)[number]

interface SessionWordInput {
  word: string
  misses: number
}

interface SessionBigramInput {
  bigram: string
  attempts: number
  misses: number
}

function sendBadRequest(reply: FastifyReply, message: string) {
  return reply.status(400).send({ message })
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function parseMode(value: unknown): Mode | null {
  if (typeof value !== 'string') return null
  return (VALID_MODES as readonly string[]).includes(value) ? (value as Mode) : null
}

function parseSentenceIds(value: unknown): string[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null

  const sentenceIds: string[] = []
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0) {
      return null
    }
    sentenceIds.push(item)
  }

  return sentenceIds
}

function parseWords(value: unknown): SessionWordInput[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null

  const words: SessionWordInput[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return null
    }

    const { word, misses } = item as Record<string, unknown>
    if (typeof word !== 'string' || word.length === 0 || !isNonNegativeInteger(misses)) {
      return null
    }

    words.push({ word, misses })
  }

  return words
}

function parseBigrams(value: unknown): SessionBigramInput[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null

  const bigrams: SessionBigramInput[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return null
    }

    const { bigram, attempts, misses } = item as Record<string, unknown>
    if (
      typeof bigram !== 'string' ||
      bigram.length !== 2 ||
      !isPositiveInteger(attempts) ||
      !isNonNegativeInteger(misses) ||
      misses > attempts
    ) {
      return null
    }

    bigrams.push({ bigram, attempts, misses })
  }

  return bigrams
}

export default async function sessionRoutes(app: FastifyInstance) {
  app.post('/sessions', { preHandler: [authenticateJWT] }, async (req, reply) => {
    const userId = (req.user as User).id
    const body = (req.body ?? {}) as Record<string, unknown>
    const totalKeys = body.totalKeys
    const missKeys = body.missKeys
    const durationMs = body.durationMs

    const mode = parseMode(body.mode)
    if (!mode) {
      return sendBadRequest(reply, 'mode must be one of sentence, random, weak_word')
    }
    if (!isNonNegativeInteger(totalKeys)) {
      return sendBadRequest(reply, 'totalKeys must be a non-negative integer')
    }
    if (!isNonNegativeInteger(missKeys)) {
      return sendBadRequest(reply, 'missKeys must be a non-negative integer')
    }
    if (!isPositiveInteger(durationMs)) {
      return sendBadRequest(reply, 'durationMs must be a positive integer')
    }

    const sentenceIds = parseSentenceIds(body.sentenceIds)
    if (!sentenceIds) {
      return sendBadRequest(reply, 'sentenceIds must be an array of non-empty strings')
    }
    if (mode === 'sentence' && sentenceIds.length === 0) {
      return sendBadRequest(reply, 'sentence mode requires at least one sentenceId')
    }

    const words = parseWords(body.words)
    if (!words) {
      return sendBadRequest(reply, 'words must be an array of { word, misses } with non-negative integer misses')
    }

    const bigrams = parseBigrams(body.bigrams)
    if (!bigrams) {
      return sendBadRequest(reply, 'bigrams must be an array of { bigram, attempts, misses } with valid integer counts')
    }

    const uniqueSentenceIds = [...new Set(sentenceIds)]
    if (uniqueSentenceIds.length > 0) {
      const sentences = await prisma.sentence.findMany({
        where: {
          userId,
          id: { in: uniqueSentenceIds },
        },
        select: { id: true },
      })

      if (sentences.length !== uniqueSentenceIds.length) {
        return sendBadRequest(reply, 'sentenceIds contain unknown or unauthorized sentences')
      }
    }

    const session = await prisma.$transaction(async (tx) => {
      const createdSession = await tx.session.create({
        data: {
          userId,
          mode,
          totalKeys,
          missKeys,
          durationMs,
        },
      })

      if (sentenceIds.length > 0) {
        await tx.sessionSentence.createMany({
          data: sentenceIds.map((sentenceId, index) => ({
            sessionId: createdSession.id,
            sentenceId,
            position: index,
          })),
        })
      }

      if (mode !== 'random' && words.length > 0) {
        await tx.sessionWord.createMany({
          data: words.map((word) => ({
            sessionId: createdSession.id,
            word: word.word,
            misses: word.misses,
          })),
        })

        for (const word of words) {
          const missRate = word.word.length > 0 ? word.misses / word.word.length : 0
          await tx.weakWord.upsert({
            where: { userId_word: { userId, word: word.word } },
            create: {
              userId,
              word: word.word,
              missRate,
              isSolved: false,
            },
            update: {
              missRate,
            },
          })
        }
      }

      for (const bigram of bigrams) {
        await tx.bigramStat.upsert({
          where: { userId_bigram: { userId, bigram: bigram.bigram } },
          create: {
            userId,
            bigram: bigram.bigram,
            attempts: bigram.attempts,
            misses: bigram.misses,
          },
          update: {
            attempts: { increment: bigram.attempts },
            misses: { increment: bigram.misses },
          },
        })
      }

      return createdSession
    })

    return reply.status(201).send({ sessionId: session.id })
  })
}
