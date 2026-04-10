# typing-en 開発メモ

## 実装フェーズ進捗

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | プロジェクト基盤構築 | ✅ 完了 |
| 2 | Google OAuth + JWT 認証 | ✅ 完了 |
| 3 | 文章管理 (CRUD + CSV インポート) | ⬜ 未着手 |
| 4 | タイピングエンジン（コア） | ✅ 完了 |
| 5 | セッション保存 & 苦手ワード自動検出 | 🔄 フロントのみ実装済み |
| 6 | Bigram（運指ペア）分析 | 🔄 フロントのみ実装済み |
| 7 | 苦手ワード集中練習モード | ⬜ 未着手 |
| 8 | テスト & 最終調整 | ⬜ 未着手 |

---

## Phase 1: プロジェクト基盤構築

### 構成方針

- **フロントエンド:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Zustand
- **バックエンド:** Node.js + Fastify + Prisma + TypeScript
- **DB:** MySQL 8.0
- **インフラ:** Docker Compose（frontend / backend / mysql の3コンテナ）

### 設計判断

- フロントエンドは `frontend/` ディレクトリに独立した Vite プロジェクトとして配置
- バックエンドは `backend/` ディレクトリに独立した Node.js プロジェクトとして配置
- Tailwind CSS v4 は `@import "tailwindcss"` 方式（設定ファイル不要）を採用
- Prisma スキーマは Phase 1 で全テーブルを定義し、後から migrate を積む運用

### Prisma スキーマ設計

```
User           ← Google OAuth ユーザー
Sentence       ← 練習文章（User に属する）
WeakWord       ← 苦手ワード（User に属する）
Session        ← 練習セッション（User + Sentence に属する）
SessionWord    ← セッション内の単語ごとのミス情報
BigramStat     ← Bigram（運指ペア）統計（User に属する）
```

### 既知の問題・注意点

- Tailwind CSS v4 はまだ変更が多い。`@tailwindcss/vite` プラグインを使う方式を採用
- Fastify + Passport.js の組み合わせは `@fastify/passport` を使う（Phase 2 で対応）

---

## Phase 4: タイピングエンジン（実装済み）

### 実装内容

- `useTypingEngine` — 正誤判定・カーソル管理・ミス検知。ミス時はカーソルを進めない（正しいキーを打つまでブロック）
- `useTypingSession` — 複数問題のセッション管理。問題完了を検知して自動進行し、全問終了時に結果を計算
- `TypingArea` — 文字色分け（緑/赤カーソル/グレー）。スペースを `·` で可視化。`window.addEventListener` でブラウザフォーカスのみで入力受付
- `CommandHistory` — 直近の打鍵履歴を右→左に並べて表示。折り返しなし・はみ出し切り捨て
- `ResultsScreen` — セッション終了後の結果画面（精度・WPM・タイム・ミス数・苦手ワード・苦手運指）

### 設計判断

- **完了トリガー**: 末尾 `.` の文章はピリオドで完了、単語は末尾スペースを自動付与してスペースキーで完了
- **ミスペナルティ**: ミス後1秒間の入力ロック。ロック中は枠が赤くなりカウントダウン表示。ロック解除後も正しいキーを打つまで赤カーソルを維持
- **Bigram分析**: 単語先頭文字（前がスペース）のミスは `x` と表示（`·→x` ではなく）
- **セッション構造**: 現問題の上に前問題（取り消し線）、下に次問題（NEXT ラベル・破線枠）を固定高さで表示してレイアウトのガタつきを防止

### 既知の問題・TODO

- バックエンド未接続。現状はランダム生成テキストのみでセッションを構成
- デフォルト3問（テスト用）。本番は問題数を設定できるようにする

---

## Phase 2: Google OAuth + JWT 認証

### 実装内容

- `backend/src/routes/auth.ts` — `@fastify/passport` + `passport-google-oauth20` による Google OAuth フロー
  - `GET /auth/google` — Google の認証画面へリダイレクト
  - `GET /auth/google/callback` — コールバック受信 → `prisma.user.upsert()` → JWT 署名 → `FRONTEND_URL?token=<jwt>` へリダイレクト
  - `GET /auth/me` — JWT 検証済みユーザー情報を返す（`authenticateJWT` preHandler）
  - `POST /auth/logout` — 200 OK（JWT はステートレス。クライアントが localStorage をクリア）
- `backend/src/middleware/authenticate.ts` — Authorization ヘッダの Bearer JWT を検証し `req.user` にセット。失敗時 401
- `backend/src/types.d.ts` — `PassportUser extends User`（Prisma）型拡張
- `backend/src/index.ts` — `@fastify/session` / `fastifyPassport.initialize()` / `fastifyPassport.secureSession()` 登録
- `frontend/src/components/LoginScreen/LoginScreen.tsx` — ダークテーマのログイン画面（"Sign in with Google" ボタン）
- `frontend/src/App.tsx` — auth gate 追加。ローディング → LoginScreen → ゲーム画面の遷移
  - `?token=` コールバック検知 → `/auth/me` 呼び出し → `setAuth()` → URL クリーン
  - localStorage にトークンあり → `/auth/me` で session restore

### 設計判断

- **JWT 有効期限 7 日**（`expiresIn: '7d'`）。リフレッシュトークンは Phase 2 スコープ外
- `@fastify/session` は OAuth コールバックのハンドシェイク用のみ使用。ゲーム機能はすべて JWT で認証
- **デバッグ用モックフラグ**: `frontend/.env.local` に `VITE_AUTH_MOCK=true` を設定すると Google 認証をスキップしてダミーユーザーで即ログイン

### 既知の問題・TODO

- Google Cloud Console で `http://localhost:3000/auth/google/callback` を承認済みリダイレクト URI に登録する必要あり
- ゲーム画面内のログアウトボタンは未実装（Phase 3 以降で追加予定）
- JWT リフレッシュ未実装（7 日後は再ログインが必要）

---

## Phase 3: 文章管理

（実装後に記載）

---

## Phase 4: タイピングエンジン

（実装後に記載）

---

## Phase 5: セッション保存 & 苦手ワード

（実装後に記載）

---

## Phase 6: Bigram 分析

（実装後に記載）

---

## Phase 7: 苦手ワード集中練習モード

（実装後に記載）

---

## Phase 8: テスト

（実装後に記載）

---

## ローカル開発手順

```bash
# 初回セットアップ
cp .env.example .env
# .env を編集（Google OAuth 認証情報、JWT_SECRET、MySQL パスワード等）

docker compose up -d

# DB マイグレーション
docker compose exec backend npx prisma migrate deploy

# アクセス
# フロントエンド: http://localhost:5173
# バックエンドAPI: http://localhost:3000
```

### 開発時（ホットリロード）

```bash
# バックエンドのみ再起動
docker compose restart backend

# ログ確認
docker compose logs -f backend
docker compose logs -f frontend
```

### DB 確認

```bash
docker compose exec mysql mysql -u root -p typing_en
```

---

## TODO / 既知の問題

- [ ] Phase 2: Google OAuth の認証情報は `.env` に設定が必要（Google Cloud Console で取得）
- [ ] Phase 6: BigramHeatmap のキーボード配列はUS配列前提

---

## 参考リンク

- Fastify 公式: https://fastify.dev/
- Prisma 公式: https://www.prisma.io/
- Tailwind CSS v4: https://tailwindcss.com/docs/v4-beta
- @fastify/passport: https://github.com/fastify/fastify-passport
