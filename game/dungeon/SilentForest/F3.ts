import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 26, h: 26 },
  enemies: {
    count: 8,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 4,
    types: [
      { itemId: 'herb', weight: 3 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'sword', weight: 3 },
      { itemId: 'shield', weight: 1 },
    ],
  },
}

export default floor
