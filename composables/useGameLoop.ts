import { useGameStore } from '~/stores/gameStore'
import { TurnManager } from '~/game/systems/TurnManager'
import { randomMove } from '~/game/systems/EnemyAI'
import { ITEMS } from '~/game/data/items'
import { generateFloor } from '~/game/systems/DungeonGenerator'
import { getFloorDifficulty } from '~/game/data/floorConfig'

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

    // 壁・範囲チェック
    if (
      newY < 0 ||
      newY >= map.length ||
      newX < 0 ||
      newX >= map[0].length ||
      map[newY][newX] === 1
    ) {
      return null
    }

    // 敵チェック
    if (store.enemies.some((e) => e.x === newX && e.y === newY)) {
      return null
    }

    // 移動
    store.setPlayerPosition(newX, newY)

    // アイテム拾得チェック
    const item = store.floorItems.find((i) => i.x === newX && i.y === newY)
    if (item) {
      const def = ITEMS[item.itemId]
      store.addToInventory({ itemId: item.itemId, name: def.name })
      store.removeFloorItem(item.id)
      messages.push(`${def.name}を拾った！`)
    }

    // ターン進行
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
    const difficulty = getFloorDifficulty(floor)
    const generated = generateFloor({
      width: difficulty.mapWidth,
      height: difficulty.mapHeight,
      floor,
      enemyCount: difficulty.enemyCount,
      itemCount: difficulty.itemCount,
      enemyTypes: difficulty.enemyTypes,
      itemTypes: difficulty.itemTypes,
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

  function goNextFloor(): string[] {
    store.nextFloor()
    const floor = store.dungeon.floor
    initFloor(floor)
    return [`${floor}Fに到着した！`]
  }

  return {
    playerMove,
    playerWait,
    initFloor,
    goNextFloor,
  }
}
