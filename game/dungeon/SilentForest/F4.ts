import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 28, h: 28 },
  enemies: {
    count: 10,
    types: [{ type: 'skeleton', weight: 1 }],
  },
  items: {
    count: 4,
    types: [
      { itemId: 'herb', weight: 3 },
      { itemId: 'bread', weight: 2 },
      { itemId: 'sword', weight: 3 },
      { itemId: 'shield', weight: 1 },
      { itemId: 'antidote', weight: 1 },
      { itemId: 'map_scroll', weight: 1 },
      { itemId: 'teleport_scroll', weight: 1 },
      { itemId: 'escape_scroll', weight: 1 },
    ],
  },
}

export default floor
