import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 48, h: 48 },
  enemies: {
    count: 14,
    types: [{ type: 'goblin', weight: 1 }],
  },
  items: {
    count: 4,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
