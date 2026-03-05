import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

const BASE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '16px',
  color: TEXT_COLOR.white,
  fontFamily: '"DotGothic16", monospace',
  letterSpacing: 2,
}

export class StatusBar {
  private floorText: Phaser.GameObjects.Text
  private levelText: Phaser.GameObjects.Text
  private hpText: Phaser.GameObjects.Text
  private satiationText: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.graphics()
    bg.fillStyle(UI_COLOR.panelBg, 0.9)
    bg.fillRoundedRect(8, 8, 464, 36, 4)
    bg.lineStyle(2, UI_COLOR.panelBorder, 1)
    bg.strokeRoundedRect(8, 8, 464, 36, 4)

    const statusStyle = { ...BASE_STYLE, fontStyle: 'bold' }

    this.floorText = scene.add.text(20, 16, '1F', statusStyle)
    this.levelText = scene.add.text(80, 16, 'Lv: 1', statusStyle)
    this.hpText = scene.add.text(180, 16, 'HP: 100/100', statusStyle)
    this.satiationText = scene.add.text(340, 16, '腹: 100', statusStyle)
  }

  updateHP(current: number, max: number) {
    this.hpText.setText(`HP: ${current}/${max}`)
  }

  updateFloor(floor: number) {
    this.floorText.setText(`${floor}F`)
  }

  updateLevel(level: number) {
    this.levelText.setText(`Lv: ${level}`)
  }

  updateSatiation(current: number, _max: number) {
    this.satiationText.setText(`腹: ${current}`)
  }
}
