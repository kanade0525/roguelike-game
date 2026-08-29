import type Phaser from 'phaser'
import { TEXT_COLOR, UI_COLOR } from '../../game/data/colors'

// AudioContextをシングルトンで保持（連打対応）
let audioCtx: AudioContext | null = null
function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

function playClickSound() {
  const ctx = getAudioContext()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 800
  osc.type = 'square'
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.05)
}

function vibrate(ms: number = 15) {
  globalThis.navigator?.vibrate?.(ms)
}

function buttonFeedback() {
  playClickSound()
  vibrate()
}

export class Controller {
  private scene: Phaser.Scene

  constructor(
    scene: Phaser.Scene,
    onMove: (dx: number, dy: number) => void,
    onAction: (action: string) => void
  ) {
    this.scene = scene
    const screenWidth = 480
    const controllerY = 466
    const controllerHeight = 294

    const controllerBg = scene.add.graphics()
    controllerBg.fillStyle(UI_COLOR.controllerBg, 1)
    controllerBg.fillRect(0, controllerY, screenWidth, controllerHeight)

    this.createLRButtons(controllerY + 24, onAction)
    this.createDPad(110, controllerY + 150, onMove)
    this.createABButtons(380, controllerY + 150, onAction)
    this.createSelectStartButtons(controllerY + 272, onAction)
  }

  private addButtonFeedback(
    btn: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Shape,
    normalColor: number,
    pressedColor: number
  ) {
    btn.on('pointerdown', () => {
      btn.setFillStyle(pressedColor)
      btn.setScale(0.9)
      buttonFeedback()
    })
    btn.on('pointerup', () => {
      btn.setFillStyle(normalColor)
      btn.setScale(1)
    })
    btn.on('pointerout', () => {
      btn.setFillStyle(normalColor)
      btn.setScale(1)
    })
  }

  private createDPad(centerX: number, centerY: number, onMove: (dx: number, dy: number) => void) {
    const btnSize = 52
    const gap = 4

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

    const radius = 8

    directions.forEach((dir) => {
      const x = startX + dir.col * (btnSize + gap)
      const y = startY + dir.row * (btnSize + gap)
      const cx = x + btnSize / 2
      const cy = y + btnSize / 2

      const btn = this.scene.add.rectangle(cx, cy, btnSize, btnSize, UI_COLOR.buttonBg)
      btn.setStrokeStyle(1, UI_COLOR.buttonBorder)
      btn.setInteractive({ useHandCursor: true })

      // 角丸の見た目をグラフィックスで重ねる
      const g = this.scene.add.graphics()
      g.fillStyle(UI_COLOR.buttonBg, 1)
      g.fillRoundedRect(x, y, btnSize, btnSize, radius)
      g.lineStyle(1, UI_COLOR.buttonBorder, 1)
      g.strokeRoundedRect(x, y, btnSize, btnSize, radius)

      // 元のrectangleは透明にしてヒットエリアとして残す
      btn.setFillStyle(0x000000, 0)
      btn.setStrokeStyle()

      this.scene.add
        .text(cx, cy, dir.arrow, {
          fontSize: '20px',
          color: TEXT_COLOR.muted,
        })
        .setOrigin(0.5)

      btn.on('pointerdown', () => {
        g.clear()
        g.fillStyle(UI_COLOR.buttonHighlight, 1)
        g.fillRoundedRect(x, y, btnSize, btnSize, radius)
        g.lineStyle(1, UI_COLOR.buttonBorder, 1)
        g.strokeRoundedRect(x, y, btnSize, btnSize, radius)
        buttonFeedback()
        onMove(dir.dx, dir.dy)
      })
      btn.on('pointerup', () => {
        g.clear()
        g.fillStyle(UI_COLOR.buttonBg, 1)
        g.fillRoundedRect(x, y, btnSize, btnSize, radius)
        g.lineStyle(1, UI_COLOR.buttonBorder, 1)
        g.strokeRoundedRect(x, y, btnSize, btnSize, radius)
      })
      btn.on('pointerout', () => {
        g.clear()
        g.fillStyle(UI_COLOR.buttonBg, 1)
        g.fillRoundedRect(x, y, btnSize, btnSize, radius)
        g.lineStyle(1, UI_COLOR.buttonBorder, 1)
        g.strokeRoundedRect(x, y, btnSize, btnSize, radius)
      })
    })
  }

