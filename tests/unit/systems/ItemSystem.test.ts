import { describe, it, expect } from 'vitest'
import { useItem, equipItem, unequipItem } from '../../../game/systems/ItemSystem'
import { ITEMS } from '../../../game/data/items'

function makePlayer(overrides: Partial<{ hp: number; maxHp: number; satiation: number; maxSatiation: number; attack: number; defense: number }> = {}) {
  return {
    hp: 50,
    maxHp: 100,
    satiation: 50,
    maxSatiation: 100,
    attack: 10,
    defense: 5,
    ...overrides,
  }
}

describe('ItemSystem.useItem', () => {
  it('herb は HP を30回復する', () => {
    const player = makePlayer({ hp: 50 })
    const result = useItem(ITEMS.herb, player)
    expect(result.success).toBe(true)
    expect(result.consumed).toBe(true)
    expect(player.hp).toBe(80)
    expect(result.message).toContain('30')
  })

  it('HP が最大値を超えない', () => {
    const player = makePlayer({ hp: 90, maxHp: 100 })
    useItem(ITEMS.herb, player)
    expect(player.hp).toBe(100)
  })

  it('HP 満タンでは回復量0のメッセージ', () => {
    const player = makePlayer({ hp: 100, maxHp: 100 })
    const result = useItem(ITEMS.herb, player)
    expect(player.hp).toBe(100)
    expect(result.message).toContain('満タン')
  })

  it('bread は満腹度を回復する', () => {
    const player = makePlayer({ satiation: 30, maxSatiation: 100 })
    useItem(ITEMS.bread, player)
    expect(player.satiation).toBe(80)
  })

  it('装備は使用できない', () => {
    const player = makePlayer()
    const result = useItem(ITEMS.sword, player)
    expect(result.success).toBe(false)
    expect(result.consumed).toBe(false)
  })

  it('antidote は消費扱いでメッセージが出る', () => {
    const player = makePlayer()
    const result = useItem(ITEMS.antidote, player)
    expect(result.success).toBe(true)
    expect(result.consumed).toBe(true)
  })
})

describe('ItemSystem.equipItem', () => {
  it('sword で攻撃+5', () => {
    const result = equipItem(ITEMS.sword, null)
    expect(result.success).toBe(true)
    expect(result.attackDelta).toBe(5)
    expect(result.defenseDelta).toBe(0)
    expect(result.unequippedId).toBeNull()
  })

  it('sword → great_sword に変更すると差分が +5 になる', () => {
    const result = equipItem(ITEMS.great_sword, 'sword')
    expect(result.success).toBe(true)
    expect(result.attackDelta).toBe(5)
    expect(result.unequippedId).toBe('sword')
  })

  it('shield で防御+3', () => {
    const result = equipItem(ITEMS.shield, null)
    expect(result.success).toBe(true)
    expect(result.defenseDelta).toBe(3)
    expect(result.attackDelta).toBe(0)
  })

  it('ポーションは装備できない', () => {
    const result = equipItem(ITEMS.herb, null)
    expect(result.success).toBe(false)
    expect(result.attackDelta).toBe(0)
    expect(result.defenseDelta).toBe(0)
  })
})

describe('ItemSystem.unequipItem', () => {
  it('装備を外すと差分はマイナス', () => {
    const result = unequipItem(ITEMS.sword)
    expect(result.attackDelta).toBe(-5)
    expect(result.defenseDelta).toBe(0)
  })

  it('shield を外すと防御-3', () => {
    const result = unequipItem(ITEMS.shield)
    expect(result.defenseDelta).toBe(-3)
  })
})

describe('ITEMS データ整合性', () => {
  it('全アイテムが id/name/type を持つ', () => {
    for (const [id, def] of Object.entries(ITEMS)) {
      expect(def.id).toBe(id)
      expect(def.name).toBeTruthy()
      expect(def.type).toBeTruthy()
    }
  })

  it('装備可能な武器/防具は equippable=true', () => {
    for (const def of Object.values(ITEMS)) {
      if (def.type === 'weapon' || def.type === 'armor') {
        expect(def.equippable).toBe(true)
      }
    }
  })

  it('ポーション・食料は usable=true', () => {
    for (const def of Object.values(ITEMS)) {
      if (def.type === 'potion' || def.type === 'food') {
        expect(def.usable).toBe(true)
      }
    }
  })
})
