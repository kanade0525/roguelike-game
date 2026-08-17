import { TILE, type TileType } from '../data/maps'

// 拠点の施設種別（プレイヤーが乗る/A で対応UIを開く）
export type VillageFacilityType = 'blacksmith' | 'dungeon' | 'exit' | 'shop'

export interface VillageFacility {
  x: number
  y: number
  type: VillageFacilityType
  label: string
  color: number // マーカー色（仮アセット代わり）
  requires?: string // 解放に必要な踏破済みダンジョンID（省略なら最初から利用可）
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
// 拠点progression: 最初はダンジョン入口と出口のみ。静寂の森を踏破すると鍛冶屋・道具屋が解放される。
export const VILLAGE_FACILITIES: VillageFacility[] = [
  { x: 2, y: 2, type: 'blacksmith', label: '鍛冶屋', color: 0xd98a3a, requires: 'silentForest' },
  { x: 12, y: 2, type: 'dungeon', label: 'ダンジョン', color: 0x8a6bd9 },
  { x: 12, y: 10, type: 'shop', label: '道具屋', color: 0x3aa06a, requires: 'silentForest' },
  { x: 7, y: 11, type: 'exit', label: '出口', color: 0x9aa0a6 },
]

// 解放済み施設か（requires 未指定、または踏破済みなら true）
export function isFacilityUnlocked(f: VillageFacility, clearedDungeons: string[]): boolean {
  return !f.requires || clearedDungeons.includes(f.requires)
}

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

export const VILLAGE_NPCS: VillageNpc[] = [{ x: 6, y: 4, npcId: 'chief', name: '村長' }]

export function npcAt(x: number, y: number): VillageNpc | undefined {
  return VILLAGE_NPCS.find((n) => n.x === x && n.y === y)
}

// 村の宝箱（初回のみ・パンとポーションのスターターアイテム）。開封済みは meta.villageChestOpened で管理。
export interface VillageChest {
  x: number
  y: number
  contents: { itemId: string; count: number }[]
}

export const VILLAGE_CHEST: VillageChest = {
  x: 5,
  y: 6,
  contents: [
    { itemId: 'bread', count: 2 },
    { itemId: 'herb', count: 2 },
  ],
}

export function isChestAt(x: number, y: number): boolean {
  return VILLAGE_CHEST.x === x && VILLAGE_CHEST.y === y
}

