---
name: verify
description: Katabasis（Nuxt3+Phaser3+Pinia ローグライク）の変更をブラウザで実動作検証する手順。dev サーバーを起動し Playwright で駆動して画面を観察する。
---

# Katabasis ブラウザ検証レシピ

このゲームの変更は「アプリを起動 → Playwright で駆動 → スクリーンショット/状態を観察」で検証する。
テストや typecheck の再実行は検証ではない（CI の仕事）。実際に画面を動かすこと。

## 1. 起動

```bash
# dev サーバー（ポートを固定して他と衝突回避）
PORT=3100 npm run dev > /tmp/dev.log 2>&1 &
# 200 が返るまで待つ（初回 Vite 最適化で ~10s）
for i in $(seq 1 45); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/ | grep -q 200 && break; sleep 2; done
```

停止は `lsof -ti:3100 | xargs kill`。

## 2. Playwright で駆動

Playwright は本体の `node_modules` にある（`playwright` パッケージ）。スクリプトは scratchpad に置き、
`NODE_PATH` を本体の node_modules に向けて実行する:

```bash
NODE_PATH=/Users/ishidakanade/development/roguelike-game/node_modules \
  node <scratchpad>/verify.cjs
```

スクリプト雛形:

```js
const { chromium } = require('playwright')
const page = await (await (await chromium.launch())
  .newContext({ viewport: { width: 480, height: 854 } })).newPage()
page.on('pageerror', e => errors.push(e.message))         // 実行時例外を必ず拾う
page.on('console', m => m.type() === 'error' && errors.push(m.text()))
await page.goto('http://localhost:3100', { waitUntil: 'networkidle' })
```

## 3. 座標・入力の要点（重要）

- ゲーム内部解像度は **480×768**（`GameCanvas.client.vue`）、Scale.FIT + CENTER_BOTH。
  viewport 480×854 だと縦に **上下 43px のレターボックス**が入る。
  → **画面座標 = ゲーム座標 + (0, 43)**。
- Vue 画面（`/`, `/village`, `/gameover`）は DOM。`getByRole('button', {name})` で操作・`.innerText()` で検証。
- ダンジョン（`/game`）は Phaser canvas。
  - **移動はキーボード**（矢印/WASD）。`page.keyboard.press('ArrowRight')`。斜めは 2 キー同時押下
    （`keyboard.down('ArrowRight'); keyboard.down('ArrowUp')` → 少し待って up）。
  - **メニューは B ボタン（canvas クリック）でのみ開く**。画面座標 `page.mouse.click(340, 712)`。
    開いた後は矢印キーでカーソル移動 + Enter で決定（道具/マップ/足元/脱出 の 2×2、脱出=右下=Right+Down）。
  - 確認ダイアログは既定カーソル=「はい」→ Enter で即確定。
- 状態の観察/セットアップに `window.__katabasis` が使える:
  - `window.__katabasis.getStore()` … Pinia store（`player`/`meta`/`inventory`/`enemies` 等を読み書き）
  - `window.__katabasis.refresh()` … 現フロアの再描画
  - `window.__katabasis.debug` … デバッグAPI
- 拠点の永続データは **localStorage キー `katabasis_meta`**。
  村UI（gold/前回リザルト/金庫/鍛冶）を実データで見たいときは goto 前に仕込む:
  `localStorage.setItem('katabasis_meta', JSON.stringify({ gold, lastRun, storage:[...] }))`。

## 4. 落とし穴

- **フロア入場直後は入力ロック**（フェードイン演出）。開始後 **~6.5s 待って**から移動キーを送ること。
  待たずに送ると最初の入力が無視される（バグではない）。
- ダンジョン初期スクショは Phaser 起動待ちで空白になりがち。数手動かしてから撮る。
- 検証対象の変更が乗っているのは基本 `main`（M4/M5 は #67 でマージ済み）。ブランチを確認。

## 5. 駆動する価値があるフロー

- 村: タイトル「きょてんへ」→ `/village`。gold・前回リザルト・鍛冶（強化コスト = base×mult^level）・出発。
- ダンジョン: 8 方向移動（斜めで実際に (±1,±1) 移動 / 壁角は移動不可・向きのみ変わる）、FOV（未探索は暗転・探索済み減光・敵/アイテムは可視のみ）。
- 脱出: ダンジョンで B→脱出→はい → `/village`。runGold が meta.gold に加算、謎の金庫は出口で精算され inventory から消える。
- 死亡: `applyDeathPenalty()` + `setGameResult('dead')` で end-state を作れる（戦闘死を headless で staging するのは壁で詰まり困難）。`/gameover` に GAME OVER・到達階層・撃破数・失ったゴールドが出る。
