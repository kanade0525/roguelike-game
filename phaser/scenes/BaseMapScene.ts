import Phaser from 'phaser'
import { TILE } from '../../game/data/maps'
import type { UIScene } from './UIScene'

// 探索済みだが今は見えていないタイルの減光色（乗算tint）
export const DIM_TINT = 0x555566

export type TileVisibility = 'visible' | 'explored' | 'hidden'

/**
 * マップを歩くシーンの共通基底。
 * タイル/壁（クォータービュー）・プレイヤー・ビューポートスクロールの描画と、
 * 8方向入力（キーボード＋仮想コントローラ経由）を提供する。
 * ダンジョン・拠点はこれを継承し、エンティティ描画(drawEntities)と
 * 移動/アクション処理(tryMove/handleAction) を各自で実装する。
 */
export abstract class BaseMapScene extends Phaser.Scene {
  // 表示するタイル数（ビューポート）
  protected viewTilesX = 8
  protected viewTilesY = 6

  // タイルサイズ（16x16を拡大表示）
  protected baseTileSize = 16
  protected tileScale = 4 // 16x4 = 64px
  protected tileWidth = 0
  protected tileHeight = 0

  // マップ
  protected mapWidth = 0
  protected mapHeight = 0
  protected map: number[][] = []

  // 地形(床/壁)の色味。シーンごとに変えられる。0xffffff は無着色。
  protected terrainTint = 0xffffff
  // 地形テクスチャのキー接尾辞。'' はダンジョン標準、'_village' は加工済みの寒色タイルを使う。
  protected terrainTextureSuffix = ''

  // Pinia store
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected gameStore: any = null

  // 描画コンテナ
  protected floorContainer!: Phaser.GameObjects.Container
  protected wallContainer!: Phaser.GameObjects.Container
  protected entityContainer!: Phaser.GameObjects.Container
  protected effectContainer!: Phaser.GameObjects.Container

  // マップ描画の開始位置
  protected offsetX = 0
  protected offsetY = 0

  // ビューポートの開始位置（スクロール用）
  protected viewStartX = 0
  protected viewStartY = 0

  // 画面サイズ
  protected screenWidth = 0
  protected screenHeight = 0
  protected gameAreaTop = 52
  protected gameAreaBottom = 420

  // 演出中の入力ロック。複数演出が重なっても早い解除が勝たないよう参照カウントで管理する。
  protected inputLocked = false
  private inputLockCount = 0

  protected lockInput() {
    this.inputLockCount++
    this.inputLocked = true
  }

  protected unlockInput() {
    this.inputLockCount = Math.max(0, this.inputLockCount - 1)
    this.inputLocked = this.inputLockCount > 0
  }

  // キーボード8方向移動: 押下中の移動キー集合と、1フレーム内の移動合成
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
  private heldMoveKeys = new Set<string>()
  private movePending = false
  private pendingMove: { dx: number; dy: number } | null = null
  private moveRafId = 0

  // --- 各サブクラスが実装 ---
  protected abstract tryMove(dx: number, dy: number): void
  protected abstract handleAction(action: string): void
  protected abstract drawEntities(
    viewStartX: number,
    viewStartY: number,
    endX: number,
    endY: number
  ): void

  // --- 描画前後フック（既定はなにもしない） ---
  protected prepareDraw() {}
  protected afterDraw() {}

  // タイルの可視状態（既定は常に見える。FOV があるシーンは override）
  protected tileVisibility(_x: number, _y: number): TileVisibility {
    return 'visible'
  }

