<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useGameStore } from '~/stores/gameStore'
  import { DUNGEONS, DEFAULT_DUNGEON_ID } from '~/game/dungeon'

  // 拠点画面（村）: 脱出・帰還の行き先、永続ゴールドの表示、ダンジョンへの出発
  const router = useRouter()
  const gameStore = useGameStore()

  const gold = computed(() => gameStore.meta.gold)
  const lastRun = computed(() => gameStore.meta.lastRun)

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

  onMounted(() => {
    // localStorage から永続データを同期
    gameStore.loadMeta()
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
    </div>

    <!-- 鍛冶（PR4で中身を実装するプレースホルダ） -->
    <div class="shop-panel nes-container is-dark is-rounded">
      <p class="shop-title">鍛冶屋</p>
      <p class="shop-note nes-text is-disabled">まだ準備中だ…（近日開放）</p>
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

  .shop-title,
  .depart-title {
    font-size: 0.75rem;
    margin: 0 0 0.6rem;
  }

  .shop-note {
    font-size: 0.6rem;
    margin: 0;
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
