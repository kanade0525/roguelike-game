<script setup lang="ts">
  import Phaser from 'phaser'
  import { markRaw, nextTick, onMounted, onUnmounted, ref } from 'vue'
  import { DungeonScene } from '~/phaser/scenes/DungeonScene'
  import { UIScene } from '~/phaser/scenes/UIScene'
  import { useGameStore } from '~/stores/gameStore'
  import { useGameLoop } from '~/composables/useGameLoop'

  const gameContainer = ref<HTMLDivElement | null>(null)
  let game: Phaser.Game | null = null
  const gameStore = useGameStore()
  const gameLoop = useGameLoop()

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
          g.registry.set('gameLoop', gameLoop)
        },
      },
      scene: [DungeonScene, UIScene],
      backgroundColor: '#1a1a2e',
    })
  }

  onMounted(async () => {
    await nextTick()
    if (!gameContainer.value) return

    // sessionStorageから状態を復元、なければ新規初期化
    const restored = gameStore.restoreFromSession()
    if (!restored || gameStore.currentMap.length === 0) {
      gameLoop.initFloor(gameStore.dungeon.floor)
    }

    // 状態変更時にsessionStorageへ自動保存（Game生成前に開始）
    gameStore.$subscribe(() => {
      gameStore.saveToSession()
    })

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
