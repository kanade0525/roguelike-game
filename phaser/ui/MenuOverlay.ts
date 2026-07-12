import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 2,
}

export class MenuOverlay {
  private container: Phaser.GameObjects.Container
  private visible = false
  private statTexts: Phaser.GameObjects.Text[] = []
  private cursor: Phaser.GameObjects.Text
  private cursorIndex = 0
  private itemPositions: { x: number; y: number }[] = []
  private itemLabels: string[] = []

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(500)

    // 半透明背景（ステータスバー直下〜コントローラー上端: Y44〜466）
    const overlayY = 44
    const overlayH = 422
    const overlay = scene.add.rectangle(240, overlayY + overlayH / 2, 480, overlayH, 0x000000, 0.6)
    this.container.add(overlay)

    // 左上: メニューボタン（道具/マップ/足元/脱出）
    const menuBg = scene.add.graphics()
    menuBg.fillStyle(UI_COLOR.panelBg, 0.95)
    menuBg.fillRoundedRect(8, 56, 170, 76, 6)
    menuBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    menuBg.strokeRoundedRect(8, 56, 170, 76, 6)
    this.container.add(menuBg)

    const menuLabels = [
      { text: '道具', col: 0, row: 0 },
      { text: 'マップ', col: 1, row: 0 },
      { text: '足元', col: 0, row: 1 },
      { text: '脱出', col: 1, row: 1 },
    ]

    const menuStyle = { ...BASE_STYLE, color: TEXT_COLOR.muted }

    this.itemPositions = []
    this.itemLabels = []
    menuLabels.forEach((label) => {
      const x = 36 + label.col * 72
      const y = 68 + label.row * 28
      const t = scene.add.text(x, y, label.text, menuStyle)
      this.container.add(t)
      this.itemPositions.push({ x, y })
      this.itemLabels.push(label.text)
    })

    // カーソル
    this.cursor = scene.add.text(0, 0, '▶', {
      ...BASE_STYLE,
      fontSize: '14px',
      color: TEXT_COLOR.white,
    })
    this.container.add(this.cursor)

    // 右上: ダンジョン名
    const nameBg = scene.add.graphics()
    nameBg.fillStyle(UI_COLOR.panelBg, 0.95)
    nameBg.fillRoundedRect(250, 56, 222, 36, 6)
    nameBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    nameBg.strokeRoundedRect(250, 56, 222, 36, 6)
    this.container.add(nameBg)

    const nameText = scene.add.text(361, 74, '不思議のダンジョン', {
      ...BASE_STYLE,
      fontStyle: 'bold',
    })
    nameText.setOrigin(0.5, 0.5)
    this.container.add(nameText)

    // 下部: 詳細ステータス（ゲームエリア内に収める）
    const statBg = scene.add.graphics()
    statBg.fillStyle(UI_COLOR.panelBg, 0.95)
    statBg.fillRoundedRect(16, 320, 448, 70, 6)
    statBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    statBg.strokeRoundedRect(16, 320, 448, 70, 6)
    this.container.add(statBg)

    this.statTexts = []
    for (let i = 0; i < 3; i++) {
      const t = scene.add.text(28, 330 + i * 20, '', { ...BASE_STYLE })
      this.container.add(t)
      this.statTexts.push(t)
    }

    // 閉じるヒント
    const hint = scene.add.text(240, 400, 'B: 閉じる', {
      ...BASE_STYLE,
      fontSize: '12px',
      color: TEXT_COLOR.dim,
    })
    hint.setOrigin(0.5, 0.5)
    this.container.add(hint)
  }

  toggle() {
    this.visible = !this.visible
    if (this.visible) {
      this.cursorIndex = 0
      this.updateCursor()
      this.updateStats()
    }
    this.container.setVisible(this.visible)
  }

  isOpen(): boolean {
    return this.visible
  }

  moveCursor(dx: number, dy: number) {
    if (!this.visible) return
    const col = this.cursorIndex % 2
    const row = Math.floor(this.cursorIndex / 2)
    const newCol = Math.max(0, Math.min(1, col + dx))
    const newRow = Math.max(0, Math.min(1, row + dy))
    this.cursorIndex = newRow * 2 + newCol
    this.updateCursor()
  }

  selectItem(): string | null {
    if (!this.visible) return null
    return this.itemLabels[this.cursorIndex] ?? null
  }

  private updateCursor() {
    const pos = this.itemPositions[this.cursorIndex]
    if (pos) {
      this.cursor.setPosition(pos.x - 14, pos.y)
    }
  }

  private updateStats() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = this.scene.game.registry.get('gameStore') as any
    if (!store) return
    const p = store.player
    const d = store.dungeon
    const expNeeded = p.level * 30
    this.statTexts[0].setText(`名前: 冒険者    Lv: ${p.level}     HP: ${p.hp}/${p.maxHp}`)
    this.statTexts[1].setText(
      `攻撃: ${p.attack}   防御: ${p.defense}    満腹度: ${p.satiation}/${p.maxSatiation}`
    )
    this.statTexts[2].setText(`経験値: ${p.exp}/${expNeeded}          ${d.floor}F`)
  }
}
