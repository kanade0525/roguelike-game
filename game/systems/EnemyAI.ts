interface Position {
  x: number
  y: number
}

const DIRECTIONS = [
  { dx: 0, dy: -1 }, // 上
  { dx: 0, dy: 1 }, // 下
  { dx: -1, dy: 0 }, // 左
  { dx: 1, dy: 0 }, // 右
]

/**
 * ランダム移動AI
 * 4方向からランダムに移動先を選ぶ。壁・範囲外・占有済みマスは避ける。
 */
export function randomMove(
  enemy: Position,
  map: number[][],
  occupied: Position[],
): Position | null {
  if (map.length === 0 || map[0].length === 0) return null

  const shuffled = [...DIRECTIONS].sort(() => Math.random() - 0.5)

  for (const { dx, dy } of shuffled) {
    const nx = enemy.x + dx
    const ny = enemy.y + dy

    // 範囲外チェック
    if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) continue
    // 壁チェック
    if (map[ny][nx] === 1) continue
    // 他エンティティとの重複チェック
    if (occupied.some((p) => p.x === nx && p.y === ny)) continue

    return { x: nx, y: ny }
  }

  return null
}
