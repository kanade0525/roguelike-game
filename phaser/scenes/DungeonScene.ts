import Phaser from 'phaser'
import { TILE_COLOR } from '../../game/data/colors'

export class DungeonScene extends Phaser.Scene {
  // 表示するタイル数（ビューポート）
  private viewTilesX = 7
  private viewTilesY = 5

  // タイルサイズ（16x16を拡大表示）
  private baseTileSize = 16
  private tileScale = 4 // 16x4 = 64px
  private tileWidth = 0
  private tileHeight = 0

  // マップサイズ（ビューポートより大きくできる）
  private mapWidth = 15
  private mapHeight = 12
  private map: number[][] = []

  // Pinia store と composable（GameCanvas.client.vue から registry 経由で受け取る）
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
  private gameAreaTop = 50 // ステータスバー下
  private gameAreaBottom = 430 // メッセージログ上

  constructor() {
    super({ key: 'DungeonScene' })
  }

  preload() {
    // プロトタイプモード: アセット不要
  }

  create() {
    // Pinia store と composable を registry から取得
    this.gameStore = this.game.registry.get('gameStore')
    this.gameLoop = this.game.registry.get('gameLoop')

    this.calculateTileSize()
    this.createMap()

    // プレイヤー初期位置を store に設定、敵を配置
    this.gameLoop.initFloor({ x: 3, y: 3 })
    this.gameStore.addEnemy({ id: 'slime-1', type: 'slime', x: 5, y: 4 })
    this.gameStore.addFloorItem({ id: 'item-1', itemId: 'sword', x: 4, y: 2 })

    // コンテナ作成（描画順序制御用）
    this.tileContainer = this.add.container(0, 0)
    this.entityContainer = this.add.container(0, 0)
    this.debugContainer = this.add.container(0, 0)
    this.debugContainer.setVisible(this.debugGridVisible)

    // グローバルからアクセス可能にする（コンソールからtoggleDebugGrid()で切り替え）
    ;(window as unknown as { toggleDebugGrid: () => void }).toggleDebugGrid = () => {
      this.debugGridVisible = !this.debugGridVisible
      this.debugContainer.setVisible(this.debugGridVisible)
      console.log(`Debug grid: ${this.debugGridVisible ? 'ON' : 'OFF'}`)
    }

    this.drawScene()
    this.drawDebugGrid()
    this.setupInput()
    this.setupTouchInput()

    // UIシーンを並行起動
    this.scene.launch('UIScene')
  }

  private calculateTileSize() {
    // 画面サイズを取得
    this.screenWidth = this.scale.width
    this.screenHeight = this.scale.height

    // ゲームエリアの高さ（ステータスバー下〜メッセージログ上）
    const gameAreaHeight = this.gameAreaBottom - this.gameAreaTop

    // タイルサイズを計算（横幅基準でスケール調整）
    this.tileScale = Math.floor(this.screenWidth / this.viewTilesX / this.baseTileSize)
    this.tileWidth = this.baseTileSize * this.tileScale
    this.tileHeight = this.baseTileSize * this.tileScale

    // オフセットを計算（ビューポートを中央揃え）
    this.offsetX = Math.floor((this.screenWidth - this.viewTilesX * this.tileWidth) / 2)
    this.offsetY = this.gameAreaTop + Math.floor((gameAreaHeight - this.viewTilesY * this.tileHeight) / 2)
  }

