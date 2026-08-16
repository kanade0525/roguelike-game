// 道具屋の価格・品揃え。ItemDef を汚さないよう価格はここに集約する。
// 静寂の森を踏破すると村に道具屋が解放される（拠点progression）。

export const ITEM_PRICE: Record<string, number> = {
  herb: 30,
  super_herb: 90,
  antidote: 25,
  bread: 20,
  big_bread: 45,
  escape_scroll: 60,
  teleport_scroll: 50,
  map_scroll: 40,
  sword: 120,
  shield: 90,
  great_sword: 320,
  heavy_armor: 260,
}

// 店頭に並ぶ商品（購入可能）。消耗品中心＋基本装備。
export const SHOP_STOCK: string[] = [
  'herb',
  'antidote',
  'bread',
  'big_bread',
  'escape_scroll',
  'teleport_scroll',
  'map_scroll',
  'sword',
  'shield',
]

export function buyPrice(itemId: string): number {
  return ITEM_PRICE[itemId] ?? 0
}

// 売値は買値の半額（0未満にはしない）
export function sellPrice(itemId: string): number {
  return Math.floor((ITEM_PRICE[itemId] ?? 0) / 2)
}
