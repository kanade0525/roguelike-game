import Phaser from 'phaser'
import { TILE } from '../../game/data/maps'
import { getDungeon } from '../../game/dungeon'
import { ITEMS } from '../../game/data/items'
import gameConfig from '../../game/data/gameConfig.json'
import type { CombatEvent, ActionResult } from '../../composables/useGameLoop'
import { isBossType } from '../../game/entities/Enemy'
import { BaseMapScene, type TileVisibility } from './BaseMapScene'

// ボス種別 → 大型スプライト（0x72 の big 敵）。最終フロアに大きく描画する。
const BOSS_SPRITE: Record<string, string> = {
  forest_lord: 'ogre',
  castle_lord: 'big_zombie',
  abyss_lord: 'big_demon',
}

const ITEM_TINT: Record<string, number> = {
  weapon: 0xffffff,
  armor: 0x66aaff,
  potion: 0x66ff66,
  food: 0xffcc66,
  scroll: 0xcc99ff,
  special: 0xffaa33,
  gold: 0xffd700,
  other: 0xcccccc,
}

export class DungeonScene extends BaseMapScene {
  // composable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameLoop: any = null

  // ユーザー設定（音量）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private settings: any = null

  // デバッググリッド
  private debugContainer!: Phaser.GameObjects.Container
  private debugGridVisible = false

  // レベルアップ検知用
  private lastPlayerLevel = 1

  // FOV（視界）: 有効フラグと、drawScene 内で使い回す可視/探索済み集合
  private fovActive = false
  private visibleSet: Set<string> = new Set()
  private exploredSet: Set<string> = new Set()

  // BGM
  private currentBgm: Phaser.Sound.BaseSound | null = null
  private currentBgmKey = ''

  constructor() {
    super({ key: 'DungeonScene' })
  }

  // ダンジョンID → 地形タイルの色替え接尾辞（静寂の森=緑, 暗黒城=紫灰, 深淵=赤黒）
  private terrainSuffixForCurrentDungeon(): string {
    const store = this.game.registry.get('gameStore')
    const id: string | undefined = store?.dungeon?.dungeonId
    const map: Record<string, string> = {
      silentForest: '_forest',
      darkCastle: '_castle',
      abyss: '_abyss',
    }
    return (id && map[id]) || ''
  }

  preload() {
    // 共通アセット（床・壁・プレイヤー・階段）
    this.loadSharedAssets()
    // ダンジョン別の色替え地形タイル
    this.loadTerrainVariant(this.terrainSuffixForCurrentDungeon())
    // 敵（4フレーム）
    for (let i = 0; i <= 3; i++) {
      this.load.image(`skelet_f${i}`, `/assets/tiles/skelet_idle_anim_f${i}.png`)
    }
    // ボス（大型スプライト・4フレーム）
    for (const sprite of Object.values(BOSS_SPRITE)) {
      for (let i = 0; i <= 3; i++) {
        this.load.image(`${sprite}_f${i}`, `/assets/tiles/${sprite}_idle_anim_f${i}.png`)
      }
    }
    // アイテム
    this.load.image('weapon_sword', '/assets/tiles/weapon_anime_sword.png')
    this.load.image('flask_green', '/assets/tiles/flask_green.png')

    // SE（ファイルが存在しない場合はロードエラーを無視）
    this.load.on('loaderror', () => {})
    this.load.audio('se_attack', '/assets/se/attack.mp3')
    this.load.audio('se_enemy_attack', '/assets/se/enemy_attack.mp3')
    this.load.audio('se_dodge', '/assets/se/dodge.mp3')
    this.load.audio('se_critical', '/assets/se/critical.mp3')
    this.load.audio('se_swing', '/assets/se/swing.mp3')
    this.load.audio('se_item_get', '/assets/se/item_get.mp3')
    this.load.audio('se_item_use', '/assets/se/item_use.mp3')
    this.load.audio('se_game_clear', '/assets/se/game_clear.mp3')
    this.load.audio('se_game_over', '/assets/se/game_over.mp3')
    this.load.audio('se_stairs', '/assets/se/stairs.mp3')
    this.load.audio('se_levelup', '/assets/se/levelup.mp3')
  }

