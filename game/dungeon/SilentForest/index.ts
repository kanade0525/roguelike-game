import type { DungeonDefinition } from '../types'
import F1 from './F1'
import F2 from './F2'
import F3 from './F3'
import F4 from './F4'
import F5 from './F5'

const silentForest: DungeonDefinition = {
  id: 'silentForest',
  name: '静寂の森',
  bgm: '/assets/bgm/silent_forest.mp3',
  floors: [F1, F2, F3, F4, F5],
}

export default silentForest
