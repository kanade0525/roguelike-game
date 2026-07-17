<script setup lang="ts">
  import Phaser from 'phaser'
  import { markRaw, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { DungeonScene } from '~/phaser/scenes/DungeonScene'
  import { UIScene } from '~/phaser/scenes/UIScene'
  import { useGameStore } from '~/stores/gameStore'
  import { useSettingsStore } from '~/stores/settingsStore'
  import { useGameLoop } from '~/composables/useGameLoop'

  const gameContainer = ref<HTMLDivElement | null>(null)
  let game: Phaser.Game | null = null
  const gameStore = useGameStore()
  const settings = useSettingsStore()
  const gameLoop = useGameLoop()
  const router = useRouter()

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
          g.registry.set('settingsStore', settings)
        },
      },
      scene: [DungeonScene, UIScene],
      backgroundColor: '#1a1a2e',
    })
  }

  onMounted(async () => {
    await nextTick()
    if (!gameContainer.value) return

    // ユーザー設定（音量）を localStorage から読み込む（Phaser 起動前）
    settings.load()

    // sessionStorageから状態を復元
    const restored = gameStore.restoreFromSession()
    // 拠点の永続データ（gold/持ち物）は localStorage を正として先に同期する。
    // 新規ダイブ時の initDungeon→loadBelongings が meta を参照するため、必ず initDungeon より前に。
    gameStore.loadMeta()
    // 復元できていなければ新規初期化（meta から持ち物・ゴールドを引き継ぐ）
    if (!restored || gameStore.currentMap.length === 0) {
      gameLoop.initDungeon(gameStore.dungeon.dungeonId)
    }

    // 復元時にゲーム終了状態ならリザルト/拠点へ直接遷移
    if (gameStore.gameResult === 'escaped') {
      router.replace('/village')
      return
    }
    if (gameStore.gameResult !== 'active') {
      router.replace('/gameover')
      return
    }

    // 状態変更時にsessionStorageへ自動保存（Game生成前に開始）
    gameStore.$subscribe(() => {
      gameStore.saveToSession()
    })

    // ゲーム終了時に画面遷移: 脱出→拠点、死亡/クリア→リザルト
    watch(
      () => gameStore.gameResult,
      (result) => {
        if (result === 'escaped') {
          router.push('/village')
        } else if (result === 'dead' || result === 'cleared') {
          router.push('/gameover')
        }
      }
    )

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
