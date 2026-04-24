import { ITEMS, type ItemDef } from '../data/items'

export interface PlayerLike {
  hp: number
  maxHp: number
  satiation: number
  maxSatiation: number
  attack: number
  defense: number
}

export interface UseResult {
  success: boolean
  message: string
  consumed: boolean
}

export function useItem(itemDef: ItemDef, player: PlayerLike): UseResult {
  if (!itemDef.usable) {
    return { success: false, message: `${itemDef.name}は使用できない`, consumed: false }
  }

  const effect = itemDef.effect ?? {}
  const messages: string[] = []

  if (typeof effect.hp === 'number' && effect.hp > 0) {
    const before = player.hp
    player.hp = Math.min(player.maxHp, player.hp + effect.hp)
    const gained = player.hp - before
    if (gained > 0) {
      messages.push(`HPが${gained}回復した`)
    } else {
      messages.push('HPは満タンだ')
    }
  }

  if (typeof effect.satiation === 'number' && effect.satiation > 0) {
    const before = player.satiation
    player.satiation = Math.min(player.maxSatiation, player.satiation + effect.satiation)
    const gained = player.satiation - before
    if (gained > 0) {
      messages.push(`満腹度が${gained}回復した`)
    } else {
      messages.push('満腹度は満タンだ')
    }
  }

  if (effect.cureStatus && effect.cureStatus.length > 0) {
    // 状態異常システム未実装のためメッセージのみ
    messages.push('状態異常を治療した')
  }

  return {
    success: true,
    message: messages.length > 0 ? messages.join('、') : `${itemDef.name}を使った`,
    consumed: true,
  }
}

export interface EquipResult {
  success: boolean
  message: string
  unequippedId: string | null
  attackDelta: number
  defenseDelta: number
}

export function equipItem(
  itemDef: ItemDef,
  currentEquippedId: string | null
): EquipResult {
  if (!itemDef.equippable) {
    return {
      success: false,
      message: `${itemDef.name}は装備できない`,
      unequippedId: null,
      attackDelta: 0,
      defenseDelta: 0,
    }
  }

  const current = currentEquippedId ? ITEMS[currentEquippedId] : null
  const currentAttack = current?.effect?.attack ?? 0
  const currentDefense = current?.effect?.defense ?? 0
  const newAttack = itemDef.effect?.attack ?? 0
  const newDefense = itemDef.effect?.defense ?? 0

  return {
    success: true,
    message: `${itemDef.name}を装備した`,
    unequippedId: currentEquippedId,
    attackDelta: newAttack - currentAttack,
    defenseDelta: newDefense - currentDefense,
  }
}

export function unequipItem(
  itemDef: ItemDef
): { attackDelta: number; defenseDelta: number; message: string } {
  const attack = itemDef.effect?.attack ?? 0
  const defense = itemDef.effect?.defense ?? 0
  return {
    attackDelta: attack === 0 ? 0 : -attack,
    defenseDelta: defense === 0 ? 0 : -defense,
    message: `${itemDef.name}を外した`,
  }
}
