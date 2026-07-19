import { TILE, type TileType } from '../data/maps'

// 拠点の施設種別（プレイヤーが乗る/A で対応UIを開く）
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

// 拠点マップ。ダンジョンと同じ 64px タイル・クォータービュー・プレイヤー中心スクロールで描画される。
// ビューポート(8x6)より大きくして歩き回れるようにする。15x13。
// prettier-ignore
export const VILLAGE_MAP: TileType[][] = [
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, W, _, _, _, W, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, W, _, _, _, W, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, _, _, _, _, _, _, _, _, _, _, _, _, _, W],
  [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
]

export const VILLAGE_PLAYER_START = { x: 7, y: 6 }

// 施設は歩ける床タイル上に配置し、乗る/A で開く
export const VILLAGE_FACILITIES: VillageFacility[] = [
  { x: 2, y: 2, type: 'blacksmith', label: '鍛冶屋', color: 0xd98a3a },
  { x: 12, y: 2, type: 'dungeon', label: 'ダンジョン', color: 0x8a6bd9 },
  { x: 7, y: 11, type: 'exit', label: '出口', color: 0x9aa0a6 },
]

export function facilityAt(x: number, y: number): VillageFacility | undefined {
  return VILLAGE_FACILITIES.find((f) => f.x === x && f.y === y)
}

// 村のNPC（話しかけ対象）。施設と違い「乗れない」障害物として置き、隣接＋A で会話する。
export interface VillageNpc {
  x: number
  y: number
  npcId: string
  name: string
}

export const VILLAGE_NPCS: VillageNpc[] = [{ x: 6, y: 3, npcId: 'chief', name: '村長' }]

export function npcAt(x: number, y: number): VillageNpc | undefined {
  return VILLAGE_NPCS.find((n) => n.x === x && n.y === y)
}

