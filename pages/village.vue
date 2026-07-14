<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useGameStore } from '~/stores/gameStore'
  import { DUNGEONS, DEFAULT_DUNGEON_ID } from '~/game/dungeon'
  import { ITEMS } from '~/game/data/items'
  import { computeEnhanceCost } from '~/game/systems/EconomySystem'
  import gameConfig from '~/game/data/gameConfig.json'

  // 拠点画面（村）: 歩けるPhaserの町 + 施設に乗ると開くモーダル（鍛冶 / ダンジョン選択 / 出口）
  const router = useRouter()
  const gameStore = useGameStore()

  const equipCfg = gameConfig.equipmentConfig

  const gold = computed(() => gameStore.meta.gold)

  // 接触中の施設（VillageScene が store 経由で設定）
  const facility = computed(() => gameStore.villageFacility)
  const closeFacility = () => {
    blacksmithMsg.value = ''
    gameStore.setVillageFacility(null)
  }

  // 鍛冶: 拠点倉庫の装備一覧（強化対象）。index は meta.storage 上の位置。
  const equipmentList = computed(() =>
    gameStore.meta.storage
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => ITEMS[entry.itemId]?.equippable)
      .map(({ entry, index }) => {
        const def = ITEMS[entry.itemId]
        const level = entry.equipmentData?.enhanceLevel ?? 0
        const maxed = level >= equipCfg.maxEnhanceLevel
        const cost = computeEnhanceCost(level, equipCfg.enhanceCostBase, equipCfg.enhanceCostMultiplier)
        return {
          index,
          name: def?.name ?? entry.itemId,
          level,
          maxed,
          cost,
          canAfford: gameStore.meta.gold >= cost,
        }
      })
  )

  const blacksmithMsg = ref('')
  const enhance = (index: number) => {
    const result = gameStore.enhanceEquipment(index)
    blacksmithMsg.value = result.message
  }

  const dungeonList = computed(() =>
    Object.values(DUNGEONS).map((d) => ({ id: d.id, name: d.name, floors: d.floors.length }))
  )
  const selectedDungeonId = ref(DEFAULT_DUNGEON_ID)

  const departDungeon = () => {
    const dungeon = DUNGEONS[selectedDungeonId.value] ?? DUNGEONS[DEFAULT_DUNGEON_ID]
    gameStore.setVillageFacility(null)
    gameStore.setDungeon(dungeon.id, dungeon.floors.length)
    sessionStorage.removeItem('gameState')
    router.push('/game')
  }

  const backToTitle = () => {
    gameStore.setVillageFacility(null)
    router.push('/')
  }

  onMounted(() => {
    gameStore.loadMeta()
    gameStore.setVillageFacility(null)
  })

  // 施設が切り替わったらメッセージをリセット
  watch(facility, () => {
    blacksmithMsg.value = ''
  })
</script>

<template>
  <div class="village-page">
    <VillageCanvas />

    <!-- 施設モーダル: 町で施設タイルに乗る/A で開く -->
    <div v-if="facility" class="modal-backdrop" @click.self="closeFacility">
      <!-- 鍛冶屋 -->
      <div v-if="facility === 'blacksmith'" class="modal-panel nes-container is-dark is-rounded">
        <div class="panel-head">
          <span class="panel-title">鍛冶屋</span>
          <span class="panel-gold">{{ gold }} G</span>
        </div>
        <p v-if="equipmentList.length === 0" class="note nes-text is-disabled">
          強化できる装備がない
        </p>
        <ul v-else class="equip-list">
          <li v-for="eq in equipmentList" :key="eq.index" class="equip-row">
            <span class="equip-name">
              {{ eq.name }}
              <span v-if="eq.level > 0" class="equip-level">+{{ eq.level }}</span>
            </span>
            <button
              v-if="!eq.maxed"
              class="nes-btn is-small enhance-btn"
              :class="{ 'is-disabled': !eq.canAfford }"
              :disabled="!eq.canAfford"
              @click="enhance(eq.index)"
            >
              強化 {{ eq.cost }}G
            </button>
            <span v-else class="equip-maxed nes-text is-disabled">MAX</span>
          </li>
        </ul>
        <p v-if="blacksmithMsg" class="msg">{{ blacksmithMsg }}</p>
        <button class="nes-btn close-btn" @click="closeFacility">閉じる</button>
      </div>

      <!-- ダンジョン入口 -->
      <div v-else-if="facility === 'dungeon'" class="modal-panel nes-container is-dark is-rounded">
        <div class="panel-head">
          <span class="panel-title">どこへ潜る？</span>
          <span class="panel-gold">{{ gold }} G</span>
        </div>
        <div class="dungeon-list">
          <label
            v-for="d in dungeonList"
            :key="d.id"
            class="dungeon-option"
            :class="{ 'is-selected': selectedDungeonId === d.id }"
          >
            <input v-model="selectedDungeonId" type="radio" :value="d.id" class="nes-radio" />
            <span class="dungeon-name">{{ d.name }}</span>
            <span class="dungeon-floors">B{{ d.floors }}F</span>
          </label>
        </div>
        <button class="nes-btn is-primary depart-btn" @click="departDungeon">出発</button>
        <button class="nes-btn close-btn" @click="closeFacility">やめる</button>
      </div>

      <!-- 出口 -->
      <div v-else-if="facility === 'exit'" class="modal-panel nes-container is-dark is-rounded">
        <p class="panel-title">タイトルへ戻りますか？</p>
        <button class="nes-btn is-primary depart-btn" @click="backToTitle">タイトルへ</button>
        <button class="nes-btn close-btn" @click="closeFacility">やめる</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .village-page {
    position: relative;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    background-color: #1a1a2e;
    color: #fff;
    font-family: 'DotGothic16', monospace;
    overflow: hidden;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    z-index: 20;
    padding: 1rem;
  }

  .modal-panel {
    width: 100%;
    max-width: 320px;
    padding: 1rem !important;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .panel-title {
    font-size: 0.85rem;
  }

  .panel-gold {
    color: #ffd700;
    font-weight: bold;
    font-size: 0.8rem;
  }

  .note {
    font-size: 0.6rem;
    margin: 0;
  }

  .equip-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .equip-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.65rem;
  }

  .equip-name {
    flex: 1;
  }

  .equip-level {
    color: #ffd700;
  }

  .enhance-btn {
    font-size: 0.55rem !important;
    padding: 0.3rem 0.5rem !important;
  }

  .equip-maxed {
    font-size: 0.6rem;
  }

  .msg {
    margin: 0;
    font-size: 0.6rem;
    color: #7fdfa0;
  }

  .dungeon-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .dungeon-option {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .dungeon-name {
    flex: 1;
  }

  .dungeon-floors {
    opacity: 0.7;
    font-size: 0.6rem;
  }

  .dungeon-option.is-selected .dungeon-name {
    color: #ffd700;
  }

  .depart-btn {
    width: 100%;
    padding: 0.6rem 1rem !important;
    font-size: 0.72rem !important;
  }

  .close-btn {
    width: 100%;
    padding: 0.5rem 1rem !important;
    font-size: 0.65rem !important;
  }
</style>
