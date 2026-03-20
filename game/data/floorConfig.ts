import gameConfig from './gameConfig.json'

export interface FloorDifficultyConfig {
  enemyCount: number
  itemCount: number
  mapWidth: number
  mapHeight: number
  enemyTypes: { type: string; weight: number }[]
  itemTypes: { itemId: string; weight: number }[]
}

export function getFloorDifficulty(floor: number): FloorDifficultyConfig {
  const { enemiesPerFloor } = gameConfig.dungeonConfig
  const normalizedFloor = Math.max(1, Math.floor(floor))
  const floorIndex = Math.min(normalizedFloor - 1, enemiesPerFloor.length - 1)
  const enemyCount = enemiesPerFloor[floorIndex]
  const itemCount = Math.min(1 + Math.floor(normalizedFloor / 2), 4)

  const mapWidth = Math.min(30 + normalizedFloor * 2, 50)
  const mapHeight = Math.min(30 + normalizedFloor * 2, 50)

  // 階層が深くなるほどゴブリンの比率が上がる
  const enemyTypes: { type: string; weight: number }[] =
    floor <= 3
      ? [{ type: 'slime', weight: 1 }]
      : floor <= 6
        ? [
            { type: 'slime', weight: 1 },
            { type: 'goblin', weight: 1 },
          ]
        : [
            { type: 'slime', weight: 1 },
            { type: 'goblin', weight: 3 },
          ]

  const itemTypes = [{ itemId: 'sword', weight: 1 }]

  return { enemyCount, itemCount, mapWidth, mapHeight, enemyTypes, itemTypes }
}
