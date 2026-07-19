import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '14px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 1,
}

// 1行分の会話（話者名＋本文）
export interface DialogLine {
  speaker?: string
  text: string
}

/**
 * 会話ボックス（画面下部）。話者名＋本文を1つずつ逐次送りする。
 * A/決定 or タップで次へ、最後まで進むと閉じて onDone を呼ぶ。
 * ConfirmDialog / ListMenuOverlay と同じパネル様式・入力様式（isOpen/決定/閉じる）に揃える。
 */
export class DialogOverlay {
  private container: Phaser.GameObjects.Container
  private visible = false
  private speakerText: Phaser.GameObjects.Text
  private bodyText: Phaser.GameObjects.Text
  private nextHint: Phaser.GameObjects.Text

  private lines: DialogLine[] = []
  private index = 0
  private onDone: (() => void) | null = null

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(620)

    // 下部の会話パネル（メッセージログ域より少し上・ゲームエリア下寄せ）
    const panel = scene.add.graphics()
    panel.fillStyle(UI_COLOR.panelBg, 0.96)
    panel.fillRoundedRect(16, 300, 448, 104, 8)
    panel.lineStyle(2, UI_COLOR.panelBorder, 1)
    panel.strokeRoundedRect(16, 300, 448, 104, 8)
    this.container.add(panel)

    // 話者名（上部の小さなラベル）
    this.speakerText = scene.add.text(32, 312, '', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.subtle,
      fontStyle: 'bold',
    })
    this.container.add(this.speakerText)

    // 本文（折り返し）
    this.bodyText = scene.add.text(32, 336, '', {
      ...BASE_STYLE,
      fontSize: '14px',
      wordWrap: { width: 416 },
    })
    this.container.add(this.bodyText)

    // 送りヒント
    this.nextHint = scene.add.text(452, 388, '▼', {
      ...BASE_STYLE,
      fontSize: '12px',
      color: TEXT_COLOR.dim,
    })
    this.nextHint.setOrigin(1, 1)
    this.container.add(this.nextHint)
  }

  show(lines: DialogLine[], onDone?: () => void) {
    if (lines.length === 0) return
    this.lines = lines
    this.index = 0
    this.onDone = onDone ?? null
    this.visible = true
    this.render()
    this.container.setVisible(true)
  }

  // 次の行へ。最後だった場合は閉じて onDone を呼ぶ。
  advance() {
    if (!this.visible) return
    if (this.index < this.lines.length - 1) {
      this.index++
      this.render()
    } else {
      this.hide()
      const cb = this.onDone
      this.onDone = null
      cb?.()
    }
  }

  hide() {
    this.visible = false
    this.container.setVisible(false)
  }

  isOpen(): boolean {
    return this.visible
  }

  private render() {
    const line = this.lines[this.index]
    this.speakerText.setText(line.speaker ?? '')
    this.bodyText.setText(line.text)
    const isLast = this.index >= this.lines.length - 1
    this.nextHint.setText(isLast ? '□' : '▼')
  }
}
