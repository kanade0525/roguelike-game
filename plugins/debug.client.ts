import { useDebugMode } from '~/composables/useDebugMode'

declare global {
  interface Window {
    __katabasis?: {
      debug: {
        enable: () => void
        disable: () => void
        toggle: () => void
        readonly enabled: boolean
        readonly invincible: boolean
        readonly oneShot: boolean
        setInvincible: (v: boolean) => void
        setOneShot: (v: boolean) => void
      }
      /** Phaser シーンが登録する全画面再描画フック (DungeonScene.create で設定) */
      refresh?: (message?: string) => void
    }
  }
}

export default defineNuxtPlugin(() => {
  const debug = useDebugMode()
  debug.attachListener()

  if (typeof window === 'undefined') return

  console.log('↑ ↑ ↓ ↓ ← → ← → B A')

  window.__katabasis = {
    debug: {
      enable: debug.enable,
      disable: debug.disable,
      toggle: debug.toggle,
      get enabled() {
        return debug.enabled.value
      },
      get invincible() {
        return debug.invincible.value
      },
      get oneShot() {
        return debug.oneShot.value
      },
      setInvincible(v: boolean) {
        debug.invincible.value = v
      },
      setOneShot(v: boolean) {
        debug.oneShot.value = v
      },
    },
  }
})
