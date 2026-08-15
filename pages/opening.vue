<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useGameStore } from '~/stores/gameStore'
  import { OPENING } from '~/game/story'

  // 専用オープニング画面。「はじめから」→ この暗転画面で導入を逐次送り → 村へ。
  const router = useRouter()
  const gameStore = useGameStore()

  const index = ref(0)
  const done = ref(false)
  const current = computed(() => OPENING[index.value])
  const isLast = computed(() => index.value >= OPENING.length - 1)

  // 次の行へ。最後まで進んだら村へ遷移。
  const advance = () => {
    if (done.value) return
    if (isLast.value) {
      finish()
      return
    }
    index.value++
  }

  const skip = () => finish()

  const finish = () => {
    if (done.value) return
    done.value = true
    // 村の maybePlayOpening が二重に出ないよう、表示済みフラグを立ててから遷移
    gameStore.markOpeningSeen()
    router.push('/village')
  }

  const onKey = (e: KeyboardEvent) => {
    if (['Enter', ' ', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      advance()
    } else if (e.key === 'Escape') {
      skip()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="opening" @click="advance">
    <button class="skip" @click.stop="skip">スキップ ▶</button>

    <div class="stage">
      <transition name="fade" mode="out-in">
        <div :key="index" class="line">
          <p v-if="current.speaker" class="speaker">{{ current.speaker }}</p>
          <p class="text" :class="{ narration: !current.speaker }">{{ current.text }}</p>
        </div>
      </transition>
    </div>

    <div class="hint">
      <span class="chevron">▼</span>
      <span class="label">{{ isLast ? '村へ' : 'タップ / Enter で送る' }}</span>
    </div>
  </div>
</template>

<style scoped>
  .opening {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
    background:
      radial-gradient(120% 80% at 50% 0%, #14161e 0%, #0b0b11 70%, #08080c 100%);
    color: #e7e3d8;
    font-family: 'DotGothic16', monospace;
    cursor: pointer;
    overflow: hidden;
  }

  /* ゆっくり降りていく淀みの粒子めいた縦グラデの揺らぎ */
  .opening::before {
    content: '';
    position: absolute;
    inset: -20% 0 auto 0;
    height: 60%;
    background: linear-gradient(180deg, rgba(120, 176, 160, 0.05), transparent);
    pointer-events: none;
  }

  .stage {
    width: 100%;
    max-width: 620px;
    min-height: 40vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .line {
    width: 100%;
  }

  .speaker {
    margin: 0 0 1rem;
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    color: #e8bd6d;
  }

  .text {
    margin: 0;
    font-size: 1.05rem;
    line-height: 2.1;
    letter-spacing: 0.04em;
  }

  .text.narration {
    color: #cfcbc0;
  }

  .hint {
    position: absolute;
    bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    color: #656c7a;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
  }

  .chevron {
    animation: bob 1.6s ease-in-out infinite;
  }

  .skip {
    position: absolute;
    top: 1.2rem;
    right: 1.2rem;
    background: transparent;
    border: 1px solid #2a2f3c;
    color: #939aa8;
    font-family: 'DotGothic16', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    padding: 0.4rem 0.8rem;
    border-radius: 3px;
    cursor: pointer;
  }

  .skip:hover {
    color: #e7e3d8;
    border-color: #4a505e;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition:
      opacity 0.6s ease,
      transform 0.6s ease;
  }

  .fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }

  .fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  @keyframes bob {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    50% {
      transform: translateY(4px);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fade-enter-active,
    .fade-leave-active {
      transition: opacity 0.3s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
      transform: none;
    }

    .chevron {
      animation: none;
    }
  }

  @media (min-width: 480px) {
    .text {
      font-size: 1.2rem;
    }

    .speaker {
      font-size: 0.95rem;
    }
  }
</style>
