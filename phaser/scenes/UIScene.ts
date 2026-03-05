import Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 2,
}

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
  private menuStatTexts: Phaser.GameObjects.Text[] = []
  private menuCursor!: Phaser.GameObjects.Text
  private menuCursorIndex = 0
  private menuItemPositions: { x: number; y: number }[] = []
  private menuItemLabels: string[] = []

  // 確認ダイアログ
  private confirmDialog!: Phaser.GameObjects.Container
  private confirmVisible = false
  private onConfirmYes?: () => void

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createStatusBar()
    this.createMessageLog()
    this.createController()
    this.createMenuOverlay()
    this.createConfirmDialog()

    // 初期メッセージ
    this.addMessage('ダンジョンに足を踏み入れた！')
  }

  private createStatusBar() {
    const bg = this.add.graphics()
    bg.fillStyle(UI_COLOR.panelBg, 0.9)
    bg.fillRoundedRect(8, 8, 464, 36, 4)
    bg.lineStyle(2, UI_COLOR.panelBorder, 1)
    bg.strokeRoundedRect(8, 8, 464, 36, 4)

    const statusStyle = { ...BASE_STYLE, fontStyle: 'bold' }

    this.floorText = this.add.text(20, 16, '1F', statusStyle)
    this.levelText = this.add.text(80, 16, 'Lv: 1', statusStyle)
    this.hpText = this.add.text(180, 16, 'HP: 100/100', statusStyle)
    this.satiationText = this.add.text(340, 16, '腹: 100', statusStyle)
  }

  private createMessageLog() {
    const bg = this.add.graphics()
    bg.fillStyle(UI_COLOR.panelBg, 0.9)
    bg.fillRoundedRect(8, 430, 464, 50, 4)
    bg.lineStyle(2, UI_COLOR.panelBorder, 1)
    bg.strokeRoundedRect(8, 430, 464, 50, 4)

    for (let i = 0; i < this.maxVisibleMessages; i++) {
      const text = this.add.text(16, 438 + i * 20, '', {
        ...BASE_STYLE,
        fontSize: '14px',
      })
      this.messageTexts.push(text)
    }
  }

  private createMenuOverlay() {
    this.menuOverlay = this.add.container(0, 0)
    this.menuOverlay.setVisible(false)
    this.menuOverlay.setDepth(500)

    // 半透明背景
    const overlay = this.add.rectangle(240, 384, 480, 768, 0x000000, 0.6)
    this.menuOverlay.add(overlay)

    // 左上: メニューボタン（道具/マップ/足元/作戦）
    const menuBg = this.add.graphics()
    menuBg.fillStyle(UI_COLOR.panelBg, 0.95)
    menuBg.fillRoundedRect(16, 60, 130, 60, 6)
    menuBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    menuBg.strokeRoundedRect(16, 60, 130, 60, 6)
    this.menuOverlay.add(menuBg)

    const menuLabels = [
      { text: '道具', col: 0, row: 0 },
      { text: 'マップ', col: 1, row: 0 },
      { text: '足元', col: 0, row: 1 },
      { text: '作戦', col: 1, row: 1 },
    ]

    const menuStyle = { ...BASE_STYLE, color: TEXT_COLOR.muted }

    this.menuItemPositions = []
    this.menuItemLabels = []
    menuLabels.forEach((label) => {
      const x = 28 + label.col * 62
      const y = 70 + label.row * 24
      const t = this.add.text(x, y, label.text, menuStyle)
      this.menuOverlay.add(t)
      this.menuItemPositions.push({ x, y })
      this.menuItemLabels.push(label.text)
    })

    // カーソル（▶）
    this.menuCursor = this.add.text(0, 0, '▶', {
      ...BASE_STYLE,
      fontSize: '14px',
      color: TEXT_COLOR.white,
    })
    this.menuOverlay.add(this.menuCursor)

    // 右上: ダンジョン名
    const nameBg = this.add.graphics()
    nameBg.fillStyle(UI_COLOR.panelBg, 0.95)
    nameBg.fillRoundedRect(300, 60, 164, 30, 6)
    nameBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    nameBg.strokeRoundedRect(300, 60, 164, 30, 6)
    this.menuOverlay.add(nameBg)

    const nameText = this.add.text(382, 75, '不思議のダンジョン', {
      ...BASE_STYLE,
      fontStyle: 'bold',
    })
    nameText.setOrigin(0.5, 0.5)
    this.menuOverlay.add(nameText)

    // 下部: 詳細ステータス
    const statBg = this.add.graphics()
    statBg.fillStyle(UI_COLOR.panelBg, 0.95)
    statBg.fillRoundedRect(16, 340, 448, 70, 6)
    statBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    statBg.strokeRoundedRect(16, 340, 448, 70, 6)
    this.menuOverlay.add(statBg)

    const statStyle = { ...BASE_STYLE }

    this.menuStatTexts = []
    for (let i = 0; i < 3; i++) {
      const t = this.add.text(28, 350 + i * 20, '', statStyle)
      this.menuOverlay.add(t)
      this.menuStatTexts.push(t)
    }

    // 閉じるヒント
    const hint = this.add.text(240, 420, 'B: 閉じる', {
      ...BASE_STYLE,
      fontSize: '12px',
      color: TEXT_COLOR.dim,
    })
    hint.setOrigin(0.5, 0.5)
    this.menuOverlay.add(hint)
  }

  private createConfirmDialog() {
    this.confirmDialog = this.add.container(0, 0)
    this.confirmDialog.setVisible(false)
    this.confirmDialog.setDepth(600)

    // 半透明背景
    const overlay = this.add.rectangle(240, 384, 480, 768, 0x000000, 0.6)
    this.confirmDialog.add(overlay)

    // パネル背景
    const panel = this.add.graphics()
    panel.fillStyle(UI_COLOR.panelBg, 0.95)
    panel.fillRoundedRect(80, 180, 320, 120, 8)
    panel.lineStyle(2, UI_COLOR.panelBorder, 1)
    panel.strokeRoundedRect(80, 180, 320, 120, 8)
    this.confirmDialog.add(panel)

    // メッセージテキスト
    const msgText = this.add.text(240, 210, '', {
      ...BASE_STYLE,
      fontSize: '14px',
    })
    msgText.setOrigin(0.5, 0)
    this.confirmDialog.add(msgText)

    // 「はい」ボタン
    const yesBg = this.add.rectangle(180, 270, 80, 30, UI_COLOR.buttonHighlight)
    yesBg.setStrokeStyle(1, UI_COLOR.buttonHighlightBorder)
    yesBg.setInteractive({ useHandCursor: true })
    this.confirmDialog.add(yesBg)

    const yesText = this.add.text(180, 270, 'はい', {
      ...BASE_STYLE,
      fontSize: '14px',
    })
    yesText.setOrigin(0.5, 0.5)
    this.confirmDialog.add(yesText)

    yesBg.on('pointerdown', () => {
      this.hideConfirm()
      if (this.onConfirmYes) this.onConfirmYes()
    })

    // 「いいえ」ボタン
    const noBg = this.add.rectangle(300, 270, 80, 30, UI_COLOR.buttonHighlight)
    noBg.setStrokeStyle(1, UI_COLOR.buttonHighlightBorder)
    noBg.setInteractive({ useHandCursor: true })
    this.confirmDialog.add(noBg)

    const noText = this.add.text(300, 270, 'いいえ', {
      ...BASE_STYLE,
      fontSize: '14px',
    })
    noText.setOrigin(0.5, 0.5)
    this.confirmDialog.add(noText)

    noBg.on('pointerdown', () => {
      this.hideConfirm()
    })

    // メッセージテキストへの参照を保持
    this.confirmDialog.setData('msgText', msgText)
  }

  showConfirm(message: string, onYes: () => void) {
    this.onConfirmYes = onYes
    const msgText = this.confirmDialog.getData('msgText') as Phaser.GameObjects.Text
    msgText.setText(message)
    this.confirmVisible = true
    this.confirmDialog.setVisible(true)
  }

  hideConfirm() {
    this.confirmVisible = false
    this.confirmDialog.setVisible(false)
    this.onConfirmYes = undefined
  }

  isConfirmOpen(): boolean {
    return this.confirmVisible
  }

  toggleMenu() {
    this.menuVisible = !this.menuVisible
    if (this.menuVisible) {
      this.menuCursorIndex = 0
      this.updateMenuCursor()
      this.updateMenuStats()
    }
    this.menuOverlay.setVisible(this.menuVisible)
  }

  moveMenuCursor(dx: number, dy: number) {
    if (!this.menuVisible) return
    // 2x2 grid: index 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
    const col = this.menuCursorIndex % 2
    const row = Math.floor(this.menuCursorIndex / 2)
    const newCol = Math.max(0, Math.min(1, col + dx))
    const newRow = Math.max(0, Math.min(1, row + dy))
    this.menuCursorIndex = newRow * 2 + newCol
    this.updateMenuCursor()
  }

  selectMenuItem(): string | null {
    if (!this.menuVisible) return null
    return this.menuItemLabels[this.menuCursorIndex] ?? null
  }

  private updateMenuCursor() {
    const pos = this.menuItemPositions[this.menuCursorIndex]
    if (pos) {
      this.menuCursor.setPosition(pos.x - 14, pos.y)
    }
  }

  private updateMenuStats() {
    const store = this.game.registry.get('gameStore')
    if (!store) return
    const p = store.player
    const d = store.dungeon
    const expNeeded = p.level * 100
    this.menuStatTexts[0].setText(`名前: 冒険者    Lv: ${p.level}     HP: ${p.hp}/${p.maxHp}`)
    this.menuStatTexts[1].setText(`攻撃: ${p.attack}   防御: ${p.defense}    満腹度: ${p.satiation}/${p.maxSatiation}`)
    this.menuStatTexts[2].setText(`経験値: ${p.exp}/${expNeeded}          ${d.floor}F`)
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
    const controllerHeight = 280

    this.controllerBg = this.add.graphics()
    this.controllerBg.fillStyle(UI_COLOR.controllerBg, 1)
    this.controllerBg.fillRect(0, controllerY, screenWidth, controllerHeight)

    this.createLRButtons(controllerY + 24)
    this.createDPad(110, controllerY + 140)
    this.createABButtons(380, controllerY + 140)
    this.createSelectStartButtons(controllerY + 252)
  }

  private createDPad(centerX: number, centerY: number) {
    const btnSize = 46
    const gap = 3
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

      graphics.fillStyle(UI_COLOR.buttonBg, 1)
      graphics.fillRoundedRect(x, y, btnSize, btnSize, 6)
      graphics.lineStyle(1, UI_COLOR.buttonBorder, 1)
      graphics.strokeRoundedRect(x, y, btnSize, btnSize, 6)

      const btn = this.add.rectangle(x + btnSize / 2, y + btnSize / 2, btnSize, btnSize, 0x000000, 0)
      btn.setInteractive({ useHandCursor: true })

      this.add.text(x + btnSize / 2, y + btnSize / 2, dir.arrow, {
        fontSize: '20px',
        color: TEXT_COLOR.muted,
      }).setOrigin(0.5)

      btn.on('pointerdown', () => {
        this.emitMove(dir.dx, dir.dy)
      })
    })

    const cx = startX + btnSize + gap
    const cy = startY + btnSize + gap
    graphics.fillStyle(UI_COLOR.selectButton, 1)
    graphics.fillRoundedRect(cx, cy, btnSize, btnSize, 6)
  }

  private createABButtons(centerX: number, centerY: number) {
    const radius = 38

    const btnA = this.add.circle(centerX + 32, centerY - 30, radius, UI_COLOR.abButton)
    btnA.setStrokeStyle(2, UI_COLOR.abButtonBorder)
    btnA.setInteractive({ useHandCursor: true })
    this.add.text(centerX + 32, centerY - 30, 'A', {
      fontSize: '24px',
      color: TEXT_COLOR.light,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnA.on('pointerdown', () => {
      btnA.setFillStyle(UI_COLOR.abButtonBorder)
      this.emitAction('confirm')
    })
    btnA.on('pointerup', () => btnA.setFillStyle(UI_COLOR.abButton))
    btnA.on('pointerout', () => btnA.setFillStyle(UI_COLOR.abButton))

    const btnB = this.add.circle(centerX - 32, centerY + 30, radius, UI_COLOR.abButton)
    btnB.setStrokeStyle(2, UI_COLOR.abButtonBorder)
    btnB.setInteractive({ useHandCursor: true })
    this.add.text(centerX - 32, centerY + 30, 'B', {
      fontSize: '24px',
      color: TEXT_COLOR.light,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnB.on('pointerdown', () => {
      btnB.setFillStyle(UI_COLOR.abButtonBorder)
      this.emitAction('inventory')
    })
    btnB.on('pointerup', () => btnB.setFillStyle(UI_COLOR.abButton))
    btnB.on('pointerout', () => btnB.setFillStyle(UI_COLOR.abButton))
  }

  private createLRButtons(y: number) {
    const graphics = this.add.graphics()
    const btnWidth = 85
    const btnHeight = 32

    graphics.fillStyle(UI_COLOR.buttonBg, 1)
    graphics.fillRoundedRect(15, y - btnHeight / 2, btnWidth, btnHeight, 4)
    graphics.lineStyle(1, UI_COLOR.buttonBorder, 1)
    graphics.strokeRoundedRect(15, y - btnHeight / 2, btnWidth, btnHeight, 4)

    const btnL = this.add.rectangle(15 + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnL.setInteractive({ useHandCursor: true })
    this.add.text(15 + btnWidth / 2, y, 'L', {
      fontSize: '16px',
      color: TEXT_COLOR.subtle,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnL.on('pointerdown', () => this.emitAction('prevItem'))

    const rX = 480 - 15 - btnWidth
    graphics.fillStyle(UI_COLOR.buttonBg, 1)
    graphics.fillRoundedRect(rX, y - btnHeight / 2, btnWidth, btnHeight, 4)
    graphics.lineStyle(1, UI_COLOR.buttonBorder, 1)
    graphics.strokeRoundedRect(rX, y - btnHeight / 2, btnWidth, btnHeight, 4)

    const btnR = this.add.rectangle(rX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnR.setInteractive({ useHandCursor: true })
    this.add.text(rX + btnWidth / 2, y, 'R', {
      fontSize: '16px',
      color: TEXT_COLOR.subtle,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnR.on('pointerdown', () => this.emitAction('nextItem'))
  }

  private createSelectStartButtons(y: number) {
    const graphics = this.add.graphics()
    const btnWidth = 65
    const btnHeight = 24
    const gap = 12
    const centerX = 240

    const selectX = centerX - gap / 2 - btnWidth
    graphics.fillStyle(UI_COLOR.selectButton, 1)
    graphics.fillRoundedRect(selectX, y - btnHeight / 2, btnWidth, btnHeight, 9)

    const btnSelect = this.add.rectangle(selectX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnSelect.setInteractive({ useHandCursor: true })
    this.add.text(selectX + btnWidth / 2, y, 'SELECT', {
      fontSize: '11px',
      color: TEXT_COLOR.dim,
    }).setOrigin(0.5)

    btnSelect.on('pointerdown', () => this.emitAction('inventory'))

    const startX = centerX + gap / 2
    graphics.fillRoundedRect(startX, y - btnHeight / 2, btnWidth, btnHeight, 9)

    const btnStart = this.add.rectangle(startX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnStart.setInteractive({ useHandCursor: true })
    this.add.text(startX + btnWidth / 2, y, 'START', {
      fontSize: '11px',
      color: TEXT_COLOR.dim,
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
