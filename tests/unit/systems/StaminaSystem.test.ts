import { describe, it, expect } from 'vitest'
import {
  STAMINA_CONFIG,
  applyGuard,
  clampStamina,
  staminaFactor,
  staminaLevel,
} from '~/game/systems/StaminaSystem'

describe('StaminaSystem', () => {
  describe('clampStamina', () => {
    it('0未満は0、最大値超えは最大値に丸める', () => {
      expect(clampStamina(-10, 100)).toBe(0)
      expect(clampStamina(150, 100)).toBe(100)
      expect(clampStamina(42, 100)).toBe(42)
    })
  })

  describe('staminaFactor', () => {
    it('満タンなら等倍', () => {
      expect(staminaFactor(100, 100)).toBe(1)
    })

    it('残量に比例して下がる', () => {
      expect(staminaFactor(60, 100)).toBeCloseTo(0.6)
    })

    it('空でも最低倍率は保証される', () => {
      expect(staminaFactor(0, 100)).toBe(STAMINA_CONFIG.minDamageFactor)
    })
  })

  describe('applyGuard', () => {
    it('防御していなければそのまま', () => {
      expect(applyGuard(20, false)).toBe(20)
    })

    it('防御中は軽減される', () => {
      expect(applyGuard(20, true)).toBe(Math.floor(20 * STAMINA_CONFIG.guardDamageRate))
    })

    it('防御中でも最低1ダメージは通る', () => {
      expect(applyGuard(1, true)).toBe(1)
    })
  })

  describe('staminaLevel', () => {
    it('残量に応じた段階を返す', () => {
      expect(staminaLevel(100, 100)).toBe('full')
      expect(staminaLevel(50, 100)).toBe('normal')
      expect(staminaLevel(20, 100)).toBe('low')
      expect(staminaLevel(0, 100)).toBe('empty')
    })
  })
})
