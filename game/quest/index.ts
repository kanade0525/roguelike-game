// クエスト（村長の依頼）。Phaser 非依存の純粋データ＋達成判定。
// 状態（受注/達成/受領済み）は stores/gameStore.ts の meta.quests で管理する。

export type QuestObjectiveType = 'clearDungeon' | 'reachFloor' | 'defeatCount' | 'collectItem'

export interface QuestObjective {
  type: QuestObjectiveType
  // clearDungeon: ダンジョンID / collectItem: アイテムID
  target?: string
  // reachFloor: 到達フロア / defeatCount: 撃破数 / collectItem: 個数
  count?: number
}

export interface QuestReward {
  gold?: number
  itemId?: string
}

export interface Quest {
  id: string
  title: string
  desc: string
  objective: QuestObjective
  reward: QuestReward
  // 受注可能になる前提（踏破済みであるべきダンジョンID）
  requires?: string[]
}

// 1回の潜行の成果（生還時に評価する）。
export interface RunStats {
  clearedDungeons: string[] // 累積の踏破済みダンジョン
  maxFloorReached: number // その潜行で到達した最大フロア
  defeatedEnemies: number // その潜行での撃破数
  inventory: { itemId: string; stack?: number }[] // 持ち帰った所持品
}

// 物語に沿った依頼（MVP: 3件）。
export const QUESTS: Quest[] = [
  {
    id: 'q_forest',
    title: '静寂の森の調査',
    desc: '静寂の森を踏破し、淀みの様子を確かめてほしい。',
    objective: { type: 'clearDungeon', target: 'silentForest' },
    reward: { gold: 120 },
  },
  {
    id: 'q_hunt',
    title: '淀みの間引き',
    desc: '一度の潜行で、淀みに蝕まれた者を8体退けよ。',
    objective: { type: 'defeatCount', count: 8 },
    reward: { gold: 80, itemId: 'herb' },
  },
  {
    id: 'q_castle',
    title: '暗黒城の制圧',
    desc: '暗黒城を踏破し、封じ手たちの眠りを見届けよ。',
    objective: { type: 'clearDungeon', target: 'darkCastle' },
    reward: { gold: 250 },
    requires: ['silentForest'],
  },
]

export function getQuest(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id)
}

// 所持品から指定アイテムの合計個数を数える（stack を考慮）。
function countItem(inventory: RunStats['inventory'], itemId: string): number {
  return inventory
    .filter((e) => e.itemId === itemId)
    .reduce((sum, e) => sum + (e.stack ?? 1), 0)
}

// 目標達成の判定（純粋関数）。生還時の RunStats を参照する。
export function isObjectiveMet(obj: QuestObjective, stats: RunStats): boolean {
  switch (obj.type) {
    case 'clearDungeon':
      return obj.target !== undefined && stats.clearedDungeons.includes(obj.target)
    case 'reachFloor':
      return stats.maxFloorReached >= (obj.count ?? Infinity)
    case 'defeatCount':
      return stats.defeatedEnemies >= (obj.count ?? Infinity)
    case 'collectItem':
      return obj.target !== undefined && countItem(stats.inventory, obj.target) >= (obj.count ?? 1)
    default:
      return false
  }
}

// 受注可能なクエスト（未受注・未達成・未受領、かつ前提を満たす）を返す。
export function availableQuests(
  clearedDungeons: string[],
  taken: string[] // active + satisfied + completed
): Quest[] {
  return QUESTS.filter((q) => {
    if (taken.includes(q.id)) return false
    if (q.requires && !q.requires.every((d) => clearedDungeons.includes(d))) return false
    return true
  })
}
