import { describe, it, expect } from 'vitest'
import { TurnManager } from '~/game/systems/TurnManager'

describe('TurnManager', () => {
  describe('初期状態', () => {
    it('ターン1、プレイヤーフェーズで開始', () => {
      const tm = new TurnManager()
      expect(tm.turnNumber).toBe(1)
      expect(tm.phase).toBe('player')
      expect(tm.isPlayerTurn).toBe(true)
    })
  })

  describe('ターン進行', () => {
    it('player → enemy → end → 次のplayer', () => {
      const tm = new TurnManager()

      // プレイヤー行動
      tm.playerAction()
      expect(tm.phase).toBe('enemy')
      expect(tm.isPlayerTurn).toBe(false)

      // 敵行動
      tm.enemyAction()
      expect(tm.phase).toBe('end')

      // ターン終了
      tm.endTurn()
      expect(tm.phase).toBe('player')
      expect(tm.turnNumber).toBe(2)
      expect(tm.isPlayerTurn).toBe(true)
    })

    it('processTurn で enemy→end→player を一括処理', () => {
      const tm = new TurnManager()
      tm.playerAction() // phase = enemy

      tm.processTurn()
      expect(tm.phase).toBe('player')
      expect(tm.turnNumber).toBe(2)
    })
  })

  describe('不正な操作', () => {
    it('プレイヤーターン以外で playerAction するとエラー', () => {
      const tm = new TurnManager()
      tm.playerAction() // phase = enemy
      expect(() => tm.playerAction()).toThrow('Not player turn')
    })

    it('敵ターン以外で enemyAction するとエラー', () => {
      const tm = new TurnManager()
      expect(() => tm.enemyAction()).toThrow('Not enemy turn')
    })
  })

  describe('reset', () => {
    it('初期状態にリセットされる', () => {
      const tm = new TurnManager()
      tm.playerAction()
      tm.processTurn()
      tm.playerAction()
      tm.processTurn()
      expect(tm.turnNumber).toBe(3)

      tm.reset()
      expect(tm.turnNumber).toBe(1)
      expect(tm.phase).toBe('player')
    })
  })
})
