import type { Position } from './Player'

export type EnemyType = 'slime' | 'goblin'
export type AIState = 'idle' | 'chase' | 'attack'

export interface EnemyData {
  id: string
  type: EnemyType
  hp: number
  maxHp: number
  attack: number
  position: Position
  aiState: AIState
}

export const ENEMY_DEFINITIONS: Record<EnemyType, Omit<EnemyData, 'id' | 'position' | 'aiState'>> = {
  slime: {
    type: 'slime',
    hp: 20,
    maxHp: 20,
    attack: 5,
  },
  goblin: {
    type: 'goblin',
    hp: 30,
    maxHp: 30,
    attack: 8,
  },
}

export class Enemy {
  private data: EnemyData

  constructor(type: EnemyType, position: Position, id?: string) {
    const definition = ENEMY_DEFINITIONS[type]
    this.data = {
      id: id ?? crypto.randomUUID(),
      type,
      hp: definition.hp,
      maxHp: definition.maxHp,
      attack: definition.attack,
      position: { ...position },
      aiState: 'idle',
    }
  }

  get id(): string {
    return this.data.id
  }

  get type(): EnemyType {
    return this.data.type
  }

  get hp(): number {
    return this.data.hp
  }

  get attack(): number {
    return this.data.attack
  }

  get position(): Position {
    return { ...this.data.position }
  }

  get aiState(): AIState {
    return this.data.aiState
  }

  get isAlive(): boolean {
    return this.data.hp > 0
  }

  takeDamage(damage: number): number {
    this.data.hp = Math.max(0, this.data.hp - damage)
    return damage
  }

  moveTo(x: number, y: number): void {
    this.data.position = { x, y }
  }

  setAIState(state: AIState): void {
    this.data.aiState = state
  }

  distanceTo(target: Position): number {
    const dx = Math.abs(this.data.position.x - target.x)
    const dy = Math.abs(this.data.position.y - target.y)
    return Math.max(dx, dy) // チェビシェフ距離（8方向移動）
  }

  toJSON(): EnemyData {
    return { ...this.data, position: { ...this.data.position } }
  }
}
