import type { FloorConfig } from '../types'
import { throneRoom } from '../presets/throneRoom'

const floor: FloorConfig = {
  mapSize: { w: 15, h: 13 },
  enemies: {
    count: 1,
    types: [{ type: 'castle_lord', weight: 1 }],
  },
  items: {
    count: 0,
    types: [],
  },
  isBossFloor: true,
  fixedMap: throneRoom,
}

export default floor
