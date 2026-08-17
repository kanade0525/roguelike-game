<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useGameStore } from '~/stores/gameStore'

  // タイトル画面
  const router = useRouter()
  const gameStore = useGameStore()

  // はじめから: 永続データ(meta)・中断ランを含め全リセットして拠点の村から開始
  // オープニングは村のゲーム画面内で DialogOverlay により自動再生される
  const startGame = () => {
    gameStore.newGame()
    router.push('/village')
  }

  // つづきから: 潜行中の中断ランがあればダンジョンを途中から再開、無ければ拠点へ
  const continueGame = () => {
    if (gameStore.hasSuspendedRun()) {
      router.push('/game')
    } else {
      router.push('/village')
    }
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
    <div class="bg" />
    <div class="scrim" />

    <div class="content">
      <header class="title-area">
        <p class="eyebrow">冥界下り</p>
        <h1 class="title">Katabasis</h1>
        <p class="tagline">淀みに攫われた者を追い、探索者は深淵の底へ下る。</p>
      </header>

      <nav class="menu">
        <button class="mbtn primary" @click="startGame">はじめから</button>
        <button class="mbtn" :class="{ locked: !hasSaveData }" :disabled="!hasSaveData" @click="continueGame">
          つづきから
        </button>
        <button class="mbtn" @click="openSettings">せってい</button>
      </nav>

      <p class="foot">Aldern · Niveln · Valte — 大崩れより三十年</p>
    </div>
  </div>
</template>

<style scoped>
  .title-screen {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #0b0c11;
    color: #ece8dd;
    font-family: 'DotGothic16', monospace;
  }

  /* 背景: 提供いただいた崖の探索者ピクセルアート。ゆっくりズームで映画的に */
  .bg {
    position: absolute;
    inset: -4%;
    background: url('/assets/opening/op_bg.jpg') center 38% / cover no-repeat;
    image-rendering: pixelated;
    transform: scale(1.04);
    animation: kenburns 26s ease-in-out infinite alternate;
  }

  /* 可読性のための暗幕（上下を締めて中央の絵を活かす） */
  .scrim {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        180deg,
        rgba(8, 9, 14, 0.72) 0%,
        rgba(8, 9, 14, 0.15) 34%,
        rgba(8, 9, 14, 0.35) 62%,
        rgba(8, 9, 14, 0.92) 100%
      );
  }

  .content {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: clamp(2.2rem, 8vh, 4rem) 1.4rem clamp(1.6rem, 5vh, 2.4rem);
    text-align: center;
  }

  .title-area {
    margin-top: clamp(1rem, 6vh, 3rem);
    animation: rise 1.1s ease both;
  }

  .eyebrow {
    margin: 0 0 0.7rem;
    font-size: 0.72rem;
    letter-spacing: 0.62em;
    padding-left: 0.62em;
    color: #e8bd6d;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.9);
  }

  .title {
    margin: 0;
    font-size: clamp(2.6rem, 13vw, 5.5rem);
    line-height: 0.98;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #f4efe3;
    font-weight: 700;
    /* ピクセルフォントを太らせて存在感を出す */
    -webkit-text-stroke: 2.5px #f4efe3;
    paint-order: stroke fill;
    text-shadow:
      0 3px 0 rgba(0, 0, 0, 0.65),
      0 0 24px rgba(232, 189, 109, 0.4),
      0 6px 30px rgba(0, 0, 0, 0.85);
  }

  .tagline {
    margin: 1.1rem auto 0;
    max-width: 22em;
    font-size: 0.78rem;
    line-height: 1.9;
    color: #cbc6ba;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.95);
  }

  .menu {
    width: 100%;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    animation: rise 1.1s ease 0.25s both;
  }

  .mbtn {
    width: 100%;
    padding: 0.85rem 1rem;
    font-family: 'DotGothic16', monospace;
    font-size: 0.9rem;
    letter-spacing: 0.14em;
    color: #ece8dd;
    background: rgba(18, 20, 28, 0.72);
    border: 1px solid rgba(232, 189, 109, 0.35);
    border-radius: 4px;
    cursor: pointer;
    backdrop-filter: blur(3px);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      transform 0.12s ease;
  }

  .mbtn:hover:not(:disabled),
  .mbtn:focus-visible:not(:disabled) {
    background: rgba(232, 189, 109, 0.16);
    border-color: #e8bd6d;
    outline: none;
    transform: translateY(-1px);
  }

  .mbtn.primary {
    border-color: rgba(232, 189, 109, 0.7);
    background: rgba(232, 189, 109, 0.14);
  }

  .mbtn.locked {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .foot {
    margin: 0;
    font-size: 0.6rem;
    letter-spacing: 0.24em;
    color: #6b6c78;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
  }

  @keyframes kenburns {
    from {
      transform: scale(1.04) translate(0, 0);
    }
    to {
      transform: scale(1.13) translate(-1.5%, -2%);
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bg,
    .title-area,
    .menu {
      animation: none;
    }
    .bg {
      transform: scale(1.06);
    }
  }

  @media (min-width: 480px) {
    .tagline {
      font-size: 0.9rem;
    }
    .mbtn {
      font-size: 1rem;
      padding: 0.95rem 1.2rem;
    }
    .menu {
      max-width: 340px;
    }
  }
</style>
