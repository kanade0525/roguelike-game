import { defineStore } from 'pinia'
import { ITEMS, makeEquipmentData, type EquipmentData } from '~/game/data/items'
import { useItem as applyUseItem } from '~/game/systems/ItemSystem'
import {
  computeDeathGoldLoss,
  rollSafeGold,
  computeEnhanceCost,
} from '~/game/systems/EconomySystem'
import { TILE } from '~/game/data/maps'
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
  amount?: number // gold ドロップなど数量を伴うアイテム用
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

export type GameResult = 'active' | 'dead' | 'cleared' | 'escaped'

// 直近1ランのリザルト（拠点画面で表示する）
interface LastRun {
  result: 'escaped' | 'dead' | 'cleared'
  goldBanked: number // 拠点に預けたゴールド
  goldLost: number // 死亡ペナルティ等で失ったゴールド
  floor: number // 到達フロア
}

// ラン跨ぎで永続する拠点データ（localStorage 保存）
interface MetaState {
  gold: number // 拠点に預けた永続ゴールド（鍛冶で使用）
  lastRun: LastRun | null
  storage: InventoryItem[] // 持ち帰った所持品（装備の強化はここに永続）
}

// localStorage キー（sessionStorage の現ラン継続とは別レイヤ）
const META_STORAGE_KEY = 'katabasis_meta'

