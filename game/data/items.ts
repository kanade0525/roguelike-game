export interface ItemDef {
  id: string
  name: string
  type: 'weapon' | 'potion' | 'other'
}

export const ITEMS: Record<string, ItemDef> = {
  sword: { id: 'sword', name: '剣', type: 'weapon' },
}
