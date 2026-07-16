import { canMoveDiagonally } from '../../game/systems/movement'
import { DUNGEONS } from '../../game/dungeon'
import { ITEMS } from '../../game/data/items'
import { computeEnhanceCost } from '../../game/systems/EconomySystem'
import gameConfig from '../../game/data/gameConfig.json'
import {
  VILLAGE_MAP,
  VILLAGE_PLAYER_START,
  VILLAGE_FACILITIES,
  facilityAt,
  type VillageFacility,
} from '../../game/village/villageMap'
import { BaseMapScene } from './BaseMapScene'

interface VillageNav {
  depart: (dungeonId: string) => void
  toTitle: () => void
}

/**
 * 拠点(村)の歩けるシーン。ダンジョン(DungeonScene)と同じ BaseMapScene を継承し、
 * 同一のタイル描画・8方向移動・仮想コントローラ・UIScene を流用する。
 * 敵/戦闘/FOV/ターンは無い。施設タイルに乗る/A で施設UI（Phaserオーバーレイ）を開く。
 */
export class VillageScene extends BaseMapScene {
  private nav!: VillageNav
  private equipCfg = gameConfig.equipmentConfig
  // 鍛冶リストの行 index → meta.storage index の対応
  private blacksmithIndexMap: number[] = []
  private dungeonIds: string[] = []

  constructor() {
    super({ key: 'VillageScene' })
  }

  preload() {
    this.loadSharedAssets()
  }

  create() {
    this.gameStore = this.game.registry.get('gameStore')
    this.nav = this.game.registry.get('villageNav')
    if (!this.gameStore || !this.nav) {
      throw new Error('gameStore or villageNav not found in registry')
    }

    this.setMap(VILLAGE_MAP)
    // 拠点入場時はプレイヤーを開始位置へ（store.player.position を BaseMapScene が参照）
    this.gameStore.setPlayerPosition(VILLAGE_PLAYER_START.x, VILLAGE_PLAYER_START.y)

    this.calculateTileSize()
    this.createContainers()
    this.createKnightAnimation()
    this.drawScene()
    this.setupInput()
    this.setupTouchInput()

    this.scene.launch('UIScene', { gameplayKey: 'VillageScene' })
    // HUD 初期化（次フレームで UIScene 生成後に反映）
    this.time.delayedCall(0, () => this.updateVillageHud())
  }

  // --- 施設マーカー描画（BaseMapScene.drawScene から呼ばれる） ---
  protected override drawEntities(viewStartX: number, viewStartY: number, endX: number, endY: number) {
    for (const f of VILLAGE_FACILITIES) {
      if (f.x < viewStartX || f.x >= endX || f.y < viewStartY || f.y >= endY) continue
      this.drawFacilityMarker(f, viewStartX, viewStartY)
    }
  }

