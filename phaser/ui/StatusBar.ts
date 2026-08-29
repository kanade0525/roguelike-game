import type Phaser from 'phaser'
import { GAUGE_COLOR, TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

// ステータスパネルのレイアウト。
// 4列グリッド（ラベル / ゲージ / 数値[右揃え] / メタ情報[右揃え]）を3行積む。
// 列のx座標は全行で共通にすること。個別にずらすと途端に読めなくなる。
const PANEL = { x: 8, y: 8, w: 464, h: 58 }
const COL = {
  label: 16, // ラベル左端
  bar: 58, // ゲージ左端
  barWidth: 190,
  valueRight: 316, // 数値の右端（右揃え）
  badge: 324, // 防御中バッジの左端（3行目のみ）
  metaRight: 464, // メタ情報の右端（右揃え）
}
const ROW_Y = [12, 29, 46] // 各行のテキスト上端
const BAR_H = 10
const FONT_SIZE = '13px'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: FONT_SIZE,
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  fontStyle: 'bold',
}

// 1本のゲージ（枠 + 中身）。全ゲージで長さ・位置・高さを共通にする。
class Gauge {
  private track: Phaser.GameObjects.Rectangle
  private fill: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, rowY: number) {
    const cy = rowY + 8
    this.track = scene.add
      .rectangle(COL.bar, cy, COL.barWidth, BAR_H, GAUGE_COLOR.trackBg)
      .setOrigin(0, 0.5)
    this.track.setStrokeStyle(1, GAUGE_COLOR.trackBorder)
    this.fill = scene.add
      .rectangle(COL.bar + 1, cy, COL.barWidth - 2, BAR_H - 2, GAUGE_COLOR.hp)
      .setOrigin(0, 0.5)
  }

  setValue(current: number, max: number, color: number) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0
    this.fill.setDisplaySize((COL.barWidth - 2) * ratio, BAR_H - 2)
    this.fill.setFillStyle(color)
  }

  setVisible(visible: boolean) {
    this.track.setVisible(visible)
    this.fill.setVisible(visible)
  }
}

export class StatusBar {
  private labels: Phaser.GameObjects.Text[] = []
  private gauges: Gauge[] = []
  private values: Phaser.GameObjects.Text[] = []

  private floorText: Phaser.GameObjects.Text
  private levelText: Phaser.GameObjects.Text
  private goldText: Phaser.GameObjects.Text
  private guardBadge: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.graphics()
    bg.fillStyle(UI_COLOR.panelBg, 0.9)
    bg.fillRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 4)
    bg.lineStyle(2, UI_COLOR.panelBorder, 1)
    bg.strokeRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 4)

    const labelStyle = { ...BASE_STYLE, color: TEXT_COLOR.subtle }

    // ラベル / ゲージ / 数値 を3行ぶん同じ列に積む
    const labelTexts = ['HP', '満腹', '気力']
    for (let row = 0; row < 3; row++) {
      this.labels.push(scene.add.text(COL.label, ROW_Y[row], labelTexts[row], labelStyle))
      this.gauges.push(new Gauge(scene, ROW_Y[row]))
      this.values.push(scene.add.text(COL.valueRight, ROW_Y[row], '0', BASE_STYLE).setOrigin(1, 0))
    }

    // メタ情報（階層 / Lv / ゴールド）を右端に縦積み
    this.floorText = scene.add.text(COL.metaRight, ROW_Y[0], 'B1F', BASE_STYLE).setOrigin(1, 0)
    this.levelText = scene.add.text(COL.metaRight, ROW_Y[1], 'Lv 1', BASE_STYLE).setOrigin(1, 0)
    this.goldText = scene.add.text(COL.metaRight, ROW_Y[2], '0G', BASE_STYLE).setOrigin(1, 0)

    // 防御中のみ気力行に出す（防御と気力回復は同じ行動なので同じ行に置く）
    this.guardBadge = scene.add.text(COL.badge, ROW_Y[2], '防御', {
      ...BASE_STYLE,
      color: '#60a5fa',
    })
    this.guardBadge.setVisible(false)

    this.updateHP(25, 25)
    this.updateSatiation(100, 100)
    this.updateStamina(100, 100)
  }

  updateHP(current: number, max: number) {
    this.values[0].setText(`${current}/${max}`)
    const ratio = max > 0 ? current / max : 0
    const color =
      ratio < 0.25 ? GAUGE_COLOR.hpDanger : ratio < 0.5 ? GAUGE_COLOR.hpWarn : GAUGE_COLOR.hp
    this.gauges[0].setValue(current, max, color)
  }

  updateSatiation(current: number, max: number) {
    this.values[1].setText(`${current}`)
    const ratio = max > 0 ? current / max : 0
    this.gauges[1].setValue(
      current,
      max,
      ratio < 0.3 ? GAUGE_COLOR.satiationDanger : GAUGE_COLOR.satiation
    )
  }

  updateStamina(current: number, max: number) {
    this.values[2].setText(`${current}`)
    const ratio = max > 0 ? current / max : 0
    this.gauges[2].setValue(
      current,
      max,
      ratio < 0.3 ? GAUGE_COLOR.staminaDanger : GAUGE_COLOR.stamina
    )
  }

  updateFloor(floor: number) {
    this.floorText.setText(`B${floor}F`)
  }

  updateLevel(level: number) {
    this.levelText.setText(`Lv ${level}`)
  }

  updateGold(gold: number) {
    this.goldText.setText(`${gold}G`)
  }

  // 防御中のみバッジを出す（次の行動で解除される一時状態）
  updateDefending(defending: boolean) {
    this.guardBadge.setVisible(defending)
  }

  // 拠点(村)ではダンジョン用の情報(HP/満腹/気力/階層/Lv)を隠し、ゴールドのみ左上に表示する
  setVillageMode() {
    for (const t of [...this.labels, ...this.values]) t.setVisible(false)
    for (const g of this.gauges) g.setVisible(false)
    this.floorText.setVisible(false)
    this.levelText.setVisible(false)
    this.guardBadge.setVisible(false)
    this.goldText.setOrigin(0, 0)
    this.goldText.setPosition(COL.label, ROW_Y[0])
  }
}
