import { useGameStore } from '~/stores/gameStore'
import { TurnManager } from '~/game/systems/TurnManager'
import { randomMove } from '~/game/systems/EnemyAI'
import { ITEMS } from '~/game/data/items'
import { getFloorConfig, TILE } from '~/game/data/maps'
import { findValidSpawnPosition } from '~/game/systems/SpawnValidator'

const turnManager = new TurnManager()

export function useGameLoop() {
  const store = useGameStore()

  function processEnemyTurn(map: number[][]) {
    const playerPos = store.player.position
    for (const enemy of store.enemies) {
      // プレイヤー位置と他の敵位置を占有リストに含める
      const occupied = [
        playerPos,
        ...store.enemies
          .filter((e) => e.id !== enemy.id)
          .map((e) => ({ x: e.x, y: e.y })),
      ]
      const newPos = randomMove({ x: enemy.x, y: enemy.y }, map, occupied)
      if (newPos) {
        store.moveEnemy(enemy.id, newPos.x, newPos.y)
        console.log(`[Enemy] ${enemy.type} → (${newPos.x}, ${newPos.y})`)
      }
    }
  }

  function playerMove(
    dx: number,
    dy: number,
    map: number[][],
  ): string[] | null {
    if (!turnManager.isPlayerTurn) return null

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

    // ターン進行: player → enemy → end → player
    turnManager.playerAction()
    processEnemyTurn(map)
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    store.decreaseSatiation(1)
    console.log(`${store.turn}ターン目`)

    return messages
  }

  function playerWait(map: number[][]): string[] {
    if (!turnManager.isPlayerTurn) return []

    turnManager.playerAction()
    processEnemyTurn(map)
    turnManager.enemyAction()
    turnManager.endTurn()
    store.endTurn()
    store.decreaseSatiation(1)

    return ['その場で待機した。']
  }

  function spawnFloorEntities(floor: number) {
    const config = getFloorConfig(floor)
    const { map, playerStart } = config

    // 階段の座標を占有リストに含める
    const occupied: { x: number; y: number }[] = []
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        if (map[y][x] === TILE.STAIRS) {
          occupied.push({ x, y })
        }
      }
    }

    // アイテムを配置し、占有リストに追加
    for (const item of config.items) {
      store.addFloorItem(item)
      occupied.push({ x: item.x, y: item.y })
    }

    // 敵を配置（バリデーション付き）
    for (const enemy of config.enemies) {
      const pos = findValidSpawnPosition(enemy.x, enemy.y, map, playerStart, occupied)
      if (pos) {
        store.addEnemy({ ...enemy, x: pos.x, y: pos.y })
        occupied.push(pos)
      }
    }
  }

  function initFloor(floor: number) {
    const config = getFloorConfig(floor)
    store.setPlayerPosition(config.playerStart.x, config.playerStart.y)
    store.clearEnemies()
    store.clearFloorItems()
    turnManager.reset()
    spawnFloorEntities(floor)
  }

  function goNextFloor(): string[] {
    store.nextFloor()
    const floor = store.dungeon.floor
    const config = getFloorConfig(floor)
    store.setPlayerPosition(config.playerStart.x, config.playerStart.y)
    store.clearEnemies()
    store.clearFloorItems()
    turnManager.reset()
    spawnFloorEntities(floor)
    console.log(`${floor}Fに到着`)
    return [`${floor}Fに到着した！`]
  }

  return {
    playerMove,
    playerWait,
    initFloor,
    goNextFloor,
  }
}
