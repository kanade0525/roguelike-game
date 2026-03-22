import Phaser from 'phaser'
import { StatusBar } from '../ui/StatusBar'
import { MessageLog } from '../ui/MessageLog'
import { Controller } from '../ui/Controller'
import { MenuOverlay } from '../ui/MenuOverlay'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { MinimapOverlay } from '../ui/MinimapOverlay'

export class UIScene extends Phaser.Scene {
  private statusBar!: StatusBar
  private messageLog!: MessageLog
  private menu!: MenuOverlay
  private confirm!: ConfirmDialog
  private minimap!: MinimapOverlay

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
