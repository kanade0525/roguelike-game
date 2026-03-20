import type { FloorConfig } from '../types'
import { arenaSmall } from '../presets/arenaSmall'

const floor: FloorConfig = {
  mapSize: { w: 13, h: 13 },
  enemies: {
    count: 1,
    types: [{ type: 'slime', weight: 1 }],
  },
  items: {
    count: 0,
    types: [],
  },
  isBossFloor: true,
  fixedMap: arenaSmall,
}

export default floor
