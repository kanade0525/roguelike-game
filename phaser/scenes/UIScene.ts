import Phaser from 'phaser'
import { StatusBar } from '../ui/StatusBar'
import { MessageLog } from '../ui/MessageLog'
import { Controller } from '../ui/Controller'
import { MenuOverlay } from '../ui/MenuOverlay'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { MinimapOverlay } from '../ui/MinimapOverlay'
import { InventoryOverlay } from '../ui/InventoryOverlay'

export class UIScene extends Phaser.Scene {
  private statusBar!: StatusBar
  private messageLog!: MessageLog
  private menu!: MenuOverlay
  private confirm!: ConfirmDialog
  private minimap!: MinimapOverlay
  private inventory!: InventoryOverlay

  constructor() {
    super({ key: 'UIScene' })
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

    // 初期メッセージ
    this.addMessage('ダンジョンに足を踏み入れた！')
  }

  // --- 公開API（DungeonSceneから呼ばれる） ---

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

  showInventory(inventory: { itemId: string; name: string; equipped?: boolean }[]) {
    this.inventory.show(inventory)
  }

  hideInventory() {
    this.inventory.hide()
  }

  refreshInventory(inventory: { itemId: string; name: string; equipped?: boolean }[]) {
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

  // --- イベント転送 ---

  private emitMove(dx: number, dy: number) {
    const dungeonScene = this.scene.get('DungeonScene')
    dungeonScene.events.emit('playerMove', dx, dy)
  }

  private emitAction(action: string) {
    const dungeonScene = this.scene.get('DungeonScene')
    dungeonScene.events.emit('playerAction', action)
  }
}
