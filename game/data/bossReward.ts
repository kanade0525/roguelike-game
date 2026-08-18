// ボス撃破時の確定報酬（通常敵のランダム少額ドロップとは別枠）。
// gold は即時付与、itemId はボスの位置に床アイテムとしてドロップする。
export const BOSS_REWARD: Record<string, { gold: number; itemId?: string }> = {
  forest_lord: { gold: 120, itemId: 'super_herb' },
  castle_lord: { gold: 300, itemId: 'great_sword' },
  abyss_lord: { gold: 700, itemId: 'heavy_armor' },
}
