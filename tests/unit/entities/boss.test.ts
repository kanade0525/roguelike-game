import { describe, it, expect } from 'vitest'
import { createEnemy } from '~/game/entities/createEnemy'
import { isBossType, BOSS_TYPES } from '~/game/entities/Enemy'
import gameConfig from '~/game/data/gameConfig.json'

describe('ボス生成', () => {
  it('ボス種別は gameConfig の高ステータスで生成される', () => {
    for (const type of BOSS_TYPES) {
      const cfg = gameConfig.enemyTypes[type as keyof typeof gameConfig.enemyTypes]
      const boss = createEnemy(type, { x: 1, y: 1 })
      expect(boss.type).toBe(type)
      expect(boss.hp).toBe(cfg.maxHealth)
      expect(boss.attack).toBe(cfg.attack)
      expect(boss.exp).toBe(cfg.exp)
    }
  })

  it('ボスは通常敵より大幅に高HP', () => {
    const boss = createEnemy('abyss_lord', { x: 0, y: 0 })
    const skeleton = createEnemy('skeleton', { x: 0, y: 0 })
    expect(boss.hp).toBeGreaterThan(skeleton.hp * 5)
  })

  it('isBossType が種別を正しく判定する', () => {
    expect(isBossType('forest_lord')).toBe(true)
    expect(isBossType('castle_lord')).toBe(true)
    expect(isBossType('abyss_lord')).toBe(true)
    expect(isBossType('skeleton')).toBe(false)
    expect(isBossType('goblin')).toBe(false)
  })

  it('通常敵は従来通り生成される', () => {
    expect(createEnemy('skeleton', { x: 0, y: 0 }).type).toBe('skeleton')
    expect(createEnemy('goblin', { x: 0, y: 0 }).type).toBe('goblin')
  })
})
