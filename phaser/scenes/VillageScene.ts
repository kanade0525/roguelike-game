import Phaser from 'phaser'
import { TILE } from '../../game/data/maps'
import { canMoveDiagonally } from '../../game/systems/movement'
import {
  VILLAGE_MAP,
  VILLAGE_PLAYER_START,
  VILLAGE_FACILITIES,
  facilityAt,
  type VillageFacility,
} from '../../game/village/villageMap'
import { Controller } from '../ui/Controller'

/**
 * 拠点(村)の歩けるシーン。ダンジョンのように8方向移動でき、施設タイルに乗る/A で
 * 施設UI（Vue モーダル）を開く。戦闘・敵・FOV・ターンは無い軽量シーン。
 * 施設の接触は store.villageFacility 経由で village.vue に伝える。
 */
export class VillageScene extends Phaser.Scene {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameStore: any = null

  private readonly map = VILLAGE_MAP
  private readonly mapW = VILLAGE_MAP[0].length
  private readonly mapH = VILLAGE_MAP.length

  private tileSize = 32
  private offsetX = 0
  private offsetY = 0

  private mapContainer!: Phaser.GameObjects.Container
  private entityContainer!: Phaser.GameObjects.Container
  private player!: Phaser.GameObjects.Sprite
  private goldText!: Phaser.GameObjects.Text

  private px = VILLAGE_PLAYER_START.x
  private py = VILLAGE_PLAYER_START.y

  // 8方向入力（同フレーム合成 / rAF）
  private static readonly MOVE_KEYS = [
    'ArrowUp',
    'KeyW',
    'ArrowDown',
    'KeyS',
    'ArrowLeft',
    'KeyA',
    'ArrowRight',
    'KeyD',
  ]
  private heldMoveKeys = new Set<string>()
  private pendingMove: { dx: number; dy: number } | null = null
  private movePending = false
  private moveRafId = 0

  private lastGold = -1

  constructor() {
    super({ key: 'VillageScene' })
  }

  preload() {
    for (let i = 1; i <= 8; i++) {
      this.load.image(`floor_${i}`, `/assets/tiles/floor_${i}.png`)
    }
    this.load.image('wall_mid', '/assets/tiles/wall_mid.png')
    for (let i = 0; i <= 3; i++) {
      this.load.image(`knight_f${i}`, `/assets/tiles/knight_m_idle_anim_f${i}.png`)
    }
  }

  create() {
    this.gameStore = this.game.registry.get('gameStore')
    this.px = VILLAGE_PLAYER_START.x
    this.py = VILLAGE_PLAYER_START.y
    this.gameStore?.setVillageFacility(null)

    this.calculateLayout()

    this.mapContainer = this.add.container(0, 0)
    this.entityContainer = this.add.container(0, 0)

    if (!this.anims.exists('knight_idle_anim')) {
      this.anims.create({
        key: 'knight_idle_anim',
        frames: [{ key: 'knight_f0' }, { key: 'knight_f1' }, { key: 'knight_f2' }, { key: 'knight_f3' }],
        frameRate: 6,
        repeat: -1,
      })
    }

    this.drawMap()
    this.drawPlayer()
    this.createHud()
    this.setupKeyboard()

    // 仮想コントローラ（ダンジョンと同じもの）。A/Enter で施設を開く。
    new Controller(
      this,
      (dx, dy) => this.tryMove(dx, dy),
      (action) => this.onAction(action)
    )
  }

  // 全マップをステータスバー(上)とコントローラ(下)の間に収める
  private calculateLayout() {
    const areaTop = 60
    const areaBottom = 430
    const availW = 480 - 24
    const availH = areaBottom - areaTop
    this.tileSize = Math.floor(Math.min(availW / this.mapW, availH / this.mapH))
    const mapPxW = this.tileSize * this.mapW
    const mapPxH = this.tileSize * this.mapH
    this.offsetX = Math.floor((480 - mapPxW) / 2)
    this.offsetY = areaTop + Math.floor((availH - mapPxH) / 2)
  }

  private cx(x: number): number {
    return this.offsetX + x * this.tileSize + this.tileSize / 2
  }

  private cy(y: number): number {
    return this.offsetY + y * this.tileSize + this.tileSize / 2
  }

  private drawMap() {
    this.mapContainer.removeAll(true)
    for (let y = 0; y < this.mapH; y++) {
      for (let x = 0; x < this.mapW; x++) {
        const sx = this.cx(x)
        const sy = this.cy(y)
        if (this.map[y][x] === TILE.WALL) {
          const wall = this.add.image(sx, sy, 'wall_mid').setDisplaySize(this.tileSize, this.tileSize)
          this.mapContainer.add(wall)
        } else {
          const key = `floor_${((x * 7 + y * 13) % 8) + 1}`
          const floor = this.add.image(sx, sy, key).setDisplaySize(this.tileSize, this.tileSize)
          this.mapContainer.add(floor)
        }
      }
    }
    // 施設マーカー（仮アセット: 色付き角丸 + ラベル）
    for (const f of VILLAGE_FACILITIES) {
      this.drawFacility(f)
    }
  }

