import Phaser from 'phaser'

export class DungeonScene extends Phaser.Scene {
  // 表示するタイル数（ビューポート）
  private viewTilesX = 10
  private viewTilesY = 6

  // タイルサイズ（動的に計算）
  private tileWidth = 0
  private tileHeight = 0
  private wallHeight = 0

  // マップサイズ（ビューポートより大きい）
  private mapWidth = 30
  private mapHeight = 30
  private map: number[][] = []
  private playerPos = { x: 5, y: 5 }
  private mapGraphics!: Phaser.GameObjects.Graphics
  private entityGraphics!: Phaser.GameObjects.Graphics

  // マップ描画の開始位置
  private offsetX = 0
  private offsetY = 0

  // 画面サイズ
  private screenWidth = 0
  private screenHeight = 0
  private gameAreaTop = 50 // ステータスバー下
  private gameAreaBottom = 430 // メッセージログ上

  constructor() {
    super({ key: 'DungeonScene' })
  }

  create() {
    this.calculateTileSize()
    this.createMap()
    this.mapGraphics = this.add.graphics()
    this.entityGraphics = this.add.graphics()
    this.drawScene()
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

    // 正方形タイル：横幅を基準にサイズを計算（10タイルが収まるように）
    const tileSize = Math.floor(this.screenWidth / this.viewTilesX)
    this.tileWidth = tileSize
    this.tileHeight = tileSize

    // 壁の高さはタイルの半分
    this.wallHeight = Math.floor(tileSize * 0.5)

    // オフセットを計算（中央揃え）
    this.offsetX = Math.floor((this.screenWidth - this.viewTilesX * this.tileWidth) / 2)
    this.offsetY = this.gameAreaTop + Math.floor((gameAreaHeight - this.viewTilesY * this.tileHeight) / 2)
  }

  private createMap() {
    // 仮の固定マップ（0: 床, 1: 壁, 2: 階段）
    for (let y = 0; y < this.mapHeight; y++) {
      this.map[y] = []
      for (let x = 0; x < this.mapWidth; x++) {
        // 外周は壁
        if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
          this.map[y][x] = 1
        } else {
          this.map[y][x] = 0
        }
      }
    }
    // 階段を配置
    this.map[20][20] = 2

