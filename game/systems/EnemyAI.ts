import { canMoveDiagonally } from './movement'

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
  { dx: -1, dy: -1 }, // 左上
  { dx: 1, dy: -1 }, // 右上
  { dx: -1, dy: 1 }, // 左下
  { dx: 1, dy: 1 }, // 右下
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
  // Chebyshev 距離 1（縦横斜めの隣接すべて true、同一マスは false）
  return dx <= 1 && dy <= 1 && dx + dy > 0
}

/**
 * 指定マスへ移動可能か判定する（範囲外・壁・占有・斜め角抜けを排除）。
 */
function canEnter(
  enemy: Position,
  nx: number,
  ny: number,
  map: number[][],
  occupied: Position[]
): boolean {
  if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) return false
  if (map[ny][nx] === 1) return false
  if (occupied.some((p) => p.x === nx && p.y === ny)) return false
  const dx = nx - enemy.x
  const dy = ny - enemy.y
  // 斜め移動時は壁角のすり抜けを禁止
  if (dx !== 0 && dy !== 0 && !canMoveDiagonally(map, enemy.x, enemy.y, dx, dy)) return false
  return true
}

/**
 * ランダム移動AI
 * 8方向からランダムに移動先を選ぶ。壁・範囲外・占有済みマス・斜め角抜けは避ける。
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
    if (canEnter(enemy, nx, ny, map, occupied)) {
      return { x: nx, y: ny }
    }
  }

  return null
}

/**
 * プレイヤー方向への貪欲移動（8方向）
 * まず斜めを含めた理想方向を試し、塞がれていれば直交方向へフォールバックする。
 */
export function moveToward(
  enemy: Position,
  target: Position,
  map: number[][],
  occupied: Position[]
): Position | null {
  const dx = target.x - enemy.x
  const dy = target.y - enemy.y
  const sx = Math.sign(dx)
  const sy = Math.sign(dy)

  const candidates: { nx: number; ny: number }[] = []

  // 1. 斜め方向（両軸ともズレている場合）
  if (sx !== 0 && sy !== 0) {
    candidates.push({ nx: enemy.x + sx, ny: enemy.y + sy })
  }

  // 2. 直交方向フォールバック（距離が大きい軸を優先）
  const straightX = { nx: enemy.x + sx, ny: enemy.y }
  const straightY = { nx: enemy.x, ny: enemy.y + sy }
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (sx !== 0) candidates.push(straightX)
    if (sy !== 0) candidates.push(straightY)
  } else {
    if (sy !== 0) candidates.push(straightY)
    if (sx !== 0) candidates.push(straightX)
  }

  for (const { nx, ny } of candidates) {
    if (canEnter(enemy, nx, ny, map, occupied)) {
      return { x: nx, y: ny }
    }
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
