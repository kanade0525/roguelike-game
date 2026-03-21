import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 43, h: 43 },
  enemies: {
    count: 8,
    types: [
      { type: 'skeleton', weight: 1 },
      { type: 'goblin', weight: 3 },
    ],
  },
  items: {
    count: 2,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
