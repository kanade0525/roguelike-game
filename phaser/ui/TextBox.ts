import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

// 1行分の会話（話者名＋本文）
export interface DialogLine {
  speaker?: string
  text: string
}

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"DotGothic16", monospace',
  color: TEXT_COLOR.white,
  letterSpacing: 1,
}

// ボックス寸法（画面下部。コントローラー上端 y466 より上に収める）
const BOX_X = 8
const BOX_Y = 376
const BOX_W = 464
const BOX_H = 86

/**
 * 画面下部の唯一のテキストボックス。
 * 通常のメッセージログ（アイテム取得・戦闘など）と、会話（話者名＋逐次送り）を
 * 同一の枠で表示する。別々のボックスを出し分けず「1つの枠」に統一するための実体。
 *
 * - message モード: 直近メッセージを最大3行表示
 * - dialog モード: 話者名＋本文を1行ずつ送る（A/タップで次へ、最後で onDone）
 */
export class TextBox {
  private container: Phaser.GameObjects.Container
  private speakerText: Phaser.GameObjects.Text
  private bodyText: Phaser.GameObjects.Text
  private advanceHint: Phaser.GameObjects.Text
  private messageTexts: Phaser.GameObjects.Text[] = []

  private mode: 'message' | 'dialog' = 'message'
  private readonly maxMessages = 3
  private messages: string[] = []

  private lines: DialogLine[] = []
  private index = 0
  private onDone: (() => void) | null = null

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setDepth(100)

    const panel = scene.add.graphics()
    panel.fillStyle(UI_COLOR.panelBg, 0.9)
    panel.fillRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 6)
    panel.lineStyle(2, UI_COLOR.panelBorder, 1)
    panel.strokeRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 6)
    this.container.add(panel)

    // --- message モード用（最大3行） ---
    for (let i = 0; i < this.maxMessages; i++) {
      const t = scene.add.text(BOX_X + 12, BOX_Y + 6 + i * 20, '', {
        ...BASE_STYLE,
        fontSize: '14px',
        letterSpacing: 2,
      })
      this.messageTexts.push(t)
      this.container.add(t)
    }

    // --- dialog モード用（話者名＋本文＋送りヒント） ---
    this.speakerText = scene.add.text(BOX_X + 16, BOX_Y + 6, '', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.subtle,
      fontStyle: 'bold',
    })
    this.container.add(this.speakerText)

    this.bodyText = scene.add.text(BOX_X + 16, BOX_Y + 26, '', {
      ...BASE_STYLE,
      fontSize: '13px',
      lineSpacing: 4,
      // 日本語は空白が無く既定の wordWrap では折り返されないため、文字単位で折り返す
      wordWrap: { width: BOX_W - 32, useAdvancedWrap: true },
    })
    this.container.add(this.bodyText)

    this.advanceHint = scene.add.text(BOX_X + BOX_W - 12, BOX_Y + BOX_H - 6, '', {
      ...BASE_STYLE,
      fontSize: '12px',
      color: TEXT_COLOR.dim,
    })
    this.advanceHint.setOrigin(1, 1)
    this.container.add(this.advanceHint)

    this.setDialogPartsVisible(false)
  }

  // --- メッセージ ---

  addMessage(message: string) {
    this.messages.push(message)
    if (this.messages.length > this.maxMessages) this.messages.shift()
    if (this.mode === 'message') this.renderMessages()
  }

  // --- 会話 ---

  showDialog(lines: DialogLine[], onDone?: () => void) {
    if (lines.length === 0) return
    this.lines = lines
    this.index = 0
    this.onDone = onDone ?? null
    this.mode = 'dialog'
    this.setMessagesVisible(false)
    this.setDialogPartsVisible(true)
    this.renderDialog()
  }

  // 次の行へ。最後だった場合は message モードに戻して onDone を呼ぶ。
  advance() {
    if (this.mode !== 'dialog') return
    if (this.index < this.lines.length - 1) {
      this.index++
      this.renderDialog()
    } else {
      this.endDialog()
    }
  }

  isDialogOpen(): boolean {
    return this.mode === 'dialog'
  }

  private endDialog() {
    this.mode = 'message'
    this.setDialogPartsVisible(false)
    this.setMessagesVisible(true)
    this.renderMessages()
    const cb = this.onDone
    this.onDone = null
    cb?.()
  }

  // オープニング上映中などボックスごと隠したいとき
  setVisible(visible: boolean) {
    this.container.setVisible(visible)
  }

  private renderMessages() {
    for (let i = 0; i < this.maxMessages; i++) {
      const msg = this.messages[i]
      const t = this.messageTexts[i]
      if (msg) {
        t.setText(msg)
        // 古いものほど薄く
        t.setAlpha(0.55 + (i / this.maxMessages) * 0.45)
      } else {
        t.setText('')
      }
    }
  }

  private renderDialog() {
    const line = this.lines[this.index]
    this.speakerText.setText(line.speaker ?? '')
    this.bodyText.setText(line.text)
    const isLast = this.index >= this.lines.length - 1
    this.advanceHint.setText(isLast ? '□' : '▼')
  }

  private setMessagesVisible(visible: boolean) {
    this.messageTexts.forEach((t) => t.setVisible(visible))
  }

  private setDialogPartsVisible(visible: boolean) {
    this.speakerText.setVisible(visible)
    this.bodyText.setVisible(visible)
    this.advanceHint.setVisible(visible)
  }
}
