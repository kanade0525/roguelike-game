import Phaser from 'phaser'

export class UIScene extends Phaser.Scene {
  // 上部ステータスバー
  private floorText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private hpText!: Phaser.GameObjects.Text
  private satiationText!: Phaser.GameObjects.Text

  // 下部メッセージログ
  private messageTexts: Phaser.GameObjects.Text[] = []
  private messages: string[] = []
  private maxVisibleMessages = 2

  // コントローラー
  private controllerBg!: Phaser.GameObjects.Graphics

  // メニューオーバーレイ（Bボタンで表示/非表示）
  private menuOverlay!: Phaser.GameObjects.Container
  private menuVisible = false

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createStatusBar()
    this.createMessageLog()
    this.createController()
    this.createMenuOverlay()

    // 初期メッセージ
    this.addMessage('ダンジョンに足を踏み入れた！')
  }

  private createStatusBar() {
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.fillRoundedRect(8, 8, 464, 36, 4)
    bg.lineStyle(2, 0x3a3a5e, 1)
    bg.strokeRoundedRect(8, 8, 464, 36, 4)

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"DotGothic16", monospace',
      fontStyle: 'bold',
    }

    this.floorText = this.add.text(20, 16, '1F', textStyle)
    this.levelText = this.add.text(80, 16, 'Lv: 1', textStyle)
    this.hpText = this.add.text(180, 16, 'HP: 100/100', textStyle)
    this.satiationText = this.add.text(340, 16, '腹: 100', textStyle)
  }

  private createMessageLog() {
    const bg = this.add.graphics()
    bg.fillStyle(0x1a1a2e, 0.9)
    bg.fillRoundedRect(8, 430, 464, 50, 4)
    bg.lineStyle(2, 0x3a3a5e, 1)
    bg.strokeRoundedRect(8, 430, 464, 50, 4)

    for (let i = 0; i < this.maxVisibleMessages; i++) {
      const text = this.add.text(16, 438 + i * 20, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: '"DotGothic16", monospace',
      })
      this.messageTexts.push(text)
    }
  }

  private createMenuOverlay() {
    this.menuOverlay = this.add.container(0, 0)
    this.menuOverlay.setVisible(false)
    this.menuOverlay.setDepth(500)

    // 半透明背景
    const overlay = this.add.rectangle(240, 360, 480, 720, 0x000000, 0.6)
    this.menuOverlay.add(overlay)

    // 左上: メニューボタン（道具/マップ/足元/作戦）
    const menuBg = this.add.graphics()
    menuBg.fillStyle(0x1a1a2e, 0.95)
    menuBg.fillRoundedRect(16, 60, 130, 60, 6)
    menuBg.lineStyle(1, 0x3a3a5e, 1)
    menuBg.strokeRoundedRect(16, 60, 130, 60, 6)
    this.menuOverlay.add(menuBg)

    const menuLabels = [
      { text: '道具', col: 0, row: 0 },
      { text: 'マップ', col: 1, row: 0 },
      { text: '足元', col: 0, row: 1 },
      { text: '作戦', col: 1, row: 1 },
    ]

    const menuStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '13px',
      color: '#cccccc',
      fontFamily: '"DotGothic16", monospace',
    }

    menuLabels.forEach((label) => {
      const x = 28 + label.col * 62
      const y = 70 + label.row * 24
      const t = this.add.text(x, y, label.text, menuStyle)
      this.menuOverlay.add(t)
    })

    // 右上: ダンジョン名
    const nameBg = this.add.graphics()
    nameBg.fillStyle(0x1a1a2e, 0.95)
    nameBg.fillRoundedRect(300, 60, 164, 30, 6)
    nameBg.lineStyle(1, 0x3a3a5e, 1)
    nameBg.strokeRoundedRect(300, 60, 164, 30, 6)
    this.menuOverlay.add(nameBg)

    const nameText = this.add.text(382, 75, '不思議のダンジョン', {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: '"DotGothic16", monospace',
      fontStyle: 'bold',
    })
    nameText.setOrigin(0.5, 0.5)
    this.menuOverlay.add(nameText)

    // 下部: 詳細ステータス
    const statBg = this.add.graphics()
    statBg.fillStyle(0x1a1a2e, 0.95)
    statBg.fillRoundedRect(16, 340, 448, 70, 6)
    statBg.lineStyle(1, 0x3a3a5e, 1)
    statBg.strokeRoundedRect(16, 340, 448, 70, 6)
    this.menuOverlay.add(statBg)

    const statStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '13px',
      color: '#ffffff',
      fontFamily: '"DotGothic16", monospace',
    }

    const statLines = [
      '名前: 冒険者    Lv: 1     HP: 100/100',
      '攻撃: 10   防御: 5    満腹度: 100/100',
      '経験値: 0/100          1F',
    ]

    statLines.forEach((line, i) => {
      const t = this.add.text(28, 350 + i * 20, line, statStyle)
      this.menuOverlay.add(t)
    })

    // 閉じるヒント
    const hint = this.add.text(240, 420, 'B: 閉じる', {
      fontSize: '12px',
      color: '#888888',
      fontFamily: '"DotGothic16", monospace',
    })
    hint.setOrigin(0.5, 0.5)
    this.menuOverlay.add(hint)
  }

  toggleMenu() {
    this.menuVisible = !this.menuVisible
    this.menuOverlay.setVisible(this.menuVisible)
  }

  isMenuOpen(): boolean {
    return this.menuVisible
  }

  addMessage(message: string) {
    this.messages.push(message)
    if (this.messages.length > this.maxVisibleMessages) {
      this.messages.shift()
    }
    this.updateMessageDisplay()
  }

  private updateMessageDisplay() {
    for (let i = 0; i < this.maxVisibleMessages; i++) {
      if (i < this.messages.length) {
        this.messageTexts[i].setText(this.messages[i])
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

  updateSatiation(current: number, _max: number) {
    this.satiationText.setText(`腹: ${current}`)
  }

  private createController() {
    const screenWidth = 480
    const controllerY = 488
    const controllerHeight = 232

    this.controllerBg = this.add.graphics()
    this.controllerBg.fillStyle(0x2a2a3e, 1)
    this.controllerBg.fillRect(0, controllerY, screenWidth, controllerHeight)

    this.createLRButtons(controllerY + 20)
    this.createDPad(100, controllerY + 120)
    this.createABButtons(380, controllerY + 120)
    this.createSelectStartButtons(controllerY + 205)
  }

  private createDPad(centerX: number, centerY: number) {
    const btnSize = 36
    const gap = 2
    const graphics = this.add.graphics()

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

      graphics.fillStyle(0x4a4a5a, 1)
      graphics.fillRoundedRect(x, y, btnSize, btnSize, 6)
      graphics.lineStyle(1, 0x5a5a6a, 1)
      graphics.strokeRoundedRect(x, y, btnSize, btnSize, 6)

      const btn = this.add.rectangle(x + btnSize / 2, y + btnSize / 2, btnSize, btnSize, 0x000000, 0)
      btn.setInteractive({ useHandCursor: true })

      this.add.text(x + btnSize / 2, y + btnSize / 2, dir.arrow, {
        fontSize: '20px',
        color: '#cccccc',
      }).setOrigin(0.5)

      btn.on('pointerdown', () => {
        this.emitMove(dir.dx, dir.dy)
      })
    })

    const cx = startX + btnSize + gap
    const cy = startY + btnSize + gap
    graphics.fillStyle(0x3a3a4a, 1)
    graphics.fillRoundedRect(cx, cy, btnSize, btnSize, 6)
  }

  private createABButtons(centerX: number, centerY: number) {
    const radius = 30

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
      this.emitAction('inventory')
    })
    btnB.on('pointerup', () => btnB.setFillStyle(0x5a5a7a))
    btnB.on('pointerout', () => btnB.setFillStyle(0x5a5a7a))
  }

  private createLRButtons(y: number) {
    const graphics = this.add.graphics()
    const btnWidth = 70
    const btnHeight = 26

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
    const dungeonScene = this.scene.get('DungeonScene')
    dungeonScene.events.emit('playerMove', dx, dy)
  }

  private emitAction(action: string) {
    const dungeonScene = this.scene.get('DungeonScene')
    dungeonScene.events.emit('playerAction', action)
  }
}
