<script setup lang="ts">
  import { computed, ref } from 'vue'
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

  const jumpDungeonId = ref(store.dungeon.dungeonId)
  const jumpFloor = ref(store.dungeon.floor)

  function jumpToFloor() {
    const def = getDungeon(jumpDungeonId.value)
    const floor = Math.max(1, Math.min(jumpFloor.value, def.floors.length))
    store.setDungeonState(jumpDungeonId.value, def.floors.length, floor)
    gameLoop.initFloor(floor)
    store.addMessage(`[DEBUG] ${def.name} ${floor}Fへジャンプ`)
  }

  function killAllEnemies() {
    const count = store.enemies.length
    store.clearEnemies()
    store.addMessage(`[DEBUG] ${count}体の敵を消した`)
  }

  function fullHeal() {
    store.setPlayerStats({ hp: store.player.maxHp, satiation: store.player.maxSatiation })
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
        <h3>Player</h3>
        <div class="row">
          <label>HP</label>
          <input v-model.number="store.player.hp" type="number" min="0" >
          <label>/ Max</label>
          <input v-model.number="store.player.maxHp" type="number" min="1" >
        </div>
        <div class="row">
          <label>ATK</label>
          <input v-model.number="store.player.attack" type="number" min="0" >
          <label>DEF</label>
          <input v-model.number="store.player.defense" type="number" min="0" >
        </div>
        <div class="row">
          <label>Lv</label>
          <input v-model.number="store.player.level" type="number" min="1" >
          <label>EXP</label>
          <input v-model.number="store.player.exp" type="number" min="0" >
        </div>
        <div class="row">
          <label>満腹</label>
          <input v-model.number="store.player.satiation" type="number" min="0" >
          <label>/ Max</label>
          <input v-model.number="store.player.maxSatiation" type="number" min="1" >
        </div>
        <div class="row">
          <label>X</label>
          <input v-model.number="store.player.position.x" type="number" >
          <label>Y</label>
          <input v-model.number="store.player.position.y" type="number" >
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
          <div class="row">
            <label>HP</label>
            <input
              :value="e.hp"
              type="number"
              min="0"
              @input="(ev) => store.setEnemyStats(e.id, { hp: Number((ev.target as HTMLInputElement).value) })"
            >
            <label>ATK</label>
            <input
              :value="e.attack"
              type="number"
              min="0"
              @input="(ev) => store.setEnemyStats(e.id, { attack: Number((ev.target as HTMLInputElement).value) })"
            >
            <label>DEF</label>
            <input
              :value="e.defense"
              type="number"
              min="0"
              @input="(ev) => store.setEnemyStats(e.id, { defense: Number((ev.target as HTMLInputElement).value) })"
            >
          </div>
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

  .btn-sm.primary {
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
</style>
