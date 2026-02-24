import { describe, it, expect } from 'vitest'
import { Enemy, ENEMY_DEFINITIONS } from '~/game/entities/Enemy'

describe('Enemy', () => {
  describe('constructor', () => {
    it('スライムが定義通りに生成される', () => {
      const enemy = new Enemy('slime', { x: 3, y: 4 })
      expect(enemy.type).toBe('slime')
      expect(enemy.hp).toBe(20)
      expect(enemy.attack).toBe(5)
      expect(enemy.position).toEqual({ x: 3, y: 4 })
      expect(enemy.aiState).toBe('idle')
      expect(enemy.isAlive).toBe(true)
    })

    it('ゴブリンが定義通りに生成される', () => {
      const enemy = new Enemy('goblin', { x: 1, y: 2 })
      expect(enemy.type).toBe('goblin')
      expect(enemy.hp).toBe(30)
      expect(enemy.attack).toBe(8)
    })

    it('IDが自動生成される', () => {
      const e1 = new Enemy('slime', { x: 0, y: 0 })
      const e2 = new Enemy('slime', { x: 0, y: 0 })
      expect(e1.id).not.toBe(e2.id)
    })

    it('カスタムIDを指定できる', () => {
      const enemy = new Enemy('slime', { x: 0, y: 0 }, 'custom-id')
      expect(enemy.id).toBe('custom-id')
    })
  })

  describe('ENEMY_DEFINITIONS', () => {
    it('スライムの定義が正しい', () => {
      expect(ENEMY_DEFINITIONS.slime).toEqual({
        type: 'slime',
        hp: 20,
        maxHp: 20,
        attack: 5,
      })
    })

    it('ゴブリンの定義が正しい', () => {
      expect(ENEMY_DEFINITIONS.goblin).toEqual({
        type: 'goblin',
        hp: 30,
        maxHp: 30,
        attack: 8,
      })
    })
  })

  describe('takeDamage', () => {
    it('ダメージを受ける（防御なし）', () => {
      const enemy = new Enemy('slime', { x: 0, y: 0 })
      enemy.takeDamage(8)
      expect(enemy.hp).toBe(12)
    })

    it('HPが0未満にならない', () => {
      const enemy = new Enemy('slime', { x: 0, y: 0 })
      enemy.takeDamage(999)
      expect(enemy.hp).toBe(0)
      expect(enemy.isAlive).toBe(false)
    })
  })

  describe('移動', () => {
    it('moveTo で指定座標に移動する', () => {
      const enemy = new Enemy('slime', { x: 0, y: 0 })
      enemy.moveTo(5, 3)
      expect(enemy.position).toEqual({ x: 5, y: 3 })
    })
  })

  describe('AI状態', () => {
    it('状態を変更できる', () => {
      const enemy = new Enemy('slime', { x: 0, y: 0 })
      expect(enemy.aiState).toBe('idle')
      enemy.setAIState('chase')
      expect(enemy.aiState).toBe('chase')
      enemy.setAIState('attack')
      expect(enemy.aiState).toBe('attack')
    })
  })

  describe('distanceTo', () => {
    it('チェビシェフ距離を計算する', () => {
      const enemy = new Enemy('slime', { x: 0, y: 0 })
      // 水平距離
      expect(enemy.distanceTo({ x: 3, y: 0 })).toBe(3)
      // 垂直距離
      expect(enemy.distanceTo({ x: 0, y: 4 })).toBe(4)
      // 斜め距離（チェビシェフ: max(dx, dy)）
      expect(enemy.distanceTo({ x: 3, y: 4 })).toBe(4)
      // 同じ位置
      expect(enemy.distanceTo({ x: 0, y: 0 })).toBe(0)
    })
  })

  describe('toJSON', () => {
    it('データのコピーを返す', () => {
      const enemy = new Enemy('slime', { x: 1, y: 2 }, 'test-id')
      const json = enemy.toJSON()
      expect(json.type).toBe('slime')
      expect(json.id).toBe('test-id')
      expect(json.position).toEqual({ x: 1, y: 2 })

      // 元データに影響しない
      json.position.x = 999
      expect(enemy.position.x).toBe(1)
    })
  })
})
