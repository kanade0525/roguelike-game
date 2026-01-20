export interface PlayerData {
  hp: number
  maxHp: number
  attack: number
  defense: number
  position: Position
}

export interface Position {
  x: number
  y: number
}

export class Player {
  private data: PlayerData

  constructor(data?: Partial<PlayerData>) {
    this.data = {
      hp: data?.hp ?? 100,
      maxHp: data?.maxHp ?? 100,
      attack: data?.attack ?? 10,
      defense: data?.defense ?? 5,
      position: data?.position ?? { x: 7, y: 7 },
    }
  }

  get hp(): number {
    return this.data.hp
  }

  get maxHp(): number {
    return this.data.maxHp
  }

  get attack(): number {
    return this.data.attack
  }

  get defense(): number {
    return this.data.defense
  }

  get position(): Position {
    return { ...this.data.position }
  }

  get isAlive(): boolean {
    return this.data.hp > 0
  }

  takeDamage(damage: number): number {
    const actualDamage = Math.max(1, damage - this.data.defense)
    this.data.hp = Math.max(0, this.data.hp - actualDamage)
    return actualDamage
  }

  heal(amount: number): number {
    const healed = Math.min(amount, this.data.maxHp - this.data.hp)
    this.data.hp += healed
    return healed
  }

  moveTo(x: number, y: number): void {
    this.data.position = { x, y }
  }

  moveBy(dx: number, dy: number): void {
    this.data.position.x += dx
    this.data.position.y += dy
  }

  toJSON(): PlayerData {
    return { ...this.data, position: { ...this.data.position } }
  }
}
