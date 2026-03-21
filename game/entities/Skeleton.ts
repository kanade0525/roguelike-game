import type { Position } from './Player'
import { Enemy } from './Enemy'

export class Skeleton extends Enemy {
  constructor(position: Position, id?: string) {
    super('skeleton', { hp: 20, maxHp: 20, attack: 5, defense: 2, exp: 10 }, position, id)
  }
}
