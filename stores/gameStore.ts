import { defineStore } from 'pinia'
import { ITEMS, type EquipmentData } from '~/game/data/items'
import {
  useItem as applyUseItem,
  equipItem as calcEquip,
  unequipItem as calcUnequip,
} from '~/game/systems/ItemSystem'
import gameConfig from '~/game/data/gameConfig.json'

interface PlayerState {
  hp: number
  maxHp: number
  level: number
  exp: number
  satiation: number
  maxSatiation: number
  attack: number
  defense: number
  dodge: number
  gold: number
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
  dodge: number
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
  equipped?: boolean
  stack?: number
  equipmentData?: EquipmentData
}

interface DungeonState {
  floor: number
  dungeonId: string
  totalFloors: number
}

export type GameResult = 'active' | 'dead' | 'cleared'

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
  gameResult: GameResult
  defeatedEnemies: number
  maxFloorReached: number
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
      dodge: 0.05,
      gold: 0,
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
    gameResult: 'active',
    defeatedEnemies: 0,
    maxFloorReached: 1,
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
      if (this.dungeon.floor > this.maxFloorReached) {
        this.maxFloorReached = this.dungeon.floor
      }
    },

    setGameResult(result: GameResult) {
      this.gameResult = result
    },

    incrementDefeatedEnemies() {
      this.defeatedEnemies++
    },

    setDungeon(dungeonId: string, totalFloors: number) {
      this.dungeon.dungeonId = dungeonId
      this.dungeon.totalFloors = totalFloors
      this.dungeon.floor = 1
    },

    setDungeonState(dungeonId: string, totalFloors: number, floor: number) {
      this.dungeon.dungeonId = dungeonId
      this.dungeon.totalFloors = totalFloors
      this.dungeon.floor = floor
    },

    setPlayerStats(stats: Partial<PlayerState>) {
      Object.assign(this.player, stats)
    },

    setEnemyStats(id: string, stats: Partial<Omit<EnemyState, 'id'>>) {
      const enemy = this.enemies.find((e) => e.id === id)
      if (enemy) {
        Object.assign(enemy, stats)
      }
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

    pickupItem(itemId: string, amount: number = 1): { message: string; toGold: boolean } {
      const def = ITEMS[itemId]
      if (!def) return { message: '', toGold: false }

      // ゴールドはプレイヤーの所持金に加算
      if (def.type === 'gold') {
        const goldAmount =
          amount > 1 ? amount : gameConfig.goldConfig?.defaultDropAmount ?? 10
        this.player.gold += goldAmount
        return { message: `${goldAmount}Gを拾った！`, toGold: true }
      }

      // スタック可能アイテムは既存スタックに合算
      if (def.stackable) {
        const existing = this.inventory.find(
          (i) => i.itemId === itemId && !i.equipped
        )
        if (existing) {
          existing.stack = (existing.stack ?? 1) + amount
          return { message: `${def.name}を拾った！`, toGold: false }
        }
      }

      // それ以外は新規スロット
      const entry: InventoryItem = { itemId, name: def.name }
      if (def.stackable) {
        entry.stack = amount
      }
      this.inventory.push(entry)
      return { message: `${def.name}を拾った！`, toGold: false }
    },

    clearFloorItems() {
      this.floorItems = []
    },

    useInventoryItem(index: number): { success: boolean; message: string } {
      const entry = this.inventory[index]
      if (!entry) return { success: false, message: '' }
      const def = ITEMS[entry.itemId]
      if (!def) return { success: false, message: '' }
      const result = applyUseItem(def, this.player)
      if (result.consumed) {
        const currentStack = entry.stack ?? 1
        if (currentStack > 1) {
          entry.stack = currentStack - 1
        } else {
          this.inventory.splice(index, 1)
        }
      }
      return { success: result.success, message: result.message }
    },

    equipInventoryItem(index: number): { success: boolean; message: string } {
      const entry = this.inventory[index]
      if (!entry) return { success: false, message: '' }
      const def = ITEMS[entry.itemId]
      if (!def) return { success: false, message: '' }

      // 既に装備済みなら外す
      if (entry.equipped) {
        const unequipped = calcUnequip(def)
        this.player.attack += unequipped.attackDelta
        this.player.defense += unequipped.defenseDelta
        entry.equipped = false
        return { success: true, message: unequipped.message }
      }

      // 同タイプの装備中アイテムを検索（1スロット1装備）
      const currentIndex = this.inventory.findIndex(
        (i, idx) => idx !== index && i.equipped && ITEMS[i.itemId]?.type === def.type
      )
      const currentId = currentIndex >= 0 ? this.inventory[currentIndex].itemId : null
      const result = calcEquip(def, currentId)
      if (!result.success) {
        return { success: false, message: result.message }
      }
      if (currentIndex >= 0) {
        this.inventory[currentIndex].equipped = false
      }
      this.player.attack += result.attackDelta
      this.player.defense += result.defenseDelta
      entry.equipped = true
      return { success: true, message: result.message }
    },

    dropInventoryItem(index: number): { success: boolean; message: string; itemId: string | null } {
      const entry = this.inventory[index]
      if (!entry) return { success: false, message: '', itemId: null }
      const def = ITEMS[entry.itemId]
      // 装備中なら先に外す
      if (entry.equipped && def) {
        const u = calcUnequip(def)
        this.player.attack += u.attackDelta
        this.player.defense += u.defenseDelta
      }
      const name = entry.name
      const itemId = entry.itemId
      this.inventory.splice(index, 1)
      return { success: true, message: `${name}を捨てた`, itemId }
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
