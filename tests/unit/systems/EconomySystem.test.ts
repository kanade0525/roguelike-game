import { describe, it, expect } from 'vitest'
import { computeDeathGoldLoss } from '../../../game/systems/EconomySystem'

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
