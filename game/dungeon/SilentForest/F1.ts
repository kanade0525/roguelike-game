import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 22, h: 22 },
  enemies: {
    count: 4,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 3,
    types: [
      { itemId: 'herb', weight: 3 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'sword', weight: 3 },
    ],
  },
}

export default floor
