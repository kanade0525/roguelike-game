<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useGameStore } from '~/stores/gameStore'

  // タイトル画面
  const router = useRouter()
  const gameStore = useGameStore()

  // はじめから: 永続データ(meta/localStorage)を含め全リセットして拠点の村から開始
  // オープニングは村のゲーム画面内（コントローラ・HUD付き）で DialogOverlay により自動再生される
  const startGame = () => {
    gameStore.newGame()
    sessionStorage.removeItem('gameState')
    router.push('/village')
  }

  // つづきから: 保存済みの永続データを引き継いで拠点の村から再開
  const continueGame = () => {
    router.push('/village')
  }

  const openSettings = () => {
    router.push('/settings')
  }

  // セーブデータ（永続データ）の有無
  const hasSaveData = ref(false)
  onMounted(() => {
    hasSaveData.value =
      typeof localStorage !== 'undefined' && !!localStorage.getItem('katabasis_meta')
  })
</script>

<template>
  <div class="title-screen">
    <!-- タイトルロゴ -->
    <div class="title-area">
      <h1 class="title">Katabasis</h1>
      <p class="nes-text is-disabled subtitle">〜 深淵への下降 〜</p>
    </div>

    <!-- メニューボタン -->
    <div class="menu nes-container is-dark is-rounded">
      <button class="nes-btn is-primary menu-btn" @click="startGame">はじめから</button>
      <button
        class="nes-btn menu-btn"
        :class="{ 'is-disabled': !hasSaveData }"
        :disabled="!hasSaveData"
        @click="continueGame"
      >
        つづきから
      </button>
      <button class="nes-btn menu-btn" @click="openSettings">せってい</button>
    </div>
  </div>
</template>

<style scoped>
  .title-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3rem;
    min-height: 100vh;
    min-height: 100dvh;
    background-color: #1a1a2e;
    color: #fff;
    padding: 2rem 1rem;
  }

  .title-area {
    text-align: center;
  }

  .title {
    font-size: 1.5rem;
    margin: 0 0 0.3rem;
  }

  .subtitle {
    margin-top: 0.8rem;
    font-size: 0.6rem;
  }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 100%;
    max-width: 280px;
    padding: 1.2rem !important;
  }

  .menu-btn {
    padding: 0.8rem 1rem !important;
    font-size: 0.8rem !important;
    width: 100%;
  }

  @media (min-width: 480px) {
    .title {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 0.7rem;
    }

    .menu {
      max-width: 320px;
    }

    .menu-btn {
      font-size: 0.9rem !important;
      padding: 1rem 1.5rem !important;
    }
  }
</style>
