import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 39, h: 39 },
  enemies: {
    count: 5,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 2,
    types: [
      { itemId: 'herb', weight: 2 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'sword', weight: 1 },
      { itemId: 'great_sword', weight: 1 },
      { itemId: 'shield', weight: 1 },
      { itemId: 'escape_scroll', weight: 1 },
      { itemId: 'map_scroll', weight: 1 },
    ],
  },
}

export default floor
