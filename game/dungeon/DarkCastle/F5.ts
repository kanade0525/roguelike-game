import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 43, h: 43 },
  enemies: {
    count: 7,
    types: [
      { type: 'slime', weight: 1 },
      { type: 'goblin', weight: 2 },
    ],
  },
  items: {
    count: 3,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