  // --- 共有アセット読み込み ---
  protected loadSharedAssets() {
    for (let i = 1; i <= 8; i++) {
      this.load.image(`floor_${i}`, `/assets/tiles/floor_${i}.png`)
    }
    this.load.image('floor_stairs', '/assets/tiles/floor_stairs.png')
    this.load.image('wall_mid', '/assets/tiles/wall_mid.png')
    this.load.image('wall_top_mid', '/assets/tiles/wall_top_mid.png')
    this.load.image('wall_top_left', '/assets/tiles/wall_top_left.png')
    this.load.image('wall_top_right', '/assets/tiles/wall_top_right.png')
    this.load.image('wall_outer_mid_left', '/assets/tiles/wall_outer_mid_left.png')
    this.load.image('wall_outer_mid_right', '/assets/tiles/wall_outer_mid_right.png')
    this.load.image('wall_outer_front_left', '/assets/tiles/wall_outer_front_left.png')
    this.load.image('wall_outer_front_right', '/assets/tiles/wall_outer_front_right.png')
    this.load.image('wall_outer_top_left', '/assets/tiles/wall_outer_top_left.png')
    this.load.image('wall_outer_top_right', '/assets/tiles/wall_outer_top_right.png')
    for (let i = 0; i <= 3; i++) {
      this.load.image(`knight_f${i}`, `/assets/tiles/knight_m_idle_anim_f${i}.png`)
    }
  }

  // 地形の壁キー（床は floor_1..8）。色替えバリアントの読み込みに使う。
  protected static readonly TERRAIN_WALLS = [
    'wall_mid',
    'wall_top_mid',
    'wall_top_left',
    'wall_top_right',
    'wall_outer_mid_left',
    'wall_outer_mid_right',
    'wall_outer_front_left',
    'wall_outer_front_right',
    'wall_outer_top_left',
    'wall_outer_top_right',
  ]

  // 色替えした地形タイル(床8+壁10)を suffix 付きキーで読み込む。
  // 村=_village / 静寂の森=_forest / 暗黒城=_castle / 深淵=_abyss。terrainTextureSuffix と対で使う。
  protected loadTerrainVariant(suffix: string) {
    if (!suffix) return
    for (let i = 1; i <= 8; i++) {
      this.load.image(`floor_${i}${suffix}`, `/assets/tiles/floor_${i}${suffix}.png`)
    }
    for (const w of BaseMapScene.TERRAIN_WALLS) {
      this.load.image(`${w}${suffix}`, `/assets/tiles/${w}${suffix}.png`)
    }
  }

  protected createKnightAnimation() {
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
  }

  protected createContainers() {
    this.floorContainer = this.add.container(0, 0)
    this.wallContainer = this.add.container(0, 0)
    this.entityContainer = this.add.container(0, 0)
    this.effectContainer = this.add.container(0, 0)
  }

  protected setMap(map: number[][]) {
    this.map = map
    this.mapWidth = map[0].length
    this.mapHeight = map.length
  }