// 装備エントリの実効ボーナス（強化込み）。未装備データは +0 として算出。
function equipBonusOf(entry: InventoryItem): { attack: number; defense: number } {
  const def = ITEMS[entry.itemId]
  if (!def || !def.equippable) return { attack: 0, defense: 0 }
  const data =
    entry.equipmentData ??
    makeEquipmentData(def, 0, gameConfig.equipmentConfig.enhanceBonusPerLevel)
  return { attack: data.attackBonus, defense: data.defenseBonus }
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
  gameResult: GameResult
  defeatedEnemies: number
  maxFloorReached: number
  meta: MetaState // ラン跨ぎ永続データ
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    player: {
      hp: 25,
      maxHp: 25,
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
    meta: {
      gold: 0,
      lastRun: null,
      storage: [],
    },
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
      // meta（永続ゴールド等）はランを跨いで保持する
      const preservedMeta: MetaState = JSON.parse(JSON.stringify(this.meta))
      this.$reset()
      this.meta = preservedMeta
    },

    // --- 拠点永続データ（localStorage レイヤ） ---

    persistMeta() {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(this.meta))
    },

    loadMeta(): boolean {
      if (typeof localStorage === 'undefined') return false
      const saved = localStorage.getItem(META_STORAGE_KEY)
      if (!saved) return false
      try {
        const parsed = JSON.parse(saved)
        this.meta = {
          gold: typeof parsed.gold === 'number' ? parsed.gold : 0,
          lastRun: parsed.lastRun ?? null,
          storage: Array.isArray(parsed.storage) ? parsed.storage : [],
        }
        return true
      } catch {
        localStorage.removeItem(META_STORAGE_KEY)
        return false
      }
    },

    // 現ランで稼いだゴールドを拠点（永続）ゴールドへ預ける
    bankRunGold(): number {
      const amount = this.player.gold
      this.meta.gold += amount
      this.player.gold = 0
      this.persistMeta()
      return amount
    },

    setLastRun(info: LastRun) {
      this.meta.lastRun = info
      this.persistMeta()
    },

    // 死亡時のペナルティ適用: 現ランgoldの一定割合をロスト、残りは拠点へ持ち帰る。
    // 持ち帰り品（storage）も失う = 死亡は全ロスト。
    applyDeathPenalty(): { lost: number; kept: number } {
      const rate = gameConfig.deathPenalty?.goldLossRate ?? 1
      const { lost, kept } = computeDeathGoldLoss(this.player.gold, rate)
      this.meta.gold += kept
      this.player.gold = 0
      this.meta.storage = []
      this.setLastRun({
        result: 'dead',
        goldBanked: kept,
        goldLost: lost,
        floor: this.dungeon.floor,
      })
      return { lost, kept }
    },

    // --- 持ち帰り品（belongings）: 脱出/踏破で拠点へ、死亡で消失、次ラン開始時に再装填 ---

    // 現在の所持品を拠点倉庫へスナップショット保存（脱出・踏破時）
    saveBelongings() {
      this.meta.storage = JSON.parse(JSON.stringify(this.inventory))
      this.persistMeta()
    },

    // 拠点倉庫の所持品を現ランのインベントリへ展開し、装備中ボーナスを再適用（ラン開始時）
    loadBelongingsIntoInventory() {
      this.inventory = JSON.parse(JSON.stringify(this.meta.storage))
      for (const entry of this.inventory) {
        if (!entry.equipped) continue
        const bonus = equipBonusOf(entry)
        this.player.attack += bonus.attack
        this.player.defense += bonus.defense
      }
    },

    // 装備の強化（鍛冶）。拠点倉庫の装備を対象に meta.gold を消費して enhanceLevel++。
    enhanceEquipment(storageIndex: number): { success: boolean; message: string } {
      const entry = this.meta.storage[storageIndex]
      if (!entry) return { success: false, message: '' }
      const def = ITEMS[entry.itemId]
      if (!def || !def.equippable) {
        return { success: false, message: 'これは強化できない' }
      }
      const cfg = gameConfig.equipmentConfig
      const data = entry.equipmentData ?? makeEquipmentData(def, 0, cfg.enhanceBonusPerLevel)
      if (data.enhanceLevel >= cfg.maxEnhanceLevel) {
        return { success: false, message: `${def.name}はこれ以上強化できない` }
      }
      const cost = computeEnhanceCost(
        data.enhanceLevel,
        cfg.enhanceCostBase,
        cfg.enhanceCostMultiplier
      )
      if (this.meta.gold < cost) {
        return { success: false, message: `ゴールドが足りない（必要 ${cost}G）` }
      }
      this.meta.gold -= cost
      const newLevel = data.enhanceLevel + 1
      entry.equipmentData = makeEquipmentData(def, newLevel, cfg.enhanceBonusPerLevel)
      this.persistMeta()
      return { success: true, message: `${def.name}を +${newLevel} に強化した！（-${cost}G）` }
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

    clearInventory() {
      this.inventory = []
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
        const goldAmount = amount > 1 ? amount : (gameConfig.goldConfig?.defaultDropAmount ?? 10)
        this.player.gold += goldAmount
        return { message: `${goldAmount}Gを拾った！`, toGold: true }
      }

      // スタック可能アイテムは既存スタックに合算
      if (def.stackable) {
        const existing = this.inventory.find((i) => i.itemId === itemId && !i.equipped)
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
      // 装備品は強化データ（+0）を付与しておく（強化表示・鍛冶の対象になる）
      if (def.equippable) {
        entry.equipmentData = makeEquipmentData(
          def,
          0,
          gameConfig.equipmentConfig.enhanceBonusPerLevel
        )
      }
      this.inventory.push(entry)
      return { message: `${def.name}を拾った！`, toGold: false }
    },

    clearFloorItems() {
      this.floorItems = []
    },

    useInventoryItem(index: number): {
      success: boolean
      message: string
      scrollAction?: 'teleport' | 'revealMap' | 'escape'
    } {
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
      // 巻物の状態変更系はストアで適用（'escape' は経路集約のため呼び出し側で処理）
      if (result.scrollAction === 'teleport') {
        this.teleportPlayerRandom()
      } else if (result.scrollAction === 'revealMap') {
        this.revealEntireMap()
      }
      return {
        success: result.success,
        message: result.message,
        scrollAction: result.scrollAction,
      }
    },

    // フロア内のランダムな床マスへプレイヤーを瞬間移動させる
    teleportPlayerRandom(): boolean {
      const map = this.currentMap
      if (!map.length) return false
      const candidates: { x: number; y: number }[] = []
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          if (map[y][x] !== TILE.FLOOR) continue
          if (x === this.player.position.x && y === this.player.position.y) continue
          if (this.enemies.some((e) => e.x === x && e.y === y)) continue
          candidates.push({ x, y })
        }
      }
      if (candidates.length === 0) return false
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      this.setPlayerPosition(pick.x, pick.y)
      this.revealAround(pick.x, pick.y)
      return true
    },

    // 現フロアの全タイルを探索済みにする（地図の巻物）
    revealEntireMap() {
      const map = this.currentMap
      const explored = new Set(this.exploredTiles)
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          explored.add(`${x},${y}`)
        }
      }
      this.exploredTiles = Array.from(explored)
    },

    // 拠点で所持している謎の金庫をすべて開封し、獲得ゴールドを拠点goldへ加算
    openStrangeSafes(): { count: number; gold: number } {
      const cfg = gameConfig.strangeSafe ?? { minGold: 50, maxGold: 200 }
      let count = 0
      let gold = 0
      this.inventory = this.inventory.filter((entry) => {
        if (ITEMS[entry.itemId]?.type !== 'special') return true
        const times = entry.stack ?? 1
        for (let i = 0; i < times; i++) {
          gold += rollSafeGold(cfg.minGold, cfg.maxGold)
          count++
        }
        return false
      })
      if (count > 0) {
        this.meta.gold += gold
        this.persistMeta()
      }
      return { count, gold }
    },

    equipInventoryItem(index: number): { success: boolean; message: string } {
      const entry = this.inventory[index]
      if (!entry) return { success: false, message: '' }
      const def = ITEMS[entry.itemId]
      if (!def) return { success: false, message: '' }
      if (!def.equippable) {
        return { success: false, message: `${def.name}は装備できない` }
      }

      // 既に装備済みなら外す（強化込みボーナスを差し引く）
      if (entry.equipped) {
        const bonus = equipBonusOf(entry)
        this.player.attack -= bonus.attack
        this.player.defense -= bonus.defense
        entry.equipped = false
        return { success: true, message: `${def.name}を外した` }
      }

      // 同タイプの装備中アイテムを外す（1スロット1装備）
      const currentIndex = this.inventory.findIndex(
        (i, idx) => idx !== index && i.equipped && ITEMS[i.itemId]?.type === def.type
      )
      if (currentIndex >= 0) {
        const current = this.inventory[currentIndex]
        const curBonus = equipBonusOf(current)
        this.player.attack -= curBonus.attack
        this.player.defense -= curBonus.defense
        current.equipped = false
      }

      // 新しい装備の強化込みボーナスを加算
      const bonus = equipBonusOf(entry)
      this.player.attack += bonus.attack
      this.player.defense += bonus.defense
      entry.equipped = true
      return { success: true, message: `${def.name}を装備した` }
    },

    dropInventoryItem(index: number): { success: boolean; message: string; itemId: string | null } {
      const entry = this.inventory[index]
      if (!entry) return { success: false, message: '', itemId: null }
      // 装備中なら先に外す（強化込みボーナスを差し引く）
      if (entry.equipped) {
        const bonus = equipBonusOf(entry)
        this.player.attack -= bonus.attack
        this.player.defense -= bonus.defense
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
      // 満腹度はターン数 SATIATION_DECREASE_INTERVAL ごとに amount 減らす
      const SATIATION_DECREASE_INTERVAL = 15
      if (this.turn % SATIATION_DECREASE_INTERVAL !== 0) return
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
