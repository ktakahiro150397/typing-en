import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

function calculateSessionWpm(totalKeys: number, missKeys: number, durationMs: number): number {
  const minutes = durationMs / 60000
  if (minutes <= 0) {
    return 0
  }

  return Math.round((((totalKeys - missKeys) / 5 / minutes) * 100)) / 100
}

function calculateAccuracy(totalKeys: number, missKeys: number): number {
  if (totalKeys <= 0) {
    return 0
  }

  return Math.round((((totalKeys - missKeys) / totalKeys) * 100))
}

export default async function statsRoutes(app: FastifyInstance) {
  // GET /api/stats/lifetime
  // ユーザーの生涯成績を集計して返す。
  app.get('/stats/lifetime', { preHandler: [authenticateJWT] }, async (req) => {
    const userId = req.user!.id

    const [sessionAgg, allSessions, recentSessions, uniqueWords, weakWordAgg, solvedCount] = await Promise.all([
      prisma.session.aggregate({
        where: { userId },
        _sum: { totalKeys: true, missKeys: true, durationMs: true },
        _count: { id: true },
      }),
      prisma.session.findMany({
        where: { userId },
        select: { totalKeys: true, missKeys: true, durationMs: true },
      }),
      prisma.session.findMany({
        where: { userId },
        select: { totalKeys: true, missKeys: true, durationMs: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.$queryRaw<[{ cnt: bigint }]>`
        SELECT COUNT(DISTINCT sw.word) AS cnt
        FROM SessionWord sw
        INNER JOIN Session s ON sw.sessionId = s.id
        WHERE s.userId = ${userId}
      `,
      prisma.weakWord.aggregate({ where: { userId }, _count: { id: true } }),
      prisma.weakWord.count({ where: { userId, isSolved: true } }),
    ])

    const totalKeys = sessionAgg._sum.totalKeys ?? 0
    const totalMissKeys = sessionAgg._sum.missKeys ?? 0
    const totalDurationMs = sessionAgg._sum.durationMs ?? 0
    const totalSessions = sessionAgg._count.id

    const totalMinutes = totalDurationMs / 60000
    const averageWpm = totalMinutes > 0
      ? Math.round(((totalKeys - totalMissKeys) / 5 / totalMinutes) * 100) / 100
      : 0

    const recentTotals = recentSessions.reduce((agg, session) => ({
      totalKeys: agg.totalKeys + session.totalKeys,
      totalMissKeys: agg.totalMissKeys + session.missKeys,
      totalDurationMs: agg.totalDurationMs + session.durationMs,
    }), { totalKeys: 0, totalMissKeys: 0, totalDurationMs: 0 })
    const recentMinutes = recentTotals.totalDurationMs / 60000
    const recentAverageWpm = recentMinutes > 0
      ? Math.round(((recentTotals.totalKeys - recentTotals.totalMissKeys) / 5 / recentMinutes) * 100) / 100
      : 0

    const bestWpm = allSessions.reduce((max, s) => {
      const wpm = calculateSessionWpm(s.totalKeys, s.missKeys, s.durationMs)
      return Math.max(max, wpm)
    }, 0)

    return {
      totalKeys,
      totalMissKeys,
      totalDurationMs,
      totalSessions,
      averageWpm,
      recentAverageWpm,
      overallAccuracy: calculateAccuracy(totalKeys, totalMissKeys),
      recentAccuracy: calculateAccuracy(recentTotals.totalKeys, recentTotals.totalMissKeys),
      recentSessionCount: recentSessions.length,
      bestWpm: Math.round(bestWpm * 100) / 100,
      uniqueWordCount: Number((uniqueWords[0] as { cnt: bigint }).cnt),
      weakWordTotal: weakWordAgg._count.id,
      weakWordSolved: solvedCount,
    }
  })

  app.get('/stats/sessions', { preHandler: [authenticateJWT] }, async (req) => {
    const userId = req.user!.id
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        totalKeys: true,
        missKeys: true,
        durationMs: true,
        createdAt: true,
        mode: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      sessions: [...sessions].reverse().map((session, index) => ({
        sessionNumber: index + 1,
        date: session.createdAt.toISOString(),
        wpm: calculateSessionWpm(session.totalKeys, session.missKeys, session.durationMs),
        mode: session.mode,
      })),
    }
  })
}
