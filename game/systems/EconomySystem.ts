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
