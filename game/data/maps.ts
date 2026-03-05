// マップタイル種別
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  STAIRS: 2,
} as const

export type TileType = (typeof TILE)[keyof typeof TILE]

export interface FloorConfig {
  map: number[][]
  playerStart: { x: number; y: number }
  enemies: { id: string; type: string; x: number; y: number }[]
  items: { id: string; itemId: string; x: number; y: number }[]
}

// TODO: マップを大きくする（最低30x30程度）
// TODO: マップ自動生成（部屋＋通路アルゴリズム）に置き換える
// TODO: フロア数を増やす（最低10F、ボスフロア含む）
const FLOOR_CONFIGS: Record<number, FloorConfig> = {
  1: {
    map: [
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 2, 1, 1],
    ],
    playerStart: { x: 3, y: 3 },
    enemies: [{ id: 'slime-1', type: 'slime', x: 5, y: 4 }],
    items: [{ id: 'item-1', itemId: 'sword', x: 4, y: 2 }],
  },
  2: {
    map: [
      [1, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 0, 2, 1],
    ],
    playerStart: { x: 1, y: 0 },
    enemies: [
      { id: 'slime-2a', type: 'slime', x: 1, y: 1 },
      { id: 'slime-2b', type: 'slime', x: 4, y: 5 },
    ],
    items: [{ id: 'item-2', itemId: 'sword', x: 2, y: 4 }],
  },
}

export function getFloorConfig(floor: number): FloorConfig {
  return FLOOR_CONFIGS[floor] ?? FLOOR_CONFIGS[1]
}

export function getMap(floor: number): number[][] {
  return getFloorConfig(floor).map
}
