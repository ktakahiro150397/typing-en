import { create } from 'zustand'
import {
  fetchSettings as fetchSettingsRequest,
  updateSettings as updateSettingsRequest,
  type UserSettings,
} from '../lib/settings'

interface SettingsState {
  settings: UserSettings | null
  loading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true })
    try {
      const settings = await fetchSettingsRequest()
      set({ settings, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  updateSettings: async (patch) => {
    set({ loading: true })
    try {
      const settings = await updateSettingsRequest(patch)
      set({ settings, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },
}))
