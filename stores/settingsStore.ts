import { defineStore } from 'pinia'

// オーディオ等のユーザー設定（ゲーム進行とは別レイヤ。localStorage 永続）
const SETTINGS_KEY = 'katabasis_settings'

interface SettingsState {
  bgmVolume: number // 0..1
  seVolume: number // 0..1
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.min(1, Math.max(0, v))
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    bgmVolume: 0.3, // 既定は従来のハードコード値に合わせる
    seVolume: 0.5,
  }),

  actions: {
    load() {
      if (typeof localStorage === 'undefined') return
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (!saved) return
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed.bgmVolume === 'number') this.bgmVolume = clamp01(parsed.bgmVolume)
        if (typeof parsed.seVolume === 'number') this.seVolume = clamp01(parsed.seVolume)
      } catch {
        localStorage.removeItem(SETTINGS_KEY)
      }
    },

    setBgmVolume(v: number) {
      this.bgmVolume = clamp01(v)
      this.persist()
    },

    setSeVolume(v: number) {
      this.seVolume = clamp01(v)
      this.persist()
    },

    persist() {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ bgmVolume: this.bgmVolume, seVolume: this.seVolume })
      )
    },
  },
})
