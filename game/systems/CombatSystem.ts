import { applyGuard } from './StaminaSystem'

export interface CombatResult {
  damage: number
  isCritical: boolean
  isDodged: boolean
}

export interface Combatant {
  attack: number
  defense?: number
  dodge?: number
  staminaFactor?: number // 攻撃側: スタミナによる火力倍率（未指定なら等倍）
  guarding?: boolean // 防御側: このターン防御しているか
}

export class CombatSystem {
  private criticalChance = 0.1
  private dodgeChance = 0.05

  calculateDamage(attacker: Combatant, defender: Combatant): CombatResult {
    // 回避判定 (defender.dodge が未指定なら既定値)
    const dodgeRate = defender.dodge ?? this.dodgeChance
    if (Math.random() < dodgeRate) {
      return { damage: 0, isCritical: false, isDodged: true }
    }

    // クリティカル判定
    const isCritical = Math.random() < this.criticalChance
    const criticalMultiplier = isCritical ? 2 : 1

    // ダメージ計算（攻撃力×クリティカル×スタミナ倍率 − 防御力、最低1）
    const factor = attacker.staminaFactor ?? 1
    const baseDamage = Math.floor(attacker.attack * criticalMultiplier * factor)
    const defense = defender.defense ?? 0
    const damage = Math.max(1, baseDamage - defense)

    // 防御中はさらに軽減（防御力を引いた後にかける）
    return { damage: applyGuard(damage, defender.guarding ?? false), isCritical, isDodged: false }
  }

  calculateHeal(baseAmount: number): number {
    // ランダムな回復量（±10%）
    const variance = 0.1
    const multiplier = 1 + (Math.random() * 2 - 1) * variance
    return Math.floor(baseAmount * multiplier)
  }
}
