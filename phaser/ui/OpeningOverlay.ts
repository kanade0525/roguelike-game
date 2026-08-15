import type Phaser from 'phaser'
import { TEXT_COLOR } from '../../game/data/colors'

// 1行分の会話（話者名＋本文）。DialogLine と同形。
export interface OpeningLine {
  speaker?: string
  text: string
}

// ゲームビュー領域(y=0〜コントローラ手前)を黒幕で覆い、中央に導入テキストを逐次表示する。
// 別画面(Vueルート)は作らず、ゲーム操作画面(HUD/コントローラはそのまま)の中で映画的に流す。
// コントローラ(y>=466)は黒幕の外なので隠れない。A/決定 or タップ(Aボタン)で送る。
const VIEW_W = 480
const VIEW_H = 466 // コントローラ開始位置(controllerY=466)より上だけを覆う

export class OpeningOverlay {
  private container: Phaser.GameObjects.Container
  private visible = false
  private speakerText: Phaser.GameObjects.Text
  private bodyText: Phaser.GameObjects.Text
  private nextHint: Phaser.GameObjects.Text

  private lines: OpeningLine[] = []
  private index = 0
  private onDone: (() => void) | null = null
  private scene: Phaser.Scene
  private tapZone: Phaser.GameObjects.Zone

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.container = scene.add.container(0, 0)
    this.container.setVisible(false)
    this.container.setDepth(900) // HUD/会話ボックスより前面。コントローラは覆う範囲外。

    // 黒幕（ゲームビュー領域のみ・画像が無い場合の下地）
    const bg = scene.add.graphics()
    bg.fillStyle(0x000000, 1)
    bg.fillRect(0, 0, VIEW_W, VIEW_H)
    this.container.add(bg)

    // 背景画像（用意されていれば黒幕の代わりに敷く）
    if (scene.textures.exists('op_bg')) {
      const img = scene.add.image(VIEW_W / 2, VIEW_H / 2, 'op_bg')
      img.setDisplaySize(VIEW_W, VIEW_H) // ビュー領域にフィット（1024x1024 → 480x466）
      this.container.add(img)
      // 文字可読性のためのスクリム（全体を軽く暗く＋中央テキスト帯をさらに暗く）
      const scrim = scene.add.graphics()
      scrim.fillStyle(0x000000, 0.4)
      scrim.fillRect(0, 0, VIEW_W, VIEW_H)
      scrim.fillStyle(0x000000, 0.32)
      scrim.fillRect(0, VIEW_H / 2 - 92, VIEW_W, 190)
      this.container.add(scrim)
    }

    // 黒幕をタップで送る（表示中のみ有効。非表示時は入力を無効化しマップ操作を妨げない）
    this.tapZone = scene.add.zone(0, 0, VIEW_W, VIEW_H).setOrigin(0, 0)
    this.tapZone.on('pointerdown', () => this.advance())
    this.container.add(this.tapZone)

    // 話者名（中央テキストの上）
    this.speakerText = scene.add.text(VIEW_W / 2, VIEW_H / 2 - 54, '', {
      fontSize: '14px',
      color: '#e8bd6d',
      fontFamily: '"DotGothic16", monospace',
      letterSpacing: 4,
    })
    this.speakerText.setOrigin(0.5, 0.5)
    this.container.add(this.speakerText)

    // 本文（中央・折り返し）
    this.bodyText = scene.add.text(VIEW_W / 2, VIEW_H / 2, '', {
      fontSize: '17px',
      color: TEXT_COLOR.white,
      fontFamily: '"DotGothic16", monospace',
      letterSpacing: 1,
      align: 'center',
      lineSpacing: 8,
      // 日本語は空白が無いため文字単位で折り返す
      wordWrap: { width: VIEW_W - 72, useAdvancedWrap: true },
    })
    this.bodyText.setOrigin(0.5, 0.5)
    this.container.add(this.bodyText)

    // 送りヒント（黒幕の下部）
    this.nextHint = scene.add.text(VIEW_W / 2, VIEW_H - 34, '▼ 送る（A / タップ）', {
      fontSize: '11px',
      color: TEXT_COLOR.dim,
      fontFamily: '"DotGothic16", monospace',
      letterSpacing: 2,
    })
    this.nextHint.setOrigin(0.5, 1)
    this.container.add(this.nextHint)
  }

  show(lines: OpeningLine[], onDone?: () => void) {
    if (lines.length === 0) return
    this.lines = lines
    this.index = 0
    this.onDone = onDone ?? null
    this.visible = true
    this.container.setVisible(true)
    this.tapZone.setInteractive()
    this.render()
  }

  // 次の行へ。最後だった場合は閉じて onDone を呼ぶ。
  advance() {
    if (!this.visible) return
    if (this.index < this.lines.length - 1) {
      this.index++
      this.render()
    } else {
      this.hide()
      const cb = this.onDone
      this.onDone = null
      cb?.()
    }
  }

  hide() {
    this.visible = false
    this.container.setVisible(false)
    this.tapZone.disableInteractive() // 非表示時はマップ操作を妨げないよう入力を切る
  }

  isOpen(): boolean {
    return this.visible
  }

  private render() {
    const line = this.lines[this.index]
    this.speakerText.setText(line.speaker ?? '')
    this.bodyText.setText(line.text)
    const isLast = this.index >= this.lines.length - 1
    this.nextHint.setText(isLast ? '▼ はじめる（A / タップ）' : '▼ 送る（A / タップ）')

    // 1行ごとに軽くフェードイン（映画的な間）
    this.scene.tweens.killTweensOf([this.speakerText, this.bodyText])
    this.speakerText.setAlpha(0)
    this.bodyText.setAlpha(0)
    this.scene.tweens.add({
      targets: [this.speakerText, this.bodyText],
      alpha: 1,
      duration: 420,
      ease: 'Power2',
    })
  }
}
