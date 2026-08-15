import Phaser from 'phaser'
import { StatusBar } from '../ui/StatusBar'
import { MessageLog } from '../ui/MessageLog'
import { Controller } from '../ui/Controller'
import { MenuOverlay } from '../ui/MenuOverlay'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { MinimapOverlay } from '../ui/MinimapOverlay'
import { InventoryOverlay, type InventoryEntry } from '../ui/InventoryOverlay'
import { ListMenuOverlay, type ListRow } from '../ui/ListMenuOverlay'
import { DialogOverlay, type DialogLine } from '../ui/DialogOverlay'
import { OpeningOverlay, type OpeningLine } from '../ui/OpeningOverlay'

export class UIScene extends Phaser.Scene {
  private statusBar!: StatusBar
  private messageLog!: MessageLog
  private menu!: MenuOverlay
  private confirm!: ConfirmDialog
  private minimap!: MinimapOverlay
  private inventory!: InventoryOverlay
  private listMenu!: ListMenuOverlay
  private dialog!: DialogOverlay
  private opening!: OpeningOverlay

  // 入力イベントの送り先（DungeonScene / VillageScene）
  private gameplayKey = 'DungeonScene'

  constructor() {
    super({ key: 'UIScene' })
  }

  init(data: { gameplayKey?: string }) {
    this.gameplayKey = data?.gameplayKey ?? 'DungeonScene'
  }

  create() {
    this.statusBar = new StatusBar(this)
    this.messageLog = new MessageLog(this)
    new Controller(
      this,
      (dx, dy) => this.emitMove(dx, dy),
      (action) => this.emitAction(action)
    )
    this.menu = new MenuOverlay(this)
    this.confirm = new ConfirmDialog(this)
    this.minimap = new MinimapOverlay(this)
    this.inventory = new InventoryOverlay(this)
    this.listMenu = new ListMenuOverlay(this)
    this.dialog = new DialogOverlay(this)
    this.opening = new OpeningOverlay(this)

    // HUD をストアの現在値で初期化（最初の1手を待たずに正しい HP/Lv/満腹/ゴールドを表示する）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = this.game.registry.get('gameStore') as any
    if (store) {
      this.statusBar.updateHP(store.player.hp, store.player.maxHp)
      this.statusBar.updateLevel(store.player.level)
      this.statusBar.updateSatiation(store.player.satiation, store.player.maxSatiation)
      this.statusBar.updateFloor(store.dungeon.floor)
      // 拠点は永続ゴールド(meta.gold)、ダンジョンは現ランのゴールド(player.gold)を表示
      const gold =
        this.gameplayKey === 'VillageScene' ? (store.meta?.gold ?? 0) : (store.player.gold ?? 0)
      this.statusBar.updateGold(gold)
    }

    // 初期メッセージ（ダンジョンのみ）
    if (this.gameplayKey === 'DungeonScene') {
      this.addMessage('ダンジョンに足を踏み入れた！')
    }
  }

  // --- 公開API ---

  addMessage(message: string) {
    this.messageLog.addMessage(message)
  }

  updateHP(current: number, max: number) {
    this.statusBar.updateHP(current, max)
  }

  updateFloor(floor: number) {
    this.statusBar.updateFloor(floor)
  }

  updateLevel(level: number) {
    this.statusBar.updateLevel(level)
  }

  updateSatiation(current: number, max: number) {
    this.statusBar.updateSatiation(current, max)
  }

  updateGold(gold: number) {
    this.statusBar.updateGold(gold)
  }

  // --- メニュー ---

  toggleMenu() {
    this.menu.toggle()
  }

  isMenuOpen(): boolean {
    return this.menu.isOpen()
  }

  moveMenuCursor(dx: number, dy: number) {
    this.menu.moveCursor(dx, dy)
  }

  selectMenuItem(): string | null {
    return this.menu.selectItem()
  }

  // --- 確認ダイアログ ---

  showConfirm(message: string, onYes: () => void) {
    this.confirm.show(message, onYes)
  }

  hideConfirm() {
    this.confirm.hide()
  }

  isConfirmOpen(): boolean {
    return this.confirm.isOpen()
  }

  moveConfirmCursor(dx: number) {
    this.confirm.moveCursor(dx)
  }

  confirmSelect() {
    this.confirm.select()
  }

  // --- ミニマップ ---

  showMinimap(
    map: number[][],
    player: { x: number; y: number },
    enemies: { x: number; y: number }[],
    items: { x: number; y: number }[],
    exploredTiles: string[]
  ) {
    this.minimap.show(map, player, enemies, items, exploredTiles)
  }

  hideMinimap() {
    this.minimap.hide()
  }

  isMinimapOpen(): boolean {
    return this.minimap.isOpen()
  }

  // --- インベントリ ---

  showInventory(inventory: InventoryEntry[]) {
    this.inventory.show(inventory)
  }

  hideInventory() {
    this.inventory.hide()
  }

  refreshInventory(inventory: InventoryEntry[]) {
    this.inventory.refresh(inventory)
  }

  isInventoryOpen(): boolean {
    return this.inventory.isOpen()
  }

  moveInventoryCursor(dx: number, dy: number) {
    this.inventory.moveCursor(dx, dy)
  }

  getInventorySelectedIndex(): number {
    return this.inventory.getSelectedIndex()
  }

  // --- リストメニュー（拠点施設: 鍛冶屋・ダンジョン選択） ---

  showListMenu(title: string, subtitle: string, rows: ListRow[], onSelect: (index: number) => void) {
    this.listMenu.show(title, subtitle, rows, onSelect)
  }

  refreshListMenu(rows: ListRow[], subtitle?: string) {
    this.listMenu.refresh(rows, subtitle)
  }

  hideListMenu() {
    this.listMenu.hide()
  }

  isListMenuOpen(): boolean {
    return this.listMenu.isOpen()
  }

  moveListCursor(dy: number) {
    this.listMenu.moveCursor(dy)
  }

  selectListItem() {
    this.listMenu.select()
  }

  getListSelectedIndex(): number {
    return this.listMenu.getSelectedIndex()
  }

  // --- 会話 ---

  showDialog(lines: DialogLine[], onDone?: () => void) {
    this.dialog.show(lines, onDone)
  }

  advanceDialog() {
    this.dialog.advance()
  }

  hideDialog() {
    this.dialog.hide()
  }

  isDialogOpen(): boolean {
    return this.dialog.isOpen()
  }

  // --- オープニング（ゲームビューを黒幕で覆い中央表示） ---

  showOpening(lines: OpeningLine[], onDone?: () => void) {
    this.opening.show(lines, onDone)
  }

  advanceOpening() {
    this.opening.advance()
  }

  isOpeningOpen(): boolean {
    return this.opening.isOpen()
  }

  // --- イベント転送（アクティブなゲームプレイシーンへ） ---

  private emitMove(dx: number, dy: number) {
    this.scene.get(this.gameplayKey).events.emit('playerMove', dx, dy)
  }

  private emitAction(action: string) {
    this.scene.get(this.gameplayKey).events.emit('playerAction', action)
  }
}
