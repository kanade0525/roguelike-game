import type { TileType } from '../data/maps'

export interface FixedMapPreset {
  map: TileType[][]
  playerStart: { x: number; y: number }
  stairsPosition?: { x: number; y: number }
}

export interface FloorConfig {
  mapSize: { w: number; h: number }
  enemies: {
    count: number
    types: { type: string; weight: number }[]
  }
  items: {
    count: number
    types: { itemId: string; weight: number }[]
  }
  isBossFloor?: boolean
  fixedMap?: FixedMapPreset
}

export interface DungeonDefinition {
  id: string
  name: string
  bgm: string
  floors: FloorConfig[]
}
