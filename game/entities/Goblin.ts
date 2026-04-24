import type { Position } from './Player'
import { Enemy } from './Enemy'
import gameConfig from '../data/gameConfig.json'

const cfg = gameConfig.enemyTypes.goblin

export class Goblin extends Enemy {
  constructor(position: Position, id?: string) {
    super(
      'goblin',
      { hp: cfg.maxHealth, maxHp: cfg.maxHealth, attack: cfg.attack, defense: cfg.defense, exp: cfg.exp },
      position,
      id
    )
  }
}
