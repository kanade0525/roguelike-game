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
// FOVインスタンスはマップ（配列参照）が変わらない限り使い回す。
// currentMap はフロア/生成ごとに新しい配列参照へ差し替わるため、参照比較でキャッシュを無効化できる。
// これにより毎移動での PreciseShadowcasting 再生成コストを避ける。
let cachedMap: number[][] | null = null
let cachedFov: InstanceType<typeof FOV.PreciseShadowcasting> | null = null

export function computeVisible(map: number[][], x: number, y: number, range: number): Set<string> {
  const visible = new Set<string>()
  if (map.length === 0 || map[0].length === 0) return visible

  const height = map.length
  const width = map[0].length

  const inBounds = (px: number, py: number): boolean =>
    px >= 0 && px < width && py >= 0 && py < height

  if (map !== cachedMap || cachedFov === null) {
    // 光が通る = マップ範囲内かつ壁でない
    const lightPasses = (px: number, py: number): boolean => {
      if (px < 0 || px >= width || py < 0 || py >= height) return false
      return map[py][px] !== TILE.WALL
    }
    cachedFov = new FOV.PreciseShadowcasting(lightPasses, { topology: 8 })
    cachedMap = map
  }

  // compute のコールバックは可視セル（visibility > 0）に対してのみ呼ばれる
  cachedFov.compute(x, y, range, (cx: number, cy: number) => {
    if (inBounds(cx, cy)) {
      visible.add(`${cx},${cy}`)
    }
  })

  return visible
}
