import gameConfig from '~/game/data/gameConfig.json'

// スタミナ（気力）システム。
// 攻撃するたびに減り、移動・防御で回復する短期リソース。
// 満腹度が「探索の持続時間」を制限するのに対し、こちらは「連続で殴り続けること」を制限する。
export interface StaminaConfig {
  max: number
  attackCost: number
  moveRecovery: number
  guardRecovery: number
  damagePenalty: number
  minDamageFactor: number
  guardDamageRate: number
}

export const STAMINA_CONFIG: StaminaConfig = gameConfig.staminaConfig

export function clampStamina(value: number, max: number = STAMINA_CONFIG.max): number {
  return Math.max(0, Math.min(max, Math.floor(value)))
}

// スタミナによる攻撃力倍率。空でも最低 minDamageFactor は出る（完全に無力にはしない）。
export function staminaFactor(stamina: number, max: number = STAMINA_CONFIG.max): number {
  if (max <= 0) return 1
  return Math.max(STAMINA_CONFIG.minDamageFactor, clampStamina(stamina, max) / max)
}

// 防御中の被ダメージ。防御力を引いた後の値に倍率をかけ、最低1は通す。
export function applyGuard(damage: number, guarding: boolean): number {
  if (!guarding) return damage
  return Math.max(1, Math.floor(damage * STAMINA_CONFIG.guardDamageRate))
}

// スタミナ残量の段階（UIの色分け・警告メッセージ用）
export type StaminaLevel = 'full' | 'normal' | 'low' | 'empty'

export function staminaLevel(stamina: number, max: number = STAMINA_CONFIG.max): StaminaLevel {
  if (stamina <= 0) return 'empty'
  const ratio = max > 0 ? stamina / max : 1
  if (ratio >= 1) return 'full'
  if (ratio < 0.3) return 'low'
  return 'normal'
}
