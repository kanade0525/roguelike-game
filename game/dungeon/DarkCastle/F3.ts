import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 39, h: 39 },
  enemies: {
    count: 5,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 2,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
