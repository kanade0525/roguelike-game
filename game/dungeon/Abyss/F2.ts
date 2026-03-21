import type { FloorConfig } from '../types'

const floor: FloorConfig = {
  mapSize: { w: 41, h: 41 },
  enemies: {
    count: 6,
    types: [
      { type: 'skeleton', weight: 2 },
      { type: 'goblin', weight: 1 },
    ],
  },
  items: {
    count: 2,
    types: [{ itemId: 'sword', weight: 1 }],
  },
}

export default floor
