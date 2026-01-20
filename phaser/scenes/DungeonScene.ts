import Phaser from 'phaser'

export class DungeonScene extends Phaser.Scene {
  private tileSize = 32
  private mapWidth = 15
  private mapHeight = 15
  private map: number[][] = []
  private playerPos = { x: 7, y: 7 }
  private playerGraphics!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'DungeonScene' })
  }

  create() {
    this.createMap()
    this.drawMap()
    this.createPlayer()
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
    this.map[13][13] = 2
  }

  private drawMap() {
    const graphics = this.add.graphics()
    const offsetX = (this.cameras.main.width - this.mapWidth * this.tileSize) / 2
    const offsetY = 50

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = this.map[y][x]
        const posX = offsetX + x * this.tileSize
        const posY = offsetY + y * this.tileSize

        switch (tile) {
          case 0: // 床
            graphics.fillStyle(0x3a3a5c)
            break
          case 1: // 壁
            graphics.fillStyle(0x1a1a2e)
            break
          case 2: // 階段
            graphics.fillStyle(0x4a90a4)
            break
        }

        graphics.fillRect(posX, posY, this.tileSize - 1, this.tileSize - 1)
      }
    }
  }

  private createPlayer() {
    const offsetX = (this.cameras.main.width - this.mapWidth * this.tileSize) / 2
    const offsetY = 50

    this.playerGraphics = this.add.graphics()
    this.updatePlayerPosition(offsetX, offsetY)
  }

  private updatePlayerPosition(offsetX: number, offsetY: number) {
    this.playerGraphics.clear()
    this.playerGraphics.fillStyle(0xe94560)
    this.playerGraphics.fillCircle(
      offsetX + this.playerPos.x * this.tileSize + this.tileSize / 2,
      offsetY + this.playerPos.y * this.tileSize + this.tileSize / 2,
      this.tileSize / 3
    )
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

    // 壁チェック
    if (this.map[newY]?.[newX] !== 1) {
      this.playerPos.x = newX
      this.playerPos.y = newY

      const offsetX = (this.cameras.main.width - this.mapWidth * this.tileSize) / 2
      const offsetY = 50
      this.updatePlayerPosition(offsetX, offsetY)

      // 階段チェック
      if (this.map[newY][newX] === 2) {
        console.log('階段に到達!')
      }
    }
  }
}
