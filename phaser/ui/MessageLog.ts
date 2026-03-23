import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 2,
}

export class MessageLog {
  private messageTexts: Phaser.GameObjects.Text[] = []
  private messages: string[] = []
  private maxVisibleMessages = 2

  constructor(scene: Phaser.Scene) {
    const panelY = 413
    const panelH = 44
    const bg = scene.add.graphics()
    bg.fillStyle(UI_COLOR.panelBg, 0.9)
    bg.fillRoundedRect(8, panelY, 464, panelH, 4)
    bg.lineStyle(2, UI_COLOR.panelBorder, 1)
    bg.strokeRoundedRect(8, panelY, 464, panelH, 4)

    for (let i = 0; i < this.maxVisibleMessages; i++) {
      const text = scene.add.text(20, panelY + 4 + i * 16, '', {
        ...BASE_STYLE,
        fontSize: '14px',
      })
      this.messageTexts.push(text)
    }
  }

  addMessage(message: string) {
    this.messages.push(message)
    if (this.messages.length > this.maxVisibleMessages) {
      this.messages.shift()
    }
    this.updateDisplay()
  }

  private updateDisplay() {
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
}
