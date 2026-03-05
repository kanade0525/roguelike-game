import { getFloorConfig, TILE } from '../data/maps'
import type { FloorConfig } from '../data/maps'

/**
 * フロア初期化・進行を管理する純粋ロジック
 * Phaserに依存しない
 */
export class FloorManager {
  getFloorConfig(floor: number): FloorConfig {
    return getFloorConfig(floor)
  }

  isStairs(map: number[][], x: number, y: number): boolean {
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false
    return map[y][x] === TILE.STAIRS
  }
}
