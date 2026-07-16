<script setup lang="ts">
  // 拠点(村): 歩ける Phaser シーン。移動・施設UI・HUD はすべて Phaser 側（VillageScene + UIScene）。
</script>

<template>
  <div class="village-page">
    <VillageCanvas />
  </div>
</template>

<style scoped>
  .village-page {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    background-color: #1a1a2e;
    overflow: hidden;
  }
</style>
