import { describe, it, expect } from 'vitest'
import { getFloorDifficulty } from '../../../game/data/floorConfig'

describe('floorConfig', () => {
  describe('getFloorDifficulty (silentForest)', () => {
    it('1Fの敵数が2', () => {
      const config = getFloorDifficulty(1, 'silentForest')
      expect(config.enemyCount).toBe(2)
    })

    it('4Fの敵数が5', () => {
      const config = getFloorDifficulty(4, 'silentForest')
      expect(config.enemyCount).toBe(5)
    })

    it('フロアごとにマップサイズが設定される', () => {
      const config = getFloorDifficulty(1, 'silentForest')
      expect(config.mapWidth).toBe(30)
      expect(config.mapHeight).toBe(30)
    })

    it('ボスフロア判定', () => {
      expect(getFloorDifficulty(4, 'silentForest').isBossFloor).toBe(false)
      expect(getFloorDifficulty(5, 'silentForest').isBossFloor).toBe(true)
    })

    it('固定フロア判定', () => {
      expect(getFloorDifficulty(4, 'silentForest').isFixedFloor).toBe(false)
      expect(getFloorDifficulty(5, 'silentForest').isFixedFloor).toBe(true)
    })

    it('全フロアでスケルトンのみ', () => {
      for (let f = 1; f <= 5; f++) {
        const config = getFloorDifficulty(f, 'silentForest')
        expect(config.enemyTypes.every((e) => e.type === 'skeleton')).toBe(true)
      }
    })
  })

  describe('getFloorDifficulty (darkCastle)', () => {
    it('4F以降でゴブリンが出現', () => {
      const config = getFloorDifficulty(4, 'darkCastle')
      expect(config.enemyTypes.some((e) => e.type === 'goblin')).toBe(true)
    })

    it('8Fがボスフロア', () => {
      expect(getFloorDifficulty(8, 'darkCastle').isBossFloor).toBe(true)
    })
  })

  describe('getFloorDifficulty (abyss)', () => {
    it('8Fはゴブリンのみ', () => {
      const config = getFloorDifficulty(8, 'abyss')
      expect(config.enemyTypes.every((e) => e.type === 'goblin')).toBe(true)
    })

    it('10Fがボスフロア', () => {
      expect(getFloorDifficulty(10, 'abyss').isBossFloor).toBe(true)
    })
  })

  describe('境界値', () => {
    it('floor=0でもエラーにならない', () => {
      const config = getFloorDifficulty(0, 'silentForest')
      expect(config.enemyCount).toBeDefined()
    })

    it('負のfloorでもエラーにならない', () => {
      const config = getFloorDifficulty(-5, 'silentForest')
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
