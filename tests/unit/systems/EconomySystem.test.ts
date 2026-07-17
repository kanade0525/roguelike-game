import { describe, it, expect } from 'vitest'
import {
  computeDeathGoldLoss,
  rollSafeGold,
  computeEnhanceCost,
  splitItemsOnDeath,
} from '../../../game/systems/EconomySystem'

describe('EconomySystem.computeDeathGoldLoss', () => {
  it('lossRate=1 で全ロスト', () => {
    const { lost, kept } = computeDeathGoldLoss(100, 1)
    expect(lost).toBe(100)
    expect(kept).toBe(0)
  })

  it('lossRate=0 でロストなし', () => {
    const { lost, kept } = computeDeathGoldLoss(100, 0)
    expect(lost).toBe(0)
    expect(kept).toBe(100)
  })

  it('lossRate=0.5 で半分ロスト（端数は切り捨て）', () => {
    const { lost, kept } = computeDeathGoldLoss(101, 0.5)
    expect(lost).toBe(50)
    expect(kept).toBe(51)
  })

  it('lost + kept は常に元の額に一致', () => {
    for (const gold of [0, 1, 7, 33, 250]) {
      for (const rate of [0, 0.25, 0.5, 0.9, 1]) {
        const { lost, kept } = computeDeathGoldLoss(gold, rate)
        expect(lost + kept).toBe(Math.floor(gold))
      }
    }
  })

  it('負のgoldは0扱い', () => {
    const { lost, kept } = computeDeathGoldLoss(-50, 1)
    expect(lost).toBe(0)
    expect(kept).toBe(0)
  })

  it('lossRateが範囲外でも 0..1 にクランプ', () => {
    expect(computeDeathGoldLoss(100, 2).lost).toBe(100)
    expect(computeDeathGoldLoss(100, -1).lost).toBe(0)
  })
})

describe('EconomySystem.rollSafeGold', () => {
  it('rng=0 で最小値', () => {
    expect(rollSafeGold(50, 200, () => 0)).toBe(50)
  })

  it('rng→1 で最大値（両端含む）', () => {
    expect(rollSafeGold(50, 200, () => 0.999999)).toBe(200)
  })

  it('rng=0.5 で中央付近', () => {
    // 50 + floor(0.5 * 151) = 50 + 75 = 125
    expect(rollSafeGold(50, 200, () => 0.5)).toBe(125)
  })

  it('常に min..max の範囲内', () => {
    for (const r of [0, 0.1, 0.33, 0.5, 0.77, 0.99]) {
      const g = rollSafeGold(50, 200, () => r)
      expect(g).toBeGreaterThanOrEqual(50)
      expect(g).toBeLessThanOrEqual(200)
    }
  })

  it('min>max でも min にクランプされる', () => {
    expect(rollSafeGold(200, 50, () => 0.5)).toBe(200)
  })
})

describe('EconomySystem.computeEnhanceCost', () => {
  // gameConfig 既定: base=100, multiplier=1.5
  it('level0 は base', () => {
    expect(computeEnhanceCost(0, 100, 1.5)).toBe(100)
  })

  it('level1 は base*1.5', () => {
    expect(computeEnhanceCost(1, 100, 1.5)).toBe(150)
  })

  it('level2 は base*1.5^2（端数切り捨て）', () => {
    expect(computeEnhanceCost(2, 100, 1.5)).toBe(225)
  })

  it('level3 は切り捨てで337', () => {
    // 100 * 3.375 = 337.5 -> 337
    expect(computeEnhanceCost(3, 100, 1.5)).toBe(337)
  })

  it('レベルが上がるほど単調増加する', () => {
    let prev = -1
    for (let lvl = 0; lvl <= 9; lvl++) {
      const c = computeEnhanceCost(lvl, 100, 1.5)
      expect(c).toBeGreaterThan(prev)
      prev = c
    }
  })

  it('負のレベルは0扱い', () => {
    expect(computeEnhanceCost(-1, 100, 1.5)).toBe(100)
  })
})

describe('EconomySystem.computeDeathGoldLoss（半分ロスト rate=0.5）', () => {
  it('100の半分は 失50/残50', () => {
    expect(computeDeathGoldLoss(100, 0.5)).toEqual({ lost: 50, kept: 50 })
  })

  it('奇数7は 失3(切り捨て)/残4', () => {
    expect(computeDeathGoldLoss(7, 0.5)).toEqual({ lost: 3, kept: 4 })
  })

  it('0は 失0/残0', () => {
    expect(computeDeathGoldLoss(0, 0.5)).toEqual({ lost: 0, kept: 0 })
  })
})

describe('EconomySystem.splitItemsOnDeath', () => {
  it('4個は floor(4/2)=2個ロスト・2個保持', () => {
    const { kept, lost } = splitItemsOnDeath(['a', 'b', 'c', 'd'])
    expect(lost.length).toBe(2)
    expect(kept.length).toBe(2)
  })

  it('1個は 0個ロスト・1個保持（半分に満たない）', () => {
    expect(splitItemsOnDeath(['a'])).toEqual({ kept: ['a'], lost: [] })
  })

  it('0個は 双方空', () => {
    expect(splitItemsOnDeath([])).toEqual({ kept: [], lost: [] })
  })

  it('kept と lost の和は元集合（重複・欠落なし）', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const { kept, lost } = splitItemsOnDeath(items)
    expect([...kept, ...lost].sort()).toEqual([...items].sort())
    expect(lost.length).toBe(2) // floor(5/2)
  })

  it('入力配列を破壊しない', () => {
    const items = ['a', 'b', 'c', 'd']
    splitItemsOnDeath(items)
    expect(items).toEqual(['a', 'b', 'c', 'd'])
  })

  it('rng 注入で決定的（rng=0 なら先頭を失う）', () => {
    const { kept, lost } = splitItemsOnDeath(['a', 'b', 'c', 'd'], () => 0)
    expect(lost).toEqual(['a', 'b'])
    expect(kept).toEqual(['c', 'd'])
  })
})
