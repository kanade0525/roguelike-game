import Phaser from 'phaser'

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
  private playerPos = { x: 0, y: 0 }

  // スプライトコンテナ
  private floorContainer!: Phaser.GameObjects.Container
  private wallContainer!: Phaser.GameObjects.Container
  private entityContainer!: Phaser.GameObjects.Container
  private debugContainer!: Phaser.GameObjects.Container
  private playerSprite!: Phaser.GameObjects.Sprite
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
    // 床タイル
    this.load.image('floor_1', '/assets/tiles/floor_1.png')
    this.load.image('floor_2', '/assets/tiles/floor_2.png')
    this.load.image('floor_3', '/assets/tiles/floor_3.png')
    this.load.image('floor_stairs', '/assets/tiles/floor_stairs.png')

    // 壁タイル
    this.load.image('wall_mid', '/assets/tiles/wall_mid.png') // 壁前面（レンガ）
    this.load.image('wall_left', '/assets/tiles/wall_left.png') // 壁左側面
    this.load.image('wall_right', '/assets/tiles/wall_right.png') // 壁右側面
    this.load.image('wall_top_mid', '/assets/tiles/wall_top_mid.png') // 壁上端ライン
    this.load.image('wall_top_left', '/assets/tiles/wall_top_left.png') // 壁上端左角
    this.load.image('wall_top_right', '/assets/tiles/wall_top_right.png') // 壁上端右角
    // 外側コーナー（床の外側の角）
    this.load.image('wall_outer_front_left', '/assets/tiles/wall_outer_front_left.png')
    this.load.image('wall_outer_front_right', '/assets/tiles/wall_outer_front_right.png')
    this.load.image('wall_outer_mid_left', '/assets/tiles/wall_outer_mid_left.png')
    this.load.image('wall_outer_mid_right', '/assets/tiles/wall_outer_mid_right.png')
    this.load.image('wall_outer_top_left', '/assets/tiles/wall_outer_top_left.png')
    this.load.image('wall_outer_top_right', '/assets/tiles/wall_outer_top_right.png')
    // 内側コーナー
    this.load.image('wall_edge_bottom_left', '/assets/tiles/wall_edge_bottom_left.png')
    this.load.image('wall_edge_bottom_right', '/assets/tiles/wall_edge_bottom_right.png')
    this.load.image('wall_edge_mid_left', '/assets/tiles/wall_edge_mid_left.png')
    this.load.image('wall_edge_mid_right', '/assets/tiles/wall_edge_mid_right.png')
    this.load.image('wall_edge_top_left', '/assets/tiles/wall_edge_top_left.png')
    this.load.image('wall_edge_top_right', '/assets/tiles/wall_edge_top_right.png')

    this.load.image('wall_edge_tshape_bottom_left', '/assets/tiles/wall_edge_tshape_bottom_left.png')
    this.load.image('wall_edge_tshape_bottom_right', '/assets/tiles/wall_edge_tshape_bottom_right.png')
    this.load.image('wall_edge_tshape_top_left', '/assets/tiles/wall_edge_tshape_top_left.png')
    this.load.image('wall_edge_tshape_top_right', '/assets/tiles/wall_edge_tshape_top_right.png')
    this.load.image('wall_edge_tshape_left', '/assets/tiles/wall_edge_tshape_left.png')
    this.load.image('wall_edge_tshape_right', '/assets/tiles/wall_edge_tshape_right.png')

    // 南側の壁用
    this.load.image('wall_edge_left', '/assets/tiles/wall_edge_left.png')
    this.load.image('wall_edge_right', '/assets/tiles/wall_edge_right.png')

    // プレイヤースプライト（個別フレーム）
    this.load.image('knight_f0', '/assets/tiles/knight_m_idle_anim_f0.png')
    this.load.image('knight_f1', '/assets/tiles/knight_m_idle_anim_f1.png')
    this.load.image('knight_f2', '/assets/tiles/knight_m_idle_anim_f2.png')
    this.load.image('knight_f3', '/assets/tiles/knight_m_idle_anim_f3.png')
  }

  create() {
    this.calculateTileSize()
    this.createMap()

    // コンテナ作成（描画順序制御用）
    this.floorContainer = this.add.container(0, 0)
    this.wallContainer = this.add.container(0, 0)
    this.entityContainer = this.add.container(0, 0)
    this.debugContainer = this.add.container(0, 0)
    this.debugContainer.setVisible(this.debugGridVisible)

    // グローバルからアクセス可能にする（コンソールからtoggleDebugGrid()で切り替え）
    ;(window as unknown as { toggleDebugGrid: () => void }).toggleDebugGrid = () => {
      this.debugGridVisible = !this.debugGridVisible
      this.debugContainer.setVisible(this.debugGridVisible)
      console.log(`Debug grid: ${this.debugGridVisible ? 'ON' : 'OFF'}`)
    }

    // プレイヤーアニメーション作成
    this.createAnimations()

    this.drawScene()
    this.drawDebugGrid()
    this.setupInput()
    this.setupTouchInput()

    // UIシーンを並行起動
    this.scene.launch('UIScene')
  }

  private createAnimations() {
    // アイドルアニメーション
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
    this.playerPos = { x: 3, y: 3 }
  }

  private drawScene() {
    // コンテナをクリア
    this.floorContainer.removeAll(true)
    this.wallContainer.removeAll(true)
    this.entityContainer.removeAll(true)

    // プレイヤーを中心にビューポートを計算
    const halfViewX = Math.floor(this.viewTilesX / 2)
    const halfViewY = Math.floor(this.viewTilesY / 2)
    this.viewStartX = this.playerPos.x - halfViewX
    this.viewStartY = this.playerPos.y - halfViewY
    const endX = this.viewStartX + this.viewTilesX
    const endY = this.viewStartY + this.viewTilesY

    // ビューポート内のタイルを描画
    for (let y = this.viewStartY; y < endY; y++) {
      for (let x = this.viewStartX; x < endX; x++) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) continue
        const tile = this.map[y][x]

        if (tile === 0 || tile === 2) {
          // 床タイルを描画
          this.drawFloorTile(x, y, this.viewStartX, this.viewStartY, tile === 2)
          // 縁タイルを重ねて描画
          this.drawBorderOverlay(x, y)
        }
      }
    }

    // プレイヤーを描画（常に画面中央）
    this.drawPlayer(this.playerPos.x, this.playerPos.y, this.viewStartX, this.viewStartY)

    // デバッググリッドを更新
    if (this.debugGridVisible) {
      this.drawDebugGrid()
    }
  }


  // タイルが床かどうか判定（範囲外は壁扱い）
  private isFloor(x: number, y: number): boolean {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return false
    }
    return this.map[y][x] === 0 || this.map[y][x] === 2
  }

  // グリッド座標でタイルを配置（ビューポート相対）
  private addTileAtGrid(texture: string, gridX: number, gridY: number) {
    // ビューポート相対座標に変換
    const screenX = gridX - this.viewStartX
    const screenY = gridY - this.viewStartY

    // 描画範囲チェック（ビューポート外は描画しない）
    if (screenX < -2 || screenX > this.viewTilesX + 1 || screenY < -2 || screenY > this.viewTilesY + 1) {
      return
    }

    const x = this.offsetX + screenX * this.tileWidth
    const y = this.offsetY + screenY * this.tileHeight
    const img = this.add.image(x, y, texture)
    img.setOrigin(0, 0)
    img.setScale(this.tileScale)
    this.wallContainer.add(img)
  }

  // 4方向ビットマスクを計算
  // N=1, E=2, S=4, W=8
  private getBitmask4(tileX: number, tileY: number): number {
    let mask = 0
    if (this.isFloor(tileX, tileY - 1)) mask |= 1 // N
    if (this.isFloor(tileX + 1, tileY)) mask |= 2 // E
    if (this.isFloor(tileX, tileY + 1)) mask |= 4 // S
    if (this.isFloor(tileX - 1, tileY)) mask |= 8 // W
    return mask
  }

  // 縁タイルを床の上に重ねて描画（隣接判定 + オーバーレイ方式）
  private drawBorderOverlay(tileX: number, tileY: number) {
    const mask = this.getBitmask4(tileX, tileY)

    // N=1, E=2, S=4, W=8
    const hasN = (mask & 1) !== 0
    const hasE = (mask & 2) !== 0
    const hasS = (mask & 4) !== 0
    const hasW = (mask & 8) !== 0

    // === 直線部分 ===
    // 北に壁
    if (!hasN) {
      this.addTileAtGrid('wall_mid', tileX, tileY - 1)
      this.addTileAtGrid('wall_top_mid', tileX, tileY - 2)
    }
    // 南に壁
    if (!hasS) {
      this.addTileAtGrid('wall_mid', tileX, tileY + 1)
      this.addTileAtGrid('wall_top_mid', tileX, tileY)
    }
    // 西に壁
    if (!hasW) {
      this.addTileAtGrid('wall_outer_mid_left', tileX -1, tileY)
    }
    // 東に壁
    if (!hasE) {
      this.addTileAtGrid('wall_outer_mid_right', tileX + 1, tileY)
    }

    // === 外側角（凸角）===
    // 北西: 北も西も壁
    if (!hasN && !hasW) {
      this.addTileAtGrid('wall_outer_top_left', tileX - 1, tileY - 2) // a-1
      this.addTileAtGrid('wall_top_left', tileX, tileY - 2)
      this.addTileAtGrid('wall_outer_mid_left', tileX - 1, tileY - 1) // a0
    }
    // 北東: 北も東も壁
    if (!hasN && !hasE) {
      this.addTileAtGrid('wall_outer_top_right', tileX + 1, tileY - 2) // e-1
      this.addTileAtGrid('wall_top_right', tileX, tileY - 2)
      this.addTileAtGrid('wall_outer_mid_right', tileX + 1, tileY - 1) // e0
    }
    // 南西: 南も西も壁
    if (!hasS && !hasW) {
      this.addTileAtGrid('wall_outer_front_left', tileX - 1, tileY + 1)
    }
    // 南東: 南も東も壁
    if (!hasS && !hasE) {
      this.addTileAtGrid('wall_outer_front_right', tileX + 1, tileY + 1)
    }

    // === 内側角（凹角）===
    // L字型の内側角のみ処理（孤立した斜め壁は無視）
    // 条件: 斜めが壁 AND 隣接2方向が両方床
    const hasNW = this.isFloor(tileX - 1, tileY - 1)
    const hasNE = this.isFloor(tileX + 1, tileY - 1)
    const hasSW = this.isFloor(tileX - 1, tileY + 1)
    const hasSE = this.isFloor(tileX + 1, tileY + 1)

    // 北西の内側角: 北西が壁、北が床、西が床（L字型の内側）
    if (!hasNW && hasN && hasW) {
      // this.addTileAtGrid('wall_edge_top_right', tileX - 1, tileY - 1)
    }
    // 北東の内側角: 北東が壁、北が床、東が床（L字型の内側）
    if (!hasNE && hasN && hasE) {
      // this.addTileAtGrid('wall_edge_top_left', tileX + 1, tileY - 1)
    }
    // 南西の内側角: 南西が壁、南が床、西が床（L字型の内側）
    if (!hasSW && hasS && hasW) {
      // this.addTileAtGrid('wall_edge_bottom_right', tileX - 1, tileY + 1)
    }
    // 南東の内側角: 南東が壁、南が床、東が床（L字型の内側）
    if (!hasSE && hasS && hasE) {
      // this.addTileAtGrid('wall_edge_bottom_left', tileX + 1, tileY + 1)
    }

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

  private drawFloorTile(tileX: number, tileY: number, viewStartX: number, viewStartY: number, isStairs: boolean) {
    const screenTileX = tileX - viewStartX
    const screenTileY = tileY - viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
    const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2

    // テクスチャを選択
    let textureKey: string
    if (isStairs) {
      textureKey = 'floor_stairs'
    } else {
      // 市松模様風にバリエーションを使い分け
      const variant = ((tileX + tileY) % 3) + 1
      textureKey = `floor_${variant}`
    }

    const tile = this.add.image(x, y, textureKey)
    tile.setScale(this.tileScale)
    this.floorContainer.add(tile)
  }


  private drawPlayer(tileX: number, tileY: number, viewStartX: number, viewStartY: number) {
    const screenTileX = tileX - viewStartX
    const screenTileY = tileY - viewStartY
    const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
    // キャラクターの足元をタイルの中央下寄りに配置
    const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight * 0.8

    // プレイヤースプライト作成
    this.playerSprite = this.add.sprite(x, y, 'knight_f0')
    this.playerSprite.setScale(this.tileScale * 0.8)
    this.playerSprite.setOrigin(0.5, 1) // 足元を原点に
    this.playerSprite.play('knight_idle_anim')
    this.entityContainer.add(this.playerSprite)
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
