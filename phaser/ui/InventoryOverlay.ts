import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'
import { ITEMS, computeEquipmentStats } from '../../game/data/items'
import gameConfig from '../../game/data/gameConfig.json'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '14px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 1,
}

export interface InventoryEntry {
  itemId: string
  name: string
  equipped?: boolean
  stack?: number
  equipmentData?: { enhanceLevel: number }
}

export class InventoryOverlay {
  private container: Phaser.GameObjects.Container
  private visible = false
  private cursorIndex = 0
  private cursor: Phaser.GameObjects.Text
  private rowTexts: Phaser.GameObjects.Text[] = []
  private descText: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text
  private emptyText: Phaser.GameObjects.Text
  private scrollIndicator!: Phaser.GameObjects.Text
  private scrollOffset = 0 // 表示先頭の行 index（maxRows を超える分をスクロール）
  private readonly maxRows = 8
  private readonly rowStartY = 90
  private readonly rowHeight = 24
  private readonly rowStartX = 48

  // 最新のインベントリ（スナップショット）
  private entries: InventoryEntry[] = []

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(550)

    // 半透明背景 (メッセージログ (y=413~457) を隠さないよう、ゲームエリアのみ覆う)
    const overlay = scene.add.rectangle(240, 230, 480, 360, 0x000000, 0.75)
    this.container.add(overlay)

    // パネル (高さ 350、メッセージログ手前で終わる)
    const panel = scene.add.graphics()
    panel.fillStyle(UI_COLOR.panelBg, 0.95)
    panel.fillRoundedRect(24, 52, 432, 350, 8)
    panel.lineStyle(2, UI_COLOR.panelBorder, 1)
    panel.strokeRoundedRect(24, 52, 432, 350, 8)
    this.container.add(panel)

    // タイトル
    const title = scene.add.text(240, 66, 'どうぐ', {
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
    descBg.fillRoundedRect(40, 300, 400, 48, 6)
    descBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    descBg.strokeRoundedRect(40, 300, 400, 48, 6)
    this.container.add(descBg)

    this.descText = scene.add.text(52, 310, '', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.subtle,
      wordWrap: { width: 380 },
    })
    this.container.add(this.descText)

    // カーソル
    // カーソルは iOS で絵文字(▶︎)になるのを防ぐため異体字セレクタ(U+FE0E)でテキスト表示を強制
    this.cursor = scene.add.text(0, 0, '▶︎', {
      ...BASE_STYLE,
      fontSize: '13px',
      color: TEXT_COLOR.white,
    })
    this.container.add(this.cursor)

    // 操作ヒント
    this.hintText = scene.add.text(240, 378, 'A:使う/装備  L:捨てる  B:閉じる', {
      ...BASE_STYLE,
      fontSize: '11px',
      color: TEXT_COLOR.dim,
    })
    this.hintText.setOrigin(0.5, 0.5)
    this.container.add(this.hintText)

    // スクロール可能を示すインジケータ（▲/▼）
    this.scrollIndicator = scene.add.text(438, 66, '', {
      ...BASE_STYLE,
      fontSize: '12px',
      color: TEXT_COLOR.subtle,
    })
    this.scrollIndicator.setOrigin(1, 0.5)
    this.container.add(this.scrollIndicator)
  }

  // readOnly: 拠点での持ち物確認など、使用/装備/破棄をせず閲覧のみのとき true。
  show(inventory: InventoryEntry[], readOnly = false) {
    this.entries = inventory
    this.cursorIndex = Math.min(this.cursorIndex, Math.max(0, inventory.length - 1))
    this.scrollOffset = 0
    this.visible = true
    this.hintText.setText(readOnly ? 'B:閉じる' : 'A:使う/装備  L:捨てる  B:閉じる')
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

    if (hasItems) {
      this.cursorIndex = Math.min(this.cursorIndex, items.length - 1)
      this.clampScroll()
    } else {
      this.scrollOffset = 0
    }
    this.renderVisibleRows()

    if (hasItems) {
      this.updateCursor()
      this.updateDescription()
    } else {
      this.cursor.setVisible(false)
      this.descText.setText('')
    }
  }

  // スクロール位置を、カーソルが表示範囲に入るよう調整する
  private clampScroll() {
    const len = this.entries.length
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
      const entry = this.entries[this.scrollOffset + i]
      const t = this.rowTexts[i]
      if (!entry) {
        t.setText('')
        continue
      }
      const equippedMark = entry.equipped ? 'E ' : '  '
      const enhanceText =
        entry.equipmentData && entry.equipmentData.enhanceLevel > 0
          ? ` +${entry.equipmentData.enhanceLevel}`
          : ''
      const stackText = entry.stack && entry.stack > 1 ? ` x${entry.stack}` : ''
      t.setText(`${equippedMark}${entry.name}${enhanceText}${stackText}`)
    }
    const up = this.scrollOffset > 0
    const down = this.scrollOffset + this.maxRows < this.entries.length
    this.scrollIndicator.setText(`${up ? '▲' : ''}${down ? '▼' : ''}`)
  }

  moveCursor(_dx: number, dy: number) {
    if (!this.visible || this.entries.length === 0) return
    const len = this.entries.length
    this.cursorIndex = (this.cursorIndex + dy + len) % len
    this.clampScroll()
    this.renderVisibleRows()
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
    const screenRow = this.cursorIndex - this.scrollOffset
    const y = this.rowStartY + screenRow * this.rowHeight
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
    // 装備品は強化を反映した実効ステータスを表示（例: 剣+1 → 攻撃力+6）
    if (def.equippable && def.effect) {
      const lvl = entry.equipmentData?.enhanceLevel ?? 0
      const bonusPerLevel = gameConfig.equipmentConfig?.enhanceBonusPerLevel ?? 1
      const { attackBonus, defenseBonus } = computeEquipmentStats(def, lvl, bonusPerLevel)
      const stats: string[] = []
      if (attackBonus > 0) stats.push(`攻撃力+${attackBonus}`)
      if (defenseBonus > 0) stats.push(`防御力+${defenseBonus}`)
      const lvlText = lvl > 0 ? `（+${lvl}）` : ''
      this.descText.setText(`${def.name}${lvlText}：${stats.join(' ') || def.description}`)
      return
    }
    this.descText.setText(`${def.name}：${def.description}`)
  }
}
