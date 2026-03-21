interface Position {
  x: number
  y: number
}

type AIState = 'idle' | 'chase' | 'attack'

export interface EnemyWithState {
  x: number
  y: number
  type: string
  aiState: AIState
}

export type EnemyAction =
  | { type: 'move'; position: Position; newAIState: AIState }
  | { type: 'attack'; newAIState: AIState }
  | { type: 'idle'; newAIState: AIState }

const DIRECTIONS = [
  { dx: 0, dy: -1 }, // 上
  { dx: 0, dy: 1 }, // 下
  { dx: -1, dy: 0 }, // 左
  { dx: 1, dy: 0 }, // 右
]

const AI_CONFIG: Record<string, { detectRange: number; chaseRange: number }> = {
  skeleton: { detectRange: 4, chaseRange: 6 },
  goblin: { detectRange: 6, chaseRange: 8 },
}

function getAIConfig(type: string) {
  return AI_CONFIG[type] ?? { detectRange: 4, chaseRange: 6 }
}

function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}

export function isAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

/**
 * ランダム移動AI
 * 4方向からランダムに移動先を選ぶ。壁・範囲外・占有済みマスは避ける。
 */
export function randomMove(
  enemy: Position,
  map: number[][],
  occupied: Position[]
): Position | null {
  if (map.length === 0 || map[0].length === 0) return null

  const shuffled = [...DIRECTIONS].sort(() => Math.random() - 0.5)

  for (const { dx, dy } of shuffled) {
    const nx = enemy.x + dx
    const ny = enemy.y + dy

    if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) continue
    if (map[ny][nx] === 1) continue
    if (occupied.some((p) => p.x === nx && p.y === ny)) continue

    return { x: nx, y: ny }
  }

  return null
}

/**
 * プレイヤー方向への貪欲移動
 * dx/dyの大きい方を優先し、壁ならもう一方を試行
 */
export function moveToward(
  enemy: Position,
  target: Position,
  map: number[][],
  occupied: Position[]
): Position | null {
  const dx = target.x - enemy.x
  const dy = target.y - enemy.y

  // 優先方向を決定（距離が大きい軸を先に試す）
  const candidates: { nx: number; ny: number }[] = []

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx !== 0) candidates.push({ nx: enemy.x + Math.sign(dx), ny: enemy.y })
    if (dy !== 0) candidates.push({ nx: enemy.x, ny: enemy.y + Math.sign(dy) })
  } else {
    if (dy !== 0) candidates.push({ nx: enemy.x, ny: enemy.y + Math.sign(dy) })
    if (dx !== 0) candidates.push({ nx: enemy.x + Math.sign(dx), ny: enemy.y })
  }

  for (const { nx, ny } of candidates) {
    if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) continue
    if (map[ny][nx] === 1) continue
    if (occupied.some((p) => p.x === nx && p.y === ny)) continue
    return { x: nx, y: ny }
  }

  return null
}

/**
 * 敵の行動決定（状態機械）
 */
export function decideAction(
  enemy: EnemyWithState,
  playerPos: Position,
  map: number[][],
  occupied: Position[]
): EnemyAction {
  const config = getAIConfig(enemy.type)
  const dist = chebyshevDistance(enemy, playerPos)
  let state = enemy.aiState

  // 状態遷移
  if (state === 'idle' && dist <= config.detectRange) {
    state = 'chase'
  } else if (state === 'chase' && dist > config.chaseRange) {
    state = 'idle'
  }

  // 隣接ならattack
  if (isAdjacent(enemy, playerPos)) {
    return { type: 'attack', newAIState: 'chase' }
  }

  // chase状態: プレイヤーに向かって移動
  if (state === 'chase') {
    const pos = moveToward(enemy, playerPos, map, occupied)
    if (pos) {
      return { type: 'move', position: pos, newAIState: 'chase' }
    }
    return { type: 'idle', newAIState: 'chase' }
  }

  // idle状態: ランダム移動
  const pos = randomMove(enemy, map, occupied)
  if (pos) {
    return { type: 'move', position: pos, newAIState: 'idle' }
  }
  return { type: 'idle', newAIState: 'idle' }
}
