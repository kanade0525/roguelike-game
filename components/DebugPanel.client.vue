<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useGameStore } from '~/stores/gameStore'
  import { useGameLoop } from '~/composables/useGameLoop'
  import { useDebugMode } from '~/composables/useDebugMode'
  import { DUNGEONS, getDungeon } from '~/game/dungeon'

  const store = useGameStore()
  const gameLoop = useGameLoop()
  const debug = useDebugMode()

  const collapsed = ref(false)

  const dungeonOptions = computed(() =>
    Object.entries(DUNGEONS).map(([id, def]) => ({
      id,
      name: def.name,
      floors: def.floors.length,
    }))
  )

  const playerDraft = reactive({
    hp: 0,
    maxHp: 0,
    attack: 0,
    defense: 0,
    dodgePct: 0,
    level: 1,
    exp: 0,
    satiation: 0,
    maxSatiation: 0,
    posX: 0,
    posY: 0,
  })

  function syncPlayerDraft() {
    playerDraft.hp = store.player.hp
    playerDraft.maxHp = store.player.maxHp
    playerDraft.attack = store.player.attack
    playerDraft.defense = store.player.defense
    playerDraft.dodgePct = Math.round((store.player.dodge ?? 0) * 1000) / 10
    playerDraft.level = store.player.level
    playerDraft.exp = store.player.exp
    playerDraft.satiation = store.player.satiation
    playerDraft.maxSatiation = store.player.maxSatiation
    playerDraft.posX = store.player.position.x
    playerDraft.posY = store.player.position.y
  }

  function savePlayer() {
    store.setPlayerStats({
      hp: playerDraft.hp,
      maxHp: playerDraft.maxHp,
      attack: playerDraft.attack,
      defense: playerDraft.defense,
      dodge: Math.max(0, Math.min(100, playerDraft.dodgePct)) / 100,
      level: playerDraft.level,
      exp: playerDraft.exp,
      satiation: playerDraft.satiation,
      maxSatiation: playerDraft.maxSatiation,
      position: { x: playerDraft.posX, y: playerDraft.posY },
    })
    store.addMessage('[DEBUG] プレイヤーを保存')
  }

  interface EnemyDraft {
    hp: number
    attack: number
    defense: number
    dodgePct: number
  }
  const enemyDrafts = reactive<Record<string, EnemyDraft>>({})

  function enemyToDraft(e: { hp: number; attack: number; defense: number; dodge?: number }): EnemyDraft {
    return {
      hp: e.hp,
      attack: e.attack,
      defense: e.defense,
      dodgePct: Math.round((e.dodge ?? 0) * 1000) / 10,
    }
  }

  function syncEnemyDrafts() {
    for (const e of store.enemies) {
      if (!enemyDrafts[e.id]) {
        enemyDrafts[e.id] = enemyToDraft(e)
      }
    }
    for (const id of Object.keys(enemyDrafts)) {
      if (!store.enemies.some((e) => e.id === id)) {
        Reflect.deleteProperty(enemyDrafts, id)
      }
    }
  }

  function resetEnemyDraft(id: string) {
    const e = store.enemies.find((e) => e.id === id)
    if (!e) return
    enemyDrafts[id] = enemyToDraft(e)
  }

  function saveEnemy(id: string) {
    const draft = enemyDrafts[id]
    if (!draft) return
    store.setEnemyStats(id, {
      hp: draft.hp,
      attack: draft.attack,
      defense: draft.defense,
      dodge: Math.max(0, Math.min(100, draft.dodgePct)) / 100,
    })
    store.addMessage('[DEBUG] 敵を保存')
  }

  watch(
    () => debug.enabled.value,
    (v) => {
      if (v) {
        syncPlayerDraft()
        syncEnemyDrafts()
      }
    },
    { immediate: true }
  )

  watch(
    () => store.enemies.map((e) => e.id).join(','),
    () => syncEnemyDrafts()
  )

  const jumpDungeonId = ref(store.dungeon.dungeonId)
  const jumpFloor = ref(store.dungeon.floor)

  function jumpToFloor() {
    const def = getDungeon(jumpDungeonId.value)
    const floor = Math.max(1, Math.min(jumpFloor.value, def.floors.length))
    store.setDungeonState(jumpDungeonId.value, def.floors.length, floor)
    gameLoop.initFloor(floor)
    syncPlayerDraft()
    syncEnemyDrafts()
    store.addMessage(`[DEBUG] ${def.name} ${floor}Fへジャンプ`)
  }

  function killAllEnemies() {
    const count = store.enemies.length
    store.clearEnemies()
    store.addMessage(`[DEBUG] ${count}体の敵を消した`)
  }

  function fullHeal() {
    store.setPlayerStats({ hp: store.player.maxHp, satiation: store.player.maxSatiation })
    syncPlayerDraft()
    store.addMessage('[DEBUG] HP・満腹度を全回復')
  }

  function warpEnemyToPlayer(id: string) {
    const p = store.player.position
    store.setEnemyStats(id, { x: p.x, y: p.y - 1 })
  }
