import { useGameStore } from '~/stores/gameStore'
import { TurnManager } from '~/game/systems/TurnManager'
import { randomMove } from '~/game/systems/EnemyAI'
import { ITEMS } from '~/game/data/items'
import { generateFloor } from '~/game/systems/DungeonGenerator'
import { getFloorDifficulty } from '~/game/data/floorConfig'
import { getDungeon, DEFAULT_DUNGEON_ID } from '~/game/dungeon'

const turnManager = new TurnManager()

export function useGameLoop() {
  const store = useGameStore()

  function processEnemyTurn() {
    const map = store.currentMap
    const playerPos = store.player.position
    for (const enemy of store.enemies) {
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

  function playerMove(dx: number, dy: number): string[] | null {
    if (!turnManager.isPlayerTurn) return null

    const map = store.currentMap
    const messages: string[] = []
    const newX = store.player.position.x + dx
    const newY = store.player.position.y + dy

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

    const item = store.floorItems.find((i) => i.x === newX && i.y === newY)
    if (item) {
      const def = ITEMS[item.itemId]
      store.addToInventory({ itemId: item.itemId, name: def.name })
      store.removeFloorItem(item.id)
      messages.push(`${def.name}を拾った！`)
    }

    turnManager.playerAction()
    processEnemyTurn()
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    store.decreaseSatiation(1)

    return messages
  }

  function playerWait(): string[] {
    if (!turnManager.isPlayerTurn) return []

    turnManager.playerAction()
    processEnemyTurn()
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    store.decreaseSatiation(1)

    return ['その場で待機した。']
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
    turnManager.reset()

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
    store.setDungeon(dungeonId, dungeon.totalFloors)
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
    playerWait,
    initFloor,
    initDungeon,
    goNextFloor,
  }
}
