import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 42, h: 42 },
  enemies: {
    count: 7,
    types: [
      { type: 'skeleton', weight: 2 },
      { type: 'goblin', weight: 1 },
    ],
  },
  items: {
    count: 2,
    types: [
      { itemId: 'herb', weight: 2 },
      { itemId: 'bread', weight: 1 },
      { itemId: 'big_bread', weight: 1 },
      { itemId: 'sword', weight: 1 },
      { itemId: 'great_sword', weight: 1 },
      { itemId: 'shield', weight: 1 },
    ],
  },
}

export default floor
