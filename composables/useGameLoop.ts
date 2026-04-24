import { useGameStore } from '~/stores/gameStore'
import { TurnManager } from '~/game/systems/TurnManager'
import { CombatSystem } from '~/game/systems/CombatSystem'
import { randomMove } from '~/game/systems/EnemyAI'
import { ITEMS } from '~/game/data/items'
import { generateFloor } from '~/game/systems/DungeonGenerator'
import { getFloorDifficulty } from '~/game/data/floorConfig'
import { getDungeon, DEFAULT_DUNGEON_ID } from '~/game/dungeon'

const turnManager = new TurnManager()
const combatSystem = new CombatSystem()

export interface CombatEvent {
  type: 'playerAttack' | 'enemyAttack'
  targetX: number
  targetY: number
  damage: number
  isCritical: boolean
  isDodged: boolean
  killed: boolean
}

export interface ActionResult {
  messages: string[]
  combatEvents: CombatEvent[]
  playerEvents: CombatEvent[]
  enemyEvents: CombatEvent[]
}

const ENEMY_NAMES: Record<string, string> = {
  skeleton: 'スケルトン',
  goblin: 'ゴブリン',
}

function getEnemyName(type: string): string {
  return ENEMY_NAMES[type] ?? type
}

export function useGameLoop() {
  const store = useGameStore()

  function enemyAttackPlayer(enemy: {
    type: string
    x: number
    y: number
    attack: number
    defense: number
  }): { messages: string[]; event: CombatEvent } {
    const messages: string[] = []
    const name = getEnemyName(enemy.type)
    const result = combatSystem.calculateDamage(
      { attack: enemy.attack },
      { attack: store.player.attack, defense: store.player.defense }
    )

    const event: CombatEvent = {
      type: 'enemyAttack',
      targetX: store.player.position.x,
      targetY: store.player.position.y,
      damage: result.damage,
      isCritical: result.isCritical,
      isDodged: result.isDodged,
      killed: false,
    }

    if (result.isDodged) {
      messages.push(`${name}の攻撃をかわした！`)
    } else {
      store.takeDamage(result.damage)
      if (result.isCritical) {
        messages.push(`${name}の痛恨の一撃！${result.damage}のダメージ！`)
      } else {
        messages.push(`${name}から${result.damage}のダメージ！`)
      }
      if (store.player.hp <= 0) {
        messages.push('力尽きた...')
        event.killed = true
      }
    }
    return { messages, event }
  }

  function processEnemyTurn(): { messages: string[]; events: CombatEvent[] } {
    const map = store.currentMap
    const playerPos = store.player.position
    const messages: string[] = []
    const events: CombatEvent[] = []

    for (const enemy of store.enemies) {
      // 隣接判定（4方向）
      const dx = Math.abs(enemy.x - playerPos.x)
      const dy = Math.abs(enemy.y - playerPos.y)
      const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1)

      if (isAdjacent) {
        const { messages: msgs, event } = enemyAttackPlayer(enemy)
        messages.push(...msgs)
        events.push(event)
        if (store.player.hp <= 0) break
      } else {
        const occupied = [
          playerPos,
          ...store.enemies.filter((e) => e.id !== enemy.id).map((e) => ({ x: e.x, y: e.y })),
        ]
        const newPos = randomMove({ x: enemy.x, y: enemy.y }, map, occupied)
        if (newPos) {
          store.moveEnemy(enemy.id, newPos.x, newPos.y)
        }
      }
    }
    return { messages, events }
  }

  function playerAttack(): ActionResult {
    const empty: ActionResult = {
      messages: [],
      combatEvents: [],
      playerEvents: [],
      enemyEvents: [],
    }
    if (!turnManager.isPlayerTurn) return empty

    const messages: string[] = []
    const playerEvents: CombatEvent[] = []
    const { direction, position } = store.player
    const targetX = position.x + direction.dx
    const targetY = position.y + direction.dy

    const target = store.enemies.find((e) => e.x === targetX && e.y === targetY)

    if (target) {
      const name = getEnemyName(target.type)
      const result = combatSystem.calculateDamage(
        { attack: store.player.attack },
        { attack: target.attack, defense: target.defense }
      )

      let killed = false

      if (result.isDodged) {
        messages.push(`${name}は攻撃をかわした！`)
      } else {
        store.damageEnemy(target.id, result.damage)
        if (result.isCritical) {
          messages.push(`会心の一撃！${name}に${result.damage}のダメージ！`)
        } else {
          messages.push(`${name}に${result.damage}のダメージ！`)
        }

        const updated = store.enemies.find((e) => e.id === target.id)
        if (!updated || updated.hp <= 0) {
          store.removeEnemy(target.id)
          messages.push(`${name}を倒した！`)
          store.gainExp(target.exp)
          killed = true
        }
      }

      playerEvents.push({
        type: 'playerAttack',
        targetX,
        targetY,
        damage: result.damage,
        isCritical: result.isCritical,
        isDodged: result.isDodged,
        killed,
      })
    }

    // ターン消費
    turnManager.playerAction()
    const enemyTurn = processEnemyTurn()
    messages.push(...enemyTurn.messages)
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    store.decreaseSatiation(1)

    const combatEvents = [...playerEvents, ...enemyTurn.events]
    return { messages, combatEvents, playerEvents, enemyEvents: enemyTurn.events }
  }

  function playerMove(dx: number, dy: number): ActionResult | null {
    if (!turnManager.isPlayerTurn) return null

    const map = store.currentMap
    const messages: string[] = []
    const newX = store.player.position.x + dx
    const newY = store.player.position.y + dy

    // 向きを更新
    store.setDirection(dx, dy)

    if (
      newY < 0 ||
      newY >= map.length ||
      newX < 0 ||
      newX >= map[0].length ||
      map[newY][newX] === 1
    ) {
      return null
    }

    if (store.enemies.some((e) => e.x === newX && e.y === newY)) {
      return null
    }

    store.setPlayerPosition(newX, newY)
    store.revealAround(newX, newY)

    const item = store.floorItems.find((i) => i.x === newX && i.y === newY)
    if (item) {
      const def = ITEMS[item.itemId]
      store.addToInventory({ itemId: item.itemId, name: def.name })
      store.removeFloorItem(item.id)
      messages.push(`${def.name}を拾った！`)
    }

    turnManager.playerAction()
    const enemyTurn = processEnemyTurn()
    messages.push(...enemyTurn.messages)
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    store.decreaseSatiation(1)

    return {
      messages,
      combatEvents: enemyTurn.events,
      playerEvents: [],
      enemyEvents: enemyTurn.events,
    }
  }

  function playerWait(): ActionResult {
    if (!turnManager.isPlayerTurn)
      return { messages: [], combatEvents: [], playerEvents: [], enemyEvents: [] }

    const messages: string[] = ['その場で待機した。']
    turnManager.playerAction()
    const enemyTurn = processEnemyTurn()
    messages.push(...enemyTurn.messages)
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    store.decreaseSatiation(1)

    return {
      messages,
      combatEvents: enemyTurn.events,
      playerEvents: [],
      enemyEvents: enemyTurn.events,
    }
  }

  function initFloor(floor: number) {
    const dungeonId = store.dungeon.dungeonId
    const dungeon = getDungeon(dungeonId)
    const difficulty = getFloorDifficulty(floor, dungeonId)
    const floorIndex = Math.min(floor - 1, dungeon.floors.length - 1)
    const fixedFloor = dungeon.floors[floorIndex].fixedMap

    const generated = generateFloor({
      width: difficulty.mapWidth,
      height: difficulty.mapHeight,
      floor,
      enemyCount: difficulty.enemyCount,
      itemCount: difficulty.itemCount,
      enemyTypes: difficulty.enemyTypes,
      itemTypes: difficulty.itemTypes,
      fixedFloor,
    })

    store.setCurrentMap(generated.map)
    store.setPlayerPosition(generated.playerStart.x, generated.playerStart.y)
    store.clearEnemies()
    store.clearFloorItems()
    store.clearExplored()
    turnManager.reset()
    store.revealAround(generated.playerStart.x, generated.playerStart.y)

    for (const item of generated.items) {
      store.addFloorItem(item)
    }
    for (const enemy of generated.enemies) {
      store.addEnemy(enemy)
    }
  }

  function initDungeon(dungeonId: string = DEFAULT_DUNGEON_ID) {
    const dungeon = getDungeon(dungeonId)
    store.resetGame()
    store.setDungeon(dungeonId, dungeon.floors.length)
    initFloor(1)
  }

  function goNextFloor(): string[] | { cleared: true; messages: string[] } {
    const { floor, totalFloors } = store.dungeon

    if (floor >= totalFloors) {
      return { cleared: true, messages: ['ダンジョンを踏破した！'] }
    }

    store.nextFloor()
    const nextFloor = store.dungeon.floor
    initFloor(nextFloor)

    const difficulty = getFloorDifficulty(nextFloor, store.dungeon.dungeonId)
    const floorMsg = difficulty.isBossFloor
      ? `${nextFloor}F — ボスフロアに到達した！`
      : `${nextFloor}Fに到着した！`

    return [floorMsg]
  }

  return {
    playerMove,
    playerAttack,
    playerWait,
    initFloor,
    initDungeon,
    goNextFloor,
  }
}
