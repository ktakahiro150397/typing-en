const ADMIN_EMAIL_SPLIT_PATTERN = /[\s,]+/

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_GOOGLE_EMAILS ?? ''
  const emails = raw
    .split(ADMIN_EMAIL_SPLIT_PATTERN)
    .map(normalizeEmail)
    .filter(Boolean)

  return new Set(emails)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  if (process.env.AUTH_MOCK === 'true' && normalizeEmail(email) === 'mock@example.com') {
    return true
  }

  return getAdminEmails().has(normalizeEmail(email))
}
