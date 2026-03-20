import { getDungeonType, DEFAULT_DUNGEON_ID } from './dungeonTypes'
import type { DungeonType } from './dungeonTypes'

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
  dungeonId: string = DEFAULT_DUNGEON_ID,
): FloorDifficultyConfig {
  const dungeon = getDungeonType(dungeonId)
  const normalizedFloor = Math.max(1, Math.floor(floor))

  const isBossFloor = dungeon.bossFloor === normalizedFloor
  const isFixedFloor = dungeon.fixedFloors?.[normalizedFloor] != null

  const floorIndex = Math.min(normalizedFloor - 1, dungeon.enemiesPerFloor.length - 1)
  const enemyCount = dungeon.enemiesPerFloor[floorIndex]
  const itemCount = dungeon.itemsPerFloor[Math.min(floorIndex, dungeon.itemsPerFloor.length - 1)]

  const mapWidth = Math.min(dungeon.baseMapSize.w + normalizedFloor * dungeon.mapGrowth, dungeon.maxMapSize)
  const mapHeight = Math.min(dungeon.baseMapSize.h + normalizedFloor * dungeon.mapGrowth, dungeon.maxMapSize)

  const enemyTypes = getEnemyTypesForFloor(dungeon, normalizedFloor)
  const itemTypes = [{ itemId: 'sword', weight: 1 }]

  return { enemyCount, itemCount, mapWidth, mapHeight, enemyTypes, itemTypes, isBossFloor, isFixedFloor }
}

function getEnemyTypesForFloor(
  dungeon: DungeonType,
  floor: number,
): { type: string; weight: number }[] {
  for (const config of dungeon.enemyTypes) {
    if (floor >= config.floorRange[0] && floor <= config.floorRange[1]) {
      return config.enemies
    }
  }
  // フォールバック: 最後の設定を使用
  const last = dungeon.enemyTypes[dungeon.enemyTypes.length - 1]
  return last?.enemies ?? [{ type: 'slime', weight: 1 }]
}
