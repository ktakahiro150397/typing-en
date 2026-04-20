import { apiFetch } from './api'

export type PenaltyResume = 'current' | 'word'

export interface UserSettings {
  missLockMs: number
  penaltyResume: PenaltyResume
  focusMode: boolean
  focusStart: number
  focusEnd: number
  focusRevealMs: number
}

const DEFAULT_FOCUS_START = Number(import.meta.env.VITE_FOCUS_START) || 2
const DEFAULT_FOCUS_END = Number(import.meta.env.VITE_FOCUS_END) || 10
const DEFAULT_FOCUS_REVEAL_MS = Number(import.meta.env.VITE_FOCUS_REVEAL_MS) || 1000

export const DEFAULT_USER_SETTINGS: UserSettings = {
  missLockMs: 1000,
  penaltyResume: 'current',
  focusMode: false,
  focusStart: DEFAULT_FOCUS_START,
  focusEnd: DEFAULT_FOCUS_END,
  focusRevealMs: DEFAULT_FOCUS_REVEAL_MS,
}

export function fetchSettings(): Promise<UserSettings> {
  return apiFetch<UserSettings>('/api/settings')
}

export function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  return apiFetch<UserSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}
