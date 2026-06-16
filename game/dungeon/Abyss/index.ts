import type { DungeonDefinition } from '../types'
import F1 from './F1'
import F2 from './F2'
import F3 from './F3'
import F4 from './F4'
import F5 from './F5'
import F6 from './F6'
import F7 from './F7'
import F8 from './F8'
import F9 from './F9'
import F10 from './F10'

const abyss: DungeonDefinition = {
  id: 'abyss',
  name: '深淵',
  bgm: '/assets/bgm/abyss.mp3',
  floors: [F1, F2, F3, F4, F5, F6, F7, F8, F9, F10],
}

export default abyss
