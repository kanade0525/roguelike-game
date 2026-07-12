import Phaser from 'phaser'
import { TILE } from '../../game/data/maps'
import { getDungeon } from '../../game/dungeon'
import { ITEMS } from '../../game/data/items'
import gameConfig from '../../game/data/gameConfig.json'
import type { CombatEvent, ActionResult } from '../../composables/useGameLoop'

const ITEM_TINT: Record<string, number> = {
  weapon: 0xffffff,
  armor: 0x66aaff,
  potion: 0x66ff66,
  food: 0xffcc66,
  scroll: 0xcc99ff,
  special: 0xffaa33,
  gold: 0xffd700,
  other: 0xcccccc,
}

// 探索済みだが今は見えていないタイルの減光色（乗算tint）
const DIM_TINT = 0x555566

type TileVisibility = 'visible' | 'explored' | 'hidden'

// インベントリ描画に渡すエントリ（強化レベル・スタック含む）
type InventoryUIEntry = {
  itemId: string
  name: string
  equipped?: boolean
  stack?: number
  equipmentData?: { enhanceLevel: number }
}

export class DungeonScene extends Phaser.Scene {
  // 表示するタイル数（ビューポート）
  private viewTilesX = 8
  private viewTilesY = 6

  // タイルサイズ（16x16を拡大表示）
  private baseTileSize = 16
  private tileScale = 4 // 16x4 = 64px
  private tileWidth = 0
  private tileHeight = 0

  // マップ
  private mapWidth = 0
  private mapHeight = 0
  private map: number[][] = []

  // Pinia store と composable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameStore: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameLoop: any = null

  // 描画コンテナ
  private floorContainer!: Phaser.GameObjects.Container
  private wallContainer!: Phaser.GameObjects.Container
  private entityContainer!: Phaser.GameObjects.Container
  private effectContainer!: Phaser.GameObjects.Container
  private debugContainer!: Phaser.GameObjects.Container
  private debugGridVisible = false

  // マップ描画の開始位置
  private offsetX = 0
  private offsetY = 0

  // ビューポートの開始位置（スクロール用）
  private viewStartX = 0
  private viewStartY = 0

  // 画面サイズ
  private screenWidth = 0
  private screenHeight = 0
  private gameAreaTop = 52
  private gameAreaBottom = 420

  // レベルアップ検知用
  private lastPlayerLevel = 1

  // 演出中の入力ロック
  private inputLocked = false

  // キーボード8方向移動: 押下中の移動キー集合と、1フレーム内の移動合成フラグ
  private heldMoveKeys = new Set<string>()
  private movePending = false

  // FOV（視界）: 有効フラグと、drawScene 内で使い回す可視/探索済み集合
  private fovActive = false
  private visibleSet: Set<string> = new Set()
  private exploredSet: Set<string> = new Set()

  // BGM
  private currentBgm: Phaser.Sound.BaseSound | null = null
  private currentBgmKey = ''

  constructor() {
    super({ key: 'DungeonScene' })
  }

  preload() {
    // 床タイル（8種類）
    for (let i = 1; i <= 8; i++) {
      this.load.image(`floor_${i}`, `/assets/tiles/floor_${i}.png`)
    }
    this.load.image('floor_stairs', '/assets/tiles/floor_stairs.png')
    // 壁タイル
    this.load.image('wall_mid', '/assets/tiles/wall_mid.png')
    this.load.image('wall_top_mid', '/assets/tiles/wall_top_mid.png')
    this.load.image('wall_top_left', '/assets/tiles/wall_top_left.png')
    this.load.image('wall_top_right', '/assets/tiles/wall_top_right.png')
    // 外側コーナー
    this.load.image('wall_outer_mid_left', '/assets/tiles/wall_outer_mid_left.png')
    this.load.image('wall_outer_mid_right', '/assets/tiles/wall_outer_mid_right.png')
    this.load.image('wall_outer_front_left', '/assets/tiles/wall_outer_front_left.png')
    this.load.image('wall_outer_front_right', '/assets/tiles/wall_outer_front_right.png')
    this.load.image('wall_outer_top_left', '/assets/tiles/wall_outer_top_left.png')
    this.load.image('wall_outer_top_right', '/assets/tiles/wall_outer_top_right.png')
    // 内側コーナー・エッジ（マップ拡大時に使用）
    // this.load.image('wall_edge_bottom_left', '/assets/tiles/wall_edge_bottom_left.png')
    // this.load.image('wall_edge_bottom_right', '/assets/tiles/wall_edge_bottom_right.png')
    // this.load.image('wall_edge_top_left', '/assets/tiles/wall_edge_top_left.png')
    // this.load.image('wall_edge_top_right', '/assets/tiles/wall_edge_top_right.png')
    // this.load.image('wall_edge_left', '/assets/tiles/wall_edge_left.png')
    // this.load.image('wall_edge_right', '/assets/tiles/wall_edge_right.png')
    // プレイヤー（4フレーム）
    for (let i = 0; i <= 3; i++) {
      this.load.image(`knight_f${i}`, `/assets/tiles/knight_m_idle_anim_f${i}.png`)
    }
    // 敵（4フレーム）
    for (let i = 0; i <= 3; i++) {
      this.load.image(`skelet_f${i}`, `/assets/tiles/skelet_idle_anim_f${i}.png`)
    }
    // アイテム
    this.load.image('weapon_sword', '/assets/tiles/weapon_anime_sword.png')
    this.load.image('flask_green', '/assets/tiles/flask_green.png')

    // SE（ファイルが存在しない場合はロードエラーを無視）
    this.load.on('loaderror', () => {})
    this.load.audio('se_attack', '/assets/se/attack.mp3')
    this.load.audio('se_enemy_attack', '/assets/se/enemy_attack.mp3')
    this.load.audio('se_dodge', '/assets/se/dodge.mp3')
    this.load.audio('se_critical', '/assets/se/critical.mp3')
    this.load.audio('se_swing', '/assets/se/swing.mp3')
    this.load.audio('se_item_get', '/assets/se/item_get.mp3')
    this.load.audio('se_item_use', '/assets/se/item_use.mp3')
    this.load.audio('se_game_clear', '/assets/se/game_clear.mp3')
    this.load.audio('se_game_over', '/assets/se/game_over.mp3')
    this.load.audio('se_stairs', '/assets/se/stairs.mp3')
    this.load.audio('se_levelup', '/assets/se/levelup.mp3')
  }

