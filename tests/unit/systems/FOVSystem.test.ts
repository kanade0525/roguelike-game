import { describe, it, expect } from 'vitest'
import { computeVisible } from '../../../game/systems/FOVSystem'

// 0=床, 1=壁, 2=階段
describe('FOVSystem.computeVisible', () => {
  it('視点マスは常に可視', () => {
    const map = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]
    const v = computeVisible(map, 1, 1, 5)
    expect(v.has('1,1')).toBe(true)
  })

  it('開けた部屋では範囲内の床がすべて可視', () => {
    const map = Array.from({ length: 5 }, () => Array(5).fill(0))
    const v = computeVisible(map, 2, 2, 5)
    // 中心・辺・四隅すべて見える
    expect(v.has('2,2')).toBe(true)
    expect(v.has('0,0')).toBe(true)
    expect(v.has('4,4')).toBe(true)
    expect(v.has('0,4')).toBe(true)
    expect(v.has('4,0')).toBe(true)
    expect(v.size).toBe(25)
  })

  it('壁で視界が遮られる（壁自体は見えるが、その先は見えない）', () => {
    const map = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1], // 壁の行
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ]
    const v = computeVisible(map, 2, 1, 5)
    expect(v.has('2,1')).toBe(true) // 視点
    expect(v.has('2,0')).toBe(true) // 視点の上（床）
    expect(v.has('2,2')).toBe(true) // 目の前の壁は見える
    expect(v.has('2,3')).toBe(false) // 壁の向こうは見えない
    expect(v.has('2,4')).toBe(false)
  })

  it('視界範囲外は不可視（Chebyshev距離 > range）', () => {
    const big = Array.from({ length: 11 }, () => Array(11).fill(0))
    const v = computeVisible(big, 5, 5, 2)
    expect(v.has('5,5')).toBe(true) // 距離0
    expect(v.has('7,5')).toBe(true) // 距離2（範囲内）
    expect(v.has('5,3')).toBe(true) // 距離2（範囲内）
    expect(v.has('8,5')).toBe(false) // 距離3（範囲外）
    expect(v.has('5,2')).toBe(false) // 距離3（範囲外）
  })

  it('可視集合に範囲外座標は含まれない', () => {
    const map = [
      [0, 0],
      [0, 0],
    ]
    const v = computeVisible(map, 0, 0, 5)
    for (const key of v) {
      const [x, y] = key.split(',').map(Number)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(2)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThan(2)
    }
  })

  it('階段(2)は光を通し可視になる', () => {
    const map = [
      [0, 0, 0],
      [0, 0, 2],
      [0, 0, 0],
    ]
    const v = computeVisible(map, 0, 1, 5)
    expect(v.has('2,1')).toBe(true)
  })

  it('空マップは空集合を返す', () => {
    expect(computeVisible([], 0, 0, 5).size).toBe(0)
  })
})
