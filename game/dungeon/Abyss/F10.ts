import type { FloorConfig } from '../types'
import { arenaLarge } from '../presets/arenaLarge'

const floor: FloorConfig = {
  mapSize: { w: 17, h: 17 },
  enemies: {
    count: 1,
    types: [{ type: 'goblin', weight: 1 }],
  },
  items: {
    count: 0,
    types: [],
  },
  isBossFloor: true,
  fixedMap: arenaLarge,
}

export default floor
