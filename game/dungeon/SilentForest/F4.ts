import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 36, h: 36 },
  enemies: {
    count: 5,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 2,
    types: [
      { itemId: 'herb', weight: 3 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'sword', weight: 1 },
      { itemId: 'shield', weight: 1 },
      { itemId: 'antidote', weight: 1 },
    ],
  },
}

export default floor
