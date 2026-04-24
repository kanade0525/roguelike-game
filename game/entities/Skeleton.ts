import type { Position } from './Player'
import { Enemy } from './Enemy'
import gameConfig from '../data/gameConfig.json'

const cfg = gameConfig.enemyTypes.skeleton

export class Skeleton extends Enemy {
  constructor(position: Position, id?: string) {
    super(
      'skeleton',
      { hp: cfg.maxHealth, maxHp: cfg.maxHealth, attack: cfg.attack, defense: cfg.defense, exp: cfg.exp },
      position,
      id
    )
  }
}
