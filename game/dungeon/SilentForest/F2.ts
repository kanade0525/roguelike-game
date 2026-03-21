import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 32, h: 32 },
  enemies: {
    count: 3,
    types: [{ type: 'slime', weight: 1 }],
  },
  items: {
    count: 1,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
