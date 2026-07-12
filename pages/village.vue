<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useGameStore } from '~/stores/gameStore'
  import { DUNGEONS, DEFAULT_DUNGEON_ID } from '~/game/dungeon'
  import { ITEMS } from '~/game/data/items'
  import { computeEnhanceCost } from '~/game/systems/EconomySystem'
  import gameConfig from '~/game/data/gameConfig.json'

  // 拠点画面（村）: 脱出・帰還の行き先、永続ゴールドの表示、鍛冶、ダンジョンへの出発
  const router = useRouter()
  const gameStore = useGameStore()

  const equipCfg = gameConfig.equipmentConfig

  const gold = computed(() => gameStore.meta.gold)
  const lastRun = computed(() => gameStore.meta.lastRun)

  // 鍛冶: 拠点倉庫の装備一覧（強化対象）。index は meta.storage 上の位置。
  const equipmentList = computed(() =>
    gameStore.meta.storage
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => ITEMS[entry.itemId]?.equippable)
      .map(({ entry, index }) => {
        const def = ITEMS[entry.itemId]
        const level = entry.equipmentData?.enhanceLevel ?? 0
        const maxed = level >= equipCfg.maxEnhanceLevel
        const cost = computeEnhanceCost(
          level,
          equipCfg.enhanceCostBase,
          equipCfg.enhanceCostMultiplier
        )
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

  const lastRunLabel = computed(() => {
    const r = lastRun.value
    if (!r) return ''
    if (r.result === 'escaped') return '生還'
    if (r.result === 'cleared') return '踏破'
    return '力尽きた'
  })

  const dungeonList = computed(() =>
    Object.values(DUNGEONS).map((d) => ({
      id: d.id,
      name: d.name,
      floors: d.floors.length,
    }))
  )

  const selectedDungeonId = ref(DEFAULT_DUNGEON_ID)

  // 持ち帰った謎の金庫の開封結果
  const safeResult = ref<{ count: number; gold: number } | null>(null)

  onMounted(() => {
    // localStorage から永続データを同期
    gameStore.loadMeta()
    // 持ち帰った謎の金庫を開封してゴールドを獲得
    const opened = gameStore.openStrangeSafes()
    if (opened.count > 0) {
      safeResult.value = opened
    }
  })

  const departDungeon = () => {
    const dungeon = DUNGEONS[selectedDungeonId.value] ?? DUNGEONS[DEFAULT_DUNGEON_ID]
    // 選択したダンジョンをストアに設定し、現ランのセッションを破棄して新規開始
    gameStore.setDungeon(dungeon.id, dungeon.floors.length)
    sessionStorage.removeItem('gameState')
    router.push('/game')
  }

  const backToTitle = () => {
    router.push('/')
  }
</script>

<template>
  <div class="village-screen">
    <div class="header-area">
      <h1 class="title">拠点の村</h1>
      <p class="subtitle nes-text is-disabled">〜 深淵の入口 〜</p>
    </div>

    <!-- 所持金 -->
    <div class="gold-panel nes-container is-dark is-rounded">
      <div class="gold-row">
        <span class="gold-label">所持金</span>
        <span class="gold-value">{{ gold }} G</span>
      </div>
      <p v-if="lastRun" class="lastrun" :class="`is-${lastRun.result}`">
        前回: {{ lastRunLabel }} / B{{ lastRun.floor }}F
        <template v-if="lastRun.goldBanked > 0"> ・ +{{ lastRun.goldBanked }}G</template>
        <template v-if="lastRun.goldLost > 0"> ・ -{{ lastRun.goldLost }}G</template>
      </p>
      <p v-if="safeResult" class="safe-result">
        謎の金庫を開けた！ +{{ safeResult.gold }}G（{{ safeResult.count }}個）
      </p>
    </div>

    <!-- 鍛冶屋: 持ち帰った装備を gold で強化 -->
    <div class="shop-panel nes-container is-dark is-rounded">
      <p class="shop-title">鍛冶屋</p>
      <p v-if="equipmentList.length === 0" class="shop-note nes-text is-disabled">
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
      <p v-if="blacksmithMsg" class="shop-msg">{{ blacksmithMsg }}</p>
    </div>

    <!-- ダンジョンへ出発 -->
    <div class="depart-panel nes-container is-dark is-rounded">
      <p class="depart-title">どこへ潜る？</p>
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
      <button class="nes-btn is-primary depart-btn" @click="departDungeon">ダンジョンへ出発</button>
    </div>

    <div class="menu">
      <button class="nes-btn menu-btn" @click="backToTitle">タイトルへ</button>
    </div>
  </div>
</template>

<style scoped>
  .village-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1.2rem;
    min-height: 100vh;
    min-height: 100dvh;
    background-color: #1a1a2e;
    color: #fff;
    padding: 2rem 1rem;
    font-family: 'DotGothic16', monospace;
  }

  .header-area {
    text-align: center;
  }

  .title {
    font-size: 1.4rem;
    margin: 0 0 0.3rem;
  }

  .subtitle {
    font-size: 0.6rem;
    margin: 0;
  }

  .gold-panel,
  .shop-panel,
  .depart-panel {
    width: 100%;
    max-width: 320px;
    padding: 1rem !important;
  }

  .gold-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.85rem;
  }

  .gold-value {
    color: #ffd700;
    font-weight: bold;
  }

  .lastrun {
    margin: 0.6rem 0 0;
    font-size: 0.6rem;
    opacity: 0.85;
  }

  .lastrun.is-escaped,
  .lastrun.is-cleared {
    color: #7fdfa0;
  }

  .lastrun.is-dead {
    color: #ff8a8a;
  }

  .safe-result {
    margin: 0.4rem 0 0;
    font-size: 0.6rem;
    color: #ffd700;
  }

  .shop-title,
  .depart-title {
    font-size: 0.75rem;
    margin: 0 0 0.6rem;
  }

  .shop-note {
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

  .shop-msg {
    margin: 0.6rem 0 0;
    font-size: 0.6rem;
    color: #7fdfa0;
  }

  .dungeon-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.9rem;
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
    padding: 0.7rem 1rem !important;
    font-size: 0.75rem !important;
  }

  .menu {
    width: 100%;
    max-width: 320px;
  }

  .menu-btn {
    width: 100%;
    padding: 0.6rem 1rem !important;
    font-size: 0.7rem !important;
  }

  @media (min-width: 480px) {
    .title {
      font-size: 1.8rem;
    }

    .gold-row {
      font-size: 1rem;
    }
  }
</style>
