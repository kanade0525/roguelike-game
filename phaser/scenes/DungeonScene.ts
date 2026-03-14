import Phaser from 'phaser'
import { TILE_COLOR } from '../../game/data/colors'
import { getMap, TILE } from '../../game/data/maps'

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
  private tileContainer!: Phaser.GameObjects.Container
  private entityContainer!: Phaser.GameObjects.Container
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

  constructor() {
    super({ key: 'DungeonScene' })
  }

  preload() {
    // プロトタイプモード: アセット不要
  }

  create() {
    this.gameStore = this.game.registry.get('gameStore')
    this.gameLoop = this.game.registry.get('gameLoop')

    if (!this.gameStore || !this.gameLoop) {
      throw new Error('gameStore or gameLoop not found in registry')
    }

    this.calculateTileSize()
    this.loadFloor(1)

    // コンテナ作成（描画順序制御用）
    this.tileContainer = this.add.container(0, 0)
    this.entityContainer = this.add.container(0, 0)
    this.debugContainer = this.add.container(0, 0)
    this.debugContainer.setVisible(this.debugGridVisible)

    // デバッググリッド切り替え（コンソール用）
    ;(window as unknown as { toggleDebugGrid: () => void }).toggleDebugGrid = () => {
      this.debugGridVisible = !this.debugGridVisible
      this.debugContainer.setVisible(this.debugGridVisible)
      console.log(`Debug grid: ${this.debugGridVisible ? 'ON' : 'OFF'}`)
    }

    this.drawScene()
    this.drawDebugGrid()
    this.setupInput()
    this.setupTouchInput()

    this.scene.launch('UIScene')
  }

  // --- フロア管理 ---

  private loadFloor(floor: number) {
    this.map = getMap(floor)
    this.mapWidth = this.map[0].length
    this.mapHeight = this.map.length
    this.gameLoop.initFloor(floor)
  }

  private goNextFloor() {
    const messages = this.gameLoop.goNextFloor()
    const floor = this.gameStore.dungeon.floor
    this.map = getMap(floor)
    this.mapWidth = this.map[0].length
    this.mapHeight = this.map.length
    this.drawScene()
    this.updateUI(messages)
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
    this.offsetY = this.gameAreaTop + Math.floor((gameAreaHeight - this.viewTilesY * this.tileHeight) / 2)
  }

  // --- 描画 ---

  private drawScene() {
    this.tileContainer.removeAll(true)
    this.entityContainer.removeAll(true)

    const playerPos = this.gameStore.player.position
    const halfViewX = Math.floor(this.viewTilesX / 2)
    const halfViewY = Math.floor(this.viewTilesY / 2)
    this.viewStartX = playerPos.x - halfViewX
    this.viewStartY = playerPos.y - halfViewY
    const endX = this.viewStartX + this.viewTilesX
    const endY = this.viewStartY + this.viewTilesY

    for (let y = this.viewStartY; y < endY; y++) {
      for (let x = this.viewStartX; x < endX; x++) {
        this.drawTile(x, y)
      }
    }

    this.drawItems(this.viewStartX, this.viewStartY, endX, endY)
    this.drawEnemies(this.viewStartX, this.viewStartY, endX, endY)
    this.drawPlayer(playerPos.x, playerPos.y)

    if (this.debugGridVisible) {
      this.drawDebugGrid()
    }
  }

  private drawTile(tileX: number, tileY: number) {
    const screenX = tileX - this.viewStartX
    const screenY = tileY - this.viewStartY
    const x = this.offsetX + screenX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenY * this.tileHeight + this.tileHeight / 2

    let color: number = TILE_COLOR.wall
    if (tileX >= 0 && tileX < this.mapWidth && tileY >= 0 && tileY < this.mapHeight) {
      const tile = this.map[tileY][tileX]
      if (tile === TILE.FLOOR) color = TILE_COLOR.floor
      else if (tile === TILE.STAIRS) color = TILE_COLOR.stairs
      else color = TILE_COLOR.wall
    }

    const rect = this.add.rectangle(x, y, this.tileWidth, this.tileHeight, color)
    this.tileContainer.add(rect)
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
        const isFloorArea = x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight && this.isFloor(x, y)
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
      const screenTileX = item.x - viewStartX
      const screenTileY = item.y - viewStartY
      const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
      const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2
      const rect = this.add.rectangle(x, y, this.tileWidth * 0.4, this.tileHeight * 0.4, TILE_COLOR.item)
      this.entityContainer.add(rect)
    }
  }

  private drawEnemies(viewStartX: number, viewStartY: number, endX: number, endY: number) {
    for (const enemy of this.gameStore.enemies) {
      if (enemy.x < viewStartX || enemy.x >= endX || enemy.y < viewStartY || enemy.y >= endY) continue
      const screenTileX = enemy.x - viewStartX
      const screenTileY = enemy.y - viewStartY
      const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
      const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2
      const rect = this.add.rectangle(x, y, this.tileWidth * 0.7, this.tileHeight * 0.7, TILE_COLOR.enemy)
      this.entityContainer.add(rect)
    }
  }

  private drawPlayer(tileX: number, tileY: number) {
    const screenTileX = tileX - this.viewStartX
    const screenTileY = tileY - this.viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2
    const rect = this.add.rectangle(x, y, this.tileWidth * 0.7, this.tileHeight * 0.7, TILE_COLOR.player)
    this.entityContainer.add(rect)
  }

  // --- 入力 ---

  private setupInput() {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      let dx = 0
      let dy = 0

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          dy = -1
          break
        case 'ArrowDown':
        case 'KeyS':
          dy = 1
          break
        case 'ArrowLeft':
        case 'KeyA':
          dx = -1
          break
        case 'ArrowRight':
        case 'KeyD':
          dx = 1
          break
      }

      if (dx !== 0 || dy !== 0) {
        this.tryMove(dx, dy)
      }
    })
  }

  private getUiScene() {
    return this.scene.get('UIScene') as unknown as {
      isConfirmOpen: () => boolean
      isMenuOpen: () => boolean
      showConfirm: (message: string, onYes: () => void) => void
      toggleMenu: () => void
      moveMenuCursor: (dx: number, dy: number) => void
      selectMenuItem: () => string | null
      moveConfirmCursor: (dx: number) => void
      confirmSelect: () => void
    }
  }

  private tryMove(dx: number, dy: number) {
    const ui = this.getUiScene()
    if (ui.isMenuOpen()) {
      ui.moveMenuCursor(dx, dy)
      return
    }
    if (ui.isConfirmOpen()) {
      ui.moveConfirmCursor(dx)
      return
    }

    const dir = dx === -1 ? '左' : dx === 1 ? '右' : dy === -1 ? '上' : '下'
    console.log(`[Move] ${dir}`)
    const messages = this.gameLoop.playerMove(dx, dy, this.map)

    if (messages !== null) {
      this.drawScene()
      this.updateUI(messages)

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
    console.log(`[Action] ${action}`)
    const ui = this.getUiScene()

    if (ui.isMenuOpen()) {
      if (action === 'confirm') {
        const selected = ui.selectMenuItem()
        if (selected) {
          ui.toggleMenu()
          this.updateUI([`${selected}（未実装）`])
        }
      } else if (action === 'inventory') {
        ui.toggleMenu()
      }
      return
    }

    if (ui.isConfirmOpen()) {
      if (action === 'confirm') {
        ui.confirmSelect()
      }
      return
    }

    switch (action) {
      case 'confirm':
        break
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

  // --- UI更新 ---

  private updateUI(messages: string[]) {
    const uiScene = this.scene.get('UIScene') as unknown as {
      addMessage: (msg: string) => void
      updateHP: (current: number, max: number) => void
      updateFloor: (floor: number) => void
      updateLevel: (level: number) => void
      updateSatiation: (current: number, max: number) => void
    }

    for (const msg of messages) {
      uiScene.addMessage(msg)
    }

    const { player, dungeon } = this.gameStore
    uiScene.updateHP(player.hp, player.maxHp)
    uiScene.updateFloor(dungeon.floor)
    uiScene.updateLevel(player.level)
    uiScene.updateSatiation(player.satiation, player.maxSatiation)
  }
}