  // --- タイルサイズ計算 ---
  protected calculateTileSize() {
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
  protected drawScene() {
    this.floorContainer.removeAll(true)
    this.wallContainer.removeAll(true)
    this.entityContainer.removeAll(true)

    this.prepareDraw()

    const playerPos = this.gameStore.player.position
    const halfViewX = Math.floor(this.viewTilesX / 2)
    const halfViewY = Math.floor(this.viewTilesY / 2)
    this.viewStartX = playerPos.x - halfViewX
    this.viewStartY = playerPos.y - halfViewY
    const endX = this.viewStartX + this.viewTilesX
    const endY = this.viewStartY + this.viewTilesY

    this.drawTerrain(endX, endY)
    this.drawEntities(this.viewStartX, this.viewStartY, endX, endY)
    this.drawPlayer(playerPos.x, playerPos.y)

    this.afterDraw()
  }

  // 床＋隣接壁（クォータービュー）＋階段を描画
  private drawTerrain(endX: number, endY: number) {
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
          if (!this.isFloor(x, y + 1)) {
            this.addWallTile('wall_top_mid', x, y, dim)
          }
        }
      }
    }
  }

  protected drawFloorTile(tileX: number, tileY: number, dim = false) {
    const screenTileX = tileX - this.viewStartX
    const screenTileY = tileY - this.viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2

    const textureKey = `floor_${((tileX * 7 + tileY * 13) % 8) + 1}${this.terrainTextureSuffix}`
    const tile = this.add.image(x, y, textureKey)
    tile.setScale(this.tileScale)
    tile.setTint(dim ? DIM_TINT : this.terrainTint)
    this.floorContainer.add(tile)
  }

  // グリッド座標に壁タイルを配置
  protected addWallTile(texture: string, gridX: number, gridY: number, dim = false) {
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
    const img = this.add.image(x, y, texture + this.terrainTextureSuffix)
    img.setOrigin(0, 0)
    img.setScale(this.tileScale)
    img.setTint(dim ? DIM_TINT : this.terrainTint)
    this.wallContainer.add(img)
  }

  // 床セルの隣接壁にタイルを配置（クォータービュー）
  protected drawBorderOverlay(tileX: number, tileY: number, dim = false) {
    const hasN = this.isFloor(tileX, tileY - 1)
    const hasE = this.isFloor(tileX + 1, tileY)
    const hasS = this.isFloor(tileX, tileY + 1)
    const hasW = this.isFloor(tileX - 1, tileY)

    if (!hasN) {
      this.addWallTile('wall_mid', tileX, tileY - 1, dim)
      this.addWallTile('wall_top_mid', tileX, tileY - 2, dim)
    }
    if (!hasS) {
      this.addWallTile('wall_mid', tileX, tileY + 1, dim)
      if (this.map[tileY]?.[tileX] !== TILE.STAIRS) {
        this.addWallTile('wall_top_mid', tileX, tileY, dim)
      }
    }
    if (!hasW) {
      this.addWallTile('wall_outer_mid_left', tileX - 1, tileY, dim)
    }
    if (!hasE) {
      this.addWallTile('wall_outer_mid_right', tileX + 1, tileY, dim)
    }

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
  }

  protected isFloor(x: number, y: number): boolean {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false
    return this.map[y][x] === TILE.FLOOR || this.map[y][x] === TILE.STAIRS
  }

  protected tileToScreen(tileX: number, tileY: number): { x: number; y: number } {
    const screenTileX = tileX - this.viewStartX
    const screenTileY = tileY - this.viewStartY
    return {
      x: this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2,
      y: this.offsetY + screenTileY * this.tileHeight + this.tileHeight * 0.8,
    }
  }

  protected drawPlayer(tileX: number, tileY: number) {
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
  protected setupInput() {
    const keyboard = this.input.keyboard
    if (!keyboard) return

    keyboard.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Enter') {
        this.handleAction('confirm')
        return
      }
      if (event.code === 'KeyI') {
        this.handleAction('inventory')
        return
      }
      if (BaseMapScene.MOVE_KEYS.includes(event.code)) {
        this.heldMoveKeys.add(event.code)
        this.pendingMove = this.composeMoveDirection()
        this.scheduleMove()
      }
    })

    keyboard.on('keyup', (event: KeyboardEvent) => {
      this.heldMoveKeys.delete(event.code)
    })

    this.game.events.on(Phaser.Core.Events.BLUR, this.clearHeldMoveKeys, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.clearHeldMoveKeys, this)
      cancelAnimationFrame(this.moveRafId)
      this.movePending = false
      this.pendingMove = null
      this.heldMoveKeys.clear()
    })
  }

  private clearHeldMoveKeys() {
    this.heldMoveKeys.clear()
    this.pendingMove = null
  }

  // 同一フレーム内の複数キー押下を1回の移動にまとめ、斜め入力を取りこぼさない
  private scheduleMove() {
    if (this.movePending) return
    this.movePending = true
    this.moveRafId = requestAnimationFrame(() => {
      this.movePending = false
      const move = this.pendingMove
      this.pendingMove = null
      if (move && (move.dx !== 0 || move.dy !== 0)) {
        this.tryMove(move.dx, move.dy)
      }
    })
  }

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

  // 仮想コントローラ（UIScene）からのイベントを購読
  protected setupTouchInput() {
    this.events.on('playerMove', (dx: number, dy: number) => this.tryMove(dx, dy))
    this.events.on('playerAction', (action: string) => this.handleAction(action))
  }

  // UIScene への型付きアクセス
  protected getUiScene(): UIScene {
    return this.scene.get('UIScene') as unknown as UIScene
  }
}