  private createABButtons(centerX: number, centerY: number, onAction: (action: string) => void) {
    const radius = 44

    const btnA = this.scene.add.circle(centerX + 36, centerY - 34, radius, UI_COLOR.abButton)
    btnA.setStrokeStyle(2, UI_COLOR.abButtonBorder)
    btnA.setInteractive({ useHandCursor: true })
    this.scene.add
      .text(centerX + 36, centerY - 34, 'A', {
        fontSize: '24px',
        color: TEXT_COLOR.light,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.addButtonFeedback(btnA, UI_COLOR.abButton, UI_COLOR.abButtonBorder)
    btnA.on('pointerdown', () => onAction('confirm'))

    const btnB = this.scene.add.circle(centerX - 36, centerY + 34, radius, UI_COLOR.abButton)
    btnB.setStrokeStyle(2, UI_COLOR.abButtonBorder)
    btnB.setInteractive({ useHandCursor: true })
    this.scene.add
      .text(centerX - 36, centerY + 34, 'B', {
        fontSize: '24px',
        color: TEXT_COLOR.light,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.addButtonFeedback(btnB, UI_COLOR.abButton, UI_COLOR.abButtonBorder)
    btnB.on('pointerdown', () => onAction('inventory'))
  }

  private createLRButtons(y: number, onAction: (action: string) => void) {
    const btnWidth = 95
    const btnHeight = 36

    const btnL = this.scene.add.rectangle(
      15 + btnWidth / 2,
      y,
      btnWidth,
      btnHeight,
      UI_COLOR.buttonBg
    )
    btnL.setStrokeStyle(1, UI_COLOR.buttonBorder)
    btnL.setInteractive({ useHandCursor: true })
    this.scene.add
      .text(15 + btnWidth / 2, y, 'L 防御', {
        fontSize: '14px',
        fontFamily: '"DotGothic16", monospace',
        color: TEXT_COLOR.subtle,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.addButtonFeedback(btnL, UI_COLOR.buttonBg, UI_COLOR.buttonHighlight)
    // 通常時は防御、持ち物を開いている間は「捨てる」(DungeonScene 側で分岐)
    btnL.on('pointerdown', () => onAction('guard'))

    const rX = 480 - 15 - btnWidth
    const btnR = this.scene.add.rectangle(
      rX + btnWidth / 2,
      y,
      btnWidth,
      btnHeight,
      UI_COLOR.buttonBg
    )
    btnR.setStrokeStyle(1, UI_COLOR.buttonBorder)
    btnR.setInteractive({ useHandCursor: true })
    this.scene.add
      .text(rX + btnWidth / 2, y, 'R', {
        fontSize: '16px',
        color: TEXT_COLOR.subtle,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.addButtonFeedback(btnR, UI_COLOR.buttonBg, UI_COLOR.buttonHighlight)
    btnR.on('pointerdown', () => onAction('nextItem'))
  }

  private createSelectStartButtons(y: number, onAction: (action: string) => void) {
    const btnWidth = 72
    const btnHeight = 28
    const gap = 12
    const centerX = 240

    const selectX = centerX - gap / 2 - btnWidth / 2
    const btnSelect = this.scene.add.rectangle(
      selectX,
      y,
      btnWidth,
      btnHeight,
      UI_COLOR.selectButton
    )
    btnSelect.setStrokeStyle(1, UI_COLOR.buttonBorder)
    btnSelect.setInteractive({ useHandCursor: true })
    this.scene.add
      .text(selectX, y, 'SELECT', {
        fontSize: '11px',
        color: TEXT_COLOR.dim,
      })
      .setOrigin(0.5)

    this.addButtonFeedback(btnSelect, UI_COLOR.selectButton, UI_COLOR.buttonBg)
    btnSelect.on('pointerdown', () => onAction('inventory'))

    const startBtnX = centerX + gap / 2 + btnWidth / 2
    const btnStart = this.scene.add.rectangle(
      startBtnX,
      y,
      btnWidth,
      btnHeight,
      UI_COLOR.selectButton
    )
    btnStart.setStrokeStyle(1, UI_COLOR.buttonBorder)
    btnStart.setInteractive({ useHandCursor: true })
    this.scene.add
      .text(startBtnX, y, 'START', {
        fontSize: '11px',
        color: TEXT_COLOR.dim,
      })
      .setOrigin(0.5)

    this.addButtonFeedback(btnStart, UI_COLOR.selectButton, UI_COLOR.buttonBg)
    btnStart.on('pointerdown', () => onAction('menu'))
  }
}
