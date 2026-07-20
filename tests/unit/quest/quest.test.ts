import { describe, it, expect } from 'vitest'
import {
  isObjectiveMet,
  availableQuests,
  getQuest,
  type RunStats,
  type QuestObjective,
} from '~/game/quest'

const baseStats: RunStats = {
  clearedDungeons: [],
  maxFloorReached: 1,
  defeatedEnemies: 0,
  inventory: [],
}

describe('isObjectiveMet', () => {
  it('clearDungeon: 踏破済みなら達成', () => {
    const obj: QuestObjective = { type: 'clearDungeon', target: 'silentForest' }
    expect(isObjectiveMet(obj, baseStats)).toBe(false)
    expect(isObjectiveMet(obj, { ...baseStats, clearedDungeons: ['silentForest'] })).toBe(true)
  })

  it('reachFloor: 到達フロアが目標以上なら達成', () => {
    const obj: QuestObjective = { type: 'reachFloor', count: 5 }
    expect(isObjectiveMet(obj, { ...baseStats, maxFloorReached: 4 })).toBe(false)
    expect(isObjectiveMet(obj, { ...baseStats, maxFloorReached: 5 })).toBe(true)
    expect(isObjectiveMet(obj, { ...baseStats, maxFloorReached: 6 })).toBe(true)
  })

  it('defeatCount: 撃破数が目標以上なら達成', () => {
    const obj: QuestObjective = { type: 'defeatCount', count: 8 }
    expect(isObjectiveMet(obj, { ...baseStats, defeatedEnemies: 7 })).toBe(false)
    expect(isObjectiveMet(obj, { ...baseStats, defeatedEnemies: 8 })).toBe(true)
  })

  it('collectItem: 所持数(stack考慮)が目標以上なら達成', () => {
    const obj: QuestObjective = { type: 'collectItem', target: 'herb', count: 2 }
    expect(isObjectiveMet(obj, { ...baseStats, inventory: [{ itemId: 'herb', stack: 1 }] })).toBe(
      false
    )
    expect(isObjectiveMet(obj, { ...baseStats, inventory: [{ itemId: 'herb', stack: 2 }] })).toBe(
      true
    )
    expect(
      isObjectiveMet(obj, {
        ...baseStats,
        inventory: [
          { itemId: 'herb' },
          { itemId: 'herb' },
        ],
      })
    ).toBe(true)
  })
})

describe('availableQuests', () => {
  it('未受注かつ前提を満たすものだけ返す', () => {
    // 何も受注/踏破していない: 前提なしのクエストのみ受注可能
    const fresh = availableQuests([], [])
    expect(fresh.some((q) => q.id === 'q_forest')).toBe(true)
    // q_castle は silentForest 踏破が前提 → まだ出ない
    expect(fresh.some((q) => q.id === 'q_castle')).toBe(false)
  })

  it('前提ダンジョン踏破後は前提付きクエストも受注可能', () => {
    const after = availableQuests(['silentForest'], [])
    expect(after.some((q) => q.id === 'q_castle')).toBe(true)
  })

  it('受注/達成/受領済みは除外される', () => {
    const forestId = 'q_forest'
    expect(getQuest(forestId)).toBeDefined()
    const filtered = availableQuests([], [forestId])
    expect(filtered.some((q) => q.id === forestId)).toBe(false)
  })
})
