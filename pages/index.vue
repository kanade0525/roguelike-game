<script setup lang="ts">
  // タイトル画面
  const router = useRouter()

  const startGame = () => {
    router.push('/game')
  }

  const continueGame = () => {
    // TODO: セーブデータ読み込み
    router.push('/game')
  }

  // セーブデータの有無（仮）
  const hasSaveData = ref(false)
</script>

<template>
  <div class="title-screen">
    <!-- タイトルロゴ -->
    <div class="title-area">
      <h1 class="title">ローグライク</h1>
      <h2 class="title-sub">ダンジョン</h2>
      <p class="nes-text is-disabled subtitle">〜 不思議の迷宮 〜</p>
    </div>

    <!-- メニューボタン -->
    <div class="menu nes-container is-dark is-rounded">
      <button class="nes-btn is-primary menu-btn" @click="startGame">
        はじめから
      </button>
      <button
        class="nes-btn menu-btn"
        :class="{ 'is-disabled': !hasSaveData }"
        :disabled="!hasSaveData"
        @click="continueGame"
      >
        つづきから
      </button>
      <button class="nes-btn menu-btn is-disabled" disabled>
        せってい
      </button>
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

  .title-sub {
    font-size: 1.2rem;
    margin: 0;
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

    .title-sub {
      font-size: 1.5rem;
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
