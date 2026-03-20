// マップタイル種別
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  STAIRS: 2,
} as const

export type TileType = (typeof TILE)[keyof typeof TILE]
