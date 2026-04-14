# typing-en — 英文タイピング練習アプリ

英文タイピングゲームの勝率向上を目的とした練習ツール。速度よりも「ミスなく打つ」ことを重視し、苦手な運指パターンと単語を自動検出して重点的に練習できます。

---

## 主な特徴

- **文章・単語練習** — 登録した文章を基本単位として練習。カテゴリ単位の出題や記号・数字・ランダム英数字にも対応
- **苦手ワード自動検出** — 練習中にミス率が高かった単語を自動検出し、苦手ワードリストへ追加
- **苦手ワード集中練習モード** — 苦手リストの単語を繰り返し練習して克服
- **Bigram（運指ペア）分析** — "w→a" のような連続2打鍵ペアごとにミス率を集計し、苦手な指の動きを特定
- **リアルタイム入力履歴** — 練習中、格闘ゲームのコマンド履歴のように打鍵履歴をリアルタイム表示
- **攻略メモ / カテゴリ** — 文章・苦手ワードごとに運指のコツなどを自由記述で保存し、文章には複数カテゴリも付与可能
- **CSV インポート** — 練習したい文章をCSVで一括登録。ファイル名カテゴリも自動付与
- **Google アカウント認証** — ログインにより統計・練習データをユーザーごとに保存（未ログイン時は保存不可）

---

## セットアップ

### 前提条件

- Docker / Docker Compose
- Google Cloud Console でのOAuth 2.0 認証情報

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/your-username/typing-en.git
cd typing-en

# 2. 環境変数を設定
cp .env.example .env
# .env を編集して以下を設定:
#   GOOGLE_CLIENT_ID=...
#   GOOGLE_CLIENT_SECRET=...
#   JWT_SECRET=...
#   MYSQL_ROOT_PASSWORD=...

# 3. 起動
docker compose up -d

# 4. DBマイグレーション
docker compose exec backend npx prisma migrate deploy
```

フロントエンド: http://localhost:5173
バックエンドAPI: http://localhost:3000

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 19 + TypeScript + Vite |
| スタイリング | Tailwind CSS v4 |
| フロント状態管理 | Zustand |
| 認証 | Google OAuth 2.0（Passport.js）+ JWT |
| バックエンド | Node.js + Fastify |
| ORM | Prisma |
| DB | MySQL 8.0 |
| 環境構築 | Docker Compose |
| テスト | Vitest + Testing Library |

---

## ディレクトリ構成

```
typing-en/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TypingArea/       # テキスト表示・入力処理
│       │   ├── CommandHistory/   # リアルタイム打鍵履歴
│       │   ├── BigramHeatmap/    # 運指ミスのヒートマップ
│       │   ├── SentenceList/     # 文章リスト管理
│       │   ├── WeakWordList/     # 苦手ワードリスト
│       │   └── CsvImport/        # CSV取り込みUI
│       ├── stores/               # Zustand（セッション・認証状態）
│       ├── hooks/
│       │   ├── useTypingEngine.ts    # コア入力ロジック
│       │   └── useBigramTracker.ts   # 運指ペア統計
│       └── utils/
│           ├── bigramAnalysis.ts     # 苦手Bigramスコア計算
│           ├── weakWordDetector.ts   # ミス率による苦手判定
│           └── textGenerator.ts     # ランダムテキスト生成
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── auth.ts           # Google OAuth エンドポイント
│       │   ├── sentences.ts      # 文章 CRUD + CSV インポート
│       │   ├── weakWords.ts      # 苦手ワード管理
│       │   ├── sessions.ts       # セッション保存・履歴
│       │   └── stats.ts          # Bigram統計
│       ├── services/
│       │   └── weakWordDetector.ts  # セッション後の自動検出処理
│       ├── middleware/
│       │   └── authenticate.ts   # JWT検証
│       └── prisma/
│           └── schema.prisma     # DBスキーマ定義
└── docker-compose.yml
```

---

## 苦手ワード自動検出の仕組み

練習セッション終了時に、セッション中の打鍵データを単語ごとに集計します。

```
miss_rate = ミス打鍵数 / 単語の文字数
```

`miss_rate >= 0.5`（デフォルト）の単語を「苦手」と判定し、苦手ワードリストへ自動追加。既に登録済みの場合は miss_rate を更新します。苦手ワード集中練習モードでこれらの単語を繰り返し出題します。

---

## 運指ミス（Bigram）検出の仕組み

連続する2打鍵のペア（Bigram）ごとにミス率を記録します。

例: "w" の後に "a" を打つ動作を `w→a` として追跡

```
weaknessScore = misses / attempts
```

統計ページではキーボード上のヒートマップとして可視化され、どの指の動きが苦手かを直感的に確認できます。

---

## CSV インポート仕様

```csv
text,note,categories
"Please double-check whether the earlier version already includes the smaller change we discussed yesterday.","repeated ch ck and th transitions","typing-game,long-sentence"
"The coach said the loose cable would make us lose time if we ignored it again.","lose loose pair","typing-game,lookalike"
```

- `text`（必須）: 練習したいテキスト
- `note`（任意）: 攻略メモ
- `category` / `categories`（任意）: カンマ区切りのカテゴリ
- CSVファイル名（拡張子除く）は自動でカテゴリとして付与
- 同一ユーザー・同一テキストの重複は無視されます
- `word-csv/` にはスターター用CSVを同梱しており、`tricky-long-sentences.csv` と `lookalike-confusion.csv` はタイピングゲーム向けの誤打しやすい文章セットです

---

## 主要 API

```
GET    /auth/google              Google OAuth ログイン開始
GET    /auth/me                  ログインユーザー情報

GET    /api/sentences            文章一覧
POST   /api/sentences            文章登録
POST   /api/sentences/import     CSV一括インポート

GET    /api/weak-words           苦手ワード一覧
PATCH  /api/weak-words/:id       攻略メモ更新
DELETE /api/weak-words/:id       苦手リストから削除

POST   /api/sessions             セッション保存（苦手ワード自動検出を含む）
GET    /api/stats/bigrams        Bigram統計
```
