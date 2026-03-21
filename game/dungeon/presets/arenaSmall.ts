import { TILE } from '../../data/maps'
import type { FixedMapPreset } from '../types'

const W = TILE.WALL
const F = TILE.FLOOR
const S = TILE.STAIRS

export const arenaSmall: FixedMapPreset = {
  map: [
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
  ],
  playerStart: { x: 6, y: 10 },
  stairsPosition: { x: 6, y: 11 },
}
