import { Map as RotMap } from 'rot-js'
import { TILE } from '../data/maps'
import type { TileType } from '../data/maps'

export interface RoomInfo {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface GeneratedFloor {
  map: TileType[][]
  rooms: RoomInfo[]
  playerStart: { x: number; y: number }
  stairsPosition: { x: number; y: number }
  enemies: { id: string; type: string; x: number; y: number }[]
  items: { id: string; itemId: string; x: number; y: number }[]
}

export interface DungeonGeneratorOptions {
  width: number
  height: number
  floor: number
  enemyCount: number
  itemCount: number
  enemyTypes: { type: string; weight: number }[]
  itemTypes: { itemId: string; weight: number }[]
}

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

function getSpawnableTiles(
  map: TileType[][],
  playerStart: { x: number; y: number },
  occupied: { x: number; y: number }[]
): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = []
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (map[y][x] !== TILE.FLOOR) continue
      if (Math.abs(x - playerStart.x) <= 2 && Math.abs(y - playerStart.y) <= 2) continue
      if (occupied.some((o) => o.x === x && o.y === y)) continue
      tiles.push({ x, y })
    }
  }
  return tiles.sort(() => Math.random() - 0.5)
}

export function generateFloor(options: DungeonGeneratorOptions): GeneratedFloor {
  const { width, height, floor } = options

  // 全セルを壁で初期化
  const map: TileType[][] = Array.from({ length: height }, () =>
    Array<TileType>(width).fill(TILE.WALL)
  )

  // rot.js Diggerで部屋+通路を生成
  const digger = new RotMap.Digger(width, height, {
    roomWidth: [4, 9],
    roomHeight: [3, 6],
    corridorLength: [1, 5],
    dugPercentage: 0.3,
  })

  digger.create((x, y, value) => {
    if (value === 0) {
      map[y][x] = TILE.FLOOR
    }
  })

  // 部屋情報を取得
  const rotRooms = digger.getRooms()
  const rooms: RoomInfo[] = rotRooms.map((r) => ({
    x: r.getLeft(),
    y: r.getTop(),
    width: r.getRight() - r.getLeft() + 1,
    height: r.getBottom() - r.getTop() + 1,
    centerX: Math.floor((r.getLeft() + r.getRight()) / 2),
    centerY: Math.floor((r.getTop() + r.getBottom()) / 2),
  }))

  // プレイヤーと階段を別の部屋に配置
  const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5)
  const playerRoom = shuffledRooms[0]
  const stairsRoom = shuffledRooms.length >= 2 ? shuffledRooms[shuffledRooms.length - 1] : playerRoom

  const playerStart = { x: playerRoom.centerX, y: playerRoom.centerY }
  // 1部屋のみの場合はプレイヤーからオフセットした位置に階段を配置
  let stairsPosition: { x: number; y: number }
  if (stairsRoom !== playerRoom) {
    stairsPosition = { x: stairsRoom.centerX, y: stairsRoom.centerY }
  } else {
    const offsetX = playerRoom.centerX + 1 < playerRoom.x + playerRoom.width ? 1 : -1
    stairsPosition = { x: playerRoom.centerX + offsetX, y: playerRoom.centerY }
  }
  map[stairsPosition.y][stairsPosition.x] = TILE.STAIRS

  // 敵を配置（プレイヤー周辺2マス以内を除外）
  const occupied: { x: number; y: number }[] = [stairsPosition]
  const enemyCandidates = getSpawnableTiles(map, playerStart, occupied)
  const enemies: GeneratedFloor['enemies'] = []
  for (let i = 0; i < Math.min(options.enemyCount, enemyCandidates.length); i++) {
    const pos = enemyCandidates[i]
    const enemyType = pickWeighted(options.enemyTypes)
    enemies.push({
      id: `enemy-${floor}-${i}`,
      type: enemyType.type,
      x: pos.x,
      y: pos.y,
    })
    occupied.push(pos)
  }

  // アイテムを配置
  const itemCandidates = getSpawnableTiles(map, playerStart, occupied)
  const items: GeneratedFloor['items'] = []
  for (let i = 0; i < Math.min(options.itemCount, itemCandidates.length); i++) {
    const pos = itemCandidates[i]
    const itemType = pickWeighted(options.itemTypes)
    items.push({
      id: `item-${floor}-${i}`,
      itemId: itemType.itemId,
      x: pos.x,
      y: pos.y,
    })
  }

  return { map, rooms, playerStart, stairsPosition, enemies, items }
}
