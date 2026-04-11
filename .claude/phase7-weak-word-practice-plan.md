# Phase 7: 苦手ワード集中練習モード

## Context
セッション保存時に `WeakWord` テーブルへの upsert は Phase 5 で実装済み。
Phase 7 では蓄積された苦手ワードを使って集中練習できるモードを追加する。
`Session.mode` はバックエンドで既に `'weak_word'` を許容しており、DB スキーマも準備済み。
フロントエンドの `sessionMode` 型と UI エントリーポイントが未実装なのが今回の作業範囲。

---

## 作業ファイル一覧

| # | 操作 | ファイル |
|---|------|---------|
| 1 | CREATE | `backend/src/routes/weakWords.ts` |
| 2 | MODIFY | `backend/src/index.ts` (line 36 コメント解除) |
| 3 | CREATE | `frontend/src/lib/weakWords.ts` |
| 4 | MODIFY | `frontend/src/App.tsx` |
| 5 | MODIFY | `frontend/src/components/SentenceManager/SentenceManager.tsx` |
| 6 | MODIFY | `frontend/src/components/ResultsScreen/ResultsScreen.tsx` |
| 7 | MODIFY | `dev.md` (Phase 7 セクション記載) |

---

## Step 1: `backend/src/routes/weakWords.ts` (NEW)

`sessions.ts` と同じパターンで `authenticateJWT` preHandler 付きの GET ルート。

```typescript
import type { User } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import { authenticateJWT } from '../middleware/authenticate.js'

export default async function weakWordRoutes(app: FastifyInstance) {
  app.get('/weak-words', { preHandler: [authenticateJWT] }, async (req) => {
    const userId = (req.user as User).id
    const words = await prisma.weakWord.findMany({
      where: { userId },
      orderBy: { missRate: 'desc' },
      take: 50,
      select: { word: true, missRate: true, note: true },
    })
    return { words }
  })
}
```

---

## Step 2: `backend/src/index.ts`

line 36 のコメントアウトを解除するだけ:

```typescript
// BEFORE:
// await app.register(import('./routes/weakWords.js'), { prefix: '/api' })

// AFTER:
await app.register(import('./routes/weakWords.js'), { prefix: '/api' })
```

---

## Step 3: `frontend/src/lib/weakWords.ts` (NEW)

`lib/sessions.ts` と同じパターン:

```typescript
import { apiFetch } from './api'

export interface WeakWordItem {
  word: string
  missRate: number
  note: string | null
}

export function fetchWeakWords(): Promise<{ words: WeakWordItem[] }> {
  return apiFetch<{ words: WeakWordItem[] }>('/api/weak-words')
}
```

---

## Step 4: `frontend/src/App.tsx`

### 4a. import 追加
```typescript
import { fetchWeakWords } from './lib/weakWords'
```

### 4b. sessionMode 型を拡張
```typescript
// 'sentence' | 'random'  →  'sentence' | 'random' | 'weak_word'
```

### 4c. テキスト生成ヘルパーを追加（`mapSentencesToSessionItems` の直後）
```typescript
const WEAK_WORD_CHUNK_SIZE = 5

function mapWeakWordsToSessionItems(words: string[]): SessionText[] {
  const chunks: SessionText[] = []
  for (let i = 0; i < words.length; i += WEAK_WORD_CHUNK_SIZE) {
    const chunk = words.slice(i, i + WEAK_WORD_CHUNK_SIZE)
    chunks.push({ text: normalizeText(chunk.join(' ')), sentenceId: null })
  }
  return chunks
}
```

### 4d. `weakWordError` state と `handleStartWeakWordSession` を追加
`handleStartSession` の直後:
```typescript
const [weakWordError, setWeakWordError] = useState<string | null>(null)

const handleStartWeakWordSession = useCallback(async () => {
  if (import.meta.env.VITE_AUTH_MOCK === 'true' || !token) return
  setWeakWordError(null)
  try {
    const { words } = await fetchWeakWords()
    if (words.length === 0) {
      setWeakWordError('苦手ワードがまだありません。まずセッションを完了させてください。')
      return
    }
    const nextItems = mapWeakWordsToSessionItems(words.map((w) => w.word))
    savedSessionRef.current = false
    setSessionMode('weak_word')
    setSessionItems(nextItems)
    restartSession(nextItems.map((item) => item.text))
    setScreen('game')
  } catch (err) {
    setWeakWordError(err instanceof Error ? err.message : '苦手ワードの取得に失敗しました')
  }
}, [token, restartSession])
```

### 4e. `handleRestart` に `setWeakWordError(null)` 追加

