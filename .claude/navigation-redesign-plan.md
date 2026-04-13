# 画面遷移リデザイン計画

## Context

現在のアプリは「文章管理」をデフォルトのランディングページにしているが、ユーザーが求めるのは「ワードを練習する」という1点。
「文章管理とは何か？」という認知負荷が発生し、実際に練習を開始するまでに4ステップ以上かかる。
ナビゲーションタブも `文章管理 / 苦手ワード / 苦手運指` という内部的技術概念で、ゴールに向かう導線が不明確。

**目標:** ログイン直後に練習を1クリックで開始できる構成にする。管理・分析機能はセカンダリに降格する。

---

## 現状の問題点

| 問題 | 詳細 |
|------|------|
| ランディングが「文章管理」 | ユーザーが求めるのは練習。管理はその手段に過ぎない |
| 練習までのステップ数 | Login → SentenceManager → 「練習開始」ボタン → モーダルで問題数選択 → Practice (4ステップ) |
| ナビが技術用語 | `文章管理 / 苦手ワード / 苦手運指` = 内部概念。ユーザーはゴール(練習する・見る)で考える |
| ランダム練習ボタン | ヘッダーに独立ボタン = UXの欠陥を回避するためのワークアラウンド |

---

## 改善案：画面構成

### 新しいルート構成

| 旧ルート | 新ルート | 変更内容 |
|---------|---------|---------|
| `/` → redirect to `/sentences` | `/` → `HomeScreen` (新規) | ランディングをホームに変更 |
| `/sentences` | `/library` | 名称変更・セカンダリ位置へ降格 |
| `/weak-words` | `/analysis` | WeakWordManager + FingeringManager を統合 |
| `/fingering` | (廃止) | `/analysis` に吸収 |
| `/practice` | `/practice` | 変更なし |
| `/results` | `/results` | 軽微な文言変更のみ |

旧URLには `<Navigate>` リダイレクトを追加してブックマーク互換性を保つ。

### 新しいナビゲーション

```
[ typing-en ]   [ 練習する ]  [ 分析 ]  [ ライブラリ ]    [ username ]  [ ログアウト ]
```

- ヘッダーの「ランダムワード練習」ボタンを削除（HomeScreenのヒーローCTAに移動）
- `<NavLink to="/" end>` で `/` に `end` propを付与（全ルートでアクティブにならないよう）

---

## HomeScreen レイアウト（新規作成）

```
┌──────────────────────────────────────────────────────┐
│  ヒーローセクション                                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ▶  ランダムワード練習を開始              [大きめCTA] │ │
│  │     30語 · 登録不要 · 今すぐスタート                │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  その他の練習モード (2カラムグリッド)                     │
│  ┌───────────────────┐  ┌───────────────────┐         │
│  │ 文章ライブラリ練習   │  │ 苦手ワード練習      │         │
│  │ {N}件登録済み       │  │ {M}件 未攻略       │         │
│  │ [練習開始]          │  │ [練習開始]          │         │
│  │ ライブラリを管理 →  │  │ 苦手ワードを見る →  │         │
│  └───────────────────┘  └───────────────────┘         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 苦手運指練習                                        │ │
│  │ {P}パターン検出済み  [練習開始]  運指データを見る →  │ │
│  └───────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

- ランダム練習: クリック即スタート（モーダル不要）
- 文章ライブラリ練習: `sentenceStore` からカウント取得、`StartSessionModal` を開く
- 苦手ワード練習: カウント表示、`isMockMode` 時は disabled + tooltip
- 苦手運指練習: bigram カウント表示、データなし時は empty state

---

## AnalysisScreen（新規作成）

WeakWordManager と FingeringManager をページ内タブで統合。

```
/analysis
  ├── [ 苦手ワード ]  [ 苦手運指 ]  ← ページ内タブ (useState)
  └── タブに応じて既存コンポーネントのコンテンツをレンダリング
```

---

## 変更対象ファイル

### 新規作成
- `frontend/src/components/HomeScreen/HomeScreen.tsx`
  - 4モードの練習カード
  - sentence/weak-word/bigram カウントを mount 時に取得（非同期、ノンブロッキング）
  - `StartSessionModal` をインポート（文章ライブラリカード用）
- `frontend/src/components/AnalysisScreen/AnalysisScreen.tsx`
  - ページ内タブ切り替え（`'words' | 'fingering'`）
  - 既存の WeakWordManager・FingeringManager コンテンツをそのまま使用

### 変更
- **`frontend/src/App.tsx`**（主な変更箇所）
  - `HomeScreen`, `AnalysisScreen` をインポート
  - ルート定義を上記新構成に更新
  - `handleStartSentenceSession`: `returnPath: '/library'`
  - `handleStartWeakWordSession`: `returnPath: '/analysis'`
  - `handleStartFingeringSession`: `returnPath: '/analysis'`
  - `handleStartRandomSession`: 常に `returnPath: '/'`（location 分岐を削除）
  - `handleAbortSession` フォールバック: `'/'`
  - `handleGoBackFromResults` フォールバック: `'/'`
  - `returnLabel`: `/analysis` → `'分析へ戻る'`、それ以外 → `'ホームへ戻る'`
  - `handleRestartSession`: `/fingering` 分岐を `/analysis` に変更
  - 旧ルートへの `<Navigate>` リダイレクト追加

- **`frontend/src/components/Layout/DashboardLayout.tsx`**
  - NavLink: `"/sentences"→"文章管理"` を `"/"end→"練習する"`, `"/analysis"→"分析"`, `"/library"→"ライブラリ"` に変更
  - `onStartRandomSession` prop とボタンを削除

- **`frontend/src/components/SentenceManager/SentenceManager.tsx`**
  - タイトル文言を「ライブラリ」に変更（または prop 化）
  - 構造・機能の変更なし

- **`frontend/src/components/PracticeScreen/PracticeScreen.tsx`**
  - `returnPath` に基づくラベル判定: `/weak-words`→`/analysis`、`/fingering`→`/analysis`、デフォルト→`'ホームへ戻る'`

---

## 実装順序

1. `DashboardLayout.tsx` — NavLink 変更・ランダムボタン削除（低リスク）
2. `HomeScreen.tsx` 作成 → `App.tsx` に `/` ルートとして接続
3. `App.tsx` でルート名変更（`/sentences`→`/library`）と旧URL リダイレクト追加
4. `AnalysisScreen.tsx` 作成 → `/analysis` ルートとして接続、旧URL リダイレクト追加
5. `App.tsx` の全 returnPath・returnLabel 更新
6. `PracticeScreen.tsx` のラベル文字列更新

---

## 検証方法

1. `npm run dev`（frontend） でローカル起動
2. ログイン後 → `/` に HomeScreen が表示されることを確認
3. 「ランダムワード練習を開始」クリック → PracticeScreen に即遷移
4. 練習完了 → ResultsScreen で「ホームへ戻る」が表示されること
5. 「分析」タブ → `/analysis` でページ内タブが機能すること
6. 旧URL `/sentences` `/weak-words` `/fingering` がそれぞれ新URLにリダイレクトされること
7. `npm run typecheck` でTypeScriptエラーなし
