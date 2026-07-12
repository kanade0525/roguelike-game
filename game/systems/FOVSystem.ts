import { FOV } from 'rot-js'
import { TILE } from '../data/maps'

/**
 * プレイヤー視点からの可視タイル集合を計算する（純粋関数・Phaser非依存）。
 *
 * rot-js の PreciseShadowcasting (topology 8) を用いて 360度の視界を計算する。
 * 壁は光を通さない（＝その先を遮る）が、壁そのものは「見えている」タイルとして
 * 可視集合に含める（壁面の描画のため）。
 *
 * @param map   マップ（0=床 / 2=階段=光を通す, 1=壁=遮る）
 * @param x     視点 X（プレイヤー）
 * @param y     視点 Y（プレイヤー）
 * @param range 視界半径（Chebyshev距離）
 * @returns "x,y" 形式の可視座標の Set
 */
export function computeVisible(map: number[][], x: number, y: number, range: number): Set<string> {
  const visible = new Set<string>()
  if (map.length === 0 || map[0].length === 0) return visible

  const height = map.length
  const width = map[0].length

  const inBounds = (px: number, py: number): boolean =>
    px >= 0 && px < width && py >= 0 && py < height

  // 光が通る = マップ範囲内かつ壁でない
  const lightPasses = (px: number, py: number): boolean => {
    if (!inBounds(px, py)) return false
    return map[py][px] !== TILE.WALL
  }

  const fov = new FOV.PreciseShadowcasting(lightPasses, { topology: 8 })
  // compute のコールバックは可視セル（visibility > 0）に対してのみ呼ばれる
  fov.compute(x, y, range, (cx: number, cy: number) => {
    if (inBounds(cx, cy)) {
      visible.add(`${cx},${cy}`)
    }
  })

  return visible
}