  private drawFacilityMarker(f: VillageFacility, viewStartX: number, viewStartY: number) {
    const cx = this.offsetX + (f.x - viewStartX) * this.tileWidth + this.tileWidth / 2
    const cy = this.offsetY + (f.y - viewStartY) * this.tileHeight + this.tileHeight / 2
    const s = this.tileWidth * 0.62
    const g = this.add.graphics()
    g.fillStyle(f.color, 0.9)
    g.fillRoundedRect(cx - s / 2, cy - s / 2 - this.tileHeight * 0.1, s, s, 6)
    g.lineStyle(2, 0xffffff, 0.9)
    g.strokeRoundedRect(cx - s / 2, cy - s / 2 - this.tileHeight * 0.1, s, s, 6)
    this.entityContainer.add(g)
    const label = this.add
      .text(cx, cy + this.tileHeight * 0.4, f.label, {
        fontSize: '11px',
        color: '#ffffff',
        fontFamily: '"DotGothic16", monospace',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
    this.entityContainer.add(label)
  }

  // --- 入力 ---
  protected override tryMove(dx: number, dy: number) {
    if (this.inputLocked) return
    const ui = this.getUiScene()
    if (ui.isConfirmOpen()) {
      ui.moveConfirmCursor(dx)
      return
    }
    if (ui.isListMenuOpen()) {
      ui.moveListCursor(dy)
      return
    }

    const nx = this.gameStore.player.position.x + dx
    const ny = this.gameStore.player.position.y + dy
    if (!this.isFloor(nx, ny)) return
    if (dx !== 0 && dy !== 0 && !canMoveDiagonally(this.map, this.gameStore.player.position.x, this.gameStore.player.position.y, dx, dy)) {
      return
    }
    this.gameStore.setPlayerPosition(nx, ny)
    this.drawScene()

    // 施設タイルに乗ったら開く
    const f = facilityAt(nx, ny)
    if (f) this.openFacility(f.type)
  }

  protected override handleAction(action: string) {
    if (this.inputLocked) return
    const ui = this.getUiScene()

    if (ui.isConfirmOpen()) {
      if (action === 'confirm') ui.confirmSelect()
      else if (action === 'inventory') ui.hideConfirm()
      return
    }
    if (ui.isListMenuOpen()) {
      if (action === 'confirm') ui.selectListItem()
      else if (action === 'inventory') ui.hideListMenu()
      return
    }

    // 何も開いていない: A で足元の施設を開く
    if (action === 'confirm') {
      const pos = this.gameStore.player.position
      const f = facilityAt(pos.x, pos.y)
      if (f) this.openFacility(f.type)
    }
  }

  // --- 施設 ---
  private openFacility(type: string) {
    if (type === 'blacksmith') this.openBlacksmith()
    else if (type === 'dungeon') this.openDungeonSelect()
    else if (type === 'exit') this.openExit()
  }

  private buildBlacksmithRows() {
    const storage = this.gameStore.meta.storage as {
      itemId: string
      equipmentData?: { enhanceLevel: number }
    }[]
    const gold = this.gameStore.meta.gold as number
    const rows: { label: string; right: string; disabled: boolean }[] = []
    this.blacksmithIndexMap = []
    storage.forEach((entry, index) => {
      const def = ITEMS[entry.itemId]
      if (!def?.equippable) return
      const level = entry.equipmentData?.enhanceLevel ?? 0
      const maxed = level >= this.equipCfg.maxEnhanceLevel
      const cost = computeEnhanceCost(level, this.equipCfg.enhanceCostBase, this.equipCfg.enhanceCostMultiplier)
      const affordable = gold >= cost
      rows.push({
        label: `${def.name}${level > 0 ? ` +${level}` : ''}`,
        right: maxed ? 'MAX' : `強化 ${cost}G`,
        disabled: maxed || !affordable,
      })
      this.blacksmithIndexMap.push(index)
    })
    return rows
  }

  private openBlacksmith() {
    const rows = this.buildBlacksmithRows()
    const subtitle = `所持金 ${this.gameStore.meta.gold}G`
    this.getUiScene().showListMenu('鍛冶屋', subtitle, rows, (rowIndex) => {
      const storageIndex = this.blacksmithIndexMap[rowIndex]
      if (storageIndex === undefined) return
      const result = this.gameStore.enhanceEquipment(storageIndex)
      // 強化後: リストと所持金表示・HUD を更新
      const newRows = this.buildBlacksmithRows()
      this.getUiScene().refreshListMenu(newRows, `所持金 ${this.gameStore.meta.gold}G`)
      this.updateVillageHud()
      if (result?.message) this.getUiScene().addMessage(result.message)
    })
  }

  private openDungeonSelect() {
    const dungeons = Object.values(DUNGEONS) as { id: string; name: string; floors: unknown[] }[]
    this.dungeonIds = dungeons.map((d) => d.id)
    const rows = dungeons.map((d) => ({ label: d.name, right: `B${d.floors.length}F` }))
    this.getUiScene().showListMenu('どこへ潜る？', '', rows, (rowIndex) => {
      const id = this.dungeonIds[rowIndex]
      if (id) this.nav.depart(id)
    })
  }

  private openExit() {
    this.getUiScene().showConfirm('タイトルへ戻りますか？', () => this.nav.toTitle())
  }

  private updateVillageHud() {
    const ui = this.getUiScene()
    const { player, meta } = this.gameStore
    ui.updateGold(meta.gold ?? 0)
    ui.updateHP(player.hp, player.maxHp)
    ui.updateLevel(player.level)
    ui.updateSatiation(player.satiation, player.maxSatiation)
  }
}