### 4f. SentenceManager と ResultsScreen に新 props を渡す
```tsx
// SentenceManager
<SentenceManager
  onStartSession={handleStartSession}
  onStartWeakWordSession={handleStartWeakWordSession}
  weakWordError={weakWordError}
  onClearWeakWordError={() => setWeakWordError(null)}
  isMockMode={import.meta.env.VITE_AUTH_MOCK === 'true'}
  onLogout={handleLogout}
  userName={user.name}
/>

// ResultsScreen
<ResultsScreen
  result={result}
  totalCount={totalCount}
  onRestart={handleRestart}
  onGoToManager={() => setScreen('manager')}
  onStartWeakWordSession={handleStartWeakWordSession}
  isMockMode={import.meta.env.VITE_AUTH_MOCK === 'true'}
/>
```

---

## Step 5: `frontend/src/components/SentenceManager/SentenceManager.tsx`

### Props 拡張
```typescript
interface Props {
  onStartSession: (sentences: Sentence[]) => void
  onStartWeakWordSession: () => Promise<void>
  weakWordError: string | null
  onClearWeakWordError: () => void
  isMockMode: boolean
  onLogout: () => void
  userName: string
}
```

### ローカル state 追加
```typescript
const [isLoadingWeakWords, setIsLoadingWeakWords] = useState(false)
```

### ハンドラー追加
```typescript
const handleWeakWordClick = useCallback(async () => {
  setIsLoadingWeakWords(true)
  try {
    await onStartWeakWordSession()
  } finally {
    setIsLoadingWeakWords(false)
  }
}, [onStartWeakWordSession])
```

### ツールバーに "苦手ワード練習" ボタン追加
既存の "練習開始" ボタンの前に挿入:
```tsx
<button
  onClick={() => void handleWeakWordClick()}
  disabled={isMockMode || isLoadingWeakWords}
  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
>
  {isLoadingWeakWords && (
    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
  )}
  苦手ワード練習
</button>
```

### エラーバナー追加（ツールバーの直下）
```tsx
{weakWordError && (
  <div className="flex items-center justify-between bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-2">
    <span>{weakWordError}</span>
    <button onClick={onClearWeakWordError} className="ml-4 text-red-400 hover:text-red-200 text-xs">✕</button>
  </div>
)}
```

---

## Step 6: `frontend/src/components/ResultsScreen/ResultsScreen.tsx`

### Props 拡張
```typescript
interface Props {
  result: SessionResult
  totalCount: number
  onRestart: () => void
  onGoToManager: () => void
  onStartWeakWordSession: () => Promise<void>
  isMockMode: boolean
}
```

### "苦手ワード練習" ボタンを既存ボタン行に追加
"新しいセッション" と "文章管理" の間:
```tsx
<button
  onClick={() => void onStartWeakWordSession()}
  disabled={isMockMode}
  className="px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-xl font-semibold text-lg transition-colors"
>
  苦手ワード練習
</button>
```

---

## 設計判断メモ

- **チャンクサイズ = 5**: 1問に5単語ずつグループ化。50単語→10問
- **エラー表示は SentenceManager のみ**: ResultsScreen はセッション開始成功時に即 unmount されるため不要
- **mock mode は disabled**: `VITE_AUTH_MOCK=true` 時はボタンを無効化し API 呼び出しを防ぐ
- **sentenceIds は空**: `weak_word` mode は Sentence テーブルと無関係。backend の validation も `sentence` mode のみ sentenceIds 必須

---

## 動作確認手順

1. **バックエンド疎通**: `curl -H "Authorization: Bearer <token>" http://localhost:3000/api/weak-words` → HTTP 200, `{ words: [...] }`、未認証なら 401
2. **TypeScript コンパイル**: `tsc --noEmit` を frontend/backend 両方で実行 → エラーなし
3. **空状態**: セッション未実施のアカウントで "苦手ワード練習" をクリック → エラーバナーが表示、ゲーム画面に遷移しない
4. **正常フロー (SentenceManager)**: セッション完了済みアカウントで "苦手ワード練習" → スピナー表示後、ゲーム画面に遷移。苦手ワードが問題テキストに含まれることを目視確認
5. **正常フロー (ResultsScreen)**: セッション完了 → 結果画面で "苦手ワード練習" → ゲーム画面に遷移
6. **セッション保存**: 苦手ワードセッション完了後、DB の Session テーブルで `mode='weak_word'` を確認
7. **mock mode**: `VITE_AUTH_MOCK=true` 環境で両ボタンが `disabled` (opacity-40) になっていることを確認
