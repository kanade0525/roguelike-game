import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 2,
}

export class ConfirmDialog {
  private container: Phaser.GameObjects.Container
  private visible = false
  private onYes?: () => void
  private cursorIndex = 0 // 0=はい, 1=いいえ
  private cursor: Phaser.GameObjects.Text
  private msgText: Phaser.GameObjects.Text
  private readonly yesX = 180
  private readonly noX = 300
  private readonly btnY = 270

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(600)

    // 半透明背景
    const overlay = scene.add.rectangle(240, 384, 480, 768, 0x000000, 0.6)
    this.container.add(overlay)

    // パネル背景
    const panel = scene.add.graphics()
    panel.fillStyle(UI_COLOR.panelBg, 0.95)
    panel.fillRoundedRect(80, 180, 320, 120, 8)
    panel.lineStyle(2, UI_COLOR.panelBorder, 1)
    panel.strokeRoundedRect(80, 180, 320, 120, 8)
    this.container.add(panel)

    // メッセージテキスト
    this.msgText = scene.add.text(240, 210, '', {
      ...BASE_STYLE,
      fontSize: '14px',
    })
    this.msgText.setOrigin(0.5, 0)
    this.container.add(this.msgText)

    // 「はい」ボタン
    const yesBg = scene.add.rectangle(this.yesX, this.btnY, 80, 30, UI_COLOR.buttonHighlight)
    yesBg.setStrokeStyle(1, UI_COLOR.buttonHighlightBorder)
    yesBg.setInteractive({ useHandCursor: true })
    this.container.add(yesBg)

    const yesText = scene.add.text(this.yesX, this.btnY, 'はい', {
      ...BASE_STYLE,
      fontSize: '14px',
    })
    yesText.setOrigin(0.5, 0.5)
    this.container.add(yesText)

    yesBg.on('pointerdown', () => {
      const callback = this.onYes
      this.hide()
      if (callback) callback()
    })

    // 「いいえ」ボタン
    const noBg = scene.add.rectangle(this.noX, this.btnY, 80, 30, UI_COLOR.buttonHighlight)
    noBg.setStrokeStyle(1, UI_COLOR.buttonHighlightBorder)
    noBg.setInteractive({ useHandCursor: true })
    this.container.add(noBg)

    const noText = scene.add.text(this.noX, this.btnY, 'いいえ', {
      ...BASE_STYLE,
      fontSize: '14px',
    })
    noText.setOrigin(0.5, 0.5)
    this.container.add(noText)

    noBg.on('pointerdown', () => {
      this.hide()
    })

    // カーソル
    this.cursor = scene.add.text(0, 0, '▶', {
      ...BASE_STYLE,
      fontSize: '14px',
      color: TEXT_COLOR.white,
    })
    this.container.add(this.cursor)
  }

  show(message: string, onYes: () => void) {
    this.onYes = onYes
    this.msgText.setText(message)
    this.cursorIndex = 0
    this.updateCursor()
    this.visible = true
    this.container.setVisible(true)
  }

  hide() {
    this.visible = false
    this.container.setVisible(false)
    this.onYes = undefined
  }

  isOpen(): boolean {
    return this.visible
  }

  moveCursor(dx: number) {
    if (!this.visible) return
    this.cursorIndex = dx < 0 ? 0 : dx > 0 ? 1 : this.cursorIndex
    this.updateCursor()
  }

  select() {
    if (!this.visible) return
    const callback = this.onYes
    this.hide()
    if (this.cursorIndex === 0 && callback) {
      callback()
    }
  }

  private updateCursor() {
    const x = this.cursorIndex === 0 ? this.yesX : this.noX
    this.cursor.setPosition(x - 35, this.btnY - 8)
  }
}
