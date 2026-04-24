import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 40, h: 40 },
  enemies: {
    count: 5,
    types: [
      { type: 'skeleton', weight: 2 },
      { type: 'goblin', weight: 1 },
    ],
  },
  items: {
    count: 1,
    types: [
      { itemId: 'herb', weight: 2 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'sword', weight: 1 },
      { itemId: 'shield', weight: 1 },
    ],
  },
}

export default floor
