import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 47, h: 47 },
  enemies: {
    count: 12,
    types: [{ type: 'goblin', weight: 1 }],
  },
  items: {
    count: 4,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
