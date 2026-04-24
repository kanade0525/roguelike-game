import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 48, h: 48 },
  enemies: {
    count: 14,
    types: [{ type: 'goblin', weight: 1 }],
  },
  items: {
    count: 4,
    types: [
      { itemId: 'super_herb', weight: 2 },
      { itemId: 'big_bread', weight: 1 },
      { itemId: 'great_sword', weight: 2 },
      { itemId: 'heavy_armor', weight: 2 },
    ],
  },
}

export default floor
