const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface Props {
  error?: boolean
}

export function LoginScreen({ error }: Props) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-10 shadow-xl flex flex-col items-center gap-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-wide">typing-en</h1>
        <p className="text-gray-400 text-sm text-center">英文タイピング練習</p>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 w-full text-center">
            認証に失敗しました。もう一度お試しください。
          </div>
        )}

        <a
          href={`${API_URL}/auth/google`}
          className="flex items-center gap-3 bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full justify-center"
        >
          {/* Google G icon */}
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </a>
      </div>
    </div>
  )
}
