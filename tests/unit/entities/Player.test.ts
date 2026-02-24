import { describe, it, expect } from 'vitest'
import { Player } from '~/game/entities/Player'

describe('Player', () => {
  describe('constructor', () => {
    it('デフォルト値で初期化される', () => {
      const player = new Player()
      expect(player.hp).toBe(100)
      expect(player.maxHp).toBe(100)
      expect(player.attack).toBe(10)
      expect(player.defense).toBe(5)
      expect(player.position).toEqual({ x: 7, y: 7 })
    })

    it('カスタム値で初期化できる', () => {
      const player = new Player({ hp: 50, maxHp: 80, attack: 15, defense: 8 })
      expect(player.hp).toBe(50)
      expect(player.maxHp).toBe(80)
      expect(player.attack).toBe(15)
      expect(player.defense).toBe(8)
    })

    it('一部の値だけ指定できる', () => {
      const player = new Player({ hp: 50 })
      expect(player.hp).toBe(50)
      expect(player.maxHp).toBe(100)
      expect(player.attack).toBe(10)
    })
  })

  describe('takeDamage', () => {
    it('防御力を差し引いたダメージを受ける', () => {
      const player = new Player({ defense: 5 })
      const actual = player.takeDamage(12)
      expect(actual).toBe(7) // 12 - 5
      expect(player.hp).toBe(93) // 100 - 7
    })

    it('最低1ダメージは受ける', () => {
      const player = new Player({ defense: 100 })
      const actual = player.takeDamage(1)
      expect(actual).toBe(1)
      expect(player.hp).toBe(99)
    })

    it('HPが0未満にならない', () => {
      const player = new Player({ hp: 5, defense: 0 })
      player.takeDamage(100)
      expect(player.hp).toBe(0)
      expect(player.isAlive).toBe(false)
    })
  })

  describe('heal', () => {
    it('HPが回復する', () => {
      const player = new Player({ hp: 50, maxHp: 100 })
      const healed = player.heal(30)
      expect(healed).toBe(30)
      expect(player.hp).toBe(80)
    })

    it('maxHpを超えて回復しない', () => {
      const player = new Player({ hp: 90, maxHp: 100 })
      const healed = player.heal(30)
      expect(healed).toBe(10)
      expect(player.hp).toBe(100)
    })

    it('満タンの場合は0回復', () => {
      const player = new Player({ hp: 100, maxHp: 100 })
      const healed = player.heal(30)
      expect(healed).toBe(0)
      expect(player.hp).toBe(100)
    })
  })

  describe('移動', () => {
    it('moveTo で指定座標に移動する', () => {
      const player = new Player()
      player.moveTo(3, 5)
      expect(player.position).toEqual({ x: 3, y: 5 })
    })

    it('moveBy で相対移動する', () => {
      const player = new Player({ position: { x: 5, y: 5 } })
      player.moveBy(-1, 2)
      expect(player.position).toEqual({ x: 4, y: 7 })
    })
  })

  describe('toJSON', () => {
    it('データのコピーを返す', () => {
      const player = new Player()
      const json = player.toJSON()
      expect(json.hp).toBe(100)
      expect(json.position).toEqual({ x: 7, y: 7 })

      // 元データに影響しないことを確認
      json.hp = 0
      json.position.x = 999
      expect(player.hp).toBe(100)
      expect(player.position.x).toBe(7)
    })
  })

  describe('isAlive', () => {
    it('HPが1以上なら生存', () => {
      const player = new Player({ hp: 1 })
      expect(player.isAlive).toBe(true)
    })

    it('HPが0なら死亡', () => {
      const player = new Player({ hp: 0 })
      expect(player.isAlive).toBe(false)
    })
  })
})
