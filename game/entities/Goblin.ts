import type { Position } from './Player'
import { Enemy } from './Enemy'

export class Goblin extends Enemy {
  constructor(position: Position, id?: string) {
    super('goblin', { hp: 30, maxHp: 30, attack: 8, defense: 3, exp: 20 }, position, id)
  }
}
