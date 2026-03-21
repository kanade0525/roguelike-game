import { describe, it, expect } from 'vitest'
import { createEnemy } from '~/game/entities/createEnemy'
import { Skeleton } from '~/game/entities/Skeleton'
import { Goblin } from '~/game/entities/Goblin'

describe('Skeleton', () => {
  it('定義通りに生成される', () => {
    const enemy = new Skeleton({ x: 3, y: 4 })
    expect(enemy.type).toBe('skeleton')
    expect(enemy.hp).toBe(20)
    expect(enemy.attack).toBe(5)
    expect(enemy.defense).toBe(2)
    expect(enemy.exp).toBe(10)
    expect(enemy.position).toEqual({ x: 3, y: 4 })
    expect(enemy.aiState).toBe('idle')
    expect(enemy.isAlive).toBe(true)
  })

  it('IDが自動生成される', () => {
    const e1 = new Skeleton({ x: 0, y: 0 })
    const e2 = new Skeleton({ x: 0, y: 0 })
    expect(e1.id).not.toBe(e2.id)
  })

  it('カスタムIDを指定できる', () => {
    const enemy = new Skeleton({ x: 0, y: 0 }, 'custom-id')
    expect(enemy.id).toBe('custom-id')
  })
})

describe('Goblin', () => {
  it('定義通りに生成される', () => {
    const enemy = new Goblin({ x: 1, y: 2 })
    expect(enemy.type).toBe('goblin')
    expect(enemy.hp).toBe(30)
    expect(enemy.attack).toBe(8)
    expect(enemy.defense).toBe(3)
    expect(enemy.exp).toBe(20)
  })
})

describe('Enemy（共通機能）', () => {
  describe('takeDamage', () => {
    it('ダメージを受ける', () => {
      const enemy = new Skeleton({ x: 0, y: 0 })
      enemy.takeDamage(8)
      expect(enemy.hp).toBe(12)
    })

    it('HPが0未満にならない', () => {
      const enemy = new Skeleton({ x: 0, y: 0 })
      enemy.takeDamage(999)
      expect(enemy.hp).toBe(0)
      expect(enemy.isAlive).toBe(false)
    })
  })

  describe('移動', () => {
    it('moveTo で指定座標に移動する', () => {
      const enemy = new Skeleton({ x: 0, y: 0 })
      enemy.moveTo(5, 3)
      expect(enemy.position).toEqual({ x: 5, y: 3 })
    })
  })

  describe('AI状態', () => {
    it('状態を変更できる', () => {
      const enemy = new Skeleton({ x: 0, y: 0 })
      expect(enemy.aiState).toBe('idle')
      enemy.setAIState('chase')
      expect(enemy.aiState).toBe('chase')
      enemy.setAIState('attack')
      expect(enemy.aiState).toBe('attack')
    })
  })

  describe('distanceTo', () => {
    it('チェビシェフ距離を計算する', () => {
      const enemy = new Skeleton({ x: 0, y: 0 })
      expect(enemy.distanceTo({ x: 3, y: 0 })).toBe(3)
      expect(enemy.distanceTo({ x: 0, y: 4 })).toBe(4)
      expect(enemy.distanceTo({ x: 3, y: 4 })).toBe(4)
      expect(enemy.distanceTo({ x: 0, y: 0 })).toBe(0)
    })
  })

  describe('toStoreState', () => {
    it('ストア用のデータを返す', () => {
      const enemy = new Skeleton({ x: 1, y: 2 }, 'test-id')
      const state = enemy.toStoreState()
      expect(state).toEqual({
        id: 'test-id',
        type: 'skeleton',
        x: 1,
        y: 2,
        hp: 20,
        maxHp: 20,
        attack: 5,
        defense: 2,
        exp: 10,
        aiState: 'idle',
      })
    })
  })

  describe('toJSON', () => {
    it('データのコピーを返す', () => {
      const enemy = new Skeleton({ x: 1, y: 2 }, 'test-id')
      const json = enemy.toJSON()
      expect(json.type).toBe('skeleton')
      expect(json.id).toBe('test-id')
      expect(json.position).toEqual({ x: 1, y: 2 })

      // 元データに影響しない
      json.position.x = 999
      expect(enemy.position.x).toBe(1)
    })
  })
})

describe('createEnemy', () => {
  it('skeletonタイプでSkeletonを生成する', () => {
    const enemy = createEnemy('skeleton', { x: 0, y: 0 }, 'e1')
    expect(enemy.type).toBe('skeleton')
    expect(enemy.hp).toBe(20)
  })

  it('goblinタイプでGoblinを生成する', () => {
    const enemy = createEnemy('goblin', { x: 0, y: 0 }, 'e2')
    expect(enemy.type).toBe('goblin')
    expect(enemy.hp).toBe(30)
  })

  it('未知のタイプはSkeletonにフォールバックする', () => {
    const enemy = createEnemy('unknown', { x: 0, y: 0 })
    expect(enemy.type).toBe('skeleton')
  })
})
