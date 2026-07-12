import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 43, h: 43 },
  enemies: {
    count: 7,
    types: [
      { type: 'skeleton', weight: 1 },
      { type: 'goblin', weight: 2 },
    ],
  },
  items: {
    count: 3,
    types: [
      { itemId: 'herb', weight: 2 },
      { itemId: 'super_herb', weight: 1 },
      { itemId: 'bread', weight: 1 },
      { itemId: 'big_bread', weight: 1 },
      { itemId: 'great_sword', weight: 1 },
      { itemId: 'heavy_armor', weight: 1 },
      { itemId: 'teleport_scroll', weight: 1 },
      { itemId: 'strange_safe', weight: 1 },
    ],
  },
}

export default floor
