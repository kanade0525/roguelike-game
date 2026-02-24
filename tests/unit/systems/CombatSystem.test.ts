import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CombatSystem } from '~/game/systems/CombatSystem'

describe('CombatSystem', () => {
  let combat: CombatSystem

  beforeEach(() => {
    combat = new CombatSystem()
  })

  describe('calculateDamage', () => {
    it('通常ダメージ: 攻撃力 - 防御力', () => {
      // 回避もクリティカルも発生しない
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const result = combat.calculateDamage(
        { attack: 10 },
        { attack: 0, defense: 3 },
      )
      expect(result.damage).toBe(7) // 10 - 3
      expect(result.isCritical).toBe(false)
      expect(result.isDodged).toBe(false)

      vi.restoreAllMocks()
    })

    it('最低ダメージは1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const result = combat.calculateDamage(
        { attack: 1 },
        { attack: 0, defense: 100 },
      )
      expect(result.damage).toBe(1)

      vi.restoreAllMocks()
    })

    it('防御力が未設定なら0として扱う', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const result = combat.calculateDamage(
        { attack: 10 },
        { attack: 0 },
      )
      expect(result.damage).toBe(10)

      vi.restoreAllMocks()
    })

    it('回避が発生するとダメージ0', () => {
      // 最初のrandom (回避判定) < 0.05 → 回避
      vi.spyOn(Math, 'random').mockReturnValue(0.01)

      const result = combat.calculateDamage(
        { attack: 100 },
        { attack: 0, defense: 0 },
      )
      expect(result.isDodged).toBe(true)
      expect(result.damage).toBe(0)

      vi.restoreAllMocks()
    })

    it('クリティカルが発生するとダメージ2倍', () => {
      const mockRandom = vi.spyOn(Math, 'random')
      // 1回目: 回避判定 → 0.5 (回避しない)
      // 2回目: クリティカル判定 → 0.05 (< 0.1 なのでクリティカル)
      mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0.05)

      const result = combat.calculateDamage(
        { attack: 10 },
        { attack: 0, defense: 3 },
      )
      expect(result.isCritical).toBe(true)
      expect(result.damage).toBe(17) // 10 * 2 - 3

      vi.restoreAllMocks()
    })
  })

  describe('calculateHeal', () => {
    it('基本回復量の±10%の範囲で回復する', () => {
      // 100回計算して範囲内に収まることを確認
      for (let i = 0; i < 100; i++) {
        const healed = combat.calculateHeal(30)
        expect(healed).toBeGreaterThanOrEqual(27) // 30 * 0.9
        expect(healed).toBeLessThanOrEqual(33) // 30 * 1.1
      }
    })

    it('固定乱数で確定値を検証', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5) // multiplier = 1.0
      expect(combat.calculateHeal(30)).toBe(30)

      vi.restoreAllMocks()
    })
  })
})
