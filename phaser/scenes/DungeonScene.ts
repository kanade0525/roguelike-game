import Phaser from 'phaser'

export class DungeonScene extends Phaser.Scene {
  // 表示するタイル数（ビューポート）
  private viewTilesX = 10
  private viewTilesY = 6

  // タイルサイズ（16x16を拡大表示）
  private baseTileSize = 16
  private tileScale = 3 // 16x3 = 48px
  private tileWidth = 0
  private tileHeight = 0

  // マップサイズ
  private mapWidth = 3
  private mapHeight = 3
  private map: number[][] = []
  private playerPos = { x: 0, y: 0 }

  // スプライトコンテナ
  private floorContainer!: Phaser.GameObjects.Container
  private wallContainer!: Phaser.GameObjects.Container
  private entityContainer!: Phaser.GameObjects.Container
  private playerSprite!: Phaser.GameObjects.Sprite

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

    // オフセットを計算（マップを中央揃え）
    this.offsetX = Math.floor((this.screenWidth - this.mapWidth * this.tileWidth) / 2)
    this.offsetY = this.gameAreaTop + Math.floor((gameAreaHeight - this.mapHeight * this.tileHeight) / 2)
  }

  private createMap() {
    // 2x2マップ: 全て床
    for (let y = 0; y < this.mapHeight; y++) {
      this.map[y] = []
      for (let x = 0; x < this.mapWidth; x++) {
        this.map[y][x] = 0 // 全て床
      }
    }
  }

  private drawScene() {
    // コンテナをクリア
    this.floorContainer.removeAll(true)
    this.wallContainer.removeAll(true)
    this.entityContainer.removeAll(true)

    // マップ全体を描画
    const startX = 0
    const startY = 0
    const endX = this.mapWidth
    const endY = this.mapHeight

    // 全タイルをスキャンして描画
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) continue
        const tile = this.map[y][x]

        if (tile === 0 || tile === 2) {
          // 床タイルを描画
          this.drawFloorTile(x, y, startX, startY, tile === 2)
          // 縁タイルを重ねて描画
          this.drawBorderOverlay(x, y)
        }
      }
    }

    // プレイヤーを描画
    if (
      this.playerPos.y >= startY &&
      this.playerPos.y < endY &&
      this.playerPos.x >= startX &&
      this.playerPos.x < endX
    ) {
      this.drawPlayer(this.playerPos.x, this.playerPos.y, startX, startY)
    }
  }


  // タイルが床かどうか判定（範囲外は壁扱い）
  private isFloor(x: number, y: number): boolean {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return false
    }
    return this.map[y][x] === 0 || this.map[y][x] === 2
  }

  // グリッド座標でタイルを配置（描画範囲チェック付き）
  // gridX: -2=外周, -1=a列, 0=b列, 1=c列, 2=d列, 3=e列, 4=外周
  // gridY: -2=外周, -1=0行, 0=1行, 1=2行, 2=3行, 3=4行, 4=外周
  private addTileAtGrid(texture: string, gridX: number, gridY: number) {
    // 描画範囲チェック: 外周含む7x7（gridX: -2〜4, gridY: -2〜4）
    if (gridX < -2 || gridX > this.mapWidth + 1 || gridY < -2 || gridY > this.mapHeight + 1) {
      return // 範囲外は描画しない
    }
    const x = this.offsetX + gridX * this.tileWidth
    const y = this.offsetY + gridY * this.tileHeight
    const img = this.add.image(x, y, texture)
    img.setOrigin(0, 0)
    img.setScale(this.tileScale)
    this.wallContainer.add(img)
  }

  // 縁タイルを床の上に重ねて描画（グリッド座標ベース）
  private drawBorderOverlay(tileX: number, tileY: number) {
    // 隣接タイルの状態を取得
    const hasFloorN = this.isFloor(tileX, tileY - 1) // 北
    const hasFloorS = this.isFloor(tileX, tileY + 1) // 南
    const hasFloorW = this.isFloor(tileX - 1, tileY) // 西
    const hasFloorE = this.isFloor(tileX + 1, tileY) // 東

    // 北に壁がある場合 → 1つ上のグリッド（tileY - 1）に壁を配置
    if (!hasFloorN) {
      this.addTileAtGrid('wall_mid', tileX, tileY -1) // 壁本体
      this.addTileAtGrid('wall_top_mid', tileX, tileY -2) // 縁（壁の上端）
    }

    // 南に壁がある場合 → 1つ下のグリッド（tileY + 1）に壁を配置
    if (!hasFloorS) {
      this.addTileAtGrid('wall_mid', tileX, tileY + 1) // 壁本体
      this.addTileAtGrid('wall_top_mid', tileX, tileY) // 縁（床の下端）
    }

    // 西に壁がある場合 → 現在のグリッドに縁を配置
    if (!hasFloorW) {
      this.addTileAtGrid('wall_outer_mid_right', tileX, tileY)
    }

    // 東に壁がある場合 → 現在のグリッドに縁を配置
    if (!hasFloorE) {
      this.addTileAtGrid('wall_outer_mid_left', tileX, tileY)
    }

    // 角の処理（北西）
    if (!hasFloorN && !hasFloorW) {
      this.addTileAtGrid('wall_top_left', tileX, tileY - 2) // 角の縁
      this.addTileAtGrid('wall_edge_tshape_left', tileX, tileY - 1) // 北側壁の左縁
    }

    // 角の処理（北東）
    if (!hasFloorN && !hasFloorE) {
      this.addTileAtGrid('wall_top_right', tileX, tileY - 2) // 角の縁
      this.addTileAtGrid('wall_edge_tshape_right', tileX, tileY - 1) // 北側壁の右縁
    }

    // 角の処理（南西）
    if (!hasFloorS && !hasFloorW) {
      this.addTileAtGrid('wall_edge_tshape_bottom_left', tileX, tileY) // 角の縁
    }

    // 角の処理（南東）
    if (!hasFloorS && !hasFloorE) {
      this.addTileAtGrid('wall_edge_tshape_bottom_right', tileX, tileY) // 角の縁
    }
  }

  private drawDebugGrid() {
    // 7x7グリッド（外周の外側も含む）
    // x: -2〜4, y: -2〜4
    // 列名: -, a, b, c, d, e, +
    // 行名: -1, 0, 1, 2, 3, 4, 5
    for (let y = -2; y < this.mapHeight + 2; y++) {
      for (let x = -2; x < this.mapWidth + 2; x++) {
        const screenX = this.offsetX + x * this.tileWidth + this.tileWidth / 2
        const screenY = this.offsetY + y * this.tileHeight + this.tileHeight / 2

        // 座標ラベル
        const colLabels = ['-', 'a', 'b', 'c', 'd', 'e', '+']
        const colLabel = colLabels[x + 2] || '?'
        const label = `${colLabel}${y + 1}`

        // 床エリアは黄色、壁エリアは赤色、外周は灰色
        const isFloorArea = x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight
        const isWallArea = x >= -1 && x <= this.mapWidth && y >= -1 && y <= this.mapHeight
        let color = '#666666' // 外周（灰色）
        if (isFloorArea) {
          color = '#ffff00' // 床（黄色）
        } else if (isWallArea) {
          color = '#ff6666' // 壁（赤色）
        }

        const text = this.add.text(screenX, screenY, label, {
          fontSize: '12px',
          color: color,
          backgroundColor: '#000000aa',
          padding: { x: 2, y: 2 },
        })
        text.setOrigin(0.5, 0.5)
        text.setDepth(1000) // 最前面に表示
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
    // キャラクターの足元をタイルの下端に合わせる
    const y = this.offsetY + (screenTileY + 1) * this.tileHeight

    // プレイヤースプライト作成
    this.playerSprite = this.add.sprite(x, y, 'knight_f0')
    this.playerSprite.setScale(this.tileScale)
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
