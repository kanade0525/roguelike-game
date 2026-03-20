import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 37, h: 37 },
  enemies: {
    count: 4,
    types: [{ type: 'slime', weight: 1 }],
  },
  items: {
    count: 1,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
