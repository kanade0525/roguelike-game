import { canMoveDiagonally } from '../../game/systems/movement'
import { DUNGEONS } from '../../game/dungeon'
import { ITEMS } from '../../game/data/items'
import { computeEnhanceCost } from '../../game/systems/EconomySystem'
import gameConfig from '../../game/data/gameConfig.json'
import {
  VILLAGE_MAP,
  VILLAGE_PLAYER_START,
  VILLAGE_FACILITIES,
  VILLAGE_NPCS,
  facilityAt,
  npcAt,
  type VillageFacility,
  type VillageNpc,
} from '../../game/village/villageMap'
import { OPENING, chiefLines, type StoryLine } from '../../game/story'
import { QUESTS, availableQuests, getQuest, type Quest } from '../../game/quest'
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
    // NPC（女性騎士）スプライト
    // 村長は老賢者(wizzard_m)スプライトを使う（0x72・既存と同画風）
    for (let i = 0; i <= 3; i++) {
      this.load.image(`npc_f${i}`, `/assets/tiles/wizzard_m_idle_anim_f${i}.png`)
    }
    // オープニング背景（ゲーム画面内の黒幕カットシーンに敷く）
    this.load.image('op_bg', '/assets/opening/op_bg.jpg')
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
    if (!this.anims.exists('npc_idle_anim')) {
      this.anims.create({
        key: 'npc_idle_anim',
        frames: [{ key: 'npc_f0' }, { key: 'npc_f1' }, { key: 'npc_f2' }, { key: 'npc_f3' }],
        frameRate: 6,
        repeat: -1,
      })
    }
    this.drawScene()
    this.setupInput()
    this.setupTouchInput()

    this.scene.launch('UIScene', { gameplayKey: 'VillageScene' })
    // HUD 初期化＋初回オープニング（次フレームで UIScene 生成後に反映）
    this.time.delayedCall(0, () => {
      this.updateVillageHud()
      this.maybePlayOpening()
    })
  }

  // 「はじめから」→ 拠点に初めて入ったときだけオープニングを再生する。
  // ゲーム画面内でビュー領域を黒幕で覆い中央表示（コントローラ・HUDはそのまま）。
  private maybePlayOpening() {
    if (this.gameStore.meta.seenOpening) return
    this.gameStore.markOpeningSeen()
    this.getUiScene().showOpening(OPENING as StoryLine[])
  }

  // --- 施設マーカー描画（BaseMapScene.drawScene から呼ばれる） ---
  protected override drawEntities(viewStartX: number, viewStartY: number, endX: number, endY: number) {
    for (const f of VILLAGE_FACILITIES) {
      if (f.x < viewStartX || f.x >= endX || f.y < viewStartY || f.y >= endY) continue
      this.drawFacilityMarker(f, viewStartX, viewStartY)
    }
    for (const n of VILLAGE_NPCS) {
      if (n.x < viewStartX || n.x >= endX || n.y < viewStartY || n.y >= endY) continue
      this.drawNpc(n, viewStartX, viewStartY)
    }
  }

  private drawNpc(n: VillageNpc, viewStartX: number, viewStartY: number) {
    const cx = this.offsetX + (n.x - viewStartX) * this.tileWidth + this.tileWidth / 2
    const cy = this.offsetY + (n.y - viewStartY) * this.tileHeight + this.tileHeight * 0.8
    const sprite = this.add.sprite(cx, cy, 'npc_f0')
    sprite.setOrigin(0.5, 1.0)
    sprite.setScale(this.tileScale * 0.6)
    sprite.play('npc_idle_anim')
    this.entityContainer.add(sprite)
    const label = this.add
      .text(cx, cy - this.tileHeight * 0.85, n.name, {
        fontSize: '10px',
        color: '#ffe08a',
        fontFamily: '"DotGothic16", monospace',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
    this.entityContainer.add(label)
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
    if (ui.isInventoryOpen()) {
      ui.moveInventoryCursor(dx, dy)
      return
    }
    if (ui.isConfirmOpen()) {
      ui.moveConfirmCursor(dx)
      return
    }
    if (ui.isListMenuOpen()) {
      ui.moveListCursor(dy)
      return
    }
    if (ui.isOpeningOpen()) return // オープニング中は移動しない（送りは A のみ）
    if (ui.isDialogOpen()) return // 会話中は移動しない（送りは A のみ）

    const nx = this.gameStore.player.position.x + dx
    const ny = this.gameStore.player.position.y + dy
    if (!this.isFloor(nx, ny)) return
    if (npcAt(nx, ny)) return // NPC は障害物（乗れない）
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

    if (ui.isOpeningOpen()) {
      if (action === 'confirm') ui.advanceOpening()
      return
    }
    if (ui.isInventoryOpen()) {
      // 村では持ち物の確認のみ。B/A で閉じる。
      if (action === 'inventory' || action === 'confirm') ui.hideInventory()
      return
    }
    if (ui.isDialogOpen()) {
      if (action === 'confirm') ui.advanceDialog()
      return
    }
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

    // 何も開いていない: B でコマンドメニュー（道具・足もと・話す）
    if (action === 'inventory') {
      this.openVillageMenu()
      return
    }
    // A で 隣接NPCと会話 or 足元の施設を開く（メニューを介さないショートカット）
    if (action === 'confirm') {
      const pos = this.gameStore.player.position
      const npc = this.adjacentNpc(pos.x, pos.y)
      if (npc) {
        this.talkToNpc(npc)
        return
      }
      const f = facilityAt(pos.x, pos.y)
      if (f) this.openFacility(f.type)
    }
  }

  // 村のコマンドメニュー（道具／足もと／話す）。状況に応じて選択不可(グレー)にする。
  private villageMenu: { enabled: boolean; run: () => void }[] = []

  private openVillageMenu() {
    const ui = this.getUiScene()
    const pos = this.gameStore.player.position
    const facility = facilityAt(pos.x, pos.y)
    const npc = this.adjacentNpc(pos.x, pos.y)
    const hasItems = ((this.gameStore.meta.storage as unknown[])?.length ?? 0) > 0

    const rows = [
      { label: '道具', right: hasItems ? '' : 'なし', disabled: !hasItems },
      { label: '足もと', right: facility ? facility.label : '—', disabled: !facility },
      { label: '話す', right: npc ? npc.name : '—', disabled: !npc },
    ]
    this.villageMenu = [
      { enabled: hasItems, run: () => this.openVillageInventory() },
      { enabled: !!facility, run: () => facility && this.openFacility(facility.type) },
      { enabled: !!npc, run: () => npc && this.talkToNpc(npc) },
    ]
    ui.showListMenu('メニュー', '', rows, (i) => this.onVillageMenuSelect(i))
  }

  private onVillageMenuSelect(index: number) {
    const item = this.villageMenu[index]
    if (!item || !item.enabled) return // グレー項目は無反応
    this.getUiScene().hideListMenu()
    item.run()
  }

  // 村では持ち帰った持ち物(meta.storage)を閲覧する（使用/装備はしない・確認のみ）
  private openVillageInventory() {
    const storage = this.gameStore.meta.storage as { itemId: string; name: string }[]
    if (!storage || storage.length === 0) {
      this.getUiScene().addMessage('持ち物はない。')
      return
    }
    this.getUiScene().showInventory(storage, true)
  }

  // プレイヤーに隣接（8近傍）するNPCを返す
  private adjacentNpc(x: number, y: number): VillageNpc | undefined {
    return VILLAGE_NPCS.find((n) => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)
  }

  private talkToNpc(npc: VillageNpc) {
    if (npc.npcId === 'chief') {
      // 村長: 物語進捗に応じた台詞 → 会話後にクエストメニューを開く
      const lines = chiefLines(this.gameStore.meta.clearedDungeons)
      this.getUiScene().showDialog(lines, () => this.openQuestMenu())
      return
    }
    this.getUiScene().showDialog([{ speaker: npc.name, text: '…' }])
  }

  // --- クエスト（村長の依頼） ---

  private questObjectiveText(q: Quest): string {
    const o = q.objective
    switch (o.type) {
      case 'clearDungeon': {
        const d = o.target ? (DUNGEONS[o.target] as { name: string } | undefined) : undefined
        return `${d?.name ?? o.target}を踏破`
      }
      case 'reachFloor':
        return `B${o.count}Fに到達`
      case 'defeatCount':
        return `一度の潜行で敵を${o.count}体撃破`
      case 'collectItem': {
        const name = o.target ? (ITEMS[o.target]?.name ?? o.target) : ''
        return `${name}を${o.count ?? 1}個持ち帰る`
      }
      default:
        return ''
    }
  }

  private questRewardText(q: Quest): string {
    const parts: string[] = []
    if (q.reward.gold) parts.push(`${q.reward.gold}G`)
    if (q.reward.itemId) parts.push(ITEMS[q.reward.itemId]?.name ?? q.reward.itemId)
    return parts.join('・') || 'なし'
  }

  // クエストメニューの行と、行→操作の対応を組み立てる
  private buildQuestRows(): {
    rows: { label: string; right: string; disabled: boolean }[]
    actions: { id: string; kind: 'report' | 'accept' | 'active' }[]
  } {
    const q = this.gameStore.meta.quests as {
      active: string[]
      satisfied: string[]
      completed: string[]
    }
    const cleared = this.gameStore.meta.clearedDungeons as string[]
    const rows: { label: string; right: string; disabled: boolean }[] = []
    const actions: { id: string; kind: 'report' | 'accept' | 'active' }[] = []

    // 1) 達成済み（報告して報酬受取）
    for (const id of q.satisfied) {
      const quest = getQuest(id)
      if (!quest) continue
      rows.push({ label: `★ ${quest.title}`, right: '報酬受取', disabled: false })
      actions.push({ id, kind: 'report' })
    }
    // 2) 受注可能
    const taken = [...q.active, ...q.satisfied, ...q.completed]
    for (const quest of availableQuests(cleared, taken)) {
      rows.push({ label: quest.title, right: '受注', disabled: false })
      actions.push({ id: quest.id, kind: 'accept' })
    }
    // 3) 受注中（進行中・選択不可）
    for (const id of q.active) {
      const quest = getQuest(id)
      if (!quest) continue
      rows.push({ label: quest.title, right: '進行中', disabled: true })
      actions.push({ id, kind: 'active' })
    }

    if (rows.length === 0) {
      rows.push({ label: '今は依頼がない', right: '', disabled: true })
      actions.push({ id: '', kind: 'active' })
    }
    return { rows, actions }
  }

  private questActions: { id: string; kind: 'report' | 'accept' | 'active' }[] = []

  private openQuestMenu() {
    const { rows, actions } = this.buildQuestRows()
    this.questActions = actions
    const done = QUESTS.filter((q) =>
      (this.gameStore.meta.quests.completed as string[]).includes(q.id)
    ).length
    this.getUiScene().showListMenu('村長の依頼', `達成 ${done}/${QUESTS.length}`, rows, (rowIndex) =>
      this.onQuestSelect(rowIndex)
    )
  }

  private onQuestSelect(rowIndex: number) {
    const action = this.questActions[rowIndex]
    if (!action || action.kind === 'active') return
    const quest = getQuest(action.id)
    if (!quest) return
    const ui = this.getUiScene()

    if (action.kind === 'accept') {
      this.gameStore.acceptQuest(action.id)
      ui.addMessage(`「${quest.title}」を受注した（${this.questObjectiveText(quest)}）`)
    } else if (action.kind === 'report') {
      const result = this.gameStore.reportQuest(action.id)
      if (result) {
        const reward = [result.gold ? `${result.gold}G` : '', result.itemName ?? '']
          .filter(Boolean)
          .join('・')
        ui.addMessage(`「${quest.title}」達成！ 報酬 ${reward} を受け取った`)
        this.updateVillageHud()
      }
    }
    // メニューとサブタイトルを更新
    const { rows, actions } = this.buildQuestRows()
    this.questActions = actions
    const done = QUESTS.filter((q) =>
      (this.gameStore.meta.quests.completed as string[]).includes(q.id)
    ).length
    ui.refreshListMenu(rows, `達成 ${done}/${QUESTS.length}`)
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
