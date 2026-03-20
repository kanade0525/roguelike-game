import { describe, it, expect } from 'vitest'
import { randomMove } from '../../../game/systems/EnemyAI'

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
      // (1,1)の左と上は壁
      for (let i = 0; i < 50; i++) {
        const result = randomMove({ x: 1, y: 1 }, map, [])
        if (result) {
          expect(map[result.y][result.x]).toBe(0)
        }
      }
    })

    it('占有済みマスには移動しない', () => {
      const occupied = [
        { x: 2, y: 1 },
        { x: 1, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 3 },
      ]
      const result = randomMove({ x: 2, y: 2 }, map, occupied)
      expect(result).toBeNull()
    })

    it('移動先は隣接マス（距離1）である', () => {
      const pos = { x: 2, y: 2 }
      const result = randomMove(pos, map, [])
      if (result) {
        const dx = Math.abs(result.x - pos.x)
        const dy = Math.abs(result.y - pos.y)
        expect(dx + dy).toBe(1)
      }
    })

    it('空マップでnullを返す', () => {
      const result = randomMove({ x: 0, y: 0 }, [], [])
      expect(result).toBeNull()
    })
  })
})
