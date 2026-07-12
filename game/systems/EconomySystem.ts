// 経済系の純粋計算（Phaser 非依存・テスト可能）

// 死亡時のゴールドロスト計算。
// runGold: 現ランで所持しているゴールド
// lossRate: 失う割合（0=ロストなし, 1=全ロスト）。範囲外は 0..1 にクランプ。
// 戻り値: 失う額 lost と 拠点へ持ち帰る額 kept（合計は元の runGold）
export function computeDeathGoldLoss(
  runGold: number,
  lossRate: number
): { lost: number; kept: number } {
  const gold = Math.max(0, Math.floor(runGold))
  const rate = Math.min(1, Math.max(0, lossRate))
  const lost = Math.floor(gold * rate)
  const kept = gold - lost
  return { lost, kept }
}

// 謎の金庫を開けたときの獲得ゴールド（min..max の一様乱数, 両端含む）。
// rng は 0<=x<1 を返す関数（テスト時に注入可能）。
export function rollSafeGold(
  minGold: number,
  maxGold: number,
  rng: () => number = Math.random
): number {
  const min = Math.max(0, Math.floor(minGold))
  const max = Math.max(min, Math.floor(maxGold))
  return min + Math.floor(rng() * (max - min + 1))
}

// 装備強化コスト: base * (multiplier ^ 現在の強化レベル)。
// currentLevel は「これから +1 する前の」レベル。
export function computeEnhanceCost(currentLevel: number, base: number, multiplier: number): number {
  const lvl = Math.max(0, Math.floor(currentLevel))
  return Math.floor(base * Math.pow(multiplier, lvl))
}
