const ALPHA = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'
const FULL_MODE_SPECIAL_RATE = 0.02

type TextMode = 'alpha' | 'alphanumeric' | 'full'

function pickRandomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)]
}

export function generateRandomText(length: number, mode: TextMode = 'alpha'): string {
  if (mode === 'full') {
    const specialCharset = DIGITS + SYMBOLS
    return Array.from({ length }, () => (
      Math.random() < FULL_MODE_SPECIAL_RATE
        ? pickRandomChar(specialCharset)
        : pickRandomChar(ALPHA)
    )).join('')
  }

  let charset = ALPHA
  if (mode === 'alphanumeric') charset += DIGITS

  return Array.from({ length }, () => pickRandomChar(charset)).join('')
}

// スペース区切りのランダム単語列（タイピングゲーム風）
export function generateWordSequence(wordCount: number, wordLength = 5): string {
  return Array.from({ length: wordCount }, () =>
    generateRandomText(wordLength, 'alpha'),
  ).join(' ')
}
