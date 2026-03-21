import { defineStore } from 'pinia'

interface PlayerState {
  hp: number
  maxHp: number
  level: number
  exp: number
  satiation: number
  maxSatiation: number
  attack: number
  defense: number
  direction: { dx: number; dy: number }
  position: { x: number; y: number }
}

interface EnemyState {
  id: string
  type: string
  x: number
  y: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  exp: number
  aiState: string
}

interface FloorItem {
  id: string
  itemId: string
  x: number
  y: number
}

interface InventoryItem {
  itemId: string
  name: string
}

interface DungeonState {
  floor: number
  dungeonId: string
  totalFloors: number
}

interface GameState {
  player: PlayerState
  dungeon: DungeonState
  enemies: EnemyState[]
  floorItems: FloorItem[]
  inventory: InventoryItem[]
  turn: number
  messageLog: string[]
  currentMap: number[][]
  exploredTiles: string[] // "x,y" 形式の探索済み座標
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    player: {
      hp: 100,
      maxHp: 100,
      level: 1,
      exp: 0,
      satiation: 100,
      maxSatiation: 100,
      attack: 10,
      defense: 5,
      direction: { dx: 0, dy: 1 },
      position: { x: 7, y: 7 },
    },
    dungeon: {
      floor: 1,
      dungeonId: 'silentForest',
      totalFloors: 5,
    },
    enemies: [],
    floorItems: [],
    inventory: [],
    turn: 0,
    messageLog: [],
    currentMap: [],
    exploredTiles: [],
  }),

  getters: {
    isPlayerAlive: (state) => state.player.hp > 0,
    hpPercentage: (state) => (state.player.hp / state.player.maxHp) * 100,
  },

  actions: {
    movePlayer(dx: number, dy: number) {
      this.player.position.x += dx
      this.player.position.y += dy
    },

    setPlayerPosition(x: number, y: number) {
      this.player.position.x = x
      this.player.position.y = y
    },

    takeDamage(damage: number) {
      this.player.hp = Math.max(0, this.player.hp - damage)
    },

    setDirection(dx: number, dy: number) {
      this.player.direction = { dx, dy }
    },

    heal(amount: number) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount)
    },

    nextFloor() {
      this.dungeon.floor++
    },

    setDungeon(dungeonId: string, totalFloors: number) {
      this.dungeon.dungeonId = dungeonId
      this.dungeon.totalFloors = totalFloors
      this.dungeon.floor = 1
    },

    endTurn() {
      this.turn++
    },

    resetGame() {
      this.$reset()
    },

    addMessage(message: string) {
      this.messageLog.push(message)
      if (this.messageLog.length > 50) {
        this.messageLog.shift()
      }
    },

    addEnemy(enemy: EnemyState) {
      this.enemies.push(enemy)
    },

    removeEnemy(id: string) {
      this.enemies = this.enemies.filter((e) => e.id !== id)
    },

    damageEnemy(id: string, damage: number) {
      const enemy = this.enemies.find((e) => e.id === id)
      if (enemy) {
        enemy.hp = Math.max(0, enemy.hp - damage)
      }
    },

    moveEnemy(id: string, x: number, y: number) {
      const enemy = this.enemies.find((e) => e.id === id)
      if (enemy) {
        enemy.x = x
        enemy.y = y
      }
    },

    setEnemyAIState(id: string, state: string) {
      const enemy = this.enemies.find((e) => e.id === id)
      if (enemy) {
        enemy.aiState = state
      }
    },

    clearEnemies() {
      this.enemies = []
    },

    addFloorItem(item: FloorItem) {
      this.floorItems.push(item)
    },

    removeFloorItem(id: string) {
      this.floorItems = this.floorItems.filter((i) => i.id !== id)
    },

    addToInventory(item: InventoryItem) {
      this.inventory.push(item)
    },

    clearFloorItems() {
      this.floorItems = []
    },

    setCurrentMap(map: number[][]) {
      this.currentMap = map.map((row) => [...row])
    },

    revealAround(cx: number, cy: number, radius: number = 3) {
      const mapH = this.currentMap.length
      const mapW = mapH > 0 ? this.currentMap[0].length : 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = cx + dx
          const y = cy + dy
          if (x < 0 || x >= mapW || y < 0 || y >= mapH) continue
          const key = `${x},${y}`
          if (!this.exploredTiles.includes(key)) {
            this.exploredTiles.push(key)
          }
        }
      }
    },

    clearExplored() {
      this.exploredTiles = []
    },

    isExplored(x: number, y: number): boolean {
      return this.exploredTiles.includes(`${x},${y}`)
    },

    decreaseSatiation(amount: number) {
      this.player.satiation = Math.max(0, this.player.satiation - amount)
    },

    saveToSession() {
      sessionStorage.setItem('gameState', JSON.stringify(this.$state))
    },

    restoreFromSession(): boolean {
      const saved = sessionStorage.getItem('gameState')
      if (!saved) {
        this.$reset()
        return false
      }
      try {
        this.$reset()
        this.$patch(JSON.parse(saved))
        return true
      } catch {
        this.$reset()
        sessionStorage.removeItem('gameState')
        return false
      }
    },

    gainExp(amount: number) {
      this.player.exp += amount
      this.addMessage(`${amount}の経験値を獲得した！`)
      const expNeeded = this.player.level * 30
      if (this.player.exp >= expNeeded) {
        this.player.exp -= expNeeded
        this.player.level++
        this.player.maxHp += 10
        this.player.hp = this.player.maxHp
        this.player.attack += 2
        this.player.defense += 1
        this.addMessage(`レベルが${this.player.level}に上がった！`)
        this.addMessage(`最大HPが${this.player.maxHp}になった！`)
      }
    },
  },
})
