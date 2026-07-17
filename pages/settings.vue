<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useSettingsStore } from '~/stores/settingsStore'

  const router = useRouter()
  const settings = useSettingsStore()

  onMounted(() => settings.load())

  const bgmPct = computed({
    get: () => Math.round(settings.bgmVolume * 100),
    set: (v: number) => settings.setBgmVolume(v / 100),
  })
  const sePct = computed({
    get: () => Math.round(settings.seVolume * 100),
    set: (v: number) => settings.setSeVolume(v / 100),
  })

  // 効果音は音量変更を離した時にサンプル再生してフィードバック
  const previewSe = () => {
    if (typeof Audio === 'undefined') return
    const a = new Audio('/assets/se/item_get.mp3')
    a.volume = settings.seVolume
    a.play().catch(() => {})
  }

  const back = () => router.push('/')
</script>

<template>
  <div class="settings-screen">
    <div class="header">
      <h1 class="title">せってい</h1>
    </div>

    <div class="panel nes-container is-dark is-rounded">
      <div class="row">
        <label class="row-label">BGM 音量</label>
        <div class="control">
          <input v-model.number="bgmPct" type="range" min="0" max="100" step="5" class="slider" />
          <span class="val">{{ bgmPct }}</span>
        </div>
      </div>

      <div class="row">
        <label class="row-label">こうか音 音量</label>
        <div class="control">
          <input
            v-model.number="sePct"
            type="range"
            min="0"
            max="100"
            step="5"
            class="slider"
            @change="previewSe"
          />
          <span class="val">{{ sePct }}</span>
        </div>
      </div>
    </div>

    <button class="nes-btn is-primary back-btn" @click="back">もどる</button>
  </div>
</template>

<style scoped>
  .settings-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    min-height: 100vh;
    min-height: 100dvh;
    background-color: #1a1a2e;
    color: #fff;
    padding: 2rem 1rem;
    font-family: 'DotGothic16', monospace;
  }

  .title {
    font-size: 1.4rem;
    margin: 0;
  }

  .panel {
    width: 100%;
    max-width: 340px;
    padding: 1.2rem !important;
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .row-label {
    font-size: 0.72rem;
  }

  .control {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .slider {
    flex: 1;
    accent-color: #ffd700;
  }

  .val {
    width: 2.5rem;
    text-align: right;
    color: #ffd700;
    font-size: 0.8rem;
  }

  .back-btn {
    width: 100%;
    max-width: 340px;
    padding: 0.7rem 1rem !important;
    font-size: 0.8rem !important;
  }
</style>
