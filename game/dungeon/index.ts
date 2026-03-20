import type { DungeonDefinition } from './types'
import silentForest from './SilentForest'
import darkCastle from './DarkCastle'
import abyss from './Abyss'

export const DUNGEONS: Record<string, DungeonDefinition> = {
  silentForest: silentForest,
  darkCastle: darkCastle,
  abyss: abyss,
}

export const DEFAULT_DUNGEON_ID = 'silentForest'

export function getDungeon(id: string): DungeonDefinition {
  return DUNGEONS[id] ?? DUNGEONS[DEFAULT_DUNGEON_ID]
}
