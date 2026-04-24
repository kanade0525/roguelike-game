import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 45, h: 45 },
  enemies: {
    count: 8,
    types: [
      { type: 'skeleton', weight: 1 },
      { type: 'goblin', weight: 2 },
    ],
  },
  items: {
    count: 3,
    types: [
      { itemId: 'super_herb', weight: 2 },
      { itemId: 'big_bread', weight: 1 },
      { itemId: 'great_sword', weight: 1 },
      { itemId: 'heavy_armor', weight: 1 },
      { itemId: 'antidote', weight: 1 },
    ],
  },
}

export default floor
