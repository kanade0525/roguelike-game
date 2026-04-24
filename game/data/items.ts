export type ItemType = 'weapon' | 'armor' | 'potion' | 'food' | 'scroll' | 'gold' | 'special' | 'other'

export interface ItemEffect {
  hp?: number
  satiation?: number
  attack?: number
  defense?: number
  cureStatus?: string[]
  scrollAction?: 'teleport' | 'revealMap' | 'escape'
}

export interface ItemDef {
  id: string
  name: string
  description: string
  type: ItemType
  effect?: ItemEffect
  usable: boolean
  equippable: boolean
  stackable?: boolean // 重ねて所持可能（ポーション・食料・スクロール・ゴールド）
}

export interface EquipmentData {
  baseItemId: string
  enhanceLevel: number
  attackBonus: number
  defenseBonus: number
}

export function computeEquipmentStats(
  baseItem: ItemDef,
  enhanceLevel: number,
  enhanceBonusPerLevel: number
): { attackBonus: number; defenseBonus: number } {
  const baseAttack = baseItem.effect?.attack ?? 0
  const baseDefense = baseItem.effect?.defense ?? 0
  const enhance = Math.max(0, enhanceLevel) * enhanceBonusPerLevel
  return {
    attackBonus: baseAttack + (baseAttack > 0 ? enhance : 0),
    defenseBonus: baseDefense + (baseDefense > 0 ? enhance : 0),
  }
}

export function makeEquipmentData(
  baseItem: ItemDef,
  enhanceLevel: number = 0,
  enhanceBonusPerLevel: number = 1
): EquipmentData {
  const { attackBonus, defenseBonus } = computeEquipmentStats(
    baseItem,
    enhanceLevel,
    enhanceBonusPerLevel
  )
  return {
    baseItemId: baseItem.id,
    enhanceLevel,
    attackBonus,
    defenseBonus,
  }
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
    stackable: true,
  },
  super_herb: {
    id: 'super_herb',
    name: '上薬草',
    description: 'HPを60回復',
    type: 'potion',
    effect: { hp: 60 },
    usable: true,
    equippable: false,
    stackable: true,
  },
  antidote: {
    id: 'antidote',
    name: '毒消し草',
    description: '毒を治療',
    type: 'potion',
    effect: { cureStatus: ['poison'] },
    usable: true,
    equippable: false,
    stackable: true,
  },
  bread: {
    id: 'bread',
    name: 'パン',
    description: '満腹度を50回復',
    type: 'food',
    effect: { satiation: 50 },
    usable: true,
    equippable: false,
    stackable: true,
  },
  big_bread: {
    id: 'big_bread',
    name: '大きなパン',
    description: '満腹度を100回復',
    type: 'food',
    effect: { satiation: 100 },
    usable: true,
    equippable: false,
    stackable: true,
  },
  scroll_escape: {
    id: 'scroll_escape',
    name: 'リレミトの巻物',
    description: 'ダンジョンから脱出する',
    type: 'scroll',
    effect: { scrollAction: 'escape' },
    usable: true,
    equippable: false,
    stackable: true,
  },
  scroll_map: {
    id: 'scroll_map',
    name: '地形の巻物',
    description: 'フロア全体の地形を表示',
    type: 'scroll',
    effect: { scrollAction: 'revealMap' },
    usable: true,
    equippable: false,
    stackable: true,
  },
  gold: {
    id: 'gold',
    name: 'ゴールド',
    description: '通貨',
    type: 'gold',
    usable: false,
    equippable: false,
    stackable: true,
  },
  strange_safe: {
    id: 'strange_safe',
    name: '謎の金庫',
    description: '中身は鑑定しないとわからない',
    type: 'special',
    usable: false,
    equippable: false,
    stackable: false,
  },
}

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id]
}
