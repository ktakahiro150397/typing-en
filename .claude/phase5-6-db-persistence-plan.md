# Phase 5 & 6: セッション結果のDB永続化

## Context

フロントエンドではタイピングセッション終了時に `analyzeProblems()` で正確な分析データ（WPM・精度・苦手ワード・Bigram）を計算済みだが、DBへの保存は未実装。DBスキーマ（Session / SessionWord / WeakWord / BigramStat）は既存のマイグレーションで適用済み。バックエンドのルートファイルも3つコメントアウトされているが実態のファイルが存在しない。

今回は `POST /api/sessions` 1本のエンドポイントで全テーブルへのINSERT/UPSERTをPrismaトランザクションで実行し、フロント側からはセッション終了時にfire-and-forget呼び出しを行う。

---

## 実装方針

### 基本設計

- **エンドポイント数:** 1本のみ（`POST /api/sessions`）— Session + SessionWord + WeakWord + BigramStat を1トランザクションで保存
- **Bigram:** 全試行Bigram（misses=0 も含む）を送る。`BigramStat.attempts` の累積を正確にするため
- **Word:** ミスのあった全単語（top-10フィルタなし）を送る。`WeakWord` と `SessionWord` の保存に使用
- **WeakWord.missRate:** 最新セッションの値で上書き（累積平均は Phase 7 以降の検討課題）
- **保存トリガー:** `App.tsx` の `useEffect`（result が非null になった瞬間）で fire-and-forget 呼び出し
- **エラー処理:** 保存失敗してもUIをブロックしない（silent catch）
- **sessionMode:** App.tsx の state で管理。`handleStartSession`（文章管理から）→ `'sentence'`、`handleRestart`（再開始）→ `'random'`

---

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `backend/src/routes/sessions.ts` | **新規作成** | `POST /sessions` ルート |
| `backend/src/index.ts` | **編集** | sessions ルートのコメントアウト解除 |
| `frontend/src/hooks/useTypingSession.ts` | **編集** | `SessionResult` に `allWordMisses` / `allBigramStats` を追加 |
| `frontend/src/lib/sessions.ts` | **新規作成** | `saveSession()` API クライアント関数 |
| `frontend/src/App.tsx` | **編集** | `sessionMode` state 追加、`useEffect` で `saveSession` 呼び出し |

---

## Step 1: `frontend/src/hooks/useTypingSession.ts` の変更

`SessionResult` インターフェースに2フィールドを追加（既存フィールドは変更なし）:

```ts
export interface SessionResult {
  wordStats: WordStat[]         // top-10 for display（変更なし）
  bigramStats: BigramStat[]     // top-10 for display（変更なし）
  allWordMisses: WordStat[]     // 全ミスワード（top-10制限なし）: DB保存用
  allBigramStats: BigramStat[]  // 全Bigram（misses=0も含む）: DB保存用
  accuracy: number
  durationMs: number
  wpm: number
  totalKeys: number
  totalMisses: number
}
```

`analyzeProblems()` の return 文を拡張:

```ts
// 既存の wordStats (top-10) はそのまま残す
const allWordMisses: WordStat[] = Object.entries(wordMissMap)
  .filter(([, v]) => v.misses > 0)
  .map(([word, v]) => ({ word, misses: v.misses, missRate: v.misses / v.length }))

// 既存の bigramStats (top-10 misses>0) はそのまま残す
const allBigramStats: BigramStat[] = Object.entries(bigramMap)
  .map(([bigram, v]) => ({
    bigram,
    attempts: v.attempts,
    misses: v.misses,
    missRate: v.attempts > 0 ? v.misses / v.attempts : 0,
  }))

return { wordStats, bigramStats, allWordMisses, allBigramStats, accuracy, durationMs, wpm, totalKeys, totalMisses }
```

---

## Step 2: `frontend/src/lib/sessions.ts` を新規作成

```ts
import { apiFetch } from './api'

export interface SaveSessionRequest {
  mode: 'sentence' | 'random' | 'weak_word'
  totalKeys: number
  missKeys: number
  durationMs: number
  words: { word: string; misses: number }[]
  bigrams: { bigram: string; attempts: number; misses: number }[]
}

export function saveSession(data: SaveSessionRequest): Promise<{ sessionId: string }> {
  return apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

---

## Step 3: `frontend/src/App.tsx` の変更

`sessionMode` state と `savedSessionRef` を追加し、`useEffect` で保存を実行:

```ts
import { saveSession } from './lib/sessions'

// state 追加（既存の screen state の隣）
const [sessionMode, setSessionMode] = useState<'sentence' | 'random'>('random')
const savedSessionRef = useRef(false)

// result が確定したら一度だけ保存
useEffect(() => {
  if (!result || savedSessionRef.current) return
  savedSessionRef.current = true
  saveSession({
    mode: sessionMode,
    totalKeys: result.totalKeys,
    missKeys: result.totalMisses,
    durationMs: result.durationMs,
    words: result.allWordMisses.map((w) => ({ word: w.word, misses: w.misses })),
    bigrams: result.allBigramStats.map((b) => ({
      bigram: b.bigram,
      attempts: b.attempts,
      misses: b.misses,
    })),
  }).catch(() => {}) // fire-and-forget: 失敗してもUIに影響しない
}, [result, sessionMode])

