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

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createStatusBar()
    this.createMessageLog()

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
}
