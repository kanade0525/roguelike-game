<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useGameStore } from '~/stores/gameStore'

  const router = useRouter()
  const gameStore = useGameStore()

  const isDead = computed(() => gameStore.gameResult === 'dead')
  const isCleared = computed(() => gameStore.gameResult === 'cleared')

  const title = computed(() => (isCleared.value ? 'GAME CLEAR' : 'GAME OVER'))
  const subtitle = computed(() => (isCleared.value ? '〜 深淵を制した 〜' : '〜 力尽きた 〜'))

  const finalFloor = computed(() => gameStore.maxFloorReached)
  const finalLevel = computed(() => gameStore.player.level)
  const defeatedCount = computed(() => gameStore.defeatedEnemies)

  onMounted(() => {
    // 不正遷移対策: activeのままならタイトルへ戻す
    if (gameStore.gameResult === 'active') {
      router.replace('/')
    }
  })

  const backToTitle = () => {
    sessionStorage.removeItem('gameState')
    gameStore.resetGame()
    router.push('/')
  }
</script>

<template>
  <div class="gameover-screen" :class="{ 'is-cleared': isCleared, 'is-dead': isDead }">
    <div class="result-area">
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </div>

    <div class="stats nes-container is-dark is-rounded">
      <dl class="stat-list">
        <div class="stat-row">
          <dt>到達階層</dt>
          <dd>{{ finalFloor }} F</dd>
        </div>
        <div class="stat-row">
          <dt>最終レベル</dt>
          <dd>Lv. {{ finalLevel }}</dd>
        </div>
        <div class="stat-row">
          <dt>撃破数</dt>
          <dd>{{ defeatedCount }}</dd>
        </div>
      </dl>
    </div>

    <div class="menu">
      <button class="nes-btn is-primary menu-btn" @click="backToTitle">タイトルへ</button>
    </div>
  </div>
</template>

<style scoped>
  .gameover-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    min-height: 100vh;
    min-height: 100dvh;
    background-color: #1a1a2e;
    color: #fff;
    padding: 2rem 1rem;
    font-family: 'DotGothic16', monospace;
  }

  .gameover-screen.is-dead {
    background-color: #2a0a0a;
  }

  .gameover-screen.is-cleared {
    background-color: #1a2e1a;
  }

  .result-area {
    text-align: center;
  }

  .title {
    font-size: 1.8rem;
    margin: 0 0 0.5rem;
    letter-spacing: 0.1em;
  }

  .is-dead .title {
    color: #ff4444;
  }

  .is-cleared .title {
    color: #ffdd00;
  }

  .subtitle {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .stats {
    width: 100%;
    max-width: 320px;
    padding: 1.2rem !important;
  }

  .stat-list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
  }

  .stat-row dt {
    margin: 0;
    opacity: 0.8;
  }

  .stat-row dd {
    margin: 0;
    font-weight: bold;
  }

  .menu {
    width: 100%;
    max-width: 280px;
  }

  .menu-btn {
    width: 100%;
    padding: 0.8rem 1rem !important;
    font-size: 0.8rem !important;
  }

  @media (min-width: 480px) {
    .title {
      font-size: 2.4rem;
    }

    .subtitle {
      font-size: 0.9rem;
    }

    .stat-row {
      font-size: 0.9rem;
    }

    .menu {
      max-width: 320px;
    }

    .menu-btn {
      padding: 1rem 1.5rem !important;
      font-size: 0.9rem !important;
    }
  }
</style>
