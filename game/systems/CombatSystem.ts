export interface CombatResult {
  damage: number
  isCritical: boolean
  isDodged: boolean
}

export interface Combatant {
  attack: number
  defense?: number
}

export class CombatSystem {
  private criticalChance = 0.1
  private dodgeChance = 0.05

  calculateDamage(attacker: Combatant, defender: Combatant): CombatResult {
    // 回避判定
    if (Math.random() < this.dodgeChance) {
      return { damage: 0, isCritical: false, isDodged: true }
    }

    // クリティカル判定
    const isCritical = Math.random() < this.criticalChance
    const criticalMultiplier = isCritical ? 2 : 1

    // ダメージ計算
    const baseDamage = attacker.attack * criticalMultiplier
    const defense = defender.defense ?? 0
    const damage = Math.max(1, baseDamage - defense)

    return { damage, isCritical, isDodged: false }
  }

  calculateHeal(baseAmount: number): number {
    // ランダムな回復量（±10%）
    const variance = 0.1
    const multiplier = 1 + (Math.random() * 2 - 1) * variance
    return Math.floor(baseAmount * multiplier)
  }
}
