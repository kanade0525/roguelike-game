import { getDungeon, DEFAULT_DUNGEON_ID } from '../dungeon'

export interface FloorDifficultyConfig {
  enemyCount: number
  itemCount: number
  mapWidth: number
  mapHeight: number
  enemyTypes: { type: string; weight: number }[]
  itemTypes: { itemId: string; weight: number }[]
  isBossFloor: boolean
  isFixedFloor: boolean
}

export function getFloorDifficulty(
  floor: number,
  dungeonId: string = DEFAULT_DUNGEON_ID
): FloorDifficultyConfig {
  const dungeon = getDungeon(dungeonId)
  const normalizedFloor = Math.max(1, Math.floor(floor))
  const floorIndex = Math.min(normalizedFloor - 1, dungeon.floors.length - 1)
  const floorConfig = dungeon.floors[floorIndex]

  const isBossFloor = floorConfig.isBossFloor ?? false
  const isFixedFloor = floorConfig.fixedMap != null

  return {
    enemyCount: floorConfig.enemies.count,
    itemCount: floorConfig.items.count,
    mapWidth: floorConfig.mapSize.w,
    mapHeight: floorConfig.mapSize.h,
    enemyTypes: floorConfig.enemies.types,
    itemTypes: floorConfig.items.types,
    isBossFloor,
    isFixedFloor,
  }
}
