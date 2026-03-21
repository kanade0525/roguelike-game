import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 47, h: 47 },
  enemies: {
    count: 9,
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
