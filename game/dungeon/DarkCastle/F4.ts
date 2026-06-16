import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 41, h: 41 },
  enemies: {
    count: 6,
    types: [
      { type: 'skeleton', weight: 1 },
      { type: 'goblin', weight: 2 },
    ],
  },
  items: {
    count: 2,
    types: [
      { itemId: 'herb', weight: 2 },
      { itemId: 'super_herb', weight: 1 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'great_sword', weight: 1 },
      { itemId: 'shield', weight: 1 },
    ],
  },
}

export default floor
