import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 2,
}

// メニュー1項目（最大4件を左上の 2x2 グリッドに配置）
export interface MenuItemConfig {
  label: string
  disabled?: boolean
}

// メニュー全体の内容。呼び出し側（各シーン）が組み立てて showMenu に渡す。
export interface MenuConfig {
  title: string // 右上の名称ボックス（ダンジョン名／拠点名など）
  items: MenuItemConfig[] // 2x2 グリッド。0=左上 1=右上 2=左下 3=右下
  stats: string[] // 下部ステータス欄（最大3行）
}

/**
 * ゲーム共通のメインメニュー（左上 2x2 グリッド＋右上の名称＋下部ステータス）。
 * ダンジョン(DungeonScene)と拠点(VillageScene)で同一様式を使い、統一感を保つ。
 * 表示内容は showMenu(config) で差し替える（ラベル・無効化・ステータスは呼び出し側が用意）。
 */
export class MenuOverlay {
  private container: Phaser.GameObjects.Container
  private visible = false
  private titleText: Phaser.GameObjects.Text
  private itemTexts: Phaser.GameObjects.Text[] = []
  private statTexts: Phaser.GameObjects.Text[] = []
  private cursor: Phaser.GameObjects.Text
  private cursorIndex = 0
  private items: MenuItemConfig[] = []
  private readonly itemPositions: { x: number; y: number }[] = []

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(500)

    // 半透明背景（ステータスバー直下〜コントローラー上端: Y44〜466）
    const overlayY = 44
    const overlayH = 422
    const overlay = scene.add.rectangle(240, overlayY + overlayH / 2, 480, overlayH, 0x000000, 0.6)
    this.container.add(overlay)

    // 左上: メニュー項目（2x2 グリッド）
    const menuBg = scene.add.graphics()
    menuBg.fillStyle(UI_COLOR.panelBg, 0.95)
    menuBg.fillRoundedRect(8, 56, 170, 76, 6)
    menuBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    menuBg.strokeRoundedRect(8, 56, 170, 76, 6)
    this.container.add(menuBg)

    // 4つのグリッド位置（0=左上 1=右上 2=左下 3=右下）と空テキストを事前配置
    for (let i = 0; i < 4; i++) {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 36 + col * 72
      const y = 68 + row * 28
      this.itemPositions.push({ x, y })
      const t = scene.add.text(x, y, '', { ...BASE_STYLE, color: TEXT_COLOR.muted })
      this.container.add(t)
      this.itemTexts.push(t)
    }

    // カーソル
    // カーソルは iOS で絵文字(▶︎)になるのを防ぐため異体字セレクタ(U+FE0E)でテキスト表示を強制
    this.cursor = scene.add.text(0, 0, '▶︎', {
      ...BASE_STYLE,
      fontSize: '14px',
      color: TEXT_COLOR.white,
    })
    this.container.add(this.cursor)

    // 右上: 名称（ダンジョン名／拠点名）
    const nameBg = scene.add.graphics()
    nameBg.fillStyle(UI_COLOR.panelBg, 0.95)
    nameBg.fillRoundedRect(250, 56, 222, 36, 6)
    nameBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    nameBg.strokeRoundedRect(250, 56, 222, 36, 6)
    this.container.add(nameBg)

    this.titleText = scene.add.text(361, 74, '', {
      ...BASE_STYLE,
      fontStyle: 'bold',
    })
    this.titleText.setOrigin(0.5, 0.5)
    this.container.add(this.titleText)

    // 下部: 詳細ステータス（ゲームエリア内に収める）
    const statBg = scene.add.graphics()
    statBg.fillStyle(UI_COLOR.panelBg, 0.95)
    statBg.fillRoundedRect(16, 320, 448, 70, 6)
    statBg.lineStyle(1, UI_COLOR.panelBorder, 1)
    statBg.strokeRoundedRect(16, 320, 448, 70, 6)
    this.container.add(statBg)

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

  // メニューを内容付きで開く（呼び出し側が config を組み立てる）
  showMenu(config: MenuConfig) {
    this.items = config.items.slice(0, 4)
    this.titleText.setText(config.title)

    // 項目描画（無効はグレー、空セルは非表示）
    for (let i = 0; i < 4; i++) {
      const item = this.items[i]
      const t = this.itemTexts[i]
      if (!item) {
        t.setText('')
        continue
      }
      t.setText(item.label)
      t.setColor(item.disabled ? TEXT_COLOR.dim : TEXT_COLOR.muted)
    }

    // ステータス描画（最大3行）
    for (let i = 0; i < 3; i++) {
      this.statTexts[i].setText(config.stats[i] ?? '')
    }

    // カーソルは最初の有効項目へ
    this.cursorIndex = this.items.findIndex((it) => !it.disabled)
    if (this.cursorIndex < 0) this.cursorIndex = 0
    this.updateCursor()

    this.visible = true
    this.container.setVisible(true)
  }

  hide() {
    this.visible = false
    this.container.setVisible(false)
  }

  isOpen(): boolean {
    return this.visible
  }

  // 2x2 グリッド移動。空セル／無効項目には乗らない（有効項目のみを行き来する）。
  moveCursor(dx: number, dy: number) {
    if (!this.visible) return
    const col = this.cursorIndex % 2
    const row = Math.floor(this.cursorIndex / 2)
    const newCol = Math.max(0, Math.min(1, col + dx))
    const newRow = Math.max(0, Math.min(1, row + dy))
    const target = newRow * 2 + newCol
    const item = this.items[target]
    if (!item || item.disabled) return // 空セル／無効はスキップ
    this.cursorIndex = target
    this.updateCursor()
  }

  // 現在カーソルの項目ラベルを返す（無効／空なら null）
  selectItem(): string | null {
    if (!this.visible) return null
    const item = this.items[this.cursorIndex]
    if (!item || item.disabled) return null
    return item.label
  }

  private updateCursor() {
    const pos = this.itemPositions[this.cursorIndex]
    const item = this.items[this.cursorIndex]
    if (pos && item) {
      this.cursor.setVisible(true)
      this.cursor.setPosition(pos.x - 14, pos.y)
    } else {
      this.cursor.setVisible(false)
    }
  }
}
