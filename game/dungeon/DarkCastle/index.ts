import type { DungeonDefinition } from '../types'
import F1 from './F1'
import F2 from './F2'
import F3 from './F3'
import F4 from './F4'
import F5 from './F5'
import F6 from './F6'
import F7 from './F7'
import F8 from './F8'

const darkCastle: DungeonDefinition = {
  id: 'darkCastle',
  name: '暗黒城',
  floors: [F1, F2, F3, F4, F5, F6, F7, F8],
}

export default darkCastle
