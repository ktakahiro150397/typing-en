import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const DEFAULT_SETTINGS = {
  missLockMs: 1000,
  penaltyResume: 'current' as const,
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
      },
    })

    return settings ?? DEFAULT_SETTINGS
  })

  app.put('/settings', { preHandler: [authenticateJWT] }, async (req, reply) => {
    const userId = req.user!.id
    const body = (req.body ?? {}) as {
      missLockMs?: unknown
      penaltyResume?: unknown
    }
    const nextMissLockMs = body.missLockMs
    const nextPenaltyResume = body.penaltyResume

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

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(typeof nextMissLockMs === 'number' ? { missLockMs: nextMissLockMs } : {}),
        ...(isPenaltyResume(nextPenaltyResume) ? { penaltyResume: nextPenaltyResume } : {}),
      },
      create: {
        userId,
        missLockMs: typeof nextMissLockMs === 'number' ? nextMissLockMs : DEFAULT_SETTINGS.missLockMs,
        penaltyResume: isPenaltyResume(nextPenaltyResume) ? nextPenaltyResume : DEFAULT_SETTINGS.penaltyResume,
      },
      select: {
        missLockMs: true,
        penaltyResume: true,
      },
    })

    return settings
  })
}
