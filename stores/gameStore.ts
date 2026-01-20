import { defineStore } from 'pinia'

interface PlayerState {
  hp: number
  maxHp: number
  attack: number
  defense: number
  position: { x: number; y: number }
}

interface DungeonState {
  floor: number
}

interface GameState {
  player: PlayerState
  dungeon: DungeonState
  turn: number
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    player: {
      hp: 100,
      maxHp: 100,
      attack: 10,
      defense: 5,
      position: { x: 7, y: 7 },
    },
    dungeon: {
      floor: 1,
    },
    turn: 0,
  }),

  getters: {
    isPlayerAlive: (state) => state.player.hp > 0,
    hpPercentage: (state) => (state.player.hp / state.player.maxHp) * 100,
  },

  actions: {
    movePlayer(dx: number, dy: number) {
      this.player.position.x += dx
      this.player.position.y += dy
      this.endTurn()
    },

    takeDamage(damage: number) {
      const actualDamage = Math.max(1, damage - this.player.defense)
      this.player.hp = Math.max(0, this.player.hp - actualDamage)
    },

    heal(amount: number) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount)
    },

    nextFloor() {
      this.dungeon.floor++
    },

    endTurn() {
      this.turn++
    },

    resetGame() {
      this.$reset()
    },
  },
})