  private createMap() {
    // 十字型マップ: 0=床, 1=壁, 2=階段
    this.map = [
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 2, 1, 1],
    ]
    this.mapWidth = 7
    this.mapHeight = 7
  }

  private drawScene() {
    // コンテナをクリア
    this.tileContainer.removeAll(true)
    this.entityContainer.removeAll(true)

    // プレイヤーを中心にビューポートを計算
    const playerPos = this.gameStore.player.position
    const halfViewX = Math.floor(this.viewTilesX / 2)
    const halfViewY = Math.floor(this.viewTilesY / 2)
    this.viewStartX = playerPos.x - halfViewX
    this.viewStartY = playerPos.y - halfViewY
    const endX = this.viewStartX + this.viewTilesX
    const endY = this.viewStartY + this.viewTilesY

    // ビューポート内の全タイルを描画
    for (let y = this.viewStartY; y < endY; y++) {
      for (let x = this.viewStartX; x < endX; x++) {
        this.drawTile(x, y)
      }
    }

    // アイテムを描画（ビューポート内のみ）
    this.drawItems(this.viewStartX, this.viewStartY, endX, endY)

    // 敵を描画（ビューポート内のみ）
    this.drawEnemies(this.viewStartX, this.viewStartY, endX, endY)

    // プレイヤーを描画（常に画面中央）
    this.drawPlayer(playerPos.x, playerPos.y)

    // デバッググリッドを更新
    if (this.debugGridVisible) {
      this.drawDebugGrid()
    }
  }

  private drawTile(tileX: number, tileY: number) {
    const screenX = tileX - this.viewStartX
    const screenY = tileY - this.viewStartY
    const x = this.offsetX + screenX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenY * this.tileHeight + this.tileHeight / 2

    // タイル種別に応じた色を決定
    let color: number = TILE_COLOR.wall // 範囲外は壁色
    if (tileX >= 0 && tileX < this.mapWidth && tileY >= 0 && tileY < this.mapHeight) {
      const tile = this.map[tileY][tileX]
      if (tile === 0) color = TILE_COLOR.floor
      else if (tile === 2) color = TILE_COLOR.stairs
      else color = TILE_COLOR.wall
    }

    const rect = this.add.rectangle(x, y, this.tileWidth, this.tileHeight, color)
    this.tileContainer.add(rect)
  }

  // タイルが床かどうか判定（範囲外は壁扱い）
  private isFloor(x: number, y: number): boolean {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return false
    }
    return this.map[y][x] === 0 || this.map[y][x] === 2
  }

  private drawDebugGrid() {
    this.debugContainer.removeAll(true)

    // ビューポート範囲のデバッググリッドを描画
    for (let y = this.viewStartY - 2; y < this.viewStartY + this.viewTilesY + 2; y++) {
      for (let x = this.viewStartX - 2; x < this.viewStartX + this.viewTilesX + 2; x++) {
        const screenX = x - this.viewStartX
        const screenY = y - this.viewStartY
        const pixelX = this.offsetX + screenX * this.tileWidth + this.tileWidth / 2
        const pixelY = this.offsetY + screenY * this.tileHeight + this.tileHeight / 2

        // 座標ラベル（マップ座標を表示）
        const label = `${x},${y}`

        // 床エリアは黄色、壁エリアは赤色、範囲外は灰色
        const isFloorArea = x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight && this.isFloor(x, y)
        const isInMap = x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight
        let color = '#666666' // 範囲外（灰色）
        if (isFloorArea) {
          color = '#ffff00' // 床（黄色）
        } else if (isInMap) {
          color = '#ff6666' // 壁（赤色）
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
      // ビューポート外はスキップ
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

  private tryMove(dx: number, dy: number) {
    const dir = dx === -1 ? '左' : dx === 1 ? '右' : dy === -1 ? '上' : '下'
    console.log(`[Move] ${dir}`)
    const messages = this.gameLoop.playerMove(dx, dy, this.map)

    // 移動が発生した場合（メッセージが空でも壁でなければ配列が返る）
    if (messages !== null) {
      this.drawScene()
      this.updateUI(messages)

      // 階段に乗ったら確認ダイアログ
      const pos = this.gameStore.player.position
      if (this.map[pos.y][pos.x] === 2) {
        const ui = this.scene.get('UIScene') as unknown as {
          showConfirm: (message: string, onYes: () => void) => void
        }
        ui.showConfirm('次の階に移動しますか？', () => {
          this.goNextFloor()
        })
      }
    }
  }

  private setupTouchInput() {
    // UISceneからの移動イベントを受け取る
    this.events.on('playerMove', (dx: number, dy: number) => {
      this.tryMove(dx, dy)
    })

    // UISceneからのアクションイベントを受け取る
    this.events.on('playerAction', (action: string) => {
      this.handleAction(action)
    })
  }

  private handleAction(action: string) {
    console.log(`[Action] ${action}`)
    switch (action) {
      case 'confirm':
        break
      case 'wait':
        this.updateUI(['その場で待機した（未実装）'])
        break
      case 'menu':
        this.updateUI(['メニューを開いた（未実装）'])
        break
      case 'inventory': {
        const ui = this.scene.get('UIScene') as unknown as {
          toggleMenu: () => void
        }
        ui.toggleMenu()
        break
      }
      case 'prevItem':
        this.updateUI(['前のアイテム（未実装）'])
        break
      case 'nextItem':
        this.updateUI(['次のアイテム（未実装）'])
        break
    }
  }

  private goNextFloor() {
    this.gameLoop.goNextFloor()

    // 新フロアに敵・アイテムを再配置
    this.gameStore.addEnemy({ id: 'slime-1', type: 'slime', x: 5, y: 4 })
    this.gameStore.addFloorItem({ id: 'item-1', itemId: 'sword', x: 4, y: 2 })

    this.drawScene()
    this.updateUI([`${this.gameStore.dungeon.floor}Fに到着した！`])
  }

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