  create() {
    this.gameStore = this.game.registry.get('gameStore')
    this.gameLoop = this.game.registry.get('gameLoop')

    if (!this.gameStore || !this.gameLoop) {
      throw new Error('gameStore or gameLoop not found in registry')
    }

    this.calculateTileSize()

    this.syncMapFromStore()

    // FOV有効判定: playerConfig.fovEnabled（既定ON）または debugConfig.showFOV（強制ON）
    const playerCfg = gameConfig.playerConfig as { fovEnabled?: boolean }
    const debugCfg = gameConfig.debugConfig as { showFOV?: boolean }
    this.fovActive = (playerCfg?.fovEnabled ?? false) || (debugCfg?.showFOV ?? false)

    // マウント／リロード直後に可視タイルが空でも即描画できるよう再計算する
    if (this.fovActive) {
      this.gameStore.recomputeFov()
    }

    // コンテナ作成（描画順序制御用）
    this.floorContainer = this.add.container(0, 0)
    this.wallContainer = this.add.container(0, 0)
    this.entityContainer = this.add.container(0, 0)
    this.effectContainer = this.add.container(0, 0)
    this.debugContainer = this.add.container(0, 0)
    this.debugContainer.setVisible(this.debugGridVisible)

    // デバッググリッド切り替え（コンソール用）
    ;(window as unknown as { toggleDebugGrid: () => void }).toggleDebugGrid = () => {
      this.debugGridVisible = !this.debugGridVisible
      this.debugContainer.setVisible(this.debugGridVisible)
      console.log(`Debug grid: ${this.debugGridVisible ? 'ON' : 'OFF'}`)
    }

    this.lastPlayerLevel = this.gameStore.player.level
    this.createAnimations()
    this.drawScene()
    this.drawDebugGrid()
    this.setupInput()
    this.setupTouchInput()

    this.scene.launch('UIScene')
    this.playDungeonBgm()

    // デバッグパネルからの全画面再描画フックを登録（plugins/debug.client.ts で __katabasis 初期化済み）
    if (window.__katabasis) {
      window.__katabasis.refresh = (message?: string) => {
        this.syncMapFromStore()
        this.drawScene()
        this.updateUI(message ? [message] : [])
      }
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (window.__katabasis) window.__katabasis.refresh = undefined
    })
  }

  private createAnimations() {
    if (!this.anims.exists('knight_idle_anim')) {
      this.anims.create({
        key: 'knight_idle_anim',
        frames: [
          { key: 'knight_f0' },
          { key: 'knight_f1' },
          { key: 'knight_f2' },
          { key: 'knight_f3' },
        ],
        frameRate: 6,
        repeat: -1,
      })
    }
    if (!this.anims.exists('skelet_idle_anim')) {
      this.anims.create({
        key: 'skelet_idle_anim',
        frames: [
          { key: 'skelet_f0' },
          { key: 'skelet_f1' },
          { key: 'skelet_f2' },
          { key: 'skelet_f3' },
        ],
        frameRate: 6,
        repeat: -1,
      })
    }
  }

  // --- フロア管理 ---

  private syncMapFromStore() {
    const map = this.gameStore.currentMap
    if (!Array.isArray(map) || map.length === 0 || !Array.isArray(map[0]) || map[0].length === 0) {
      throw new Error('currentMap is empty or invalid')
    }
    this.map = map
    this.mapWidth = this.map[0].length
    this.mapHeight = this.map.length
  }

  private goNextFloor() {
    this.inputLocked = true
    this.playSE('se_stairs')

    // フェードアウト
    const overlay = this.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x000000
    )
    overlay.setAlpha(0)
    overlay.setDepth(3000)

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        // 暗転中にフロア遷移処理
        const result = this.gameLoop.goNextFloor()

        // ダンジョンクリア判定
        if (result && typeof result === 'object' && 'cleared' in result) {
          this.updateUI(result.messages)
          this.playClearSequence(overlay)
          return
        }

        if (!Array.isArray(result)) {
          overlay.destroy()
          this.updateUI(['次の階へ移動できませんでした'])
          return
        }

        this.syncMapFromStore()
        this.drawScene()

        // フロア名表示
        const dungeon = getDungeon(this.gameStore.dungeon.dungeonId)
        const floor = this.gameStore.dungeon.floor
        const gameAreaCenterY = (this.gameAreaTop + this.gameAreaBottom) / 2
        const floorLabel = this.add.text(
          this.screenWidth / 2,
          gameAreaCenterY,
          `${dungeon.name}  ~B${floor}F~`,
          {
            fontSize: '22px',
            fontFamily: '"DotGothic16", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
          }
        )
        floorLabel.setOrigin(0.5)
        floorLabel.setDepth(3001)

        // フロア名を表示してからフェードイン
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: [overlay, floorLabel],
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
              overlay.destroy()
              floorLabel.destroy()
              this.updateUI(result)
              this.playDungeonBgm()
              this.inputLocked = false
            },
          })
        })
      },
    })
  }

  // --- タイルサイズ計算 ---

  private calculateTileSize() {
    this.screenWidth = this.scale.width
    this.screenHeight = this.scale.height

    const gameAreaHeight = this.gameAreaBottom - this.gameAreaTop
    const tileFromWidth = this.screenWidth / this.viewTilesX
    const tileFromHeight = gameAreaHeight / this.viewTilesY
    const tileSize = Math.floor(Math.min(tileFromWidth, tileFromHeight))
    this.tileScale = tileSize / this.baseTileSize
    this.tileWidth = tileSize
    this.tileHeight = tileSize

    this.offsetX = Math.floor((this.screenWidth - this.viewTilesX * this.tileWidth) / 2)
    this.offsetY =
      this.gameAreaTop + Math.floor((gameAreaHeight - this.viewTilesY * this.tileHeight) / 2)
  }

  // --- 描画 ---

  private drawScene() {
    this.floorContainer.removeAll(true)
    this.wallContainer.removeAll(true)
    this.entityContainer.removeAll(true)

    // FOV可視/探索済み集合を毎フレーム構築（Array.includes の O(n) を回避）
    if (this.fovActive) {
      this.visibleSet = new Set(this.gameStore.visibleTiles as string[])
      this.exploredSet = new Set(this.gameStore.exploredTiles as string[])
    }

    const playerPos = this.gameStore.player.position
    const halfViewX = Math.floor(this.viewTilesX / 2)
    const halfViewY = Math.floor(this.viewTilesY / 2)
    this.viewStartX = playerPos.x - halfViewX
    this.viewStartY = playerPos.y - halfViewY
    const endX = this.viewStartX + this.viewTilesX
    const endY = this.viewStartY + this.viewTilesY

    // 床セルのみ描画し、隣接壁をオーバーレイ（画面端の壁欠け防止で1タイル広く走査）
    for (let y = this.viewStartY - 1; y < endY + 1; y++) {
      for (let x = this.viewStartX - 1; x < endX + 1; x++) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) continue
        const tile = this.map[y][x]
        if (tile === TILE.FLOOR || tile === TILE.STAIRS) {
          const vis = this.tileVisibility(x, y)
          if (vis === 'hidden') continue
          const dim = vis === 'explored'
          const inViewport = x >= this.viewStartX && x < endX && y >= this.viewStartY && y < endY
          if (inViewport && tile === TILE.FLOOR) {
            this.drawFloorTile(x, y, dim)
          }
          this.drawBorderOverlay(x, y, dim)
        }
      }
    }

    // 階段を壁より上に再描画し、南壁のふちを階段の上に重ねる
    for (let y = this.viewStartY; y < endY; y++) {
      for (let x = this.viewStartX; x < endX; x++) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) continue
        if (this.map[y][x] === TILE.STAIRS) {
          const vis = this.tileVisibility(x, y)
          if (vis === 'hidden') continue
          const dim = vis === 'explored'
          const sx = this.offsetX + (x - this.viewStartX) * this.tileWidth + this.tileWidth / 2
          const sy = this.offsetY + (y - this.viewStartY) * this.tileHeight + this.tileHeight / 2
          const stairsTile = this.add.image(sx, sy, 'floor_stairs')
          stairsTile.setScale(this.tileScale)
          if (dim) stairsTile.setTint(DIM_TINT)
          this.wallContainer.add(stairsTile)
          // 南に壁がある場合、ふち（wall_top_mid）を階段の上に重ねる
          if (!this.isFloor(x, y + 1)) {
            this.addWallTile('wall_top_mid', x, y, dim)
          }
        }
      }
    }

    this.drawItems(this.viewStartX, this.viewStartY, endX, endY)
    this.drawEnemies(this.viewStartX, this.viewStartY, endX, endY)
    this.drawPlayer(playerPos.x, playerPos.y)

    if (this.debugGridVisible) {
      this.drawDebugGrid()
    }
  }

  // タイルの可視状態を返す（FOV無効時は常に visible = 全描画）
  private tileVisibility(x: number, y: number): TileVisibility {
    if (!this.fovActive) return 'visible'
    const key = `${x},${y}`
    if (this.visibleSet.has(key)) return 'visible'
    if (this.exploredSet.has(key)) return 'explored'
    return 'hidden'
  }

  private drawFloorTile(tileX: number, tileY: number, dim = false) {
    const screenTileX = tileX - this.viewStartX
    const screenTileY = tileY - this.viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2

    const textureKey = `floor_${((tileX * 7 + tileY * 13) % 8) + 1}`
    const tile = this.add.image(x, y, textureKey)
    tile.setScale(this.tileScale)
    if (dim) tile.setTint(DIM_TINT)
    this.floorContainer.add(tile)
  }

  // グリッド座標に壁タイルを配置
  private addWallTile(texture: string, gridX: number, gridY: number, dim = false) {
    const screenX = gridX - this.viewStartX
    const screenY = gridY - this.viewStartY
    if (
      screenX < -2 ||
      screenX > this.viewTilesX + 1 ||
      screenY < -2 ||
      screenY > this.viewTilesY + 1
    )
      return
    const x = this.offsetX + screenX * this.tileWidth
    const y = this.offsetY + screenY * this.tileHeight
    const img = this.add.image(x, y, texture)
    img.setOrigin(0, 0)
    img.setScale(this.tileScale)
    if (dim) img.setTint(DIM_TINT)
    this.wallContainer.add(img)
  }

  // 床セルの隣接壁にタイルを配置
  private drawBorderOverlay(tileX: number, tileY: number, dim = false) {
    const hasN = this.isFloor(tileX, tileY - 1)
    const hasE = this.isFloor(tileX + 1, tileY)
    const hasS = this.isFloor(tileX, tileY + 1)
    const hasW = this.isFloor(tileX - 1, tileY)

    // === 直線部分 ===
    // 北に壁: 前面 + キャップ
    if (!hasN) {
      this.addWallTile('wall_mid', tileX, tileY - 1, dim)
      this.addWallTile('wall_top_mid', tileX, tileY - 2, dim)
    }
    // 南に壁: 前面 + キャップ（キャップは床セル自体に重ねる、ただし階段は隠さない）
    if (!hasS) {
      this.addWallTile('wall_mid', tileX, tileY + 1, dim)
      if (this.map[tileY]?.[tileX] !== TILE.STAIRS) {
        this.addWallTile('wall_top_mid', tileX, tileY, dim)
      }
    }
    // 西に壁
    if (!hasW) {
      this.addWallTile('wall_outer_mid_left', tileX - 1, tileY, dim)
    }
    // 東に壁
    if (!hasE) {
      this.addWallTile('wall_outer_mid_right', tileX + 1, tileY, dim)
    }

    // === 外側角（凸角）===
    if (!hasN && !hasW) {
      this.addWallTile('wall_outer_top_left', tileX - 1, tileY - 2, dim)
      this.addWallTile('wall_top_left', tileX, tileY - 2, dim)
      this.addWallTile('wall_outer_mid_left', tileX - 1, tileY - 1, dim)
    }
    if (!hasN && !hasE) {
      this.addWallTile('wall_outer_top_right', tileX + 1, tileY - 2, dim)
      this.addWallTile('wall_top_right', tileX, tileY - 2, dim)
      this.addWallTile('wall_outer_mid_right', tileX + 1, tileY - 1, dim)
    }
    if (!hasS && !hasW) {
      this.addWallTile('wall_outer_front_left', tileX - 1, tileY + 1, dim)
    }
    if (!hasS && !hasE) {
      this.addWallTile('wall_outer_front_right', tileX + 1, tileY + 1, dim)
    }

    // TODO: 内側角（凹角）は別途マップが大きくなってから対応
  }

  private isFloor(x: number, y: number): boolean {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false
    return this.map[y][x] === TILE.FLOOR || this.map[y][x] === TILE.STAIRS
  }

  private drawDebugGrid() {
    this.debugContainer.removeAll(true)

    for (let y = this.viewStartY - 2; y < this.viewStartY + this.viewTilesY + 2; y++) {
      for (let x = this.viewStartX - 2; x < this.viewStartX + this.viewTilesX + 2; x++) {
        const screenX = x - this.viewStartX
        const screenY = y - this.viewStartY
        const pixelX = this.offsetX + screenX * this.tileWidth + this.tileWidth / 2
        const pixelY = this.offsetY + screenY * this.tileHeight + this.tileHeight / 2

        const label = `${x},${y}`
        const isFloorArea =
          x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight && this.isFloor(x, y)
        const isInMap = x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight
        let color = '#666666'
        if (isFloorArea) {
          color = '#ffff00'
        } else if (isInMap) {
          color = '#ff6666'
        }

        const text = this.add.text(pixelX, pixelY, label, {
          fontSize: '10px',
          color: color,
          backgroundColor: '#000000aa',
          padding: { x: 2, y: 2 },
        })
        text.setOrigin(0.5, 0.5)
        text.setDepth(1000)
        this.debugContainer.add(text)
      }
    }
  }

  private drawItems(viewStartX: number, viewStartY: number, endX: number, endY: number) {
    for (const item of this.gameStore.floorItems) {
      if (item.x < viewStartX || item.x >= endX || item.y < viewStartY || item.y >= endY) continue
      // FOV有効時、今見えているマスのアイテムのみ描画
      if (this.tileVisibility(item.x, item.y) !== 'visible') continue
      const screenTileX = item.x - viewStartX
      const screenTileY = item.y - viewStartY
      const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
      const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2
      const def = ITEMS[item.itemId]
      const spriteKey =
        def?.sprite && this.textures.exists(def.sprite) ? def.sprite : 'weapon_sword'
      const sprite = this.add.image(x, y, spriteKey)
      // 専用スプライト (flask 等) は元画像が小さいので大きめに描画する
      const scaleFactor = spriteKey === 'weapon_sword' ? 0.35 : 0.55
      sprite.setScale(this.tileScale * scaleFactor)
      const type = def?.type ?? 'other'
      // 専用スプライトは tint しない（色被りを防ぐ）
      if (spriteKey === 'weapon_sword') {
        sprite.setTint(ITEM_TINT[type] ?? 0xffffff)
      }
      this.entityContainer.add(sprite)
    }
  }

  private drawEnemies(viewStartX: number, viewStartY: number, endX: number, endY: number) {
    for (const enemy of this.gameStore.enemies) {
      if (enemy.x < viewStartX || enemy.x >= endX || enemy.y < viewStartY || enemy.y >= endY)
        continue
      // FOV有効時、今見えているマスの敵のみ描画
      if (this.tileVisibility(enemy.x, enemy.y) !== 'visible') continue
      const screenTileX = enemy.x - viewStartX
      const screenTileY = enemy.y - viewStartY
      const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
      const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight * 0.8
      const sprite = this.add.sprite(x, y, 'skelet_f0')
      sprite.setOrigin(0.5, 1.0)
      sprite.setScale(this.tileScale * 0.6)
      sprite.play('skelet_idle_anim')
      this.entityContainer.add(sprite)
    }
  }

  private drawPlayer(tileX: number, tileY: number) {
    const screenTileX = tileX - this.viewStartX
    const screenTileY = tileY - this.viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight * 0.8
    const sprite = this.add.sprite(x, y, 'knight_f0')
    sprite.setOrigin(0.5, 1.0)
    sprite.setScale(this.tileScale * 0.6)
    sprite.play('knight_idle_anim')
    this.entityContainer.add(sprite)
  }

  // --- 入力 ---

  private static readonly MOVE_KEYS = [
    'ArrowUp',
    'KeyW',
    'ArrowDown',
    'KeyS',
    'ArrowLeft',
    'KeyA',
    'ArrowRight',
    'KeyD',
  ]

  private setupInput() {
    const keyboard = this.input.keyboard
    if (!keyboard) return

    keyboard.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Enter') {
        this.handleAction('confirm')
        return
      }
      if (DungeonScene.MOVE_KEYS.includes(event.code)) {
        this.heldMoveKeys.add(event.code)
        this.scheduleMove()
      }
    })

    keyboard.on('keyup', (event: KeyboardEvent) => {
      this.heldMoveKeys.delete(event.code)
    })

    // フォーカスを失うとkeyupを取りこぼしてキーが押しっぱなし扱いになるためクリアする
    this.game.events.on(Phaser.Core.Events.BLUR, this.clearHeldMoveKeys, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.clearHeldMoveKeys, this)
      this.heldMoveKeys.clear()
    })
  }

  private clearHeldMoveKeys() {
    this.heldMoveKeys.clear()
  }

  // 同一フレーム内の複数キー押下を1回の移動にまとめ、斜め入力を取りこぼさない
  private scheduleMove() {
    if (this.movePending) return
    this.movePending = true
    requestAnimationFrame(() => {
      this.movePending = false
      const { dx, dy } = this.composeMoveDirection()
      if (dx !== 0 || dy !== 0) {
        this.tryMove(dx, dy)
      }
    })
  }

  // 押下中の移動キー集合から dx,dy を合成する（例: 上+右 → {dx:1, dy:-1}）
  private composeMoveDirection(): { dx: number; dy: number } {
    let dx = 0
    let dy = 0
    const keys = this.heldMoveKeys
    if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1
    if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1
    if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1
    return { dx, dy }
  }

  private getUiScene() {
    return this.scene.get('UIScene') as unknown as {
      isConfirmOpen: () => boolean
      isMenuOpen: () => boolean
      isMinimapOpen: () => boolean
      isInventoryOpen: () => boolean
      showConfirm: (message: string, onYes: () => void) => void
      hideConfirm: () => void
      toggleMenu: () => void
      moveMenuCursor: (dx: number, dy: number) => void
      selectMenuItem: () => string | null
      moveConfirmCursor: (dx: number) => void
      confirmSelect: () => void
      showMinimap: (
        map: number[][],
        player: { x: number; y: number },
        enemies: { x: number; y: number }[],
        items: { x: number; y: number }[],
        exploredTiles: string[]
      ) => void
      hideMinimap: () => void
      showInventory: (inventory: InventoryUIEntry[]) => void
      hideInventory: () => void
      refreshInventory: (inventory: InventoryUIEntry[]) => void
      moveInventoryCursor: (dx: number, dy: number) => void
      getInventorySelectedIndex: () => number
    }
  }

  private tryMove(dx: number, dy: number) {
    if (this.inputLocked) return
    const ui = this.getUiScene()
    // 確認ダイアログは最上位レイヤなので最優先で操作する
    if (ui.isConfirmOpen()) {
      ui.moveConfirmCursor(dx)
      return
    }
    if (ui.isInventoryOpen()) {
      ui.moveInventoryCursor(dx, dy)
      return
    }
    if (ui.isMenuOpen()) {
      ui.moveMenuCursor(dx, dy)
      return
    }

    const h = dx === -1 ? '左' : dx === 1 ? '右' : ''
    const v = dy === -1 ? '上' : dy === 1 ? '下' : ''
    const dir = `${h}${v}` || '?'
    console.log(`[Move] ${dir}`)
    const result: ActionResult | null = this.gameLoop.playerMove(dx, dy)

    if (result !== null) {
      this.drawScene()
      this.updateUI(result.messages)
      this.playSequencedCombatEffects(result)

      if (result.messages.some((m) => m.includes('拾った'))) {
        this.playSE('se_item_get')
      }

      const pos = this.gameStore.player.position
      if (this.map[pos.y][pos.x] === TILE.STAIRS) {
        this.getUiScene().showConfirm('次の階に移動しますか？', () => {
          this.goNextFloor()
        })
      }
    }
  }

  private setupTouchInput() {
    this.events.on('playerMove', (dx: number, dy: number) => {
      this.tryMove(dx, dy)
    })
    this.events.on('playerAction', (action: string) => {
      this.handleAction(action)
    })
  }

  private handleAction(action: string) {
    if (this.inputLocked) return
    console.log(`[Action] ${action}`)
    const ui = this.getUiScene()

    if (ui.isMinimapOpen()) {
      if (action === 'confirm' || action === 'inventory') {
        ui.hideMinimap()
      }
      return
    }

    // 確認ダイアログは最上位レイヤなので最優先で扱う (インベントリ→使用確認のような重ね表示にも対応)
    if (ui.isConfirmOpen()) {
      if (action === 'confirm') {
        ui.confirmSelect()
      } else if (action === 'inventory') {
        ui.hideConfirm()
      }
      return
    }

    if (ui.isInventoryOpen()) {
      this.handleInventoryAction(action)
      return
    }

    if (ui.isMenuOpen()) {
      if (action === 'confirm') {
        const selected = ui.selectMenuItem()
        if (selected) {
          ui.toggleMenu()
          if (selected === 'マップ') {
            ui.showMinimap(
              this.gameStore.currentMap,
              this.gameStore.player.position,
              this.gameStore.enemies.map((e: { x: number; y: number }) => ({ x: e.x, y: e.y })),
              this.gameStore.floorItems.map((i: { x: number; y: number }) => ({ x: i.x, y: i.y })),
              this.gameStore.exploredTiles
            )
          } else if (selected === '道具') {
            ui.showInventory(this.gameStore.inventory)
          } else if (selected === '脱出') {
            ui.showConfirm('ダンジョンから脱出しますか？', () => {
              this.gameLoop.escapeDungeon()
            })
          } else {
            this.updateUI([`${selected}（未実装）`])
          }
        }
      } else if (action === 'inventory') {
        ui.toggleMenu()
      }
      return
    }

    switch (action) {
      case 'confirm': {
        const result: ActionResult = this.gameLoop.playerAttack()
        this.drawScene()
        this.updateUI(result.messages)
        if (result.combatEvents.length === 0) {
          this.playSE('se_swing')
        }
        this.playSequencedCombatEffects(result)
        break
      }
      case 'wait':
        this.updateUI(['その場で待機した（未実装）'])
        break
      case 'menu':
        this.updateUI(['メニューを開いた（未実装）'])
        break
      case 'inventory':
        ui.toggleMenu()
        break
      case 'prevItem':
        this.updateUI(['前のアイテム（未実装）'])
        break
      case 'nextItem':
        this.updateUI(['次のアイテム（未実装）'])
        break
    }
  }

  private handleInventoryAction(action: string) {
    const ui = this.getUiScene()
    const index = ui.getInventorySelectedIndex()

    if (action === 'inventory') {
      ui.hideInventory()
      return
    }

    if (action === 'confirm') {
      const entry = this.gameStore.inventory[index]
      if (!entry) return
      const def = ITEMS[entry.itemId]
      if (!def) return

      if (def.usable) {
        ui.showConfirm(`${def.name} を使用しますか？`, () => {
          const useResult = this.gameStore.useInventoryItem(index)
          if (!useResult.success) return
          this.updateUI([useResult.message])
          ui.refreshInventory(this.gameStore.inventory)

          const scrollAction = useResult.scrollAction
          // リレミトの巻物: 脱出（ターン消費なし・拠点へ遷移）
          if (scrollAction === 'escape') {
            ui.hideInventory()
            this.playSE('se_stairs')
            this.gameLoop.escapeDungeon()
            return
          }
          // ワープ/地図の巻物: 効果は store 適用済み、再描画してターン消費
          if (scrollAction === 'teleport' || scrollAction === 'revealMap') {
            this.playSE('se_item_use')
            ui.hideInventory()
            this.consumeTurnAfterItem()
            return
          }
          // 通常の消費アイテム（ポーション・食料）
          if (useResult.message.includes('HP') || useResult.message.includes('満腹')) {
            this.playSE('se_item_use')
          }
          this.consumeTurnAfterItem()
        })
        return
      }

      if (def.equippable) {
        const verb = entry.equipped ? '外しますか' : '装備しますか'
        ui.showConfirm(`${def.name} を${verb}？`, () => {
          const equipResult = this.gameStore.equipInventoryItem(index)
          if (equipResult.success) {
            this.updateUI([equipResult.message])
            ui.refreshInventory(this.gameStore.inventory)
          }
        })
        return
      }

      // 特殊アイテム（謎の金庫など）: 使用/装備どちらでもない
      if (def.type === 'special') {
        this.updateUI(['重い金庫だ。拠点に持ち帰れば開けられそうだ。'])
        return
      }
      return
    }

    if (action === 'prevItem') {
      const dropResult = this.gameStore.dropInventoryItem(index)
      if (dropResult.success) {
        this.updateUI([dropResult.message])
        ui.refreshInventory(this.gameStore.inventory)
      }
      return
    }
  }

  private consumeTurnAfterItem() {
    // アイテム使用で1ターン消費（待機メッセージは出さない）
    const result: ActionResult = this.gameLoop.passTurn()
    this.drawScene()
    this.updateUI(result.messages)
    this.playSequencedCombatEffects(result)
  }

  // --- 戦闘演出 ---

  private tileToScreen(tileX: number, tileY: number): { x: number; y: number } {
    const screenTileX = tileX - this.viewStartX
    const screenTileY = tileY - this.viewStartY
    return {
      x: this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2,
      y: this.offsetY + screenTileY * this.tileHeight + this.tileHeight * 0.8,
    }
  }

  private playSE(key: string) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, { volume: 0.5 })
    }
  }

  private playSequencedCombatEffects(result: ActionResult) {
    if (result.combatEvents.length === 0) return

    this.inputLocked = true

    // プレイヤーの攻撃を即時再生
    this.playCombatEffects(result.playerEvents)

    if (result.enemyEvents.length > 0) {
      // 敵の攻撃を遅延再生 (短縮: 連打時の入力欠落を減らす)
      this.time.delayedCall(200, () => {
        this.drawScene()
        this.playCombatEffects(result.enemyEvents)
        this.time.delayedCall(150, () => {
          if (this.gameStore.player.hp <= 0 && this.gameStore.gameResult === 'active') {
            this.playDeathSequence()
          } else {
            this.inputLocked = false
          }
        })
      })
    } else {
      this.time.delayedCall(150, () => {
        this.inputLocked = false
      })
    }
  }

  private playDeathSequence() {
    this.inputLocked = true
    this.stopBgm()
    this.playSE('se_game_over')
    // 持ち物全ロスト (issue #7) + gold ロスト (死亡ペナルティ, issue #37)
    this.gameStore.clearInventory()
    this.gameStore.applyDeathPenalty()

    // プレイヤー位置に赤フラッシュ
    const playerPos = this.gameStore.player.position
    const pos = this.tileToScreen(playerPos.x, playerPos.y)
    const redFlash = this.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x880000
    )
    redFlash.setAlpha(0)
    redFlash.setDepth(2500)

    const centerFlash = this.add.rectangle(
      pos.x,
      pos.y - this.tileHeight * 0.4,
      this.tileWidth * 2,
      this.tileHeight * 2,
      0xff2222
    )
    centerFlash.setAlpha(0.7)
    centerFlash.setDepth(1500)

    this.tweens.add({
      targets: redFlash,
      alpha: 0.6,
      duration: 400,
      ease: 'Power2',
    })
    this.tweens.add({
      targets: centerFlash,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => centerFlash.destroy(),
    })

    // 暗転オーバーレイ
    const blackout = this.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x000000
    )
    blackout.setAlpha(0)
    blackout.setDepth(3000)

    // メッセージ
    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: blackout,
        alpha: 1,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          const deathText = this.add.text(
            this.screenWidth / 2,
            this.screenHeight / 2,
            '力尽きた...',
            {
              fontSize: '28px',
              fontFamily: '"DotGothic16", monospace',
              color: '#ff4444',
              stroke: '#000000',
              strokeThickness: 4,
            }
          )
          deathText.setOrigin(0.5)
          deathText.setDepth(3001)
          deathText.setAlpha(0)

          this.tweens.add({
            targets: deathText,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
              this.time.delayedCall(1200, () => {
                this.gameStore.setGameResult('dead')
              })
            },
          })
        },
      })
    })
  }

  private playCombatEffects(events: CombatEvent[]) {
    for (const event of events) {
      if (event.isDodged) {
        this.showMissText(event.targetX, event.targetY)
        this.playSE('se_dodge')
      } else if (event.type === 'playerAttack') {
        this.showDamageNumber(event.targetX, event.targetY, event.damage, event.isCritical)
        this.flashTarget(event.targetX, event.targetY, false)
        this.playSE(event.isCritical ? 'se_critical' : 'se_attack')
      } else {
        this.showDamageNumber(event.targetX, event.targetY, event.damage, event.isCritical)
        this.flashTarget(event.targetX, event.targetY, true)
        this.playSE('se_enemy_attack')
      }
    }
  }

  private showDamageNumber(tileX: number, tileY: number, damage: number, isCritical: boolean) {
    const pos = this.tileToScreen(tileX, tileY)
    const text = this.add.text(pos.x, pos.y - 20, `${damage}`, {
      fontSize: isCritical ? '20px' : '16px',
      fontFamily: '"DotGothic16", monospace',
      color: isCritical ? '#ffff00' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    })
    text.setOrigin(0.5, 1)
    text.setDepth(2000)
    this.effectContainer.add(text)

    this.tweens.add({
      targets: text,
      y: pos.y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }

  private showMissText(tileX: number, tileY: number) {
    const pos = this.tileToScreen(tileX, tileY)
    const text = this.add.text(pos.x, pos.y - 20, 'MISS', {
      fontSize: '14px',
      fontFamily: '"DotGothic16", monospace',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2,
    })
    text.setOrigin(0.5, 1)
    text.setDepth(2000)
    this.effectContainer.add(text)

    this.tweens.add({
      targets: text,
      y: pos.y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }

  private flashTarget(tileX: number, tileY: number, isPlayer: boolean) {
    const pos = this.tileToScreen(tileX, tileY)
    const flash = this.add.rectangle(
      pos.x,
      pos.y - this.tileHeight * 0.4,
      this.tileWidth,
      this.tileHeight,
      isPlayer ? 0xff0000 : 0xffffff
    )
    flash.setAlpha(0.6)
    flash.setDepth(1500)
    this.effectContainer.add(flash)

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    })
  }

  private playClearSequence(overlay: Phaser.GameObjects.Rectangle) {
    this.stopBgm()
    this.playSE('se_game_clear')

    const clearText = this.add.text(
      this.screenWidth / 2,
      this.screenHeight / 2,
      'ダンジョン踏破！',
      {
        fontSize: '28px',
        fontFamily: '"DotGothic16", monospace',
        color: '#ffdd00',
        stroke: '#000000',
        strokeThickness: 4,
      }
    )
    clearText.setOrigin(0.5)
    clearText.setDepth(3001)
    clearText.setAlpha(0)

    this.tweens.add({
      targets: clearText,
      alpha: 1,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          // 踏破は生還扱い: 現ランgoldと所持品を拠点へ持ち帰る (issue #37)
          const banked = this.gameStore.bankRunGold()
          this.gameStore.saveBelongings()
          this.gameStore.setLastRun({
            result: 'cleared',
            goldBanked: banked,
            goldLost: 0,
            floor: this.gameStore.dungeon.floor,
          })
          this.gameStore.setGameResult('cleared')
          overlay.destroy()
        })
      },
    })
  }

  // --- BGM ---

  private playDungeonBgm() {
    const dungeonId = this.gameStore.dungeon.dungeonId
    const dungeon = getDungeon(dungeonId)
    const bgmKey = `bgm_${dungeonId}`

    // 同じBGMが再生中ならスキップ
    if (this.currentBgmKey === bgmKey && this.currentBgm?.isPlaying) return

    // 前のBGMを停止
    this.stopBgm()

    // 動的ロード＋再生
    if (!this.cache.audio.exists(bgmKey)) {
      this.load.audio(bgmKey, dungeon.bgm)
      this.load.once('complete', () => {
        this.startBgm(bgmKey)
      })
      this.load.once('loaderror', () => {})
      this.load.start()
    } else {
      this.startBgm(bgmKey)
    }
  }

  private startBgm(key: string) {
    if (!this.cache.audio.exists(key)) return
    this.currentBgm = this.sound.add(key, { loop: true, volume: 0 })
    this.currentBgm.play()
    this.currentBgmKey = key
    // フェードイン
    this.tweens.add({
      targets: this.currentBgm,
      volume: 0.3,
      duration: 1000,
      ease: 'Linear',
    })
  }

  private stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.stop()
      this.currentBgm.destroy()
      this.currentBgm = null
      this.currentBgmKey = ''
    }
  }

  private pauseBgmForEffect() {
    if (!this.currentBgm || !this.currentBgm.isPlaying) return
    this.tweens.add({
      targets: this.currentBgm,
      volume: 0,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        this.currentBgm?.pause()
      },
    })
  }

  private resumeBgmAfterEffect() {
    if (!this.currentBgm) return
    this.currentBgm.resume()
    this.tweens.add({
      targets: this.currentBgm,
      volume: 0.3,
      duration: 800,
      ease: 'Linear',
    })
  }

  // --- UI更新 ---

  private updateUI(messages: string[]) {
    const uiScene = this.scene.get('UIScene') as unknown as {
      addMessage: (msg: string) => void
      updateHP: (current: number, max: number) => void
      updateFloor: (floor: number) => void
      updateLevel: (level: number) => void
      updateSatiation: (current: number, max: number) => void
      updateGold: (gold: number) => void
    }

    for (const msg of messages) {
      uiScene.addMessage(msg)
    }

    const { player, dungeon } = this.gameStore
    uiScene.updateHP(player.hp, player.maxHp)
    uiScene.updateFloor(dungeon.floor)
    uiScene.updateLevel(player.level)
    uiScene.updateSatiation(player.satiation, player.maxSatiation)
    uiScene.updateGold(player.gold ?? 0)

    if (player.level > this.lastPlayerLevel) {
      this.lastPlayerLevel = player.level
      this.showLevelUpEffect()
    }
  }

  private showLevelUpEffect() {
    this.inputLocked = true
    this.pauseBgmForEffect()
    this.playSE('se_levelup')

    const gameAreaCenterY = (this.gameAreaTop + this.gameAreaBottom) / 2
    const label = this.add.text(this.screenWidth / 2, gameAreaCenterY, 'LEVEL UP!', {
      fontSize: '28px',
      fontFamily: '"DotGothic16", monospace',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
    })
    label.setOrigin(0.5)
    label.setDepth(2000)
    label.setAlpha(0)
    this.effectContainer.add(label)

    this.tweens.add({
      targets: label,
      alpha: 1,
      y: gameAreaCenterY - 30,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.tweens.add({
            targets: label,
            alpha: 0,
            y: gameAreaCenterY - 60,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
              label.destroy()
              this.inputLocked = false
              this.resumeBgmAfterEffect()
            },
          })
        })
      },
    })

    // プレイヤー位置にフラッシュ
    const playerPos = this.gameStore.player.position
    const pos = this.tileToScreen(playerPos.x, playerPos.y)
    const flash = this.add.rectangle(
      pos.x,
      pos.y - this.tileHeight * 0.4,
      this.tileWidth * 1.5,
      this.tileHeight * 1.5,
      0xffdd00
    )
    flash.setAlpha(0.5)
    flash.setDepth(1500)
    this.effectContainer.add(flash)

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    })
  }
}
