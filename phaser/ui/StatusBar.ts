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
  private goldText: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.graphics()
    bg.fillStyle(UI_COLOR.panelBg, 0.9)
    bg.fillRoundedRect(8, 8, 464, 36, 4)
    bg.lineStyle(2, UI_COLOR.panelBorder, 1)
    bg.strokeRoundedRect(8, 8, 464, 36, 4)

    const statusStyle = { ...BASE_STYLE, fontStyle: 'bold', fontSize: '14px' }

    this.floorText = scene.add.text(16, 16, 'B1F', statusStyle)
    this.levelText = scene.add.text(70, 16, 'Lv 1', statusStyle)
    this.hpText = scene.add.text(130, 16, 'HP 25/25', statusStyle)
    this.satiationText = scene.add.text(260, 16, '腹 100', statusStyle)
    this.goldText = scene.add.text(350, 16, '0G', statusStyle)
  }

  updateHP(current: number, max: number) {
    this.hpText.setText(`HP ${current}/${max}`)
  }

  updateFloor(floor: number) {
    this.floorText.setText(`B${floor}F`)
  }

  updateLevel(level: number) {
    this.levelText.setText(`Lv ${level}`)
  }

  updateSatiation(current: number, _max: number) {
    this.satiationText.setText(`腹 ${current}`)
  }

  updateGold(gold: number) {
    this.goldText.setText(`${gold}G`)
  }

  // 拠点(村)ではダンジョン用の情報(階層/Lv/HP/満腹)を隠し、ゴールドのみ左に表示する
  setVillageMode() {
    this.floorText.setVisible(false)
    this.levelText.setVisible(false)
    this.hpText.setVisible(false)
    this.satiationText.setVisible(false)
    this.goldText.setPosition(16, 16)
  }
}
