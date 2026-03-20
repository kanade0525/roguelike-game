import { describe, it, expect } from 'vitest'
import { generateFloor } from '../../../game/systems/DungeonGenerator'
import { TILE } from '../../../game/data/maps'

const defaultOptions = {
  width: 30,
  height: 30,
  floor: 1,
  enemyCount: 3,
  itemCount: 2,
  enemyTypes: [{ type: 'slime', weight: 1 }],
  itemTypes: [{ itemId: 'sword', weight: 1 }],
}

describe('DungeonGenerator', () => {
  describe('generateFloor', () => {
    it('生成されたマップが指定サイズである', () => {
      const result = generateFloor(defaultOptions)
      expect(result.map.length).toBe(30)
      expect(result.map[0].length).toBe(30)
    })

    it('床タイルが存在する', () => {
      const result = generateFloor(defaultOptions)
      const hasFloor = result.map.some((row) => row.some((tile) => tile === TILE.FLOOR))
      expect(hasFloor).toBe(true)
    })

    it('階段タイルが1つだけ存在する', () => {
      const result = generateFloor(defaultOptions)
      let stairsCount = 0
      for (const row of result.map) {
        for (const tile of row) {
          if (tile === TILE.STAIRS) stairsCount++
        }
      }
      expect(stairsCount).toBe(1)
    })

    it('プレイヤー開始位置が床タイルである', () => {
      const result = generateFloor(defaultOptions)
      const { x, y } = result.playerStart
      expect(result.map[y][x]).toBe(TILE.FLOOR)
    })

    it('階段位置がSTAIRSタイルである', () => {
      const result = generateFloor(defaultOptions)
      const { x, y } = result.stairsPosition
      expect(result.map[y][x]).toBe(TILE.STAIRS)
    })

    it('プレイヤーと階段が異なる位置にある', () => {
      const result = generateFloor(defaultOptions)
      const { playerStart, stairsPosition } = result
      expect(playerStart.x !== stairsPosition.x || playerStart.y !== stairsPosition.y).toBe(true)
    })

    it('部屋が最低1つ生成される', () => {
      const result = generateFloor(defaultOptions)
      expect(result.rooms.length).toBeGreaterThanOrEqual(1)
    })

    it('要求した数の敵が配置される（候補が十分な場合）', () => {
      const result = generateFloor(defaultOptions)
      expect(result.enemies.length).toBe(3)
    })

    it('要求した数のアイテムが配置される（候補が十分な場合）', () => {
      const result = generateFloor(defaultOptions)
      expect(result.items.length).toBe(2)
    })

    it('敵がプレイヤー周辺2マス以内にいない', () => {
      const result = generateFloor(defaultOptions)
      for (const enemy of result.enemies) {
        const dx = Math.abs(enemy.x - result.playerStart.x)
        const dy = Math.abs(enemy.y - result.playerStart.y)
        expect(dx > 2 || dy > 2).toBe(true)
      }
    })

    it('全敵が床タイルに配置される', () => {
      const result = generateFloor(defaultOptions)
      for (const enemy of result.enemies) {
        expect(result.map[enemy.y][enemy.x]).toBe(TILE.FLOOR)
      }
    })

    it('全アイテムが床タイルに配置される', () => {
      const result = generateFloor(defaultOptions)
      for (const item of result.items) {
        expect(result.map[item.y][item.x]).toBe(TILE.FLOOR)
      }
    })

    it('敵同士の座標が重複しない', () => {
      const result = generateFloor(defaultOptions)
      const positions = result.enemies.map((e) => `${e.x},${e.y}`)
      expect(new Set(positions).size).toBe(positions.length)
    })

    it('敵IDがユニークである', () => {
      const result = generateFloor(defaultOptions)
      const ids = result.enemies.map((e) => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('フロア5以降で大きいマップを生成できる', () => {
      const result = generateFloor({ ...defaultOptions, width: 40, height: 40, floor: 5 })
      expect(result.map.length).toBe(40)
      expect(result.map[0].length).toBe(40)
    })

    it('敵数0でも正常に動作する', () => {
      const result = generateFloor({ ...defaultOptions, enemyCount: 0 })
      expect(result.enemies.length).toBe(0)
    })

    it('アイテム数0でも正常に動作する', () => {
      const result = generateFloor({ ...defaultOptions, itemCount: 0 })
      expect(result.items.length).toBe(0)
    })
  })
})
