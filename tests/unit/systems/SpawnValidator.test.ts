import { describe, it, expect } from 'vitest'
import { isValidSpawnPosition, findValidSpawnPosition } from '../../../game/systems/SpawnValidator'
import { TILE } from '../../../game/data/maps'

const map = [
  [TILE.WALL, TILE.WALL, TILE.WALL, TILE.WALL, TILE.WALL],
  [TILE.WALL, TILE.FLOOR, TILE.FLOOR, TILE.FLOOR, TILE.WALL],
  [TILE.WALL, TILE.FLOOR, TILE.FLOOR, TILE.FLOOR, TILE.WALL],
  [TILE.WALL, TILE.FLOOR, TILE.FLOOR, TILE.STAIRS, TILE.WALL],
  [TILE.WALL, TILE.WALL, TILE.WALL, TILE.WALL, TILE.WALL],
]

const playerStart = { x: 1, y: 1 }

describe('SpawnValidator', () => {
  describe('isValidSpawnPosition', () => {
    it('床タイルで有効', () => {
      expect(isValidSpawnPosition(3, 1, map, playerStart, [])).toBe(true)
    })

    it('壁タイルは無効', () => {
      expect(isValidSpawnPosition(0, 0, map, playerStart, [])).toBe(false)
    })

    it('階段タイルは無効', () => {
      expect(isValidSpawnPosition(3, 3, map, playerStart, [])).toBe(false)
    })

    it('プレイヤー周囲1マスは無効', () => {
      expect(isValidSpawnPosition(2, 2, map, playerStart, [])).toBe(false)
      expect(isValidSpawnPosition(1, 2, map, playerStart, [])).toBe(false)
      expect(isValidSpawnPosition(2, 1, map, playerStart, [])).toBe(false)
    })

    it('プレイヤーから2マス離れていれば有効', () => {
      expect(isValidSpawnPosition(3, 1, map, playerStart, [])).toBe(true)
    })

    it('占有済み座標は無効', () => {
      expect(isValidSpawnPosition(3, 1, map, playerStart, [{ x: 3, y: 1 }])).toBe(false)
    })

    it('マップ範囲外は無効', () => {
      expect(isValidSpawnPosition(-1, 0, map, playerStart, [])).toBe(false)
      expect(isValidSpawnPosition(0, 5, map, playerStart, [])).toBe(false)
    })
  })

  describe('findValidSpawnPosition', () => {
    it('指定位置が有効ならそのまま返す', () => {
      const pos = findValidSpawnPosition(3, 1, map, playerStart, [])
      expect(pos).toEqual({ x: 3, y: 1 })
    })

    it('指定位置が無効なら別の有効な位置を返す', () => {
      const pos = findValidSpawnPosition(0, 0, map, playerStart, [])
      expect(pos).not.toBeNull()
      if (pos) {
        expect(map[pos.y][pos.x]).toBe(TILE.FLOOR)
      }
    })

    it('有効な位置がない場合はnullを返す', () => {
      const allOccupied = [
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 3 },
      ]
      const pos = findValidSpawnPosition(0, 0, map, playerStart, allOccupied)
      expect(pos).toBeNull()
    })
  })
})
