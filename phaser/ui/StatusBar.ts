import type Phaser from 'phaser'
import { GAUGE_COLOR, TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 2,
}

// パネル寸法（2段構成: 上段=数値情報+HPゲージ / 下段=満腹・スタミナゲージ）
const PANEL_X = 8
const PANEL_Y = 8
const PANEL_W = 464
const PANEL_H = 52
const ROW1_Y = 14
const ROW2_Y = 34
const BAR_H = 10

// 1本のゲージ（枠 + 中身）。setValue で残量比率に応じて幅と色を更新する。
class Gauge {
  private fill: Phaser.GameObjects.Rectangle
  private track: Phaser.GameObjects.Rectangle
  private width: number

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    this.width = width
    this.track = scene.add.rectangle(x, y, width, BAR_H, GAUGE_COLOR.trackBg).setOrigin(0, 0.5)
    this.track.setStrokeStyle(1, GAUGE_COLOR.trackBorder)
    this.fill = scene.add
      .rectangle(x + 1, y, width - 2, BAR_H - 2, GAUGE_COLOR.hp)
      .setOrigin(0, 0.5)
  }

  setValue(current: number, max: number, color: number) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0
    this.fill.setDisplaySize(Math.max(0, (this.width - 2) * ratio), BAR_H - 2)
    this.fill.setFillStyle(color)
  }

  setVisible(visible: boolean) {
    this.track.setVisible(visible)
    this.fill.setVisible(visible)
  }
}

export class StatusBar {
  private floorText: Phaser.GameObjects.Text
  private levelText: Phaser.GameObjects.Text
  private hpLabel: Phaser.GameObjects.Text
  private hpText: Phaser.GameObjects.Text
  private satiationLabel: Phaser.GameObjects.Text
  private satiationText: Phaser.GameObjects.Text
  private staminaLabel: Phaser.GameObjects.Text
  private staminaText: Phaser.GameObjects.Text
  private goldText: Phaser.GameObjects.Text
  private guardBadge: Phaser.GameObjects.Text

  private hpGauge: Gauge
  private satiationGauge: Gauge
  private staminaGauge: Gauge

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.graphics()
    bg.fillStyle(UI_COLOR.panelBg, 0.9)
    bg.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 4)
    bg.lineStyle(2, UI_COLOR.panelBorder, 1)
    bg.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 4)

    const statusStyle = { ...BASE_STYLE, fontStyle: 'bold', fontSize: '14px' }
    const labelStyle = { ...statusStyle, color: TEXT_COLOR.subtle }

    // --- 上段: 階層 / Lv / HPゲージ / ゴールド
    this.floorText = scene.add.text(16, ROW1_Y, 'B1F', statusStyle)
    this.levelText = scene.add.text(62, ROW1_Y, 'Lv 1', statusStyle)
    this.hpLabel = scene.add.text(116, ROW1_Y, 'HP', labelStyle)
    this.hpGauge = new Gauge(scene, 142, ROW1_Y + 8, 120)
    this.hpText = scene.add.text(268, ROW1_Y, '25/25', statusStyle)
    this.goldText = scene.add.text(464, ROW1_Y, '0G', statusStyle).setOrigin(1, 0)

    // --- 下段: 満腹度ゲージ / スタミナゲージ / 防御中バッジ
    this.satiationLabel = scene.add.text(16, ROW2_Y, '腹', labelStyle)
    this.satiationGauge = new Gauge(scene, 38, ROW2_Y + 8, 110)
    this.satiationText = scene.add.text(154, ROW2_Y, '100', statusStyle)

    this.staminaLabel = scene.add.text(214, ROW2_Y, 'STA', labelStyle)
    this.staminaGauge = new Gauge(scene, 252, ROW2_Y + 8, 110)
    this.staminaText = scene.add.text(368, ROW2_Y, '100', statusStyle)

    this.guardBadge = scene.add
      .text(464, ROW2_Y, '防御', { ...statusStyle, color: '#60a5fa' })
      .setOrigin(1, 0)
    this.guardBadge.setVisible(false)

    this.updateHP(25, 25)
    this.updateSatiation(100, 100)
    this.updateStamina(100, 100)
  }

  updateHP(current: number, max: number) {
    this.hpText.setText(`${current}/${max}`)
    const ratio = max > 0 ? current / max : 0
    const color =
      ratio < 0.25 ? GAUGE_COLOR.hpDanger : ratio < 0.5 ? GAUGE_COLOR.hpWarn : GAUGE_COLOR.hp
    this.hpGauge.setValue(current, max, color)
  }

  updateFloor(floor: number) {
    this.floorText.setText(`B${floor}F`)
  }

  updateLevel(level: number) {
    this.levelText.setText(`Lv ${level}`)
  }

  updateSatiation(current: number, max: number) {
    this.satiationText.setText(`${current}`)
    const ratio = max > 0 ? current / max : 0
    this.satiationGauge.setValue(
      current,
      max,
      ratio < 0.3 ? GAUGE_COLOR.satiationDanger : GAUGE_COLOR.satiation
    )
  }

  updateStamina(current: number, max: number) {
    this.staminaText.setText(`${current}`)
    const ratio = max > 0 ? current / max : 0
    this.staminaGauge.setValue(
      current,
      max,
      ratio < 0.3 ? GAUGE_COLOR.staminaDanger : GAUGE_COLOR.stamina
    )
  }

  // 防御中のみ右下にバッジを出す（次の行動で解除される一時状態）
  updateDefending(defending: boolean) {
    this.guardBadge.setVisible(defending)
  }

  updateGold(gold: number) {
    this.goldText.setText(`${gold}G`)
  }

  // 拠点(村)ではダンジョン用の情報(階層/Lv/HP/満腹/スタミナ)を隠し、ゴールドのみ左に表示する
  setVillageMode() {
    this.floorText.setVisible(false)
    this.levelText.setVisible(false)
    this.hpLabel.setVisible(false)
    this.hpText.setVisible(false)
    this.satiationLabel.setVisible(false)
    this.satiationText.setVisible(false)
    this.staminaLabel.setVisible(false)
    this.staminaText.setVisible(false)
    this.guardBadge.setVisible(false)
    this.hpGauge.setVisible(false)
    this.satiationGauge.setVisible(false)
    this.staminaGauge.setVisible(false)
    this.goldText.setOrigin(0, 0)
    this.goldText.setPosition(16, ROW1_Y)
  }
}
