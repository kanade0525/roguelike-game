<script setup lang="ts">
import Phaser from 'phaser'
import { onMounted, onUnmounted, ref } from 'vue'
import { DungeonScene } from '~/phaser/scenes/DungeonScene'
import { UIScene } from '~/phaser/scenes/UIScene'

const gameContainer = ref<HTMLDivElement | null>(null)
let game: Phaser.Game | null = null

onMounted(() => {
  if (!gameContainer.value) return

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: 480,
    height: 720,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [DungeonScene, UIScene],
    backgroundColor: '#1a1a2e',
  }

  game = new Phaser.Game(config)
})

onUnmounted(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<template>
  <div ref="gameContainer" class="game-container" />
</template>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
