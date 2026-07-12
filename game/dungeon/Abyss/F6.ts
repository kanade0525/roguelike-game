import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 45, h: 45 },
  enemies: {
    count: 10,
    types: [
      { type: 'skeleton', weight: 1 },
      { type: 'goblin', weight: 3 },
    ],
  },
  items: {
    count: 3,
    types: [
      { itemId: 'super_herb', weight: 2 },
      { itemId: 'big_bread', weight: 2 },
      { itemId: 'great_sword', weight: 1 },
      { itemId: 'heavy_armor', weight: 1 },
      { itemId: 'escape_scroll', weight: 1 },
      { itemId: 'strange_safe', weight: 1 },
    ],
  },
}

export default floor
