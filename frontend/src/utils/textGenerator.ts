const ALPHA = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'

type TextMode = 'alpha' | 'alphanumeric' | 'full'

export function generateRandomText(length: number, mode: TextMode = 'alpha'): string {
  let charset = ALPHA
  if (mode === 'alphanumeric') charset += DIGITS
  if (mode === 'full') charset += DIGITS + SYMBOLS

  return Array.from({ length }, () =>
    charset[Math.floor(Math.random() * charset.length)],
  ).join('')
}

// スペース区切りのランダム単語列（タイピングゲーム風）
export function generateWordSequence(wordCount: number, wordLength = 5): string {
  return Array.from({ length: wordCount }, () =>
    generateRandomText(wordLength, 'alpha'),
  ).join(' ')
}
