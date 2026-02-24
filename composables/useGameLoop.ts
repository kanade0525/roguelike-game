import { useGameStore } from '~/stores/gameStore'
import { TurnManager } from '~/game/systems/TurnManager'
import { randomMove } from '~/game/systems/EnemyAI'

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

    // 階段チェック
    if (map[newY][newX] === 2) {
      messages.push('階段を見つけた！')
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

  function initFloor(playerPos: { x: number; y: number }) {
    store.setPlayerPosition(playerPos.x, playerPos.y)
    store.clearEnemies()
    turnManager.reset()
  }

  return {
    playerMove,
    playerWait,
    initFloor,
  }
}
