import Phaser from 'phaser'

export class UIScene extends Phaser.Scene {
  private hpText!: Phaser.GameObjects.Text
  private floorText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    // HP表示
    this.hpText = this.add.text(16, 16, 'HP: 100/100', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
    })

    // 階層表示
    this.floorText = this.add.text(16, 40, '1F', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    })
  }

  updateHP(current: number, max: number) {
    this.hpText.setText(`HP: ${current}/${max}`)
  }

  updateFloor(floor: number) {
    this.floorText.setText(`${floor}F`)
  }
}
