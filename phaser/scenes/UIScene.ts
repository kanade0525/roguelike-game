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

  // 仮想方向パッド
  private dpadGraphics!: Phaser.GameObjects.Graphics
  private dpadButtons: Phaser.GameObjects.Arc[] = []

  // アクションボタン
  private menuButton!: Phaser.GameObjects.Container
  private waitButton!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createStatusBar()
    this.createMessageLog()
    this.createDPad()
    this.createActionButtons()

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
    this.floorText = this.add.text(20, 16, '1F', {
      ...textStyle,
      color: '#ffcc00',
    })

    // レベル表示
    this.levelText = this.add.text(80, 16, 'Lv: 1', textStyle)

    // HP表示
    this.hpText = this.add.text(180, 16, 'HP: 100/100', {
      ...textStyle,
      color: '#66ff66',
    })

    // 満腹度表示
    this.satiationText = this.add.text(340, 16, '腹: 100', {
      ...textStyle,
      color: '#ffaa66',
    })
  }

  private createMessageLog() {
    // メッセージログ背景
    this.messageBg = this.add.graphics()
    this.messageBg.fillStyle(0x1a1a2e, 0.85)
    this.messageBg.fillRoundedRect(8, 620, 464, 92, 4)
    this.messageBg.lineStyle(2, 0x3a3a5e, 1)
    this.messageBg.strokeRoundedRect(8, 620, 464, 92, 4)

    // メッセージテキスト（4行分）
    for (let i = 0; i < this.maxVisibleMessages; i++) {
      const text = this.add.text(16, 628 + i * 20, '', {
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
    // HPが低いと赤く
    if (current / max < 0.3) {
      this.hpText.setColor('#ff4444')
    } else if (current / max < 0.6) {
      this.hpText.setColor('#ffaa44')
    } else {
      this.hpText.setColor('#66ff66')
    }
  }

  updateFloor(floor: number) {
    this.floorText.setText(`${floor}F`)
  }

  updateLevel(level: number) {
    this.levelText.setText(`Lv: ${level}`)
  }

  updateSatiation(current: number, max: number) {
    this.satiationText.setText(`腹: ${current}`)
    // 満腹度が低いと赤く
    if (current / max < 0.2) {
      this.satiationText.setColor('#ff4444')
    } else if (current / max < 0.5) {
      this.satiationText.setColor('#ffaa44')
    } else {
      this.satiationText.setColor('#ffaa66')
    }
  }

  private createDPad() {
    const centerX = 100
    const centerY = 520
    const buttonRadius = 28
    const distance = 45

    this.dpadGraphics = this.add.graphics()

    // D-Pad背景（円形）
    this.dpadGraphics.fillStyle(0x1a1a2e, 0.8)
    this.dpadGraphics.fillCircle(centerX, centerY, 80)
    this.dpadGraphics.lineStyle(2, 0x3a3a5e, 1)
    this.dpadGraphics.strokeCircle(centerX, centerY, 80)

    // 方向ボタンの定義（8方向）
    const directions = [
      { dx: 0, dy: -1, x: centerX, y: centerY - distance, label: '▲' }, // 上
      { dx: 0, dy: 1, x: centerX, y: centerY + distance, label: '▼' }, // 下
      { dx: -1, dy: 0, x: centerX - distance, y: centerY, label: '◀' }, // 左
      { dx: 1, dy: 0, x: centerX + distance, y: centerY, label: '▶' }, // 右
      { dx: -1, dy: -1, x: centerX - distance * 0.7, y: centerY - distance * 0.7, label: '◤' }, // 左上
      { dx: 1, dy: -1, x: centerX + distance * 0.7, y: centerY - distance * 0.7, label: '◥' }, // 右上
      { dx: -1, dy: 1, x: centerX - distance * 0.7, y: centerY + distance * 0.7, label: '◣' }, // 左下
      { dx: 1, dy: 1, x: centerX + distance * 0.7, y: centerY + distance * 0.7, label: '◢' }, // 右下
    ]

    directions.forEach((dir, index) => {
      // 斜め方向は小さめ
      const radius = index < 4 ? buttonRadius : buttonRadius * 0.7

      const button = this.add.circle(dir.x, dir.y, radius, 0x3a5a7a, 0.9)
      button.setStrokeStyle(2, 0x5a8aaa)
      button.setInteractive({ useHandCursor: true })

      // ボタンラベル
      const labelSize = index < 4 ? '18px' : '12px'
      this.add
        .text(dir.x, dir.y, dir.label, {
          fontSize: labelSize,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        })
        .setOrigin(0.5)

      // タッチイベント
      button.on('pointerdown', () => {
        button.setFillStyle(0x5a8aaa, 1)
        this.emitMove(dir.dx, dir.dy)
      })

      button.on('pointerup', () => {
        button.setFillStyle(0x3a5a7a, 0.9)
      })

      button.on('pointerout', () => {
        button.setFillStyle(0x3a5a7a, 0.9)
      })

      this.dpadButtons.push(button)
    })
  }

  private createActionButtons() {
    const buttonY = 520

    // メニューボタン
    this.menuButton = this.createButton(320, buttonY, 'メニュー', () => {
      this.emitAction('menu')
    })

    // 待機ボタン
    this.waitButton = this.createButton(410, buttonY, '待機', () => {
      this.emitAction('wait')
    })
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    // ボタン背景
    const bg = this.add.graphics()
    bg.fillStyle(0x3a5a7a, 0.9)
    bg.fillRoundedRect(-40, -25, 80, 50, 8)
    bg.lineStyle(2, 0x5a8aaa, 1)
    bg.strokeRoundedRect(-40, -25, 80, 50, 8)

    // ボタンテキスト
    const text = this.add
      .text(0, 0, label, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    container.add([bg, text])

    // インタラクティブ領域
    const hitArea = this.add.rectangle(0, 0, 80, 50, 0x000000, 0)
    hitArea.setInteractive({ useHandCursor: true })
    container.add(hitArea)

    hitArea.on('pointerdown', () => {
      bg.clear()
      bg.fillStyle(0x5a8aaa, 1)
      bg.fillRoundedRect(-40, -25, 80, 50, 8)
      bg.lineStyle(2, 0x7abacc, 1)
      bg.strokeRoundedRect(-40, -25, 80, 50, 8)
      callback()
    })

    hitArea.on('pointerup', () => {
      bg.clear()
      bg.fillStyle(0x3a5a7a, 0.9)
      bg.fillRoundedRect(-40, -25, 80, 50, 8)
      bg.lineStyle(2, 0x5a8aaa, 1)
      bg.strokeRoundedRect(-40, -25, 80, 50, 8)
    })

    hitArea.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(0x3a5a7a, 0.9)
      bg.fillRoundedRect(-40, -25, 80, 50, 8)
      bg.lineStyle(2, 0x5a8aaa, 1)
      bg.strokeRoundedRect(-40, -25, 80, 50, 8)
    })

    return container
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
