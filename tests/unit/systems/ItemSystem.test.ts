import { describe, it, expect } from 'vitest'
import { useItem, equipItem, unequipItem } from '../../../game/systems/ItemSystem'
import { ITEMS, computeEquipmentStats, makeEquipmentData } from '../../../game/data/items'

function makePlayer(
  overrides: Partial<{
    hp: number
    maxHp: number
    satiation: number
    maxSatiation: number
    attack: number
    defense: number
  }> = {}
) {
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
  it('herb は HP を25回復する', () => {
    const player = makePlayer({ hp: 50 })
    const result = useItem(ITEMS.herb, player)
    expect(result.success).toBe(true)
    expect(result.consumed).toBe(true)
    expect(player.hp).toBe(75)
    expect(result.message).toContain('25')
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

  it('リレミトの巻物は scrollAction=escape を返す', () => {
    const player = makePlayer()
    const result = useItem(ITEMS.escape_scroll, player)
    expect(result.success).toBe(true)
    expect(result.consumed).toBe(true)
    expect(result.scrollAction).toBe('escape')
  })

  it('ワープの巻物は scrollAction=teleport を返す', () => {
    const result = useItem(ITEMS.teleport_scroll, makePlayer())
    expect(result.scrollAction).toBe('teleport')
    expect(result.consumed).toBe(true)
  })

  it('地図の巻物は scrollAction=revealMap を返す', () => {
    const result = useItem(ITEMS.map_scroll, makePlayer())
    expect(result.scrollAction).toBe('revealMap')
  })

  it('謎の金庫は使用できない（special）', () => {
    const result = useItem(ITEMS.strange_safe, makePlayer())
    expect(result.success).toBe(false)
    expect(result.consumed).toBe(false)
    expect(result.scrollAction).toBeUndefined()
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

  it('gold / scroll / special タイプのアイテムが存在する', () => {
    const types = Object.values(ITEMS).map((i) => i.type)
    expect(types).toContain('gold')
    expect(types).toContain('scroll')
    expect(types).toContain('special')
  })

  it('ポーション・食料・スクロール・ゴールドは stackable=true', () => {
    for (const def of Object.values(ITEMS)) {
      if (['potion', 'food', 'scroll', 'gold'].includes(def.type)) {
        expect(def.stackable).toBe(true)
      }
    }
  })
})

describe('EquipmentData', () => {
  it('未強化（+0）は ベース値そのまま', () => {
    const stats = computeEquipmentStats(ITEMS.sword, 0, 1)
    expect(stats.attackBonus).toBe(5)
    expect(stats.defenseBonus).toBe(0)
  })

  it('強化+3で 攻撃が+3上乗せ', () => {
    const stats = computeEquipmentStats(ITEMS.sword, 3, 1)
    expect(stats.attackBonus).toBe(8)
  })

  it('盾の+2で 防御が+2上乗せ', () => {
    const stats = computeEquipmentStats(ITEMS.shield, 2, 1)
    expect(stats.defenseBonus).toBe(5)
  })

  it('attack が0の防具は強化してもattackに加算されない', () => {
    const stats = computeEquipmentStats(ITEMS.shield, 5, 1)
    expect(stats.attackBonus).toBe(0)
  })

  it('makeEquipmentData で完全なデータが作れる', () => {
    const data = makeEquipmentData(ITEMS.great_sword, 2, 1)
    expect(data.baseItemId).toBe('great_sword')
    expect(data.enhanceLevel).toBe(2)
    expect(data.attackBonus).toBe(12)
    expect(data.defenseBonus).toBe(0)
  })

  it('負の強化レベルは0扱い', () => {
    const stats = computeEquipmentStats(ITEMS.sword, -1, 1)
    expect(stats.attackBonus).toBe(5)
  })
})
