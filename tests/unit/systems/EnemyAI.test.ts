import { describe, it, expect } from 'vitest'
import { randomMove, moveToward, isAdjacent, decideAction } from '../../../game/systems/EnemyAI'

const map = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
]

describe('EnemyAI', () => {
  describe('randomMove', () => {
    it('床タイルに移動する', () => {
      const result = randomMove({ x: 2, y: 2 }, map, [])
      expect(result).not.toBeNull()
      if (result) {
        expect(map[result.y][result.x]).toBe(0)
      }
    })

    it('壁には移動しない', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomMove({ x: 1, y: 1 }, map, [])
        if (result) {
          expect(map[result.y][result.x]).toBe(0)
        }
      }
    })

    it('周囲8マスすべて占有済みなら移動しない', () => {
      const occupied = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 1, y: 2 },
        { x: 3, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ]
      const result = randomMove({ x: 2, y: 2 }, map, occupied)
      expect(result).toBeNull()
    })

    it('移動先はChebyshev距離1（8方向の隣接）である', () => {
      const pos = { x: 2, y: 2 }
      const result = randomMove(pos, map, [])
      if (result) {
        const dx = Math.abs(result.x - pos.x)
        const dy = Math.abs(result.y - pos.y)
        expect(Math.max(dx, dy)).toBe(1)
      }
    })

    it('斜めを含む8方向に移動できる', () => {
      const seen = new Set<string>()
      for (let i = 0; i < 300; i++) {
        const result = randomMove({ x: 2, y: 2 }, map, [])
        if (result) seen.add(`${result.x - 2},${result.y - 2}`)
      }
      const diagonals = ['-1,-1', '1,-1', '-1,1', '1,1']
      expect(diagonals.some((d) => seen.has(d))).toBe(true)
    })

    it('空マップでnullを返す', () => {
      const result = randomMove({ x: 0, y: 0 }, [], [])
      expect(result).toBeNull()
    })
  })

  describe('isAdjacent', () => {
    it('縦横の隣接マスでtrue', () => {
      expect(isAdjacent({ x: 2, y: 2 }, { x: 3, y: 2 })).toBe(true)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 2, y: 3 })).toBe(true)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 1, y: 2 })).toBe(true)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 2, y: 1 })).toBe(true)
    })

    it('斜めの隣接マスでもtrue（8方向）', () => {
      expect(isAdjacent({ x: 2, y: 2 }, { x: 3, y: 3 })).toBe(true)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 1, y: 1 })).toBe(true)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 3, y: 1 })).toBe(true)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 1, y: 3 })).toBe(true)
    })

    it('Chebyshev距離2以上はfalse', () => {
      expect(isAdjacent({ x: 2, y: 2 }, { x: 4, y: 2 })).toBe(false)
      expect(isAdjacent({ x: 2, y: 2 }, { x: 4, y: 4 })).toBe(false)
    })

    it('同じ位置はfalse', () => {
      expect(isAdjacent({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(false)
    })
  })

  describe('moveToward', () => {
    it('ターゲット方向に近づく', () => {
      const result = moveToward({ x: 1, y: 1 }, { x: 3, y: 1 }, map, [])
      expect(result).toEqual({ x: 2, y: 1 })
    })

    it('壁で塞がれたらもう一方の軸を試す', () => {
      // 右が壁の場合、下に移動
      const narrowMap = [
        [1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
      ]
      const result = moveToward({ x: 1, y: 1 }, { x: 3, y: 2 }, narrowMap, [])
      expect(result).toEqual({ x: 1, y: 2 })
    })

    it('斜め方向へ直接近づく（8方向）', () => {
      const result = moveToward({ x: 1, y: 1 }, { x: 3, y: 3 }, map, [])
      expect(result).toEqual({ x: 2, y: 2 })
    })

    it('壁角をすり抜けず直交方向へフォールバックする', () => {
      // (1,1)から右下(2,2)へ行きたいが (2,1) が壁 → 斜め不可、(1,2)へ
      const cornerMap = [
        [1, 1, 1, 1],
        [1, 0, 1, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
      ]
      const result = moveToward({ x: 1, y: 1 }, { x: 2, y: 2 }, cornerMap, [])
      expect(result).toEqual({ x: 1, y: 2 })
    })

    it('候補マスがすべて塞がれたらnull', () => {
      const occupied = [
        { x: 2, y: 2 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
      ]
      const result = moveToward({ x: 1, y: 1 }, { x: 3, y: 3 }, map, occupied)
      expect(result).toBeNull()
    })
  })

  describe('decideAction', () => {
    it('idle + 検知範囲内 → chase + move', () => {
      const enemy = { x: 1, y: 1, type: 'skeleton', aiState: 'idle' as const }
      const action = decideAction(enemy, { x: 3, y: 1 }, map, [])
      expect(action.newAIState).toBe('chase')
      expect(action.type).toBe('move')
    })

    it('idle + 検知範囲外 → idle', () => {
      const bigMap = Array.from({ length: 20 }, () => Array(20).fill(0))
      const enemy = { x: 1, y: 1, type: 'skeleton', aiState: 'idle' as const }
      const action = decideAction(enemy, { x: 15, y: 15 }, bigMap, [])
      expect(action.newAIState).toBe('idle')
    })

    it('隣接 → attack', () => {
      const enemy = { x: 2, y: 2, type: 'skeleton', aiState: 'idle' as const }
      const action = decideAction(enemy, { x: 3, y: 2 }, map, [])
      expect(action.type).toBe('attack')
    })

    it('斜め隣接 → attack（8方向攻撃）', () => {
      const enemy = { x: 2, y: 2, type: 'skeleton', aiState: 'chase' as const }
      const action = decideAction(enemy, { x: 3, y: 3 }, map, [])
      expect(action.type).toBe('attack')
    })

    it('chase + 範囲外 → idle', () => {
      const bigMap = Array.from({ length: 20 }, () => Array(20).fill(0))
      const enemy = { x: 1, y: 1, type: 'skeleton', aiState: 'chase' as const }
      const action = decideAction(enemy, { x: 15, y: 15 }, bigMap, [])
      expect(action.newAIState).toBe('idle')
    })

    it('ゴブリンはスケルトンより広い検知範囲', () => {
      const bigMap = Array.from({ length: 20 }, () => Array(20).fill(0))
      // 距離5: スケルトン検知外(4)、ゴブリン検知内(6)
      const skeletonAction = decideAction(
        { x: 1, y: 1, type: 'skeleton', aiState: 'idle' as const },
        { x: 6, y: 1 },
        bigMap,
        []
      )
      const goblinAction = decideAction(
        { x: 1, y: 1, type: 'goblin', aiState: 'idle' as const },
        { x: 6, y: 1 },
        bigMap,
        []
      )
      expect(skeletonAction.newAIState).toBe('idle')
      expect(goblinAction.newAIState).toBe('chase')
    })
  })
})