  create() {
    this.gameStore = this.game.registry.get('gameStore')
    this.gameLoop = this.game.registry.get('gameLoop')
    this.settings = this.game.registry.get('settingsStore')
    // ダンジョンごとに地形の色味を変える（描画前に設定）
    this.terrainTextureSuffix = this.terrainSuffixForCurrentDungeon()

    if (!this.gameStore || !this.gameLoop) {
      throw new Error('gameStore or gameLoop not found in registry')
    }

    this.calculateTileSize()
    this.syncMapFromStore()

    // FOV有効判定: playerConfig.fovEnabled（既定ON）または debugConfig.showFOV（強制ON）
    const playerCfg = gameConfig.playerConfig as { fovEnabled?: boolean }
    const debugCfg = gameConfig.debugConfig as { showFOV?: boolean }
    this.fovActive = (playerCfg?.fovEnabled ?? false) || (debugCfg?.showFOV ?? false)

    // マウント／リロード直後に可視タイルが空でも即描画できるよう再計算する
    if (this.fovActive) {
      this.gameStore.recomputeFov()
    }

    // 共通コンテナ + デバッグ用
    this.createContainers()
    this.debugContainer = this.add.container(0, 0)
    this.debugContainer.setVisible(this.debugGridVisible)

    // デバッググリッド切り替え（コンソール用）
    ;(window as unknown as { toggleDebugGrid: () => void }).toggleDebugGrid = () => {
      this.debugGridVisible = !this.debugGridVisible
      this.debugContainer.setVisible(this.debugGridVisible)
      console.log(`Debug grid: ${this.debugGridVisible ? 'ON' : 'OFF'}`)
    }

    this.lastPlayerLevel = this.gameStore.player.level
    this.createAnimations()
    this.drawScene()
    this.drawDebugGrid()
    this.setupInput()
    this.setupTouchInput()

    this.scene.launch('UIScene', { gameplayKey: 'DungeonScene' })
    this.playDungeonBgm()

    // デバッグパネルからの全画面再描画フックを登録
    if (window.__katabasis) {
      window.__katabasis.refresh = (message?: string) => {
        this.syncMapFromStore()
        this.drawScene()
        this.updateUI(message ? [message] : [])
      }
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (window.__katabasis) window.__katabasis.refresh = undefined
    })
  }

  private createAnimations() {
    this.createKnightAnimation()
    if (!this.anims.exists('skelet_idle_anim')) {
      this.anims.create({
        key: 'skelet_idle_anim',
        frames: [
          { key: 'skelet_f0' },
          { key: 'skelet_f1' },
          { key: 'skelet_f2' },
          { key: 'skelet_f3' },
        ],
        frameRate: 6,
        repeat: -1,
      })
    }
    // ボスの待機アニメ
    for (const sprite of Object.values(BOSS_SPRITE)) {
      const key = `${sprite}_idle_anim`
      if (this.anims.exists(key)) continue
      this.anims.create({
        key,
        frames: [
          { key: `${sprite}_f0` },
          { key: `${sprite}_f1` },
          { key: `${sprite}_f2` },
          { key: `${sprite}_f3` },
        ],
        frameRate: 5,
        repeat: -1,
      })
    }
  }

  // --- フロア管理 ---

  private syncMapFromStore() {
    const map = this.gameStore.currentMap
    if (!Array.isArray(map) || map.length === 0 || !Array.isArray(map[0]) || map[0].length === 0) {
      throw new Error('currentMap is empty or invalid')
    }
    this.setMap(map)
  }

  private goNextFloor() {
    this.lockInput()
    this.playSE('se_stairs')

    // フェードアウト
    const overlay = this.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x000000
    )
    overlay.setAlpha(0)
    overlay.setDepth(3000)

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        // 暗転中にフロア遷移処理
        const result = this.gameLoop.goNextFloor()

        // ダンジョンクリア判定
        if (result && typeof result === 'object' && 'cleared' in result) {
          this.updateUI(result.messages)
          this.playClearSequence(overlay)
          return
        }

        if (!Array.isArray(result)) {
          overlay.destroy()
          this.updateUI(['次の階へ移動できませんでした'])
          return
        }

        this.syncMapFromStore()
        this.drawScene()

        // フロア名表示
        const dungeon = getDungeon(this.gameStore.dungeon.dungeonId)
        const floor = this.gameStore.dungeon.floor
        const gameAreaCenterY = (this.gameAreaTop + this.gameAreaBottom) / 2
        const floorLabel = this.add.text(
          this.screenWidth / 2,
          gameAreaCenterY,
          `${dungeon.name}  ~B${floor}F~`,
          {
            fontSize: '22px',
            fontFamily: '"DotGothic16", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
          }
        )
        floorLabel.setOrigin(0.5)
        floorLabel.setDepth(3001)

        // フロア名を表示してからフェードイン
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: [overlay, floorLabel],
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
              overlay.destroy()
              floorLabel.destroy()
              this.updateUI(result)
              this.playDungeonBgm()
              this.unlockInput()
              // ボスフロアに到達したら登場演出
              if (this.isBossAlive()) this.showBossIntro()
            },
          })
        })
      },
    })
  }

  // ボス種別の敵が生存しているか（撃破すると store.enemies から除かれる）
  private isBossAlive(): boolean {
    return (this.gameStore.enemies as { type: string }[]).some((e) => isBossType(e.type))
  }

  // ボスフロア到達時の登場演出（赤フラッシュ＋バナー）
  private showBossIntro() {
    const cx = this.screenWidth / 2
    const cy = (this.gameAreaTop + this.gameAreaBottom) / 2
    const flash = this.add
      .rectangle(cx, this.screenHeight / 2, this.screenWidth, this.screenHeight, 0xaa0000, 0)
      .setDepth(3200)
    this.tweens.add({
      targets: flash,
      alpha: 0.35,
      duration: 220,
      yoyo: true,
      repeat: 1,
      onComplete: () => flash.destroy(),
    })
    const banner = this.add
      .text(cx, cy, '― ボス出現 ―', {
        fontSize: '30px',
        fontFamily: '"DotGothic16", monospace',
        color: '#ff5555',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(3201)
      .setAlpha(0)
    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 350,
      yoyo: true,
      hold: 1000,
      onComplete: () => banner.destroy(),
    })
  }

  // --- 描画フック（BaseMapScene から呼ばれる） ---

  // FOV可視/探索済み集合を毎フレーム構築（Array.includes の O(n) を回避）
  protected override prepareDraw() {
    if (this.fovActive) {
      this.visibleSet = new Set(this.gameStore.visibleTiles as string[])
      this.exploredSet = new Set(this.gameStore.exploredTiles as string[])
    }
  }

  // タイルの可視状態（FOV無効時は常に visible = 全描画）
  protected override tileVisibility(x: number, y: number): TileVisibility {
    if (!this.fovActive) return 'visible'
    const key = `${x},${y}`
    if (this.visibleSet.has(key)) return 'visible'
    if (this.exploredSet.has(key)) return 'explored'
    return 'hidden'
  }

  protected override drawEntities(
    viewStartX: number,
    viewStartY: number,
    endX: number,
    endY: number
  ) {
    this.drawItems(viewStartX, viewStartY, endX, endY)
    this.drawEnemies(viewStartX, viewStartY, endX, endY)
  }

  protected override afterDraw() {
    if (this.debugGridVisible) {
      this.drawDebugGrid()
    }
  }

  private drawDebugGrid() {
    this.debugContainer.removeAll(true)

    for (let y = this.viewStartY - 2; y < this.viewStartY + this.viewTilesY + 2; y++) {
      for (let x = this.viewStartX - 2; x < this.viewStartX + this.viewTilesX + 2; x++) {
        const screenX = x - this.viewStartX
        const screenY = y - this.viewStartY
        const pixelX = this.offsetX + screenX * this.tileWidth + this.tileWidth / 2
        const pixelY = this.offsetY + screenY * this.tileHeight + this.tileHeight / 2

        const label = `${x},${y}`
        const isFloorArea =
          x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight && this.isFloor(x, y)
        const isInMap = x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight
        let color = '#666666'
        if (isFloorArea) {
          color = '#ffff00'
        } else if (isInMap) {
          color = '#ff6666'
        }

        const text = this.add.text(pixelX, pixelY, label, {
          fontSize: '10px',
          color: color,
          backgroundColor: '#000000aa',
          padding: { x: 2, y: 2 },
        })
        text.setOrigin(0.5, 0.5)
        text.setDepth(1000)
        this.debugContainer.add(text)
      }
    }
  }

  private drawItems(viewStartX: number, viewStartY: number, endX: number, endY: number) {
    for (const item of this.gameStore.floorItems) {
      if (item.x < viewStartX || item.x >= endX || item.y < viewStartY || item.y >= endY) continue
      // FOV有効時、今見えているマスのアイテムのみ描画
      if (this.tileVisibility(item.x, item.y) !== 'visible') continue
      const screenTileX = item.x - viewStartX
      const screenTileY = item.y - viewStartY
      const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
      const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight / 2
      const def = ITEMS[item.itemId]
      const spriteKey =
        def?.sprite && this.textures.exists(def.sprite) ? def.sprite : 'weapon_sword'
      const sprite = this.add.image(x, y, spriteKey)
      // 専用スプライト (flask 等) は元画像が小さいので大きめに描画する
      const scaleFactor = spriteKey === 'weapon_sword' ? 0.35 : 0.55
      sprite.setScale(this.tileScale * scaleFactor)
      const type = def?.type ?? 'other'
      // 専用スプライトは tint しない（色被りを防ぐ）
      if (spriteKey === 'weapon_sword') {
        sprite.setTint(ITEM_TINT[type] ?? 0xffffff)
      }
      this.entityContainer.add(sprite)
    }
  }

  private drawEnemies(viewStartX: number, viewStartY: number, endX: number, endY: number) {
    for (const enemy of this.gameStore.enemies) {
      if (enemy.x < viewStartX || enemy.x >= endX || enemy.y < viewStartY || enemy.y >= endY)
        continue
      // FOV有効時、今見えているマスの敵のみ描画
      if (this.tileVisibility(enemy.x, enemy.y) !== 'visible') continue
      const screenTileX = enemy.x - viewStartX
      const screenTileY = enemy.y - viewStartY
      const x = this.offsetX + screenTileX * this.tileWidth + this.tileWidth / 2
      const y = this.offsetY + screenTileY * this.tileHeight + this.tileHeight * 0.8
      const bossSprite = BOSS_SPRITE[enemy.type]
      const sprite = this.add.sprite(x, y, bossSprite ? `${bossSprite}_f0` : 'skelet_f0')
      sprite.setOrigin(0.5, 1.0)
      // ボスは大型スプライトをさらに大きく描画して威圧感を出す
      sprite.setScale(this.tileScale * (bossSprite ? 0.9 : 0.6))
      sprite.play(bossSprite ? `${bossSprite}_idle_anim` : 'skelet_idle_anim')
      this.entityContainer.add(sprite)
    }
  }

  // --- 入力（移動/アクションの中身。共通の入力配線は BaseMapScene） ---

  protected override tryMove(dx: number, dy: number) {
    if (this.inputLocked) return
    const ui = this.getUiScene()
    // 確認ダイアログは最上位レイヤなので最優先で操作する
    if (ui.isConfirmOpen()) {
      ui.moveConfirmCursor(dx)
      return
    }
    if (ui.isInventoryOpen()) {
      ui.moveInventoryCursor(dx, dy)
      return
    }
    if (ui.isMenuOpen()) {
      ui.moveMenuCursor(dx, dy)
      return
    }
    // ミニマップ表示中は移動しない（handleAction と対称に）
    if (ui.isMinimapOpen()) return

    const result: ActionResult | null = this.gameLoop.playerMove(dx, dy)

    if (result !== null) {
      this.drawScene()
      this.updateUI(result.messages)
      this.playSequencedCombatEffects(result)

      if (result.messages.some((m) => m.includes('拾った'))) {
        this.playSE('se_item_get')
      }

      const pos = this.gameStore.player.position
      if (this.map[pos.y][pos.x] === TILE.STAIRS) {
        // ボスフロアはボスを倒すまで先へ進めない
        if (this.isBossAlive()) {
          this.updateUI(['ボスが立ちはだかっている。倒さなければ先へ進めない！'])
        } else {
          this.getUiScene().showConfirm('次の階に移動しますか？', () => {
            this.goNextFloor()
          })
        }
      }
    }
  }

  protected override handleAction(action: string) {
    if (this.inputLocked) return
    const ui = this.getUiScene()

    if (ui.isMinimapOpen()) {
      if (action === 'confirm' || action === 'inventory') {
        ui.hideMinimap()
      }
      return
    }

    // 確認ダイアログは最上位レイヤなので最優先で扱う
    if (ui.isConfirmOpen()) {
      if (action === 'confirm') {
        ui.confirmSelect()
      } else if (action === 'inventory') {
        ui.hideConfirm()
      }
      return
    }

    if (ui.isInventoryOpen()) {
      this.handleInventoryAction(action)
      return
    }

    if (ui.isMenuOpen()) {
      if (action === 'confirm') {
        const selected = ui.selectMenuItem()
        if (selected) {
          ui.toggleMenu()
          if (selected === 'マップ') {
            ui.showMinimap(
              this.gameStore.currentMap,
              this.gameStore.player.position,
              this.gameStore.enemies.map((e: { x: number; y: number }) => ({ x: e.x, y: e.y })),
              this.gameStore.floorItems.map((i: { x: number; y: number }) => ({ x: i.x, y: i.y })),
              this.gameStore.exploredTiles
            )
          } else if (selected === '道具') {
            ui.showInventory(this.gameStore.inventory)
          } else if (selected === '脱出') {
            ui.showConfirm('ダンジョンから脱出しますか？', () => {
              this.gameLoop.escapeDungeon()
            })
          } else if (selected === '足元') {
            const pos = this.gameStore.player.position
            const foot = this.gameStore.floorItems.find(
              (i: { x: number; y: number }) => i.x === pos.x && i.y === pos.y
            )
            if (this.map[pos.y][pos.x] === TILE.STAIRS) {
              this.updateUI(['足元には階段がある。'])
            } else if (foot) {
              this.updateUI([`足元に ${ITEMS[foot.itemId]?.name ?? foot.itemId} がある。`])
            } else {
              this.updateUI(['足元には何もない。'])
            }
          }
        }
      } else if (action === 'inventory') {
        ui.toggleMenu()
      }
      return
    }

    switch (action) {
      case 'confirm': {
        const result: ActionResult = this.gameLoop.playerAttack()
        this.drawScene()
        this.updateUI(result.messages)
        if (result.combatEvents.length === 0) {
          this.playSE('se_swing')
        }
        this.playSequencedCombatEffects(result)
        break
      }
      case 'wait': {
        const result: ActionResult = this.gameLoop.playerWait()
        this.drawScene()
        this.updateUI(result.messages)
        this.playSequencedCombatEffects(result)
        break
      }
      case 'menu':
      case 'inventory':
        ui.toggleMenu()
        break
      // L/R(前/次アイテム)は持ち物を開いている時だけカーソル送りに使う。通常時は何もしない。
      case 'prevItem':
      case 'nextItem':
        break
    }
  }

  private handleInventoryAction(action: string) {
    const ui = this.getUiScene()
    const index = ui.getInventorySelectedIndex()

    if (action === 'inventory') {
      ui.hideInventory()
      return
    }

    if (action === 'confirm') {
      const entry = this.gameStore.inventory[index]
      if (!entry) return
      const def = ITEMS[entry.itemId]
      if (!def) return

      if (def.usable) {
        ui.showConfirm(`${def.name} を使用しますか？`, () => {
          const useResult = this.gameStore.useInventoryItem(index)
          if (!useResult.success) return
          this.updateUI([useResult.message])
          ui.refreshInventory(this.gameStore.inventory)

          const scrollAction = useResult.scrollAction
          // リレミトの巻物: 脱出（ターン消費なし・拠点へ遷移）
          if (scrollAction === 'escape') {
            ui.hideInventory()
            this.playSE('se_stairs')
            this.gameLoop.escapeDungeon()
            return
          }
          // ワープ/地図の巻物: 効果は store 適用済み、再描画してターン消費
          if (scrollAction === 'teleport' || scrollAction === 'revealMap') {
            this.playSE('se_item_use')
            ui.hideInventory()
            this.consumeTurnAfterItem()
            return
          }
          // 通常の消費アイテム（ポーション・食料）
          if (useResult.message.includes('HP') || useResult.message.includes('満腹')) {
            this.playSE('se_item_use')
          }
          this.consumeTurnAfterItem()
        })
        return
      }

      if (def.equippable) {
        const verb = entry.equipped ? '外しますか' : '装備しますか'
        ui.showConfirm(`${def.name} を${verb}？`, () => {
          const equipResult = this.gameStore.equipInventoryItem(index)
          if (equipResult.success) {
            this.updateUI([equipResult.message])
            ui.refreshInventory(this.gameStore.inventory)
          }
        })
        return
      }

      // 特殊アイテム（謎の金庫など）: 使用/装備どちらでもない
      if (def.type === 'special') {
        this.updateUI(['重い金庫だ。拠点に持ち帰れば開けられそうだ。'])
        return
      }
      return
    }

    if (action === 'prevItem') {
      const dropResult = this.gameStore.dropInventoryItem(index)
      if (dropResult.success) {
        this.updateUI([dropResult.message])
        ui.refreshInventory(this.gameStore.inventory)
      }
      return
    }
  }

  private consumeTurnAfterItem() {
    // アイテム使用で1ターン消費（待機メッセージは出さない）
    const result: ActionResult = this.gameLoop.passTurn()
    this.drawScene()
    this.updateUI(result.messages)
    this.playSequencedCombatEffects(result)
  }

  // --- 戦闘演出 ---

  private playSE(key: string) {
    const volume = this.settings?.seVolume ?? 0.5
    if (volume > 0 && this.cache.audio.exists(key)) {
      this.sound.play(key, { volume })
    }
  }

  private playSequencedCombatEffects(result: ActionResult) {
    if (result.combatEvents.length === 0) return

    this.lockInput()

    // プレイヤーの攻撃を即時再生
    this.playCombatEffects(result.playerEvents)

    if (result.enemyEvents.length > 0) {
      // 敵の攻撃を遅延再生 (短縮: 連打時の入力欠落を減らす)
      this.time.delayedCall(200, () => {
        this.drawScene()
        this.playCombatEffects(result.enemyEvents)
        this.time.delayedCall(150, () => {
          if (this.gameStore.player.hp <= 0 && this.gameStore.gameResult === 'active') {
            this.playDeathSequence()
          } else {
            this.unlockInput()
          }
        })
      })
    } else {
      this.time.delayedCall(150, () => {
        this.unlockInput()
      })
    }
  }

  private playDeathSequence() {
    this.lockInput()
    this.stopBgm()
    this.playSE('se_game_over')
    // 死亡ペナルティ: ゴールドとアイテムの半分をロスト（applyDeathPenalty が inventory/gold を処理）
    this.gameStore.applyDeathPenalty()

    // プレイヤー位置に赤フラッシュ
    const playerPos = this.gameStore.player.position
    const pos = this.tileToScreen(playerPos.x, playerPos.y)
    const redFlash = this.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x880000
    )
    redFlash.setAlpha(0)
    redFlash.setDepth(2500)

    const centerFlash = this.add.rectangle(
      pos.x,
      pos.y - this.tileHeight * 0.4,
      this.tileWidth * 2,
      this.tileHeight * 2,
      0xff2222
    )
    centerFlash.setAlpha(0.7)
    centerFlash.setDepth(1500)

    this.tweens.add({
      targets: redFlash,
      alpha: 0.6,
      duration: 400,
      ease: 'Power2',
    })
    this.tweens.add({
      targets: centerFlash,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => centerFlash.destroy(),
    })

    // 暗転オーバーレイ
    const blackout = this.add.rectangle(
      this.screenWidth / 2,
      this.screenHeight / 2,
      this.screenWidth,
      this.screenHeight,
      0x000000
    )
    blackout.setAlpha(0)
    blackout.setDepth(3000)

    // メッセージ
    this.time.delayedCall(600, () => {
      this.tweens.add({
        targets: blackout,
        alpha: 1,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          const deathText = this.add.text(this.screenWidth / 2, this.screenHeight / 2, '力尽きた...', {
            fontSize: '28px',
            fontFamily: '"DotGothic16", monospace',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 4,
          })
          deathText.setOrigin(0.5)
          deathText.setDepth(3001)
          deathText.setAlpha(0)

          this.tweens.add({
            targets: deathText,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
              this.time.delayedCall(1200, () => {
                this.gameStore.setGameResult('dead')
              })
            },
          })
        },
      })
    })
  }

  private playCombatEffects(events: CombatEvent[]) {
    for (const event of events) {
      if (event.isDodged) {
        this.showMissText(event.targetX, event.targetY)
        this.playSE('se_dodge')
      } else if (event.type === 'playerAttack') {
        this.showDamageNumber(event.targetX, event.targetY, event.damage, event.isCritical)
        this.flashTarget(event.targetX, event.targetY, false)
        this.playSE(event.isCritical ? 'se_critical' : 'se_attack')
      } else {
        this.showDamageNumber(event.targetX, event.targetY, event.damage, event.isCritical)
        this.flashTarget(event.targetX, event.targetY, true)
        this.playSE('se_enemy_attack')
      }
    }
  }

  private showDamageNumber(tileX: number, tileY: number, damage: number, isCritical: boolean) {
    const pos = this.tileToScreen(tileX, tileY)
    const text = this.add.text(pos.x, pos.y - 20, `${damage}`, {
      fontSize: isCritical ? '20px' : '16px',
      fontFamily: '"DotGothic16", monospace',
      color: isCritical ? '#ffff00' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    })
    text.setOrigin(0.5, 1)
    text.setDepth(2000)
    this.effectContainer.add(text)

    this.tweens.add({
      targets: text,
      y: pos.y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }

  private showMissText(tileX: number, tileY: number) {
    const pos = this.tileToScreen(tileX, tileY)
    const text = this.add.text(pos.x, pos.y - 20, 'MISS', {
      fontSize: '14px',
      fontFamily: '"DotGothic16", monospace',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2,
    })
    text.setOrigin(0.5, 1)
    text.setDepth(2000)
    this.effectContainer.add(text)

    this.tweens.add({
      targets: text,
      y: pos.y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }

  private flashTarget(tileX: number, tileY: number, isPlayer: boolean) {
    const pos = this.tileToScreen(tileX, tileY)
    const flash = this.add.rectangle(
      pos.x,
      pos.y - this.tileHeight * 0.4,
      this.tileWidth,
      this.tileHeight,
      isPlayer ? 0xff0000 : 0xffffff
    )
    flash.setAlpha(0.6)
    flash.setDepth(1500)
    this.effectContainer.add(flash)

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    })
  }

  private playClearSequence(overlay: Phaser.GameObjects.Rectangle) {
    this.stopBgm()
    this.playSE('se_game_clear')

    const clearText = this.add.text(this.screenWidth / 2, this.screenHeight / 2, 'ダンジョン踏破！', {
      fontSize: '28px',
      fontFamily: '"DotGothic16", monospace',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
    })
    clearText.setOrigin(0.5)
    clearText.setDepth(3001)
    clearText.setAlpha(0)

    this.tweens.add({
      targets: clearText,
      alpha: 1,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          // 踏破は生還扱い: ラン終了の会計処理を store に集約 (issue #37)
          this.gameStore.finishSurvivedRun('cleared')
          this.gameStore.setGameResult('cleared')
          overlay.destroy()
        })
      },
    })
  }

  // --- BGM ---

  private playDungeonBgm() {
    const dungeonId = this.gameStore.dungeon.dungeonId
    const dungeon = getDungeon(dungeonId)
    // BGM未収録のダンジョンは再生しない（存在しないファイルの読込→デコード失敗を防ぐ）
    if (!dungeon.bgm) {
      this.stopBgm()
      this.currentBgmKey = ''
      return
    }
    const bgmKey = `bgm_${dungeonId}`

    // 同じBGMが再生中ならスキップ
    if (this.currentBgmKey === bgmKey && this.currentBgm?.isPlaying) return

    // 前のBGMを停止
    this.stopBgm()

    // 動的ロード＋再生
    if (!this.cache.audio.exists(bgmKey)) {
      this.load.audio(bgmKey, dungeon.bgm)
      this.load.once('complete', () => {
        this.startBgm(bgmKey)
      })
      this.load.once('loaderror', () => {})
      this.load.start()
    } else {
      this.startBgm(bgmKey)
    }
  }

  private startBgm(key: string) {
    if (!this.cache.audio.exists(key)) return
    this.currentBgm = this.sound.add(key, { loop: true, volume: 0 })
    this.currentBgm.play()
    this.currentBgmKey = key
    // フェードイン（設定音量まで）
    this.tweens.add({
      targets: this.currentBgm,
      volume: this.settings?.bgmVolume ?? 0.3,
      duration: 1000,
      ease: 'Linear',
    })
  }

  private stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.stop()
      this.currentBgm.destroy()
      this.currentBgm = null
      this.currentBgmKey = ''
    }
  }

  private pauseBgmForEffect() {
    if (!this.currentBgm || !this.currentBgm.isPlaying) return
    this.tweens.add({
      targets: this.currentBgm,
      volume: 0,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        this.currentBgm?.pause()
      },
    })
  }

  private resumeBgmAfterEffect() {
    if (!this.currentBgm) return
    this.currentBgm.resume()
    this.tweens.add({
      targets: this.currentBgm,
      volume: this.settings?.bgmVolume ?? 0.3,
      duration: 800,
      ease: 'Linear',
    })
  }

  // --- UI更新 ---

  private updateUI(messages: string[]) {
    const uiScene = this.getUiScene()

    for (const msg of messages) {
      uiScene.addMessage(msg)
    }

    const { player, dungeon } = this.gameStore
    uiScene.updateHP(player.hp, player.maxHp)
    uiScene.updateFloor(dungeon.floor)
    uiScene.updateLevel(player.level)
    uiScene.updateSatiation(player.satiation, player.maxSatiation)
    uiScene.updateGold(player.gold ?? 0)

    if (player.level > this.lastPlayerLevel) {
      this.lastPlayerLevel = player.level
      this.showLevelUpEffect()
    }
  }

  private showLevelUpEffect() {
    this.lockInput()
    this.pauseBgmForEffect()
    this.playSE('se_levelup')

    const gameAreaCenterY = (this.gameAreaTop + this.gameAreaBottom) / 2
    const label = this.add.text(this.screenWidth / 2, gameAreaCenterY, 'LEVEL UP!', {
      fontSize: '28px',
      fontFamily: '"DotGothic16", monospace',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4,
    })
    label.setOrigin(0.5)
    label.setDepth(2000)
    label.setAlpha(0)
    this.effectContainer.add(label)

    this.tweens.add({
      targets: label,
      alpha: 1,
      y: gameAreaCenterY - 30,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.tweens.add({
            targets: label,
            alpha: 0,
            y: gameAreaCenterY - 60,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
              label.destroy()
              this.unlockInput()
              this.resumeBgmAfterEffect()
            },
          })
        })
      },
    })

    // プレイヤー位置にフラッシュ
    const playerPos = this.gameStore.player.position
    const pos = this.tileToScreen(playerPos.x, playerPos.y)
    const flash = this.add.rectangle(
      pos.x,
      pos.y - this.tileHeight * 0.4,
      this.tileWidth * 1.5,
      this.tileHeight * 1.5,
      0xffdd00
    )
    flash.setAlpha(0.5)
    flash.setDepth(1500)
    this.effectContainer.add(flash)

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    })
  }
}
