import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 44, h: 44 },
  enemies: {
    count: 9,
    types: [
      { type: 'skeleton', weight: 1 },
      { type: 'goblin', weight: 3 },
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
