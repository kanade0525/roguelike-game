import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 34, h: 34 },
  enemies: {
    count: 4,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 2,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
