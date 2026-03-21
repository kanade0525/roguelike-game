import { TILE } from '../../data/maps'
import type { FixedMapPreset } from '../types'

const W = TILE.WALL
const F = TILE.FLOOR
const S = TILE.STAIRS

export const throneRoom: FixedMapPreset = {
  map: [
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
  ],
  playerStart: { x: 7, y: 10 },
  stairsPosition: { x: 7, y: 11 },
}
