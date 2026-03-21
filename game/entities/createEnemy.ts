import type { Position } from './Player'
import type { Enemy, EnemyType } from './Enemy'
import { Skeleton } from './Skeleton'
import { Goblin } from './Goblin'

const ENEMY_CLASSES: Record<EnemyType, new (pos: Position, id?: string) => Enemy> = {
  skeleton: Skeleton,
  goblin: Goblin,
}

export function createEnemy(type: string, position: Position, id?: string): Enemy {
  const EnemyClass = ENEMY_CLASSES[type as EnemyType]
  if (!EnemyClass) {
    return new Skeleton(position, id)
  }
  return new EnemyClass(position, id)
}
