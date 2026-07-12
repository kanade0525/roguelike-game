import { describe, it, expect } from 'vitest'
import { computeDeathGoldLoss, rollSafeGold } from '../../../game/systems/EconomySystem'

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
