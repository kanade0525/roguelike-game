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
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
