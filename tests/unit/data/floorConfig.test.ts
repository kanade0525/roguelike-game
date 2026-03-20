import { describe, it, expect } from 'vitest'
import { getFloorDifficulty } from '../../../game/data/floorConfig'

describe('floorConfig', () => {
  describe('getFloorDifficulty', () => {
    it('1Fの敵数が3', () => {
      const config = getFloorDifficulty(1)
      expect(config.enemyCount).toBe(3)
    })

    it('10Fの敵数が15', () => {
      const config = getFloorDifficulty(10)
      expect(config.enemyCount).toBe(15)
    })

    it('1Fのマップサイズが32x32', () => {
      const config = getFloorDifficulty(1)
      expect(config.mapWidth).toBe(32)
      expect(config.mapHeight).toBe(32)
    })

    it('10Fのマップサイズが50x50（上限）', () => {
      const config = getFloorDifficulty(10)
      expect(config.mapWidth).toBe(50)
      expect(config.mapHeight).toBe(50)
    })

    it('1-3Fはスライムのみ', () => {
      for (let f = 1; f <= 3; f++) {
        const config = getFloorDifficulty(f)
        expect(config.enemyTypes).toEqual([{ type: 'slime', weight: 1 }])
      }
    })

    it('4-6Fでゴブリンが出現', () => {
      const config = getFloorDifficulty(4)
      expect(config.enemyTypes.some((e) => e.type === 'goblin')).toBe(true)
    })

    it('7F以降でゴブリンの比率が高い', () => {
      const config = getFloorDifficulty(7)
      const goblin = config.enemyTypes.find((e) => e.type === 'goblin')
      const slime = config.enemyTypes.find((e) => e.type === 'slime')
      expect(goblin!.weight).toBeGreaterThan(slime!.weight)
    })

    it('floor=0でもエラーにならない', () => {
      const config = getFloorDifficulty(0)
      expect(config.enemyCount).toBeDefined()
      expect(config.mapWidth).toBeGreaterThanOrEqual(32)
    })

    it('負のfloorでもエラーにならない', () => {
      const config = getFloorDifficulty(-5)
      expect(config.enemyCount).toBeDefined()
    })

    it('上限を超えるfloorで最大値が返る', () => {
      const config = getFloorDifficulty(100)
      expect(config.enemyCount).toBe(15)
      expect(config.mapWidth).toBe(50)
    })
  })
})
