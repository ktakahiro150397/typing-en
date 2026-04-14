import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

export default async function statsRoutes(app: FastifyInstance) {
  // GET /api/stats/lifetime
  // ユーザーの生涯成績を集計して返す。
  app.get('/stats/lifetime', { preHandler: [authenticateJWT] }, async (req) => {
    const userId = req.user!.id

    const [sessionAgg, allSessions, uniqueWords, weakWordAgg, solvedCount] = await Promise.all([
      prisma.session.aggregate({
        where: { userId },
        _sum: { totalKeys: true, missKeys: true, durationMs: true },
        _count: { id: true },
      }),
      prisma.session.findMany({
        where: { userId },
        select: { totalKeys: true, missKeys: true, durationMs: true },
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

    const bestWpm = allSessions.reduce((max, s) => {
      const mins = s.durationMs / 60000
      const wpm = mins > 0 ? (s.totalKeys - s.missKeys) / 5 / mins : 0
      return Math.max(max, wpm)
    }, 0)

    return {
      totalKeys,
      totalMissKeys,
      totalDurationMs,
      totalSessions,
      averageWpm,
      bestWpm: Math.round(bestWpm * 100) / 100,
      uniqueWordCount: Number((uniqueWords[0] as { cnt: bigint }).cnt),
      weakWordTotal: weakWordAgg._count.id,
      weakWordSolved: solvedCount,
    }
  })
}
