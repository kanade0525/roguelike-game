<script setup lang="ts">
// タイトル画面
const router = useRouter()

const startGame = () => {
  router.push('/game')
}
</script>

<template>
  <div class="title-screen">
    <h1>ローグライクダンジョン</h1>
    <div class="menu">
      <button class="menu-button" @click="startGame">
        はじめから
      </button>
      <button class="menu-button" disabled>
        つづきから
      </button>
    </div>
  </div>
</template>

<style scoped>
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #1a1a2e;
  color: #eee;
  font-family: 'Courier New', monospace;
}

h1 {
  font-size: 2rem;
  margin-bottom: 3rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #16213e;
  color: #eee;
  border: 2px solid #0f3460;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-button:hover:not(:disabled) {
  background-color: #0f3460;
  transform: scale(1.05);
}

.menu-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
