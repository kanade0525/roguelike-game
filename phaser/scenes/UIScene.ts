import Phaser from 'phaser'

export class UIScene extends Phaser.Scene {
  // 上部ステータスバー
  private statusBg!: Phaser.GameObjects.Graphics
  private floorText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private hpText!: Phaser.GameObjects.Text
  private satiationText!: Phaser.GameObjects.Text

  // 下部メッセージログ
  private messageBg!: Phaser.GameObjects.Graphics
  private messageTexts: Phaser.GameObjects.Text[] = []
  private messages: string[] = []
  private maxVisibleMessages = 4

  // コントローラー
  private controllerBg!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createStatusBar()
    this.createMessageLog()
    this.createController()

    // 初期メッセージ
    this.addMessage('ダンジョンに足を踏み入れた！')
  }

  private createStatusBar() {
    // ステータスバー背景
    this.statusBg = this.add.graphics()
    this.statusBg.fillStyle(0x1a1a2e, 0.9)
    this.statusBg.fillRoundedRect(8, 8, 464, 36, 4)
    this.statusBg.lineStyle(2, 0x3a3a5e, 1)
    this.statusBg.strokeRoundedRect(8, 8, 464, 36, 4)

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }

    // 階層表示
    this.floorText = this.add.text(20, 16, '1F', textStyle)

    // レベル表示
    this.levelText = this.add.text(80, 16, 'Lv: 1', textStyle)

    // HP表示
    this.hpText = this.add.text(180, 16, 'HP: 100/100', textStyle)

    // 満腹度表示
    this.satiationText = this.add.text(340, 16, '腹: 100', textStyle)
  }

  private createMessageLog() {
    // メッセージログ背景（コントローラーの上）
    this.messageBg = this.add.graphics()
    this.messageBg.fillStyle(0x1a1a2e, 0.9)
    this.messageBg.fillRoundedRect(8, 430, 464, 50, 4)
    this.messageBg.lineStyle(2, 0x3a3a5e, 1)
    this.messageBg.strokeRoundedRect(8, 430, 464, 50, 4)

    // メッセージテキスト（2行分に縮小）
    this.maxVisibleMessages = 2
    for (let i = 0; i < this.maxVisibleMessages; i++) {
      const text = this.add.text(16, 438 + i * 20, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      this.messageTexts.push(text)
    }
  }

  addMessage(message: string) {
    this.messages.push(message)

    // 古いメッセージを削除
    if (this.messages.length > this.maxVisibleMessages) {
      this.messages.shift()
    }

    // 表示更新
    this.updateMessageDisplay()
  }

  private updateMessageDisplay() {
    for (let i = 0; i < this.maxVisibleMessages; i++) {
      if (i < this.messages.length) {
        this.messageTexts[i].setText(this.messages[i])
        // 新しいメッセージほど明るく
        const alpha = 0.5 + (i / this.maxVisibleMessages) * 0.5
        this.messageTexts[i].setAlpha(alpha)
      } else {
        this.messageTexts[i].setText('')
      }
    }
  }

  updateHP(current: number, max: number) {
    this.hpText.setText(`HP: ${current}/${max}`)
  }

  updateFloor(floor: number) {
    this.floorText.setText(`${floor}F`)
  }

  updateLevel(level: number) {
    this.levelText.setText(`Lv: ${level}`)
  }

  updateSatiation(current: number, max: number) {
    this.satiationText.setText(`腹: ${current}`)
  }

  private createController() {
    const screenWidth = 480
    const controllerY = 488
    const controllerHeight = 232

    // コントローラー背景
    this.controllerBg = this.add.graphics()
    this.controllerBg.fillStyle(0x2a2a3e, 1)
    this.controllerBg.fillRect(0, controllerY, screenWidth, controllerHeight)

    // L/Rボタン（上部）
    this.createLRButtons(controllerY + 20)

    // 8方向キー（左）
    this.createDPad(100, controllerY + 120)

    // A/Bボタン（右）
    this.createABButtons(380, controllerY + 120)

    // SELECT/STARTボタン（中央下部）
    this.createSelectStartButtons(controllerY + 205)
  }

  private createDPad(centerX: number, centerY: number) {
    const btnSize = 36
    const gap = 2
    const graphics = this.add.graphics()

    // 8方向の矢印ボタン（3x3グリッド、中央は空き）
    const directions = [
      { dx: -1, dy: -1, col: 0, row: 0, arrow: '↖' },
      { dx: 0, dy: -1, col: 1, row: 0, arrow: '↑' },
      { dx: 1, dy: -1, col: 2, row: 0, arrow: '↗' },
      { dx: -1, dy: 0, col: 0, row: 1, arrow: '←' },
      { dx: 1, dy: 0, col: 2, row: 1, arrow: '→' },
      { dx: -1, dy: 1, col: 0, row: 2, arrow: '↙' },
      { dx: 0, dy: 1, col: 1, row: 2, arrow: '↓' },
      { dx: 1, dy: 1, col: 2, row: 2, arrow: '↘' },
    ]

    const gridSize = btnSize * 3 + gap * 2
    const startX = centerX - gridSize / 2
    const startY = centerY - gridSize / 2

    directions.forEach((dir) => {
      const x = startX + dir.col * (btnSize + gap)
      const y = startY + dir.row * (btnSize + gap)

      // ボタン背景
      graphics.fillStyle(0x4a4a5a, 1)
      graphics.fillRoundedRect(x, y, btnSize, btnSize, 6)
      graphics.lineStyle(1, 0x5a5a6a, 1)
      graphics.strokeRoundedRect(x, y, btnSize, btnSize, 6)

      // 当たり判定
      const btn = this.add.rectangle(x + btnSize / 2, y + btnSize / 2, btnSize, btnSize, 0x000000, 0)
      btn.setInteractive({ useHandCursor: true })

      // 矢印テキスト
      this.add.text(x + btnSize / 2, y + btnSize / 2, dir.arrow, {
        fontSize: '20px',
        color: '#cccccc',
      }).setOrigin(0.5)

      btn.on('pointerdown', () => {
        this.emitMove(dir.dx, dir.dy)
      })
    })

    // 中央の装飾
    const cx = startX + btnSize + gap
    const cy = startY + btnSize + gap
    graphics.fillStyle(0x3a3a4a, 1)
    graphics.fillRoundedRect(cx, cy, btnSize, btnSize, 6)
  }

  private createABButtons(centerX: number, centerY: number) {
    const radius = 30

    // Aボタン（右上）
    const btnA = this.add.circle(centerX + 28, centerY - 24, radius, 0x5a5a7a)
    btnA.setStrokeStyle(2, 0x7a7a9a)
    btnA.setInteractive({ useHandCursor: true })
    this.add.text(centerX + 28, centerY - 24, 'A', {
      fontSize: '20px',
      color: '#dddddd',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnA.on('pointerdown', () => {
      btnA.setFillStyle(0x7a7a9a)
      this.emitAction('confirm')
    })
    btnA.on('pointerup', () => btnA.setFillStyle(0x5a5a7a))
    btnA.on('pointerout', () => btnA.setFillStyle(0x5a5a7a))

    // Bボタン（左下）
    const btnB = this.add.circle(centerX - 28, centerY + 24, radius, 0x5a5a7a)
    btnB.setStrokeStyle(2, 0x7a7a9a)
    btnB.setInteractive({ useHandCursor: true })
    this.add.text(centerX - 28, centerY + 24, 'B', {
      fontSize: '20px',
      color: '#dddddd',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnB.on('pointerdown', () => {
      btnB.setFillStyle(0x7a7a9a)
      this.emitAction('wait')
    })
    btnB.on('pointerup', () => btnB.setFillStyle(0x5a5a7a))
    btnB.on('pointerout', () => btnB.setFillStyle(0x5a5a7a))
  }

  private createLRButtons(y: number) {
    const graphics = this.add.graphics()
    const btnWidth = 70
    const btnHeight = 26

    // Lボタン
    graphics.fillStyle(0x4a4a5a, 1)
    graphics.fillRoundedRect(15, y - btnHeight / 2, btnWidth, btnHeight, 4)
    graphics.lineStyle(1, 0x5a5a6a, 1)
    graphics.strokeRoundedRect(15, y - btnHeight / 2, btnWidth, btnHeight, 4)

    const btnL = this.add.rectangle(15 + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnL.setInteractive({ useHandCursor: true })
    this.add.text(15 + btnWidth / 2, y, 'L', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnL.on('pointerdown', () => this.emitAction('prevItem'))

    // Rボタン
    const rX = 480 - 15 - btnWidth
    graphics.fillStyle(0x4a4a5a, 1)
    graphics.fillRoundedRect(rX, y - btnHeight / 2, btnWidth, btnHeight, 4)
    graphics.lineStyle(1, 0x5a5a6a, 1)
    graphics.strokeRoundedRect(rX, y - btnHeight / 2, btnWidth, btnHeight, 4)

    const btnR = this.add.rectangle(rX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnR.setInteractive({ useHandCursor: true })
    this.add.text(rX + btnWidth / 2, y, 'R', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnR.on('pointerdown', () => this.emitAction('nextItem'))
  }

  private createSelectStartButtons(y: number) {
    const graphics = this.add.graphics()
    const btnWidth = 55
    const btnHeight = 18
    const gap = 10
    const centerX = 240

    // SELECTボタン
    const selectX = centerX - gap / 2 - btnWidth
    graphics.fillStyle(0x3a3a4a, 1)
    graphics.fillRoundedRect(selectX, y - btnHeight / 2, btnWidth, btnHeight, 9)

    const btnSelect = this.add.rectangle(selectX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnSelect.setInteractive({ useHandCursor: true })
    this.add.text(selectX + btnWidth / 2, y, 'SELECT', {
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5)

    btnSelect.on('pointerdown', () => this.emitAction('inventory'))

    // STARTボタン
    const startX = centerX + gap / 2
    graphics.fillRoundedRect(startX, y - btnHeight / 2, btnWidth, btnHeight, 9)

    const btnStart = this.add.rectangle(startX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnStart.setInteractive({ useHandCursor: true })
    this.add.text(startX + btnWidth / 2, y, 'START', {
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5)

    btnStart.on('pointerdown', () => this.emitAction('menu'))
  }

  private emitMove(dx: number, dy: number) {
    // DungeonSceneに移動イベントを送信
    const dungeonScene = this.scene.get('DungeonScene')
    dungeonScene.events.emit('playerMove', dx, dy)
  }

  private emitAction(action: string) {
    // DungeonSceneにアクションイベントを送信
    const dungeonScene = this.scene.get('DungeonScene')
    dungeonScene.events.emit('playerAction', action)
  }
}
