export type TurnPhase = 'player' | 'enemy' | 'end'

export interface TurnState {
  turnNumber: number
  phase: TurnPhase
}

export class TurnManager {
  private state: TurnState

  constructor() {
    this.state = {
      turnNumber: 1,
      phase: 'player',
    }
  }

  get turnNumber(): number {
    return this.state.turnNumber
  }

  get phase(): TurnPhase {
    return this.state.phase
  }

  get isPlayerTurn(): boolean {
    return this.state.phase === 'player'
  }

  playerAction(): void {
    if (this.state.phase !== 'player') {
      throw new Error('Not player turn')
    }
    this.state.phase = 'enemy'
  }

  enemyAction(): void {
    if (this.state.phase !== 'enemy') {
      throw new Error('Not enemy turn')
    }
    this.state.phase = 'end'
  }

  endTurn(): void {
    this.state.turnNumber++
    this.state.phase = 'player'
  }

  processTurn(): void {
    // プレイヤー行動後、敵行動、ターン終了を一括処理
    if (this.state.phase === 'enemy') {
      this.enemyAction()
    }
    if (this.state.phase === 'end') {
      this.endTurn()
    }
  }

  reset(): void {
    this.state = {
      turnNumber: 1,
      phase: 'player',
    }
  }
}
