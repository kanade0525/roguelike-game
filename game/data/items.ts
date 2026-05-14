export type ItemType = 'weapon' | 'armor' | 'potion' | 'food' | 'other'

export interface ItemEffect {
  hp?: number
  satiation?: number
  attack?: number
  defense?: number
  cureStatus?: string[]
}

export interface ItemDef {
  id: string
  name: string
  description: string
  type: ItemType
  effect?: ItemEffect
  usable: boolean
  equippable: boolean
}

export const ITEMS: Record<string, ItemDef> = {
  sword: {
    id: 'sword',
    name: '剣',
    description: '攻撃力+5',
    type: 'weapon',
    effect: { attack: 5 },
    usable: false,
    equippable: true,
  },
  great_sword: {
    id: 'great_sword',
    name: '大剣',
    description: '攻撃力+10',
    type: 'weapon',
    effect: { attack: 10 },
    usable: false,
    equippable: true,
  },
  shield: {
    id: 'shield',
    name: '盾',
    description: '防御力+3',
    type: 'armor',
    effect: { defense: 3 },
    usable: false,
    equippable: true,
  },
  heavy_armor: {
    id: 'heavy_armor',
    name: '重装鎧',
    description: '防御力+6',
    type: 'armor',
    effect: { defense: 6 },
    usable: false,
    equippable: true,
  },
  herb: {
    id: 'herb',
    name: '回復草',
    description: 'HPを30回復',
    type: 'potion',
    effect: { hp: 30 },
    usable: true,
    equippable: false,
  },
  super_herb: {
    id: 'super_herb',
    name: '上薬草',
    description: 'HPを60回復',
    type: 'potion',
    effect: { hp: 60 },
    usable: true,
    equippable: false,
  },
  antidote: {
    id: 'antidote',
    name: '毒消し草',
    description: '毒を治療',
    type: 'potion',
    effect: { cureStatus: ['poison'] },
    usable: true,
    equippable: false,
  },
  bread: {
    id: 'bread',
    name: 'パン',
    description: '満腹度を50回復',
    type: 'food',
    effect: { satiation: 50 },
    usable: true,
    equippable: false,
  },
  big_bread: {
    id: 'big_bread',
    name: '大きなパン',
    description: '満腹度を100回復',
    type: 'food',
    effect: { satiation: 100 },
    usable: true,
    equippable: false,
  },
}

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id]
}
