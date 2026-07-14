<script setup lang="ts">
  import Phaser from 'phaser'
  import { markRaw, nextTick, onMounted, onUnmounted, ref } from 'vue'
  import { VillageScene } from '~/phaser/scenes/VillageScene'
  import { useGameStore } from '~/stores/gameStore'

  const gameContainer = ref<HTMLDivElement | null>(null)
  let game: Phaser.Game | null = null
  const gameStore = useGameStore()

  function createGame(parent: HTMLDivElement): Phaser.Game {
    return new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 480,
      height: 768,
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      callbacks: {
        preBoot: (g) => {
          g.registry.set('gameStore', gameStore)
        },
      },
      scene: [VillageScene],
      backgroundColor: '#1a1a2e',
    })
  }

  onMounted(async () => {
    await nextTick()
    if (!gameContainer.value) return
    // 拠点の永続データを localStorage から同期し、施設接触状態をリセット
    gameStore.loadMeta()
    gameStore.setVillageFacility(null)
    game = markRaw(createGame(gameContainer.value))
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
