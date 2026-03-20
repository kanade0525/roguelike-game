import { describe, it, expect } from 'vitest'
import { getFloorDifficulty } from '../../../game/data/floorConfig'

describe('floorConfig', () => {
  describe('getFloorDifficulty (forest)', () => {
    it('1Fの敵数が2', () => {
      const config = getFloorDifficulty(1, 'forest')
      expect(config.enemyCount).toBe(2)
    })

    it('4Fの敵数が5', () => {
      const config = getFloorDifficulty(4, 'forest')
      expect(config.enemyCount).toBe(5)
    })

    it('マップサイズが基準+成長', () => {
      const config = getFloorDifficulty(1, 'forest')
      expect(config.mapWidth).toBe(32) // 30 + 1*2
      expect(config.mapHeight).toBe(32)
    })

    it('ボスフロア判定', () => {
      expect(getFloorDifficulty(4, 'forest').isBossFloor).toBe(false)
      expect(getFloorDifficulty(5, 'forest').isBossFloor).toBe(true)
    })

    it('固定フロア判定', () => {
      expect(getFloorDifficulty(4, 'forest').isFixedFloor).toBe(false)
      expect(getFloorDifficulty(5, 'forest').isFixedFloor).toBe(true)
    })

    it('全フロアでスライムのみ', () => {
      for (let f = 1; f <= 5; f++) {
        const config = getFloorDifficulty(f, 'forest')
        expect(config.enemyTypes.every((e) => e.type === 'slime')).toBe(true)
      }
    })
  })

  describe('getFloorDifficulty (castle)', () => {
    it('4F以降でゴブリンが出現', () => {
      const config = getFloorDifficulty(4, 'castle')
      expect(config.enemyTypes.some((e) => e.type === 'goblin')).toBe(true)
    })

    it('8Fがボスフロア', () => {
      expect(getFloorDifficulty(8, 'castle').isBossFloor).toBe(true)
    })
  })

  describe('getFloorDifficulty (abyss)', () => {
    it('8F以降はゴブリンのみ', () => {
      const config = getFloorDifficulty(8, 'abyss')
      expect(config.enemyTypes.every((e) => e.type === 'goblin')).toBe(true)
    })

    it('10Fがボスフロア', () => {
      expect(getFloorDifficulty(10, 'abyss').isBossFloor).toBe(true)
    })
  })

  describe('境界値', () => {
    it('floor=0でもエラーにならない', () => {
      const config = getFloorDifficulty(0, 'forest')
      expect(config.enemyCount).toBeDefined()
    })

    it('負のfloorでもエラーにならない', () => {
      const config = getFloorDifficulty(-5, 'forest')
      expect(config.enemyCount).toBeDefined()
    })

    it('デフォルトダンジョンIDで動作する', () => {
      const config = getFloorDifficulty(1)
      expect(config.enemyCount).toBeDefined()
    })

    it('不明なダンジョンIDでフォールバック', () => {
      const config = getFloorDifficulty(1, 'unknown')
      expect(config.enemyCount).toBeDefined()
    })
  })
})
