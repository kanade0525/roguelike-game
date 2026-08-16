import type { Position } from './Player'

export type EnemyType = 'skeleton' | 'goblin' | 'forest_lord' | 'castle_lord' | 'abyss_lord'

// 各ダンジョンのボス種別（最終フロアに配置）
export const BOSS_TYPES: EnemyType[] = ['forest_lord', 'castle_lord', 'abyss_lord']

export function isBossType(type: string): boolean {
  return (BOSS_TYPES as string[]).includes(type)
}
export type AIState = 'idle' | 'chase' | 'attack'

export interface EnemyStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  exp: number
  dodge?: number
}

export interface EnemyData {
  id: string
  type: EnemyType
  hp: number
  maxHp: number
  attack: number
  defense: number
  exp: number
  dodge: number
  position: Position
  aiState: AIState
}

export interface EnemyStoreState {
  id: string
  type: string
  x: number
  y: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  exp: number
  dodge: number
  aiState: string
}

export class Enemy {
  protected data: EnemyData

  constructor(type: EnemyType, stats: EnemyStats, position: Position, id?: string) {
    this.data = {
      id: id ?? crypto.randomUUID(),
      type,
      hp: stats.hp,
      maxHp: stats.maxHp,
      attack: stats.attack,
      defense: stats.defense,
      exp: stats.exp,
      dodge: stats.dodge ?? 0.05,
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

  get defense(): number {
    return this.data.defense
  }

  get exp(): number {
    return this.data.exp
  }

  get dodge(): number {
    return this.data.dodge
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

  toStoreState(): EnemyStoreState {
    return {
      id: this.data.id,
      type: this.data.type,
      x: this.data.position.x,
      y: this.data.position.y,
      hp: this.data.hp,
      maxHp: this.data.maxHp,
      attack: this.data.attack,
      defense: this.data.defense,
      exp: this.data.exp,
      dodge: this.data.dodge,
      aiState: this.data.aiState,
    }
  }

  toJSON(): EnemyData {
    return { ...this.data, position: { ...this.data.position } }
  }
}
