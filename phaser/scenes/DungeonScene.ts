import Phaser from 'phaser'

export class DungeonScene extends Phaser.Scene {
  // タイルサイズ（クォータービュー: 正方形だがY方向が圧縮）
  private tileWidth = 24
  private tileHeight = 12 // Y方向は半分に圧縮
  private wallHeight = 16
  private mapWidth = 13
  private mapHeight = 13
  private map: number[][] = []
  private playerPos = { x: 6, y: 6 }
  private mapGraphics!: Phaser.GameObjects.Graphics
  private entityGraphics!: Phaser.GameObjects.Graphics

  // マップ描画の開始位置
  private offsetX = 84
  private offsetY = 80

  constructor() {
    super({ key: 'DungeonScene' })
  }

  create() {
    this.createMap()
    this.mapGraphics = this.add.graphics()
    this.entityGraphics = this.add.graphics()
    this.drawScene()
    this.setupInput()

    // UIシーンを並行起動
    this.scene.launch('UIScene')
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
    this.map[10][10] = 2

    // いくつかの内部壁を追加
    this.map[4][4] = 1
    this.map[4][5] = 1
    this.map[7][8] = 1
    this.map[8][8] = 1
  }

  private drawScene() {
    this.mapGraphics.clear()
    this.entityGraphics.clear()

    // 床を先に全部描画
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.map[y][x]
        if (tile === 0 || tile === 2) {
          this.drawFloorTile(x, y, tile === 2)
        }
      }
    }

    // 壁とエンティティを描画順序を考慮して描画（奥から手前へ）
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        // プレイヤーをこの位置で描画
        if (this.playerPos.x === x && this.playerPos.y === y) {
          this.drawPlayer(x, y)
        }

        // 壁を描画
        if (this.map[y][x] === 1) {
          this.drawWallTile(x, y)
        }
      }
    }
  }

  private drawFloorTile(tileX: number, tileY: number, isStairs: boolean) {
    const x = this.offsetX + tileX * this.tileWidth
    const y = this.offsetY + tileY * this.tileHeight

    // 床の色（市松模様）
    const isLight = (tileX + tileY) % 2 === 0
    if (isStairs) {
      this.mapGraphics.fillStyle(0x4a90a4)
    } else {
      this.mapGraphics.fillStyle(isLight ? 0x2a6a6a : 0x1a5a5a)
    }

    // 正方形タイル（Y方向圧縮）
    this.mapGraphics.fillRect(x, y, this.tileWidth - 1, this.tileHeight - 1)

    // グリッド線
    this.mapGraphics.lineStyle(1, 0x0a3a3a, 0.5)
    this.mapGraphics.strokeRect(x, y, this.tileWidth - 1, this.tileHeight - 1)

    if (isStairs) {
      // 階段の模様
      this.mapGraphics.lineStyle(1, 0x3a7084, 0.8)
      for (let i = 2; i < this.tileHeight - 2; i += 3) {
        this.mapGraphics.lineBetween(x + 4, y + i, x + this.tileWidth - 5, y + i)
      }
    }
  }

  private drawWallTile(tileX: number, tileY: number) {
    const x = this.offsetX + tileX * this.tileWidth
    const y = this.offsetY + tileY * this.tileHeight

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

  private drawPlayer(tileX: number, tileY: number) {
    const x = this.offsetX + tileX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + tileY * this.tileHeight + this.tileHeight / 2

    // 影
    this.entityGraphics.fillStyle(0x000000, 0.3)
    this.entityGraphics.fillEllipse(x, y + 2, 16, 6)

    // 体（青い服）
    this.entityGraphics.fillStyle(0x4169e1)
    this.entityGraphics.fillRect(x - 6, y - 16, 12, 18)

    // 頭
    this.entityGraphics.fillStyle(0xffdbac)
    this.entityGraphics.fillCircle(x, y - 22, 6)

    // 髪
    this.entityGraphics.fillStyle(0x4a3728)
    this.entityGraphics.fillEllipse(x, y - 26, 6, 3)

    // 目
    this.entityGraphics.fillStyle(0x000000)
    this.entityGraphics.fillCircle(x - 2, y - 22, 1)
    this.entityGraphics.fillCircle(x + 2, y - 22, 1)
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
}
