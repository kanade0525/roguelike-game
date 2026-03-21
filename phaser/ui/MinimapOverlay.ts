import type Phaser from 'phaser'
import { TILE } from '../../game/data/maps'

const COLORS = {
  wall: 0x444455,
  floor: 0x887766,
  stairs: 0xffcc00,
  player: 0x00ccff,
  enemy: 0xff4444,
  item: 0x44ff44,
  background: 0x111122,
}

export class MinimapOverlay {
  private scene: Phaser.Scene
  private container!: Phaser.GameObjects.Container
  private visible = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.container = scene.add.container(0, 0)
    this.container.setDepth(550)
    this.container.setVisible(false)
  }

  show(
    map: number[][],
    player: { x: number; y: number },
    enemies: { x: number; y: number }[],
    items: { x: number; y: number }[],
    exploredTiles: string[]
  ) {
    this.container.removeAll(true)

    if (map.length === 0 || map[0].length === 0) return

    const screenW = this.scene.scale.width
    // ゲームエリアのみ（コントローラー領域を除外）
    const gameAreaH = 486
    const gameAreaCenterY = gameAreaH / 2

    // 半透明背景（ゲームエリアのみ）
    const bg = this.scene.add.rectangle(
      screenW / 2,
      gameAreaCenterY,
      screenW,
      gameAreaH,
      0x000000,
      0.85
    )
    this.container.add(bg)

    const mapH = map.length
    const mapW = map[0].length

    // マップをゲームエリア内に収めるタイルサイズを計算
    const margin = 40
    const availW = screenW - margin * 2
    const availH = gameAreaH - margin * 2 - 40 // タイトル+凡例分
    const tileSize = Math.floor(Math.min(availW / mapW, availH / mapH))
    const clampedTileSize = Math.max(2, Math.min(tileSize, 12))

    const totalW = mapW * clampedTileSize
    const totalH = mapH * clampedTileSize
    const offsetX = Math.floor((screenW - totalW) / 2)
    const offsetY = Math.floor((gameAreaH - totalH) / 2) + 16

    // タイトル
    const title = this.scene.add.text(screenW / 2, offsetY - 24, 'マップ', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'DotGothic16',
    })
    title.setOrigin(0.5, 0.5)
    this.container.add(title)

    // 探索済み座標をSetに変換（高速検索用）
    const explored = new Set(exploredTiles)

    // マップ描画（探索済みのみ）
    const gfx = this.scene.add.graphics()

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const px = offsetX + x * clampedTileSize
        const py = offsetY + y * clampedTileSize

        if (!explored.has(`${x},${y}`)) {
          gfx.fillStyle(COLORS.background, 1)
          gfx.fillRect(px, py, clampedTileSize, clampedTileSize)
          continue
        }

        const tile = map[y][x]
        let color: number
        if (tile === TILE.WALL) {
          color = COLORS.wall
        } else if (tile === TILE.STAIRS) {
          color = COLORS.stairs
        } else {
          color = COLORS.floor
        }

        gfx.fillStyle(color, 1)
        gfx.fillRect(px, py, clampedTileSize, clampedTileSize)
      }
    }

    // アイテム（探索済みのみ）
    for (const item of items) {
      if (!explored.has(`${item.x},${item.y}`)) continue
      const px = offsetX + item.x * clampedTileSize
      const py = offsetY + item.y * clampedTileSize
      gfx.fillStyle(COLORS.item, 1)
      gfx.fillRect(px, py, clampedTileSize, clampedTileSize)
    }

    // 敵（探索済みのみ）
    for (const enemy of enemies) {
      if (!explored.has(`${enemy.x},${enemy.y}`)) continue
      const px = offsetX + enemy.x * clampedTileSize
      const py = offsetY + enemy.y * clampedTileSize
      gfx.fillStyle(COLORS.enemy, 1)
      gfx.fillRect(px, py, clampedTileSize, clampedTileSize)
    }

    // プレイヤー（常に表示）
    const ppx = offsetX + player.x * clampedTileSize
    const ppy = offsetY + player.y * clampedTileSize
    gfx.fillStyle(COLORS.player, 1)
    gfx.fillRect(ppx, ppy, clampedTileSize, clampedTileSize)

    this.container.add(gfx)

    // 凡例
    const legendY = offsetY + totalH + 12
    const legends = [
      { color: COLORS.player, label: 'プレイヤー' },
      { color: COLORS.enemy, label: '敵' },
      { color: COLORS.item, label: 'アイテム' },
      { color: COLORS.stairs, label: '階段' },
    ]
    const legendGfx = this.scene.add.graphics()
    let lx = offsetX
    for (const legend of legends) {
      legendGfx.fillStyle(legend.color, 1)
      legendGfx.fillRect(lx, legendY, 8, 8)
      const label = this.scene.add.text(lx + 12, legendY - 2, legend.label, {
        fontSize: '10px',
        color: '#cccccc',
        fontFamily: 'DotGothic16',
      })
      this.container.add(label)
      lx += label.width + 20
    }
    this.container.add(legendGfx)

    this.container.setVisible(true)
    this.visible = true
  }

  hide() {
    this.container.setVisible(false)
    this.container.removeAll(true)
    this.visible = false
  }

  isOpen(): boolean {
    return this.visible
  }
}