</script>

<template>
  <div v-if="debug.enabled.value" class="debug-panel" :class="{ collapsed }">
    <header class="header">
      <span class="title">🛠 DEBUG</span>
      <button class="btn-icon" type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▼' : '▲' }}
      </button>
      <button class="btn-icon" type="button" @click="debug.disable()">✕</button>
    </header>

    <div v-if="!collapsed" class="body">
      <section class="section">
        <div class="section-header">
          <h3>Player</h3>
          <div class="actions">
            <button
              class="btn-xs"
              type="button"
              title="現在の値を再読込"
              @click="syncPlayerDraft"
            >
              ↻
            </button>
            <button class="btn-sm primary" type="button" @click="savePlayer">保存</button>
          </div>
        </div>
        <div class="row">
          <label>HP</label>
          <input v-model.number="playerDraft.hp" type="number" min="0" >
          <label>/ Max</label>
          <input v-model.number="playerDraft.maxHp" type="number" min="1" >
        </div>
        <div class="row">
          <label>ATK</label>
          <input v-model.number="playerDraft.attack" type="number" min="0" >
          <label>DEF</label>
          <input v-model.number="playerDraft.defense" type="number" min="0" >
        </div>
        <div class="row">
          <label>回避%</label>
          <input v-model.number="playerDraft.dodgePct" type="number" min="0" max="100" step="0.5" >
        </div>
        <div class="row">
          <label>Lv</label>
          <input v-model.number="playerDraft.level" type="number" min="1" >
          <label>EXP</label>
          <input v-model.number="playerDraft.exp" type="number" min="0" >
        </div>
        <div class="row">
          <label>満腹</label>
          <input v-model.number="playerDraft.satiation" type="number" min="0" >
          <label>/ Max</label>
          <input v-model.number="playerDraft.maxSatiation" type="number" min="1" >
        </div>
        <div class="row">
          <label>X</label>
          <input v-model.number="playerDraft.posX" type="number" >
          <label>Y</label>
          <input v-model.number="playerDraft.posY" type="number" >
        </div>
        <div class="row toggles">
          <label class="toggle">
            <input v-model="debug.invincible.value" type="checkbox" >
            <span>無敵</span>
          </label>
          <label class="toggle">
            <input v-model="debug.oneShot.value" type="checkbox" >
            <span>ワンパン</span>
          </label>
          <button class="btn-sm" type="button" @click="fullHeal">全回復</button>
        </div>
      </section>

      <section class="section">
        <h3>Floor Jump</h3>
        <div class="row">
          <select v-model="jumpDungeonId">
            <option v-for="d in dungeonOptions" :key="d.id" :value="d.id">
              {{ d.name }} ({{ d.floors }}F)
            </option>
          </select>
        </div>
        <div class="row">
          <label>F</label>
          <input v-model.number="jumpFloor" type="number" min="1" >
          <button class="btn-sm primary" type="button" @click="jumpToFloor">Jump</button>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h3>Enemies ({{ store.enemies.length }})</h3>
          <button class="btn-sm danger" type="button" @click="killAllEnemies">全消去</button>
        </div>
        <div v-if="store.enemies.length === 0" class="empty">敵はいません</div>
        <div v-for="e in store.enemies" :key="e.id" class="enemy">
          <div class="enemy-head">
            <span class="enemy-type">{{ e.type }}</span>
            <span class="enemy-pos">({{ e.x }},{{ e.y }})</span>
            <button class="btn-xs" type="button" @click="warpEnemyToPlayer(e.id)">→Player</button>
            <button class="btn-xs danger" type="button" @click="store.removeEnemy(e.id)">削</button>
          </div>
          <template v-if="enemyDrafts[e.id]">
            <div class="row">
              <label>HP</label>
              <input v-model.number="enemyDrafts[e.id].hp" type="number" min="0" >
              <label>ATK</label>
              <input v-model.number="enemyDrafts[e.id].attack" type="number" min="0" >
            </div>
            <div class="row">
              <label>DEF</label>
              <input v-model.number="enemyDrafts[e.id].defense" type="number" min="0" >
              <label>回避%</label>
              <input v-model.number="enemyDrafts[e.id].dodgePct" type="number" min="0" max="100" step="0.5" >
            </div>
            <div class="row enemy-actions">
              <span class="current">
                現在 HP{{ e.hp }} / ATK{{ e.attack }} / DEF{{ e.defense }} / 回避{{ Math.round((e.dodge ?? 0) * 1000) / 10 }}%
              </span>
              <button class="btn-xs" type="button" title="現在値を再読込" @click="resetEnemyDraft(e.id)">↻</button>
              <button class="btn-xs primary" type="button" @click="saveEnemy(e.id)">保存</button>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  .debug-panel {
    position: fixed;
    top: 8px;
    right: 8px;
    width: 280px;
    max-height: calc(100vh - 16px);
    background: rgba(20, 20, 30, 0.92);
    color: #e0e0ff;
    border: 1px solid #8888aa;
    border-radius: 4px;
    font-family: 'DotGothic16', monospace;
    font-size: 12px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(2px);
  }

  .debug-panel.collapsed {
    width: auto;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    background: rgba(60, 60, 80, 0.8);
    border-bottom: 1px solid #555577;
  }

  .title {
    flex: 1;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .btn-icon {
    width: 22px;
    height: 22px;
    background: rgba(80, 80, 100, 0.6);
    border: 1px solid #666688;
    color: #e0e0ff;
    font-size: 11px;
    cursor: pointer;
    border-radius: 2px;
  }

  .btn-icon:hover {
    background: rgba(100, 100, 130, 0.8);
  }

  .body {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
  }

  .section {
    padding: 4px 0 8px;
    border-bottom: 1px dashed #444466;
  }

  .section:last-child {
    border-bottom: none;
  }

  .section h3 {
    margin: 0 0 4px;
    font-size: 13px;
    color: #ffcc88;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .section-header h3 {
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 4px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }

  .row label {
    color: #aaaacc;
    min-width: 28px;
    font-size: 11px;
  }

  .row input[type='number'],
  .row select {
    flex: 1;
    min-width: 0;
    background: rgba(40, 40, 60, 0.8);
    color: #fff;
    border: 1px solid #555577;
    border-radius: 2px;
    padding: 2px 4px;
    font-family: inherit;
    font-size: 12px;
  }

  .toggles {
    justify-content: space-between;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    min-width: auto;
  }

  .toggle input {
    cursor: pointer;
  }

  .btn-sm,
  .btn-xs {
    background: rgba(70, 110, 150, 0.7);
    border: 1px solid #6688aa;
    color: #fff;
    padding: 2px 6px;
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    border-radius: 2px;
  }

  .btn-xs {
    padding: 1px 4px;
    font-size: 10px;
  }

  .btn-sm:hover,
  .btn-xs:hover {
    background: rgba(90, 140, 190, 0.9);
  }

  .btn-sm.primary,
  .btn-xs.primary {
    background: rgba(80, 140, 90, 0.8);
    border-color: #88bb88;
  }

  .btn-sm.danger,
  .btn-xs.danger {
    background: rgba(160, 60, 60, 0.8);
    border-color: #cc6666;
  }

  .empty {
    color: #777799;
    font-style: italic;
    padding: 4px 0;
  }

  .enemy {
    background: rgba(40, 40, 60, 0.5);
    padding: 4px;
    margin-bottom: 4px;
    border-radius: 2px;
  }

  .enemy-head {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }

  .enemy-type {
    color: #ffaa88;
    font-weight: bold;
  }

  .enemy-pos {
    color: #888899;
    flex: 1;
    font-size: 10px;
  }

  .enemy-actions {
    margin-top: 2px;
    margin-bottom: 0;
  }

  .current {
    flex: 1;
    color: #888899;
    font-size: 10px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
