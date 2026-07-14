import { useGameStore } from '~/stores/gameStore'
import { TurnManager } from '~/game/systems/TurnManager'
import { CombatSystem } from '~/game/systems/CombatSystem'
import { decideAction } from '~/game/systems/EnemyAI'
import { canMoveDiagonally } from '~/game/systems/movement'
import { generateFloor } from '~/game/systems/DungeonGenerator'
import { getFloorDifficulty } from '~/game/data/floorConfig'
import { getDungeon, DEFAULT_DUNGEON_ID } from '~/game/dungeon'
import { useDebugMode } from '~/composables/useDebugMode'
import gameConfig from '~/game/data/gameConfig.json'

const goldConfig = gameConfig.goldConfig ?? {
  defaultDropAmount: 10,
  dropVariance: 5,
  dropChance: 0.3,
}

function rollGoldDrop(): number {
  if (Math.random() >= goldConfig.dropChance) return 0
  const base = goldConfig.defaultDropAmount
  const variance = goldConfig.dropVariance
  const amount = base + Math.floor(Math.random() * (variance * 2 + 1)) - variance
  return Math.max(1, amount)
}

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
  const debug = useDebugMode()

  // 満腹度を減らし、閾値を跨いだ時のメッセージを返す
  function tickSatiation(): string[] {
    const before = store.player.satiation
    store.decreaseSatiation(1)
    const after = store.player.satiation
    const messages: string[] = []
    if (before > 30 && after <= 30) {
      messages.push('お腹が減ってきた...')
    }
    if (before > 10 && after <= 10) {
      messages.push('もう空腹で倒れそうだ...')
    }
    if (before > 0 && after === 0) {
      messages.push('お腹がペコペコだ！')
    }
    return messages
  }

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
      { attack: store.player.attack, defense: store.player.defense, dodge: store.player.dodge }
    )

    if (debug.invincible.value && !result.isDodged) {
      result.damage = 0
    }

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
      const occupied = [
        playerPos,
        ...store.enemies.filter((e) => e.id !== enemy.id).map((e) => ({ x: e.x, y: e.y })),
      ]
      const action = decideAction(
        {
          x: enemy.x,
          y: enemy.y,
          type: enemy.type,
          aiState: (enemy.aiState ?? 'idle') as 'idle' | 'chase' | 'attack',
        },
        playerPos,
        map,
        occupied
      )

      store.setEnemyAIState(enemy.id, action.newAIState)

      if (action.type === 'attack') {
        const { messages: msgs, event } = enemyAttackPlayer(enemy)
        messages.push(...msgs)
        events.push(event)
        if (store.player.hp <= 0) break
      } else if (action.type === 'move') {
        store.moveEnemy(enemy.id, action.position.x, action.position.y)
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
        { attack: target.attack, defense: target.defense, dodge: target.dodge }
      )

      if (debug.oneShot.value) {
        result.damage = target.hp
        result.isDodged = false
      }

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
          store.incrementDefeatedEnemies()
          const beforeLv = store.player.level
          const beforeMaxHp = store.player.maxHp
          const beforeAtk = store.player.attack
          const beforeDef = store.player.defense
          store.gainExp(target.exp)
          const leveledUp = store.player.level > beforeLv
          const gold = rollGoldDrop()
          if (gold > 0) {
            store.player.gold += gold
          }

          // 撃破ログを1行に統合: 「Xを倒した！ EXP+5  10G」
          const parts = [`${name}を倒した！ EXP+${target.exp}`]
          if (gold > 0) parts.push(`${gold}G`)
          messages.push(parts.join('  '))
          if (leveledUp) {
            const dHp = store.player.maxHp - beforeMaxHp
            const dAtk = store.player.attack - beforeAtk
            const dDef = store.player.defense - beforeDef
            const upParts: string[] = []
            if (dHp !== 0) upParts.push(`最大HP+${dHp}`)
            if (dAtk !== 0) upParts.push(`攻撃+${dAtk}`)
            if (dDef !== 0) upParts.push(`防御+${dDef}`)
            const detail = upParts.length > 0 ? `  ${upParts.join('  ')}` : ''
            messages.push(`レベルが${store.player.level}に上がった！${detail}`)
          }
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
    messages.push(...tickSatiation())

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

    // 斜め移動時は壁角のすり抜けを禁止
    if (
      dx !== 0 &&
      dy !== 0 &&
      !canMoveDiagonally(map, store.player.position.x, store.player.position.y, dx, dy)
    ) {
      return null
    }

    if (store.enemies.some((e) => e.x === newX && e.y === newY)) {
      return null
    }

    store.setPlayerPosition(newX, newY)
    store.recomputeFov(newX, newY)

    const item = store.floorItems.find((i) => i.x === newX && i.y === newY)
    if (item) {
      const pickup = store.pickupItem(item.itemId, item.amount ?? 1)
      store.removeFloorItem(item.id)
      if (pickup.message) {
        messages.push(pickup.message)
      }
    }

    turnManager.playerAction()
    const enemyTurn = processEnemyTurn()
    messages.push(...enemyTurn.messages)
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    messages.push(...tickSatiation())

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
    messages.push(...tickSatiation())

    return {
      messages,
      combatEvents: enemyTurn.events,
      playerEvents: [],
      enemyEvents: enemyTurn.events,
    }
  }

  // メッセージを出さずに1ターン経過させる（アイテム使用後など、呼び出し元で独自メッセージを出す場合）
  function passTurn(): ActionResult {
    if (!turnManager.isPlayerTurn)
      return { messages: [], combatEvents: [], playerEvents: [], enemyEvents: [] }

    turnManager.playerAction()
    const enemyTurn = processEnemyTurn()
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    const hungerMessages = tickSatiation()

    return {
      messages: [...enemyTurn.messages, ...hungerMessages],
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
    store.recomputeFov(generated.playerStart.x, generated.playerStart.y)

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
    // 拠点に持ち帰った所持品（強化済み装備など）を引き継いで開始
    store.loadBelongingsIntoInventory()
  }

  // ダンジオンから脱出して拠点へ戻る。現ランのゴールドは拠点に持ち帰る。
  function escapeDungeon() {
    // ラン終了の会計処理（金庫精算・gold銀行・装備持ち帰り・lastRun）は store に集約
    store.finishSurvivedRun('escaped')
    // gameResult の変化を GameCanvas が監視して /village へ遷移する
    store.setGameResult('escaped')
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
      ? `B${nextFloor}F — ボスフロアに到達した！`
      : `B${nextFloor}Fに到着した！`

    return [floorMsg]
  }

  return {
    playerMove,
    playerAttack,
    playerWait,
    passTurn,
    initFloor,
    initDungeon,
    goNextFloor,
    escapeDungeon,
  }
}