// handleStartSession: 文章管理から開始 → sentence モード
const handleStartSession = useCallback((sessionTexts: string[]) => {
  savedSessionRef.current = false
  setSessionMode('sentence')       // ← 追加
  setTexts(sessionTexts)
  restartSession(sessionTexts)
  setScreen('game')
}, [restartSession])

// handleRestart: 新しいセッション → random モード
const handleRestart = useCallback(() => {
  savedSessionRef.current = false
  setSessionMode('random')          // ← 追加
  const next = generateSessionTexts(DEFAULT_COUNT)
  setTexts(next)
  restartSession(next)
}, [restartSession])
```

---

## Step 4: `backend/src/routes/sessions.ts` を新規作成

```ts
import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

const VALID_MODES = ['sentence', 'random', 'weak_word'] as const
type Mode = (typeof VALID_MODES)[number]

export default async function sessionRoutes(app: FastifyInstance) {
  app.post('/sessions', { preHandler: [authenticateJWT] }, async (req, reply) => {
    const userId = req.user!.id
    const body = req.body as {
      mode?: string
      totalKeys?: number
      missKeys?: number
      durationMs?: number
      words?: { word: string; misses: number }[]
      bigrams?: { bigram: string; attempts: number; misses: number }[]
    }

    // バリデーション
    if (!body.mode || !(VALID_MODES as readonly string[]).includes(body.mode)) {
      return reply.status(400).send({ message: 'Invalid mode' })
    }
    if (typeof body.totalKeys !== 'number' || body.totalKeys < 0) {
      return reply.status(400).send({ message: 'totalKeys must be a non-negative number' })
    }
    if (typeof body.missKeys !== 'number' || body.missKeys < 0) {
      return reply.status(400).send({ message: 'missKeys must be a non-negative number' })
    }
    if (typeof body.durationMs !== 'number' || body.durationMs <= 0) {
      return reply.status(400).send({ message: 'durationMs must be positive' })
    }

    const words = body.words ?? []
    const bigrams = body.bigrams ?? []

    const session = await prisma.$transaction(async (tx) => {
      // 1. Session レコード作成
      const session = await tx.session.create({
        data: {
          userId,
          mode: body.mode as Mode,
          totalKeys: body.totalKeys!,
          missKeys: body.missKeys!,
          durationMs: body.durationMs!,
        },
      })

      // 2. SessionWord 一括作成（ミスのあった単語のみ）
      if (words.length > 0) {
        await tx.sessionWord.createMany({
          data: words.map((w) => ({ sessionId: session.id, word: w.word, misses: w.misses })),
        })
      }

      // 3. WeakWord upsert（最新セッションの missRate で上書き）
      //    missRate = misses / word.length（バックエンドで再計算）
      for (const w of words) {
        const missRate = w.word.length > 0 ? w.misses / w.word.length : 0
        await tx.weakWord.upsert({
          where: { userId_word: { userId, word: w.word } },
          create: { userId, word: w.word, missRate },
          update: { missRate },
        })
      }

      // 4. BigramStat upsert（累積加算）
      for (const b of bigrams) {
        await tx.bigramStat.upsert({
          where: { userId_bigram: { userId, bigram: b.bigram } },
          create: { userId, bigram: b.bigram, attempts: b.attempts, misses: b.misses },
          update: {
            attempts: { increment: b.attempts },
            misses: { increment: b.misses },
          },
        })
      }

      return session
    })

    return reply.status(201).send({ sessionId: session.id })
  })
}
```

**設計注記:**
- `WeakWord.missRate` はバックエンドで `misses / word.length` を再計算（クライアントの浮動小数点値に依存しない）
- `BigramStat` は `{ increment: N }` で累積加算（Prisma MySQL の ON DUPLICATE KEY UPDATE 相当）
- `sentenceId` は null のまま（複数文章セッションに1対1のIDが存在しないため）

---

## Step 5: `backend/src/index.ts` の変更

```ts
await app.register(import('./routes/sessions.js'), { prefix: '/api' })
// await app.register(import('./routes/weakWords.js'), { prefix: '/api' })  ← Phase 7 以降
// await app.register(import('./routes/stats.js'), { prefix: '/api' })      ← Phase 7 以降
```

---

## 動作確認手順

1. `docker compose restart backend` でバックエンドを再起動
2. フロントエンドでセッションを1回完了（文章管理 → 練習開始 → タイピング → 結果画面）
3. DBを確認:
   ```bash
   docker compose exec mysql mysql -u root -p typing_en \
     -e "SELECT * FROM Session ORDER BY createdAt DESC LIMIT 1;"
   docker compose exec mysql mysql -u root -p typing_en \
     -e "SELECT * FROM BigramStat ORDER BY misses DESC LIMIT 10;"
   docker compose exec mysql mysql -u root -p typing_en \
     -e "SELECT * FROM WeakWord ORDER BY missRate DESC LIMIT 10;"
   ```
4. 2回目のセッション後に `BigramStat.attempts` が加算されていること（累積）を確認
5. ブラウザのNetwork タブで `POST /api/sessions` が 201 を返していることを確認

---

## 既知の制約・将来の改善点

- `WeakWord.missRate` は最新セッション値で上書き（累積平均は Phase 7 で検討）
- BigramStat の loop upsert は小規模セッションでは問題ないが、将来的に raw SQL の `INSERT ... ON DUPLICATE KEY UPDATE` に置き換え可能
- `GET /api/sessions`（履歴閲覧）は Phase 7/8 のスコープ
- `sentenceId` は将来的に「単一文章モード」が実装されたときに活用
