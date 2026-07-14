import { TILE, type TileType } from '../data/maps'

// 拠点の施設種別（プレイヤーが乗ると対応UIを開く）
export type VillageFacilityType = 'blacksmith' | 'dungeon' | 'exit'

export interface VillageFacility {
  x: number
  y: number
  type: VillageFacilityType
  label: string
  color: number // マーカー色（仮アセット代わり）
}

const _ = TILE.FLOOR
const W = TILE.WALL

// 小さな固定拠点マップ（外周＋内部の柱で町らしさを出す）。13x11。
// スクロールせず全体を1画面に収める前提のサイズ。
// prettier-ignore
export const VILLAGE_MAP: TileType[][] = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, W, _, _, _, W, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, W, _, _, _, W, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, W, W, W, W, W, W, W, W, W, W, W, W],
]

export const VILLAGE_PLAYER_START = { x: 6, y: 5 }

// 施設は歩ける床タイル上に配置し、乗ると開く
export const VILLAGE_FACILITIES: VillageFacility[] = [
  { x: 2, y: 2, type: 'blacksmith', label: '鍛冶屋', color: 0xd98a3a },
  { x: 10, y: 2, type: 'dungeon', label: 'ダンジョン', color: 0x8a6bd9 },
  { x: 6, y: 9, type: 'exit', label: '出口', color: 0x9aa0a6 },
]

export function facilityAt(x: number, y: number): VillageFacility | undefined {
  return VILLAGE_FACILITIES.find((f) => f.x === x && f.y === y)
}
