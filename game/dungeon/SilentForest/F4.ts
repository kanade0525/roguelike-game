import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 36, h: 36 },
  enemies: {
    count: 5,
    types: [{ type: 'slime', weight: 1 }],
  },
  items: {
    count: 2,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