  private drawFacility(f: VillageFacility) {
    const sx = this.cx(f.x)
    const sy = this.cy(f.y)
    const s = this.tileSize
    const g = this.add.graphics()
    g.fillStyle(f.color, 0.85)
    g.fillRoundedRect(sx - s / 2 + 3, sy - s / 2 + 3, s - 6, s - 6, 4)
    g.lineStyle(2, 0xffffff, 0.9)
    g.strokeRoundedRect(sx - s / 2 + 3, sy - s / 2 + 3, s - 6, s - 6, 4)
    this.mapContainer.add(g)
    const label = this.add
      .text(sx, sy + s / 2 + 7, f.label, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: '"DotGothic16", monospace',
      })
      .setOrigin(0.5, 0.5)
    this.mapContainer.add(label)
  }

  private drawPlayer() {
    this.player = this.add
      .sprite(this.cx(this.px), this.cy(this.py), 'knight_f0')
      .setDisplaySize(this.tileSize * 0.9, this.tileSize * 0.9)
      .play('knight_idle_anim')
    this.entityContainer.add(this.player)
  }

  private createHud() {
    this.add.rectangle(240, 30, 480, 52, 0x000000, 0.55).setOrigin(0.5, 0.5)
    this.add
      .text(16, 20, '拠点の村', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: '"DotGothic16", monospace',
      })
      .setOrigin(0, 0.5)
    this.goldText = this.add
      .text(464, 20, '', {
        fontSize: '14px',
        color: '#ffd700',
        fontFamily: '"DotGothic16", monospace',
      })
      .setOrigin(1, 0.5)
    // 前回リザルトの一言サマリ（生還/踏破/力尽きた）
    this.add
      .text(16, 41, this.formatLastRun(), {
        fontSize: '10px',
        color: '#9fe6b4',
        fontFamily: '"DotGothic16", monospace',
      })
      .setOrigin(0, 0.5)
    this.updateHud()
  }

  private formatLastRun(): string {
    const r = this.gameStore?.meta?.lastRun
    if (!r) return ''
    const label = r.result === 'escaped' ? '生還' : r.result === 'cleared' ? '踏破' : '力尽きた'
    const parts = [`前回: ${label} / B${r.floor}F`]
    if (r.goldBanked > 0) parts.push(`+${r.goldBanked}G`)
    if (r.goldLost > 0) parts.push(`-${r.goldLost}G`)
    if ((r.safeGold ?? 0) > 0) parts.push(`金庫 +${r.safeGold}G`)
    return parts.join(' ・ ')
  }

  private updateHud() {
    const gold = this.gameStore?.meta?.gold ?? 0
    this.goldText.setText(`${gold} G`)
    this.lastGold = gold
  }

  override update() {
    // 鍛冶などで gold が変わったら追従
    const gold = this.gameStore?.meta?.gold ?? 0
    if (gold !== this.lastGold) this.updateHud()
  }

  private modalOpen(): boolean {
    return !!this.gameStore?.villageFacility
  }

  // --- 入力 ---
  private setupKeyboard() {
    const keyboard = this.input.keyboard
    if (!keyboard) return
    keyboard.on('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        this.onAction('confirm')
        return
      }
      if (VillageScene.MOVE_KEYS.includes(e.code)) {
        this.heldMoveKeys.add(e.code)
        this.pendingMove = this.composeMoveDirection()
        this.scheduleMove()
      }
    })
    keyboard.on('keyup', (e: KeyboardEvent) => this.heldMoveKeys.delete(e.code))
    this.game.events.on(Phaser.Core.Events.BLUR, this.clearHeldMoveKeys, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.clearHeldMoveKeys, this)
      cancelAnimationFrame(this.moveRafId)
      this.heldMoveKeys.clear()
      this.pendingMove = null
      this.movePending = false
    })
  }

  private clearHeldMoveKeys() {
    this.heldMoveKeys.clear()
    this.pendingMove = null
  }

  private composeMoveDirection(): { dx: number; dy: number } {
    let dx = 0
    let dy = 0
    const k = this.heldMoveKeys
    if (k.has('ArrowUp') || k.has('KeyW')) dy -= 1
    if (k.has('ArrowDown') || k.has('KeyS')) dy += 1
    if (k.has('ArrowLeft') || k.has('KeyA')) dx -= 1
    if (k.has('ArrowRight') || k.has('KeyD')) dx += 1
    return { dx, dy }
  }

  private scheduleMove() {
    if (this.movePending) return
    this.movePending = true
    this.moveRafId = requestAnimationFrame(() => {
      this.movePending = false
      const m = this.pendingMove
      this.pendingMove = null
      if (m && (m.dx !== 0 || m.dy !== 0)) this.tryMove(m.dx, m.dy)
    })
  }

  private isWalkable(x: number, y: number): boolean {
    if (y < 0 || y >= this.mapH || x < 0 || x >= this.mapW) return false
    return this.map[y][x] !== TILE.WALL
  }

  private tryMove(dx: number, dy: number) {
    if (this.modalOpen()) return // モーダル表示中は移動しない
    const nx = this.px + dx
    const ny = this.py + dy
    if (!this.isWalkable(nx, ny)) return
    if (dx !== 0 && dy !== 0 && !canMoveDiagonally(this.map, this.px, this.py, dx, dy)) return
    this.px = nx
    this.py = ny
    this.player.setPosition(this.cx(this.px), this.cy(this.py))
    // 施設タイルに乗ったら開く
    const f = facilityAt(this.px, this.py)
    if (f) this.gameStore?.setVillageFacility(f.type)
  }

  private onAction(action: string) {
    if (action !== 'confirm') return // 村では A/Enter のみ使用（他ボタンは無効）
    if (this.modalOpen()) return
    // 足元の施設を開く（乗って閉じた後の再オープン用）
    const f = facilityAt(this.px, this.py)
    if (f) this.gameStore?.setVillageFacility(f.type)
  }
}
