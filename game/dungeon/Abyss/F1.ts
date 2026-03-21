import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 40, h: 40 },
  enemies: {
    count: 5,
    types: [
      { type: 'slime', weight: 2 },
      { type: 'goblin', weight: 1 },
    ],
  },
  items: {
    count: 1,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
