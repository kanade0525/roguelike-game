import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '14px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 1,
}

export interface ListRow {
  label: string
  right?: string
  disabled?: boolean
}

/**
 * 汎用リストメニュー（鍛冶屋・ダンジョン選択などの拠点施設UIに使用）。
 * InventoryOverlay と同じ見た目・入力様式（カーソル + A決定 + B閉じる）で、
 * 拠点でもダンジョンと一貫したUIを提供する。
 */
export class ListMenuOverlay {
  private container: Phaser.GameObjects.Container
  private visible = false
  private cursorIndex = 0
  private titleText: Phaser.GameObjects.Text
  private subtitleText: Phaser.GameObjects.Text
  private cursor: Phaser.GameObjects.Text
  private labelTexts: Phaser.GameObjects.Text[] = []
  private rightTexts: Phaser.GameObjects.Text[] = []
  private emptyText: Phaser.GameObjects.Text
  private scrollIndicator!: Phaser.GameObjects.Text
  private scrollOffset = 0 // 表示先頭の行 index（maxRows を超える分をスクロール）
  private readonly maxRows = 7
  private readonly rowStartY = 108
  private readonly rowHeight = 30
  private readonly rowStartX = 60

  private rows: ListRow[] = []
  private onSelect: (index: number) => void = () => {}

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(560)

    // 下部テキストボックス(y376~462)も含めコントローラー上端まで覆う
    const overlay = scene.add.rectangle(240, 258, 480, 416, 0x000000, 0.75)
    this.container.add(overlay)

    const panel = scene.add.graphics()
    panel.fillStyle(UI_COLOR.panelBg, 0.95)
    panel.fillRoundedRect(24, 52, 432, 350, 8)
    panel.lineStyle(2, UI_COLOR.panelBorder, 1)
    panel.strokeRoundedRect(24, 52, 432, 350, 8)
    this.container.add(panel)

    this.titleText = scene.add.text(240, 70, '', {
      ...BASE_STYLE,
      fontSize: '18px',
      fontStyle: 'bold',
    })
    this.titleText.setOrigin(0.5, 0.5)
    this.container.add(this.titleText)

    this.subtitleText = scene.add.text(432, 70, '', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.subtle,
    })
    this.subtitleText.setOrigin(1, 0.5)
    this.container.add(this.subtitleText)

    for (let i = 0; i < this.maxRows; i++) {
      const y = this.rowStartY + i * this.rowHeight
      const label = scene.add.text(this.rowStartX, y, '', BASE_STYLE)
      label.setOrigin(0, 0.5)
      this.container.add(label)
      this.labelTexts.push(label)
      const right = scene.add.text(420, y, '', { ...BASE_STYLE, fontSize: '13px' })
      right.setOrigin(1, 0.5)
      this.container.add(right)
      this.rightTexts.push(right)
    }

    this.emptyText = scene.add.text(240, 200, '', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.muted,
    })
    this.emptyText.setOrigin(0.5, 0.5)
    this.emptyText.setVisible(false)
    this.container.add(this.emptyText)

    // iOS で絵文字(▶︎)になるのを防ぐため異体字セレクタ(U+FE0E)でテキスト表示を強制
    this.cursor = scene.add.text(0, 0, '▶︎', { ...BASE_STYLE, fontSize: '13px' })
    this.cursor.setOrigin(0.5, 0.5)
    this.container.add(this.cursor)

    const hint = scene.add.text(240, 380, 'A:決定  B:閉じる', {
      ...BASE_STYLE,
      fontSize: '11px',
      color: TEXT_COLOR.dim,
    })
    hint.setOrigin(0.5, 0.5)
    this.container.add(hint)

    // スクロール可能を示すインジケータ（▲/▼）
    this.scrollIndicator = scene.add.text(438, 380, '', {
      ...BASE_STYLE,
      fontSize: '12px',
      color: TEXT_COLOR.subtle,
    })
    this.scrollIndicator.setOrigin(1, 0.5)
    this.container.add(this.scrollIndicator)
  }

  show(title: string, subtitle: string, rows: ListRow[], onSelect: (index: number) => void) {
    this.titleText.setText(title)
    this.rows = rows
    this.onSelect = onSelect
    this.cursorIndex = 0
    this.scrollOffset = 0
    this.visible = true
    this.refresh(rows, subtitle)
    this.container.setVisible(true)
  }

  refresh(rows?: ListRow[], subtitle?: string) {
    if (rows) this.rows = rows
    if (subtitle !== undefined) this.subtitleText.setText(subtitle)
    const hasRows = this.rows.length > 0
    this.emptyText.setText(hasRows ? '' : '該当なし')
    this.emptyText.setVisible(!hasRows)

    if (hasRows) {
      this.cursorIndex = Math.min(this.cursorIndex, this.rows.length - 1)
      this.clampScroll()
    } else {
      this.scrollOffset = 0
    }
    this.renderVisibleRows()

    if (hasRows) this.updateCursor()
    else this.cursor.setVisible(false)
  }

  // スクロール位置を、カーソルが表示範囲に入るよう調整する
  private clampScroll() {
    const len = this.rows.length
    const maxScroll = Math.max(0, len - this.maxRows)
    if (this.cursorIndex < this.scrollOffset) this.scrollOffset = this.cursorIndex
    else if (this.cursorIndex >= this.scrollOffset + this.maxRows) {
      this.scrollOffset = this.cursorIndex - this.maxRows + 1
    }
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll))
  }

  // 表示範囲（scrollOffset から maxRows 件）だけ描画する
  private renderVisibleRows() {
    for (let i = 0; i < this.maxRows; i++) {
      const row = this.rows[this.scrollOffset + i]
      const label = this.labelTexts[i]
      const right = this.rightTexts[i]
      if (!row) {
        label.setText('')
        right.setText('')
        continue
      }
      label.setText(row.label)
      label.setColor(row.disabled ? TEXT_COLOR.dim : TEXT_COLOR.white)
      right.setText(row.right ?? '')
      right.setColor(row.disabled ? TEXT_COLOR.dim : TEXT_COLOR.subtle)
    }
    const up = this.scrollOffset > 0
    const down = this.scrollOffset + this.maxRows < this.rows.length
    this.scrollIndicator.setText(`${up ? '▲' : ''}${down ? '▼' : ''}`)
  }

  hide() {
    this.visible = false
    this.container.setVisible(false)
  }

  isOpen(): boolean {
    return this.visible
  }

  moveCursor(dy: number) {
    if (!this.visible || this.rows.length === 0 || dy === 0) return
    const len = this.rows.length
    this.cursorIndex = (this.cursorIndex + dy + len) % len
    this.clampScroll()
    this.renderVisibleRows()
    this.updateCursor()
  }

  getSelectedIndex(): number {
    return this.cursorIndex
  }

  select() {
    if (!this.visible) return
    const row = this.rows[this.cursorIndex]
    if (!row || row.disabled) return
    this.onSelect(this.cursorIndex)
  }

  private updateCursor() {
    if (this.rows.length === 0) {
      this.cursor.setVisible(false)
      return
    }
    this.cursor.setVisible(true)
    const screenRow = this.cursorIndex - this.scrollOffset
    const y = this.rowStartY + screenRow * this.rowHeight
    this.cursor.setPosition(this.rowStartX - 20, y)
  }
}
