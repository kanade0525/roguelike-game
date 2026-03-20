import { TILE } from '../../data/maps'
import type { FixedMapPreset } from '../types'

const W = TILE.WALL
const F = TILE.FLOOR
const S = TILE.STAIRS

export const arenaLarge: FixedMapPreset = {
  map: [
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
  ],
  playerStart: { x: 8, y: 14 },
  stairsPosition: { x: 8, y: 15 },
}
