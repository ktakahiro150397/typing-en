import { apiFetch } from './api'

export type PenaltyResume = 'current' | 'word'

export interface UserSettings {
  missLockMs: number
  penaltyResume: PenaltyResume
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  missLockMs: 1000,
  penaltyResume: 'current',
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
