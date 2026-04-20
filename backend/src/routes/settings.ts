import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const DEFAULT_SETTINGS = {
  missLockMs: 1000,
  penaltyResume: 'current' as const,
  focusMode: false,
  focusStart: 2,
  focusEnd: 10,
  focusRevealMs: 1000,
}

function isPenaltyResume(value: unknown): value is 'current' | 'word' {
  return value === 'current' || value === 'word'
}

export default async function settingsRoutes(app: FastifyInstance) {
  app.get('/settings', { preHandler: [authenticateJWT] }, async (req) => {
    const userId = req.user!.id
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        missLockMs: true,
        penaltyResume: true,
        focusMode: true,
        focusStart: true,
        focusEnd: true,
        focusRevealMs: true,
      },
    })

    return settings ?? DEFAULT_SETTINGS
  })

  app.put('/settings', { preHandler: [authenticateJWT] }, async (req, reply) => {
    const userId = req.user!.id
    const body = (req.body ?? {}) as {
      missLockMs?: unknown
      penaltyResume?: unknown
      focusMode?: unknown
      focusStart?: unknown
      focusEnd?: unknown
      focusRevealMs?: unknown
    }
    const nextMissLockMs = body.missLockMs
    const nextPenaltyResume = body.penaltyResume
    const nextFocusMode = body.focusMode
    const nextFocusStart = body.focusStart
    const nextFocusEnd = body.focusEnd
    const nextFocusRevealMs = body.focusRevealMs

    if (
      nextMissLockMs !== undefined
      && (typeof nextMissLockMs !== 'number'
        || !Number.isInteger(nextMissLockMs)
        || nextMissLockMs < 0
        || nextMissLockMs > 5000)
    ) {
      return reply.status(400).send({ message: 'missLockMs must be an integer between 0 and 5000' })
    }

    if (nextPenaltyResume !== undefined && !isPenaltyResume(nextPenaltyResume)) {
      return reply.status(400).send({ message: 'penaltyResume must be "current" or "word"' })
    }

    if (nextFocusMode !== undefined && typeof nextFocusMode !== 'boolean') {
      return reply.status(400).send({ message: 'focusMode must be a boolean' })
    }

    if (
      nextFocusStart !== undefined
      && (typeof nextFocusStart !== 'number'
        || !Number.isInteger(nextFocusStart)
        || nextFocusStart < 0
        || nextFocusStart > 100)
    ) {
      return reply.status(400).send({ message: 'focusStart must be an integer between 0 and 100' })
    }

    if (
      nextFocusEnd !== undefined
      && (typeof nextFocusEnd !== 'number'
        || !Number.isInteger(nextFocusEnd)
        || nextFocusEnd < 1
        || nextFocusEnd > 200)
    ) {
      return reply.status(400).send({ message: 'focusEnd must be an integer between 1 and 200' })
    }

    if (typeof nextFocusStart === 'number' && typeof nextFocusEnd === 'number' && nextFocusStart >= nextFocusEnd) {
      return reply.status(400).send({ message: 'focusStart must be less than focusEnd' })
    }

    if (
      nextFocusRevealMs !== undefined
      && (typeof nextFocusRevealMs !== 'number'
        || !Number.isInteger(nextFocusRevealMs)
        || nextFocusRevealMs < 0
        || nextFocusRevealMs > 10000)
    ) {
      return reply.status(400).send({ message: 'focusRevealMs must be an integer between 0 and 10000' })
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(typeof nextMissLockMs === 'number' ? { missLockMs: nextMissLockMs } : {}),
        ...(isPenaltyResume(nextPenaltyResume) ? { penaltyResume: nextPenaltyResume } : {}),
        ...(typeof nextFocusMode === 'boolean' ? { focusMode: nextFocusMode } : {}),
        ...(typeof nextFocusStart === 'number' ? { focusStart: nextFocusStart } : {}),
        ...(typeof nextFocusEnd === 'number' ? { focusEnd: nextFocusEnd } : {}),
        ...(typeof nextFocusRevealMs === 'number' ? { focusRevealMs: nextFocusRevealMs } : {}),
      },
      create: {
        userId,
        missLockMs: typeof nextMissLockMs === 'number' ? nextMissLockMs : DEFAULT_SETTINGS.missLockMs,
        penaltyResume: isPenaltyResume(nextPenaltyResume) ? nextPenaltyResume : DEFAULT_SETTINGS.penaltyResume,
        focusMode: typeof nextFocusMode === 'boolean' ? nextFocusMode : DEFAULT_SETTINGS.focusMode,
        focusStart: typeof nextFocusStart === 'number' ? nextFocusStart : DEFAULT_SETTINGS.focusStart,
        focusEnd: typeof nextFocusEnd === 'number' ? nextFocusEnd : DEFAULT_SETTINGS.focusEnd,
        focusRevealMs: typeof nextFocusRevealMs === 'number' ? nextFocusRevealMs : DEFAULT_SETTINGS.focusRevealMs,
      },
      select: {
        missLockMs: true,
        penaltyResume: true,
        focusMode: true,
        focusStart: true,
        focusEnd: true,
        focusRevealMs: true,
      },
    })

    return settings
  })
}