    // いくつかの内部壁を追加（検証用に複数配置）
    this.map[4][4] = 1
    this.map[4][5] = 1
    this.map[7][8] = 1
    this.map[8][8] = 1
    this.map[10][10] = 1
    this.map[10][11] = 1
    this.map[10][12] = 1
    this.map[15][5] = 1
    this.map[15][6] = 1
    this.map[15][7] = 1
    this.map[15][8] = 1
  }

  private drawScene() {
    this.mapGraphics.clear()
    this.entityGraphics.clear()

    // ビューポートの範囲を計算（プレイヤー中心）
    const halfViewX = Math.floor(this.viewTilesX / 2)
    const halfViewY = Math.floor(this.viewTilesY / 2)
    const startX = this.playerPos.x - halfViewX
    const startY = this.playerPos.y - halfViewY
    const endX = startX + this.viewTilesX
    const endY = startY + this.viewTilesY

    // 床を先に全部描画
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) continue
        const tile = this.map[y][x]
        if (tile === 0 || tile === 2) {
          this.drawFloorTile(x, y, startX, startY, tile === 2)
        }
      }
    }

    // 壁とエンティティを描画順序を考慮して描画（奥から手前へ）
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) continue

        // プレイヤーをこの位置で描画
        if (this.playerPos.x === x && this.playerPos.y === y) {
          this.drawPlayer(x, y, startX, startY)
        }

        // 壁を描画
        if (this.map[y][x] === 1) {
          this.drawWallTile(x, y, startX, startY)
        }
      }
    }
  }

  private drawFloorTile(tileX: number, tileY: number, viewStartX: number, viewStartY: number, isStairs: boolean) {
    const screenTileX = tileX - viewStartX
    const screenTileY = tileY - viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth
    const y = this.offsetY + screenTileY * this.tileHeight

    // 床の色（市松模様）
    const isLight = (tileX + tileY) % 2 === 0
    if (isStairs) {
      this.mapGraphics.fillStyle(0x4a90a4)
    } else {
      this.mapGraphics.fillStyle(isLight ? 0x2a6a6a : 0x1a5a5a)
    }

    // 正方形タイル
    this.mapGraphics.fillRect(x, y, this.tileWidth - 1, this.tileHeight - 1)

    // グリッド線
    this.mapGraphics.lineStyle(1, 0x0a3a3a, 0.5)
    this.mapGraphics.strokeRect(x, y, this.tileWidth - 1, this.tileHeight - 1)

    if (isStairs) {
      // 階段の模様
      this.mapGraphics.lineStyle(1, 0x3a7084, 0.8)
      const step = Math.max(3, Math.floor(this.tileHeight / 4))
      for (let i = 2; i < this.tileHeight - 2; i += step) {
        this.mapGraphics.lineBetween(x + 4, y + i, x + this.tileWidth - 5, y + i)
      }
    }
  }

  private drawWallTile(tileX: number, tileY: number, viewStartX: number, viewStartY: number) {
    const screenTileX = tileX - viewStartX
    const screenTileY = tileY - viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth
    const y = this.offsetY + screenTileY * this.tileHeight

    // 壁の上面
    this.mapGraphics.fillStyle(0x3a4a5a)
    this.mapGraphics.fillRect(x, y - this.wallHeight, this.tileWidth - 1, this.tileHeight - 1)

    // 壁の前面（見える部分）
    this.mapGraphics.fillStyle(0x2a3a4a)
    this.mapGraphics.fillRect(
      x,
      y - this.wallHeight + this.tileHeight - 1,
      this.tileWidth - 1,
      this.wallHeight
    )

    // 壁の輪郭
    this.mapGraphics.lineStyle(1, 0x1a2a3a, 0.8)
    this.mapGraphics.strokeRect(
      x,
      y - this.wallHeight,
      this.tileWidth - 1,
      this.tileHeight - 1 + this.wallHeight
    )
  }

  private drawPlayer(tileX: number, tileY: number, viewStartX: number, viewStartY: number) {
    const screenTileX = tileX - viewStartX
    const screenTileY = tileY - viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2

    // プレイヤーサイズをタイルサイズに比例させる
    const scale = Math.min(this.tileWidth, this.tileHeight * 2) / 48

    // 影
    this.entityGraphics.fillStyle(0x000000, 0.3)
    this.entityGraphics.fillEllipse(x, y + 2 * scale, 16 * scale, 6 * scale)

    // 体（青い服）
    this.entityGraphics.fillStyle(0x4169e1)
    this.entityGraphics.fillRect(x - 6 * scale, y - 16 * scale, 12 * scale, 18 * scale)

    // 頭
    this.entityGraphics.fillStyle(0xffdbac)
    this.entityGraphics.fillCircle(x, y - 22 * scale, 6 * scale)

    // 髪
    this.entityGraphics.fillStyle(0x4a3728)
    this.entityGraphics.fillEllipse(x, y - 26 * scale, 6 * scale, 3 * scale)

    // 目
    this.entityGraphics.fillStyle(0x000000)
    this.entityGraphics.fillCircle(x - 2 * scale, y - 22 * scale, 1 * scale)
    this.entityGraphics.fillCircle(x + 2 * scale, y - 22 * scale, 1 * scale)
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
    const newX = this.playerPos.x + dx
    const newY = this.playerPos.y + dy

    // 範囲チェックと壁チェック
    if (
      newX >= 0 &&
      newX < this.mapWidth &&
      newY >= 0 &&
      newY < this.mapHeight &&
      this.map[newY][newX] !== 1
    ) {
      this.playerPos.x = newX
      this.playerPos.y = newY
      this.drawScene()

      // 階段チェック
      if (this.map[newY][newX] === 2) {
        console.log('階段に到達!')
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
    const uiScene = this.scene.get('UIScene') as unknown as {
      addMessage: (msg: string) => void
    }

    switch (action) {
      case 'confirm':
        uiScene.addMessage('決定/攻撃（未実装）')
        break
      case 'wait':
        uiScene.addMessage('その場で待機した')
        // TODO: ターン経過処理
        break
      case 'menu':
        uiScene.addMessage('メニューを開いた（未実装）')
        break
      case 'inventory':
        uiScene.addMessage('アイテム一覧（未実装）')
        break
      case 'prevItem':
        uiScene.addMessage('前のアイテム（未実装）')
        break
      case 'nextItem':
        uiScene.addMessage('次のアイテム（未実装）')
        break
    }
  }
}
