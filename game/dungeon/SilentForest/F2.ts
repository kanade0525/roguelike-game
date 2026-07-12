import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 24, h: 24 },
  enemies: {
    count: 6,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 3,
    types: [
      { itemId: 'herb', weight: 3 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'sword', weight: 3 },
      { itemId: 'shield', weight: 1 },
      { itemId: 'teleport_scroll', weight: 1 },
      { itemId: 'map_scroll', weight: 1 },
    ],
  },
}

export default floor
