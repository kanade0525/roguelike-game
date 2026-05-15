import { ref } from 'vue'

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
]

const enabled = ref(false)
const invincible = ref(false)
const oneShot = ref(false)

const onEnableCallbacks = new Set<() => void>()
const onDisableCallbacks = new Set<() => void>()

let buffer: string[] = []
let listenerAttached = false

function handleKeyDown(e: KeyboardEvent) {
  buffer.push(e.code)
  if (buffer.length > KONAMI_SEQUENCE.length) {
    buffer.shift()
  }
  if (
    buffer.length === KONAMI_SEQUENCE.length &&
    buffer.every((k, i) => k === KONAMI_SEQUENCE[i])
  ) {
    toggle()
    buffer = []
  }
}

function enable() {
  if (enabled.value) return
  enabled.value = true
  onEnableCallbacks.forEach((cb) => cb())
}

function disable() {
  if (!enabled.value) return
  enabled.value = false
  invincible.value = false
  oneShot.value = false
  onDisableCallbacks.forEach((cb) => cb())
}

function toggle() {
  if (enabled.value) {
    disable()
  } else {
    enable()
  }
}

function attachListener() {
  if (listenerAttached || typeof window === 'undefined') return
  window.addEventListener('keydown', handleKeyDown)
  listenerAttached = true
}

function detachListener() {
  if (!listenerAttached || typeof window === 'undefined') return
  window.removeEventListener('keydown', handleKeyDown)
  listenerAttached = false
}

function onEnable(cb: () => void) {
  onEnableCallbacks.add(cb)
  return () => onEnableCallbacks.delete(cb)
}

function onDisable(cb: () => void) {
  onDisableCallbacks.add(cb)
  return () => onDisableCallbacks.delete(cb)
}

export function useDebugMode() {
  return {
    enabled,
    invincible,
    oneShot,
    enable,
    disable,
    toggle,
    attachListener,
    detachListener,
    onEnable,
    onDisable,
  }
}
