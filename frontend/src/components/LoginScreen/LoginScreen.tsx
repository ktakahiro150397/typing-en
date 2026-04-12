const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Props {
  error?: boolean
}

export function LoginScreen({ error }: Props) {
  return (
    <div className="app-page flex min-h-screen items-center px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="app-card flex flex-col justify-between gap-8 px-7 py-8 sm:px-10 sm:py-10">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#3ea8ff]">typing-en</p>
              <h1 className="text-3xl font-bold leading-[1.5] text-slate-900 sm:text-4xl">
                ミスを減らすための
                <br />
                英文タイピング練習
              </h1>
              <p className="max-w-2xl text-base text-slate-500">
                練習結果から苦手ワードと運指パターンを抽出し、次に打つべき課題へ自然につなげる練習環境です。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="app-card-soft px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">文章と単語を横断</p>
                <p className="mt-1 text-sm text-slate-500">登録文、苦手ワード、ランダムワードを目的別に練習。</p>
              </div>
              <div className="app-card-soft px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">苦手を自動分析</p>
                <p className="mt-1 text-sm text-slate-500">ミス率、停止、bigram から弱点を可視化します。</p>
              </div>
              <div className="app-card-soft px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">次の練習へ直結</p>
                <p className="mt-1 text-sm text-slate-500">結果画面からそのまま苦手ワード練習やドリルへ。</p>
              </div>
            </div>
          </div>

          <div className="app-card-soft flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Google アカウントでログイン</p>
              <p className="text-sm text-slate-500">練習履歴と分析結果を保存して、ページをまたいで続けられます。</p>
            </div>
            <div className="app-chip app-chip-info">Accurate first</div>
          </div>
        </section>

        <section className="app-card flex flex-col gap-6 px-7 py-8 sm:px-8">
          <div className="space-y-2">
            <div className="app-chip app-chip-info">Sign in</div>
            <h2 className="text-2xl font-bold text-slate-900">練習をはじめる</h2>
            <p className="text-sm text-slate-500">
              認証すると、文章管理・苦手ワード管理・結果の保存が利用できます。
            </p>
          </div>

          {error && (
            <div className="app-banner app-banner-danger">
              認証に失敗しました。時間をおいて、もう一度お試しください。
            </div>
          )}

          <a
            href={`${API_URL}/auth/google`}
            className="app-button app-button-primary w-full justify-center text-base"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google でログイン
          </a>

          <div className="app-card-soft px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">ログイン後にできること</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-500">
              <li>文章と攻略メモを管理</li>
              <li>苦手ワードと攻略済み状態を記録</li>
              <li>セッション結果から弱点を継続分析</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
