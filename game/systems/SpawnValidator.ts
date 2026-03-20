import { TILE } from '../data/maps'

interface Position {
  x: number
  y: number
}

/**
 * 指定座標がスポーン可能かチェックする
 * - 床タイルであること（壁・階段はNG）
 * - プレイヤーの周囲1マス以内でないこと
 * - 占有済み座標（他の敵・アイテム）と重ならないこと
 */
export function isValidSpawnPosition(
  x: number,
  y: number,
  map: number[][],
  playerStart: Position,
  occupied: Position[],
): boolean {
  // マップ範囲チェック
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false

  // 床タイルのみ（壁・階段はNG）
  if (map[y][x] !== TILE.FLOOR) return false

  // プレイヤー周囲1マス以内はNG
  if (Math.abs(x - playerStart.x) <= 1 && Math.abs(y - playerStart.y) <= 1) return false

  // 占有済み座標と重複NG
  if (occupied.some((pos) => pos.x === x && pos.y === y)) return false

  return true
}

/**
 * 有効なスポーン位置を探す
 * 指定位置が無効な場合、マップ上の有効な床タイルからランダムに選ぶ
 */
export function findValidSpawnPosition(
  preferredX: number,
  preferredY: number,
  map: number[][],
  playerStart: Position,
  occupied: Position[],
): Position | null {
  // 指定位置が有効ならそのまま返す
  if (isValidSpawnPosition(preferredX, preferredY, map, playerStart, occupied)) {
    return { x: preferredX, y: preferredY }
  }

  // 有効な候補をすべて収集
  const candidates: Position[] = []
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (isValidSpawnPosition(x, y, map, playerStart, occupied)) {
        candidates.push({ x, y })
      }
    }
  }

  if (candidates.length === 0) return null

  // ランダムに選択
  return candidates[Math.floor(Math.random() * candidates.length)]
}
