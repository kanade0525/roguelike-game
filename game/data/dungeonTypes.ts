import { TILE } from './maps'
import type { TileType } from './maps'

export interface FloorEnemyConfig {
  floorRange: [number, number] // [from, to] (inclusive)
  enemies: { type: string; weight: number }[]
}

export interface FixedFloorConfig {
  map: TileType[][]
  playerStart: { x: number; y: number }
  stairsPosition?: { x: number; y: number } // ボス最終階はなし
  enemies: { type: string; x: number; y: number }[]
  items: { itemId: string; x: number; y: number }[]
}

export interface DungeonType {
  id: string
  name: string
  totalFloors: number
  baseMapSize: { w: number; h: number }
  mapGrowth: number // フロアごとのマップサイズ増加
  maxMapSize: number
  enemiesPerFloor: number[]
  itemsPerFloor: number[]
  enemyTypes: FloorEnemyConfig[]
  bossFloor?: number
  fixedFloors?: Record<number, FixedFloorConfig>
}

// --- ボスマップ定義 ---

const W = TILE.WALL
const F = TILE.FLOOR
const S = TILE.STAIRS

// 森の迷宮 5Fボス: 小さなアリーナ
const forestBossMap: TileType[][] = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W],
  [W, W, W, W, F, F, F, F, F, W, W, W, W],
  [W, W, W, F, F, F, F, F, F, F, W, W, W],
  [W, W, F, F, F, F, F, F, F, F, F, W, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, W, F, F, F, F, F, F, F, F, F, W, W],
  [W, W, W, F, F, F, F, F, F, F, W, W, W],
  [W, W, W, W, F, F, S, F, F, W, W, W, W],
  [W, W, W, W, W, W, W, W, W, W, W, W, W],
]

// 王城 8Fボス: 広い玉座の間
const castleBossMap: TileType[][] = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, W, F, F, F, F, F, F, F, W, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, W, F, F, F, F, F, F, F, W, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, S, F, F, F, F, F, F, W],
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
]

// 深淵 10Fボス: 巨大な円形アリーナ
const abyssBossMap: TileType[][] = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
  [W, W, W, W, W, F, F, F, F, F, F, F, W, W, W, W, W],
  [W, W, W, F, F, F, F, F, F, F, F, F, F, F, W, W, W],
  [W, W, F, F, F, F, F, F, F, F, F, F, F, F, F, W, W],
  [W, W, F, F, F, F, F, F, F, F, F, F, F, F, F, W, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
  [W, W, F, F, F, F, F, F, F, F, F, F, F, F, F, W, W],
  [W, W, F, F, F, F, F, F, F, F, F, F, F, F, F, W, W],
  [W, W, W, F, F, F, F, F, F, F, F, F, F, F, W, W, W],
  [W, W, W, W, W, F, F, F, S, F, F, F, W, W, W, W, W],
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
]

// --- ダンジョン定義 ---

export const DUNGEON_TYPES: Record<string, DungeonType> = {
  forest: {
    id: 'forest',
    name: '森の迷宮',
    totalFloors: 5,
    baseMapSize: { w: 30, h: 30 },
    mapGrowth: 2,
    maxMapSize: 40,
    enemiesPerFloor: [2, 3, 4, 5, 0], // ボスフロアは固定配置
    itemsPerFloor: [1, 1, 2, 2, 0],
    enemyTypes: [
      { floorRange: [1, 5], enemies: [{ type: 'slime', weight: 1 }] },
    ],
    bossFloor: 5,
    fixedFloors: {
      5: {
        map: forestBossMap,
        playerStart: { x: 6, y: 10 },
        stairsPosition: { x: 6, y: 11 },
        enemies: [{ type: 'slime', x: 6, y: 4 }],
        items: [],
      },
    },
  },
  castle: {
    id: 'castle',
    name: '王城',
    totalFloors: 8,
    baseMapSize: { w: 35, h: 35 },
    mapGrowth: 2,
    maxMapSize: 50,
    enemiesPerFloor: [3, 4, 5, 6, 7, 8, 9, 0],
    itemsPerFloor: [1, 1, 2, 2, 3, 3, 3, 0],
    enemyTypes: [
      { floorRange: [1, 3], enemies: [{ type: 'slime', weight: 1 }] },
      {
        floorRange: [4, 8],
        enemies: [
          { type: 'slime', weight: 1 },
          { type: 'goblin', weight: 2 },
        ],
      },
    ],
    bossFloor: 8,
    fixedFloors: {
      8: {
        map: castleBossMap,
        playerStart: { x: 7, y: 10 },
        stairsPosition: { x: 7, y: 11 },
        enemies: [{ type: 'goblin', x: 7, y: 3 }],
        items: [],
      },
    },
  },
  abyss: {
    id: 'abyss',
    name: '深淵',
    totalFloors: 10,
    baseMapSize: { w: 40, h: 40 },
    mapGrowth: 1,
    maxMapSize: 50,
    enemiesPerFloor: [5, 6, 7, 8, 9, 10, 11, 12, 14, 0],
    itemsPerFloor: [1, 2, 2, 2, 3, 3, 3, 4, 4, 0],
    enemyTypes: [
      {
        floorRange: [1, 3],
        enemies: [
          { type: 'slime', weight: 2 },
          { type: 'goblin', weight: 1 },
        ],
      },
      {
        floorRange: [4, 7],
        enemies: [
          { type: 'slime', weight: 1 },
          { type: 'goblin', weight: 3 },
        ],
      },
      {
        floorRange: [8, 10],
        enemies: [{ type: 'goblin', weight: 1 }],
      },
    ],
    bossFloor: 10,
    fixedFloors: {
      10: {
        map: abyssBossMap,
        playerStart: { x: 8, y: 14 },
        stairsPosition: { x: 8, y: 15 },
        enemies: [{ type: 'goblin', x: 8, y: 5 }],
        items: [],
      },
    },
  },
}

export const DEFAULT_DUNGEON_ID = 'forest'

export function getDungeonType(id: string): DungeonType {
  return DUNGEON_TYPES[id] ?? DUNGEON_TYPES[DEFAULT_DUNGEON_ID]
}
