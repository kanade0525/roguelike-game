import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 46, h: 46 },
  enemies: {
    count: 11,
    types: [
      { type: 'slime', weight: 1 },
      { type: 'goblin', weight: 3 },
    ],
  },
  items: {
    count: 3,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
