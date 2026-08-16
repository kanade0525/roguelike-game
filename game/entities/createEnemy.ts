import type { Position } from './Player'
import { type Enemy, type EnemyType, isBossType } from './Enemy'
import { Skeleton } from './Skeleton'
import { Goblin } from './Goblin'
import { Boss } from './Boss'

const ENEMY_CLASSES: Partial<Record<EnemyType, new (pos: Position, id?: string) => Enemy>> = {
  skeleton: Skeleton,
  goblin: Goblin,
}

export function createEnemy(type: string, position: Position, id?: string): Enemy {
  // ボス種別は汎用 Boss（gameConfig からステータス取得）で生成する
  if (isBossType(type)) {
    return new Boss(type as EnemyType, position, id)
  }
  const EnemyClass = ENEMY_CLASSES[type as EnemyType]
  if (!EnemyClass) {
    return new Skeleton(position, id)
  }
  return new EnemyClass(position, id)
}
