<script setup lang="ts">
  // ゲーム画面
</script>

<template>
  <div class="game-screen">
    <GameCanvas />
    <DebugPanel />
  </div>
</template>

<style scoped>
  .game-screen {
    width: 100vw;
    height: 100vh;
    /* iOS Safari のツールバー込み 100vh でコントローラ下部が見切れるのを防ぐ（dvh 併記） */
    height: 100dvh;
    overflow: hidden;
    background-color: #000;
  }
</style>
