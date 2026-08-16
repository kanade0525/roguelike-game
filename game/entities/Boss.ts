import type { Position } from './Player'
import { Enemy, type EnemyType } from './Enemy'
import gameConfig from '../data/gameConfig.json'

// 各ダンジョン最終フロアのボス。gameConfig.enemyTypes からステータスを読み、
// 通常敵より大幅に高いHP/攻撃/経験値を持つ。描画は DungeonScene が type から大型スプライトに割り当てる。
export class Boss extends Enemy {
  constructor(type: EnemyType, position: Position, id?: string) {
    const cfg = gameConfig.enemyTypes[type as keyof typeof gameConfig.enemyTypes]
    super(
      type,
      {
        hp: cfg.maxHealth,
        maxHp: cfg.maxHealth,
        attack: cfg.attack,
        defense: cfg.defense,
        exp: cfg.exp,
        dodge: cfg.dodge,
      },
      position,
      id
    )
  }
}
