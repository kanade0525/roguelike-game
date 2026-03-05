import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

export class Controller {
  private scene: Phaser.Scene

  constructor(
    scene: Phaser.Scene,
    onMove: (dx: number, dy: number) => void,
    onAction: (action: string) => void,
  ) {
    this.scene = scene
    const screenWidth = 480
    const controllerY = 488
    const controllerHeight = 280

    const controllerBg = scene.add.graphics()
    controllerBg.fillStyle(UI_COLOR.controllerBg, 1)
    controllerBg.fillRect(0, controllerY, screenWidth, controllerHeight)

    this.createLRButtons(controllerY + 24, onAction)
    this.createDPad(110, controllerY + 140, onMove)
    this.createABButtons(380, controllerY + 140, onAction)
    this.createSelectStartButtons(controllerY + 252, onAction)
  }

  private createDPad(centerX: number, centerY: number, onMove: (dx: number, dy: number) => void) {
    const btnSize = 46
    const gap = 3
    const graphics = this.scene.add.graphics()

    const directions = [
      { dx: -1, dy: -1, col: 0, row: 0, arrow: '↖' },
      { dx: 0, dy: -1, col: 1, row: 0, arrow: '↑' },
      { dx: 1, dy: -1, col: 2, row: 0, arrow: '↗' },
      { dx: -1, dy: 0, col: 0, row: 1, arrow: '←' },
      { dx: 1, dy: 0, col: 2, row: 1, arrow: '→' },
      { dx: -1, dy: 1, col: 0, row: 2, arrow: '↙' },
      { dx: 0, dy: 1, col: 1, row: 2, arrow: '↓' },
      { dx: 1, dy: 1, col: 2, row: 2, arrow: '↘' },
    ]

    const gridSize = btnSize * 3 + gap * 2
    const startX = centerX - gridSize / 2
    const startY = centerY - gridSize / 2

    directions.forEach((dir) => {
      const x = startX + dir.col * (btnSize + gap)
      const y = startY + dir.row * (btnSize + gap)

      graphics.fillStyle(UI_COLOR.buttonBg, 1)
      graphics.fillRoundedRect(x, y, btnSize, btnSize, 6)
      graphics.lineStyle(1, UI_COLOR.buttonBorder, 1)
      graphics.strokeRoundedRect(x, y, btnSize, btnSize, 6)

      const btn = this.scene.add.rectangle(x + btnSize / 2, y + btnSize / 2, btnSize, btnSize, 0x000000, 0)
      btn.setInteractive({ useHandCursor: true })

      this.scene.add.text(x + btnSize / 2, y + btnSize / 2, dir.arrow, {
        fontSize: '20px',
        color: TEXT_COLOR.muted,
      }).setOrigin(0.5)

      btn.on('pointerdown', () => onMove(dir.dx, dir.dy))
    })

    const cx = startX + btnSize + gap
    const cy = startY + btnSize + gap
    graphics.fillStyle(UI_COLOR.selectButton, 1)
    graphics.fillRoundedRect(cx, cy, btnSize, btnSize, 6)
  }

  private createABButtons(centerX: number, centerY: number, onAction: (action: string) => void) {
    const radius = 38

    const btnA = this.scene.add.circle(centerX + 32, centerY - 30, radius, UI_COLOR.abButton)
    btnA.setStrokeStyle(2, UI_COLOR.abButtonBorder)
    btnA.setInteractive({ useHandCursor: true })
    this.scene.add.text(centerX + 32, centerY - 30, 'A', {
      fontSize: '24px',
      color: TEXT_COLOR.light,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnA.on('pointerdown', () => {
      btnA.setFillStyle(UI_COLOR.abButtonBorder)
      onAction('confirm')
    })
    btnA.on('pointerup', () => btnA.setFillStyle(UI_COLOR.abButton))
    btnA.on('pointerout', () => btnA.setFillStyle(UI_COLOR.abButton))

    const btnB = this.scene.add.circle(centerX - 32, centerY + 30, radius, UI_COLOR.abButton)
    btnB.setStrokeStyle(2, UI_COLOR.abButtonBorder)
    btnB.setInteractive({ useHandCursor: true })
    this.scene.add.text(centerX - 32, centerY + 30, 'B', {
      fontSize: '24px',
      color: TEXT_COLOR.light,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnB.on('pointerdown', () => {
      btnB.setFillStyle(UI_COLOR.abButtonBorder)
      onAction('inventory')
    })
    btnB.on('pointerup', () => btnB.setFillStyle(UI_COLOR.abButton))
    btnB.on('pointerout', () => btnB.setFillStyle(UI_COLOR.abButton))
  }

  private createLRButtons(y: number, onAction: (action: string) => void) {
    const graphics = this.scene.add.graphics()
    const btnWidth = 85
    const btnHeight = 32

    graphics.fillStyle(UI_COLOR.buttonBg, 1)
    graphics.fillRoundedRect(15, y - btnHeight / 2, btnWidth, btnHeight, 4)
    graphics.lineStyle(1, UI_COLOR.buttonBorder, 1)
    graphics.strokeRoundedRect(15, y - btnHeight / 2, btnWidth, btnHeight, 4)

    const btnL = this.scene.add.rectangle(15 + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnL.setInteractive({ useHandCursor: true })
    this.scene.add.text(15 + btnWidth / 2, y, 'L', {
      fontSize: '16px',
      color: TEXT_COLOR.subtle,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnL.on('pointerdown', () => onAction('prevItem'))

    const rX = 480 - 15 - btnWidth
    graphics.fillStyle(UI_COLOR.buttonBg, 1)
    graphics.fillRoundedRect(rX, y - btnHeight / 2, btnWidth, btnHeight, 4)
    graphics.lineStyle(1, UI_COLOR.buttonBorder, 1)
    graphics.strokeRoundedRect(rX, y - btnHeight / 2, btnWidth, btnHeight, 4)

    const btnR = this.scene.add.rectangle(rX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnR.setInteractive({ useHandCursor: true })
    this.scene.add.text(rX + btnWidth / 2, y, 'R', {
      fontSize: '16px',
      color: TEXT_COLOR.subtle,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btnR.on('pointerdown', () => onAction('nextItem'))
  }

  private createSelectStartButtons(y: number, onAction: (action: string) => void) {
    const graphics = this.scene.add.graphics()
    const btnWidth = 65
    const btnHeight = 24
    const gap = 12
    const centerX = 240

    const selectX = centerX - gap / 2 - btnWidth
    graphics.fillStyle(UI_COLOR.selectButton, 1)
    graphics.fillRoundedRect(selectX, y - btnHeight / 2, btnWidth, btnHeight, 9)

    const btnSelect = this.scene.add.rectangle(selectX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnSelect.setInteractive({ useHandCursor: true })
    this.scene.add.text(selectX + btnWidth / 2, y, 'SELECT', {
      fontSize: '11px',
      color: TEXT_COLOR.dim,
    }).setOrigin(0.5)

    btnSelect.on('pointerdown', () => onAction('inventory'))

    const startX = centerX + gap / 2
    graphics.fillRoundedRect(startX, y - btnHeight / 2, btnWidth, btnHeight, 9)

    const btnStart = this.scene.add.rectangle(startX + btnWidth / 2, y, btnWidth, btnHeight, 0x000000, 0)
    btnStart.setInteractive({ useHandCursor: true })
    this.scene.add.text(startX + btnWidth / 2, y, 'START', {
      fontSize: '11px',
      color: TEXT_COLOR.dim,
    }).setOrigin(0.5)

    btnStart.on('pointerdown', () => onAction('menu'))
  }
}
