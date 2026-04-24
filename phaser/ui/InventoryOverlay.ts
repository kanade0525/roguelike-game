import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'
import { ITEMS } from '../../game/data/items'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '14px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 1,
}

interface InventoryEntry {
  itemId: string
  name: string
  equipped?: boolean
}

export class InventoryOverlay {
  private container: Phaser.GameObjects.Container
  private visible = false
  private cursorIndex = 0
  private cursor: Phaser.GameObjects.Text
  private rowTexts: Phaser.GameObjects.Text[] = []
  private descText: Phaser.GameObjects.Text
  private emptyText: Phaser.GameObjects.Text
  private readonly maxRows = 8
  private readonly rowStartY = 96
  private readonly rowHeight = 26
  private readonly rowStartX = 48

  // 最新のインベントリ（スナップショット）
  private entries: InventoryEntry[] = []

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(550)

    // 半透明背景
    const overlay = scene.add.rectangle(240, 255, 480, 510, 0x000000, 0.75)
    this.container.add(overlay)

    // パネル
    const panel = scene.add.graphics()
    panel.fillStyle(UI_COLOR.panelBg, 0.95)
    panel.fillRoundedRect(24, 56, 432, 380, 8)
    panel.lineStyle(2, UI_COLOR.panelBorder, 1)
    panel.strokeRoundedRect(24, 56, 432, 380, 8)
    this.container.add(panel)

    // タイトル
    const title = scene.add.text(240, 72, 'どうぐ', {
      ...BASE_STYLE,
      fontSize: '18px',
      fontStyle: 'bold',
    })
    title.setOrigin(0.5, 0.5)
    this.container.add(title)

    // アイテム行（空で事前配置、描画時に差し替え）
    for (let i = 0; i < this.maxRows; i++) {
      const y = this.rowStartY + i * this.rowHeight
      const t = scene.add.text(this.rowStartX, y, '', BASE_STYLE)
      this.container.add(t)
      this.rowTexts.push(t)
    }

    // 空メッセージ
    this.emptyText = scene.add.text(240, 180, '持ち物は空です', {
      ...BASE_STYLE,
      fontSize: '14px',
      color: TEXT_COLOR.muted,
    })
    this.emptyText.setOrigin(0.5, 0.5)
    this.emptyText.setVisible(false)
    this.container.add(this.emptyText)

    // 説明欄
    const descBg = scene.add.graphics()
    descBg.fillStyle(UI_COLOR.panelBg, 0.95)
    descBg.fillRoundedRect(40, 336, 400, 52, 6)
    descBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    descBg.strokeRoundedRect(40, 336, 400, 52, 6)
    this.container.add(descBg)

    this.descText = scene.add.text(52, 348, '', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.subtle,
      wordWrap: { width: 380 },
    })
    this.container.add(this.descText)

    // カーソル
    this.cursor = scene.add.text(0, 0, '▶', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.white,
    })
    this.container.add(this.cursor)

    // 操作ヒント
    const hint = scene.add.text(240, 408, 'A:使う/装備  L:捨てる  B:閉じる', {
      ...BASE_STYLE,
      fontSize: '11px',
      color: TEXT_COLOR.dim,
    })
    hint.setOrigin(0.5, 0.5)
    this.container.add(hint)
  }

  show(inventory: InventoryEntry[]) {
    this.entries = inventory
    this.cursorIndex = Math.min(this.cursorIndex, Math.max(0, inventory.length - 1))
    this.visible = true
    this.refresh()
    this.container.setVisible(true)
  }

  hide() {
    this.visible = false
    this.container.setVisible(false)
  }

  isOpen(): boolean {
    return this.visible
  }

  refresh(inventory?: InventoryEntry[]) {
    if (inventory) this.entries = inventory
    const items = this.entries
    const hasItems = items.length > 0
    this.emptyText.setVisible(!hasItems)

    for (let i = 0; i < this.maxRows; i++) {
      const entry = items[i]
      const t = this.rowTexts[i]
      if (!entry) {
        t.setText('')
        continue
      }
      const equippedMark = entry.equipped ? 'E ' : '  '
      t.setText(`${equippedMark}${entry.name}`)
    }

    if (hasItems) {
      this.cursorIndex = Math.min(this.cursorIndex, items.length - 1)
      this.updateCursor()
      this.updateDescription()
    } else {
      this.cursor.setVisible(false)
      this.descText.setText('')
    }
  }

  moveCursor(_dx: number, dy: number) {
    if (!this.visible || this.entries.length === 0) return
    const len = this.entries.length
    this.cursorIndex = (this.cursorIndex + dy + len) % len
    this.updateCursor()
    this.updateDescription()
  }

  getSelectedIndex(): number {
    return this.cursorIndex
  }

  getSelectedEntry(): InventoryEntry | null {
    return this.entries[this.cursorIndex] ?? null
  }

  private updateCursor() {
    if (this.entries.length === 0) {
      this.cursor.setVisible(false)
      return
    }
    this.cursor.setVisible(true)
    const y = this.rowStartY + this.cursorIndex * this.rowHeight
    this.cursor.setPosition(this.rowStartX - 18, y)
  }

  private updateDescription() {
    const entry = this.entries[this.cursorIndex]
    if (!entry) {
      this.descText.setText('')
      return
    }
    const def = ITEMS[entry.itemId]
    if (!def) {
      this.descText.setText(entry.name)
      return
    }
    this.descText.setText(`${def.name}：${def.description}`)
  }
}
