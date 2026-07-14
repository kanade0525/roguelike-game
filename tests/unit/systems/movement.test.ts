import { describe, it, expect } from 'vitest'
import { canMoveDiagonally } from '../../../game/systems/movement'

// 0=床, 1=壁
describe('canMoveDiagonally (壁角すり抜け禁止)', () => {
  it('直交移動（dx=0 または dy=0）は常に許可', () => {
    const map = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]
    expect(canMoveDiagonally(map, 1, 1, 0, -1)).toBe(true)
    expect(canMoveDiagonally(map, 1, 1, 1, 0)).toBe(true)
  })

  it('両隣接直交マスが床なら斜め移動を許可', () => {
    const map = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]
    expect(canMoveDiagonally(map, 1, 1, 1, 1)).toBe(true)
    expect(canMoveDiagonally(map, 1, 1, -1, -1)).toBe(true)
    expect(canMoveDiagonally(map, 1, 1, 1, -1)).toBe(true)
    expect(canMoveDiagonally(map, 1, 1, -1, 1)).toBe(true)
  })

  it('横隣が壁なら斜め移動を禁止', () => {
    // (1,1)から右下(2,2)へ。右(2,1)が壁
    const map = [
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 0],
    ]
    expect(canMoveDiagonally(map, 1, 1, 1, 1)).toBe(false)
  })

  it('縦隣が壁なら斜め移動を禁止', () => {
    // (1,1)から右下(2,2)へ。下(1,2)が壁
    const map = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
    ]
    expect(canMoveDiagonally(map, 1, 1, 1, 1)).toBe(false)
  })

  it('両隣接直交マスが壁なら斜め移動を禁止', () => {
    // (1,1)から左上(0,0)へ。上(1,0)と左(0,1)が壁
    const map = [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 0],
    ]
    expect(canMoveDiagonally(map, 1, 1, -1, -1)).toBe(false)
  })

  it('範囲外は壁扱いで斜め移動を禁止', () => {
    const map = [
      [0, 0],
      [0, 0],
    ]
    // (0,0)から左上(-1,-1)へ。隣接マスが範囲外
    expect(canMoveDiagonally(map, 0, 0, -1, -1)).toBe(false)
  })

  it('空マップは常に禁止（安全側）', () => {
    expect(canMoveDiagonally([], 0, 0, 1, 1)).toBe(false)
  })
})
