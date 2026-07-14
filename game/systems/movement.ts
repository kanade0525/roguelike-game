import { TILE } from '../data/maps'

/**
 * 指定座標が壁（または範囲外）かどうかを判定する。
 * 範囲外は壁扱い（移動をブロックする）。
 */
function isBlocking(map: number[][], x: number, y: number): boolean {
  if (map.length === 0 || map[0].length === 0) return true
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return true
  return map[y][x] === TILE.WALL
}

/**
 * 斜め移動時の「壁角すり抜け（corner-cut）」を禁止するための判定。
 *
 * 斜め (dx≠0 かつ dy≠0) に移動しようとするとき、移動元から見て
 * 隣接する2つの直交マス（横方向・縦方向）のいずれかが壁（または範囲外）なら
 * 斜め移動を許可しない。直交移動（縦横）の場合は常に true を返す。
 *
 * @param map   マップ（0=床/2=階段=通行可, 1=壁）
 * @param fromX 移動元 X
 * @param fromY 移動元 Y
 * @param dx    X 方向の移動量 (-1|0|1)
 * @param dy    Y 方向の移動量 (-1|0|1)
 * @returns 斜め移動が許可されるなら true
 */
export function canMoveDiagonally(
  map: number[][],
  fromX: number,
  fromY: number,
  dx: number,
  dy: number
): boolean {
  // 斜めでなければ corner-cut の概念は無い
  if (dx === 0 || dy === 0) return true

  // 横隣・縦隣のどちらかが壁なら斜めに抜けられない
  if (isBlocking(map, fromX + dx, fromY)) return false
  if (isBlocking(map, fromX, fromY + dy)) return false
  return true
}
