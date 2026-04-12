import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

// 統計的ノイズを除外するための最低試行数。ただしミスが1回以上あれば試行数に関わらず表示する。
const MIN_ATTEMPTS = 5
const TOP_N = 20

export default async function bigramStatRoutes(app: FastifyInstance) {
  // GET /api/bigram-stats
  // ミス率の高いバイグラムを上位 TOP_N 件返す。
  // 表示条件: 試行数 >= MIN_ATTEMPTS、または ミス数 > 0（ミスした瞬間から即表示）
  app.get('/bigram-stats', { preHandler: [authenticateJWT] }, async (req) => {
    const userId = req.user!.id
    const stats = await prisma.bigramStat.findMany({
      where: {
        userId,
        OR: [
          { attempts: { gte: MIN_ATTEMPTS } },
          { misses: { gt: 0 } },
        ],
      },
      select: { bigram: true, attempts: true, misses: true },
    })
    // missRate はDB側で計算できないためアプリ層でソート
    const ranked = stats
      .map(s => ({ ...s, missRate: s.attempts > 0 ? s.misses / s.attempts : 0 }))
      .sort((a, b) => b.missRate - a.missRate || b.misses - a.misses)
      .slice(0, TOP_N)
    return { bigrams: ranked }
  })

  // GET /api/bigram-stats/words?bigrams=wa,t%20,%20r
  // 指定バイグラムを含む単語をユーザーの文章コーパスから抽出して返す。
  //
  // バイグラムのマッチング規則:
  //   □→X (" X"): X で始まる単語  例: " r" → "run", "red"
  //   X→□ ("X "): X で終わる単語  例: "t " → "cat", "hit"
  //   XY  ("xy"): XY を含む単語   例: "do" → "docker", "done"
  //
  // スペースを含むバイグラムは単語境界の遷移を表すため、trim() せずに保持する。
  app.get('/bigram-stats/words', { preHandler: [authenticateJWT] }, async (req, reply) => {
    const userId = req.user!.id
    const query = (req.query as { bigrams?: string }).bigrams ?? ''
    // trim() しない — スペースを含むバイグラム ("t ", " r") を保持する
    const bigrams = query
      .split(',')
      .map(b => b.toLowerCase())
      .filter(b => b.length === 2)

    if (bigrams.length === 0) {
      return reply.status(400).send({ message: 'bigrams param required (comma-separated 2-char strings)' })
    }

    const sentences = await prisma.sentence.findMany({
      where: { userId },
      select: { text: true },
    })

    const wordSet = new Set<string>()
    for (const { text } of sentences) {
      for (const raw of text.split(/\s+/)) {
        const word = raw.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
        if (word.length < 2) continue
        for (const bigram of bigrams) {
          const matched =
            bigram[0] === ' ' ? word.startsWith(bigram[1])  // □→X: X で始まる単語
            : bigram[1] === ' ' ? word.endsWith(bigram[0])  // X→□: X で終わる単語
            : word.includes(bigram)                         // XY: XY を含む単語
          if (matched) {
            wordSet.add(word)
            break
          }
        }
      }
    }

    return { words: [...wordSet] }
  })
}
