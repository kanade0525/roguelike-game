# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

「Katabasis」— Nuxt 3 + Phaser 3 を使用した不思議のダンジョン風ターン制ローグライク。

## 開発コマンド

```bash
# Docker開発環境（推奨）
docker-compose up

# ローカル開発
npm install
npm run dev       # 開発サーバー起動（ポート3000、Docker経由は4000）
npm run build     # 本番ビルド
npm run generate  # 静的サイト生成
npm run lint      # ESLint + Markdownlint 実行
npm run lint:fix  # 自動修正付きリント
npm run format    # Prettierでフォーマット
npm run test      # ユニットテスト実行（Vitest）
npm run test:watch # テスト監視モード
npm run test:e2e  # E2Eテスト実行（Playwright）
```

## 開発フロー

1. コードを書く
2. `npm run lint:fix` でリントエラーを自動修正
3. `npm run format` でフォーマット
4. コミット前に `npm run lint` でエラーがないことを確認

リンターは ESLint（TypeScript/Vue）と Markdownlint（Markdown）の両方を実行する。
コミット前には必ずリントを通すこと。

## アーキテクチャ

### ディレクトリ構成と責務

| ディレクトリ   | 責務                       | Phaser依存 |
| -------------- | -------------------------- | ---------- |
| `game/`        | 純粋なゲームロジック・計算 | ❌ なし    |
| `stores/`      | Pinia状態管理              | ❌ なし    |
| `composables/` | ロジック橋渡し             | ❌ なし    |
| `phaser/`      | 描画のみ                   | ✅ あり    |
| `components/`  | Vue UI                     | ❌ なし    |
| `pages/`       | 画面ルーティング           | ❌ なし    |

### 設計原則（必ず守ること）

1. **game/ は純粋な TypeScript** - Phaser を一切使わない、テスト可能
2. **Pinia 一元管理** - 状態変更は必ず `stores/gameStore.ts` 経由
3. **Phaser は描画専用** - store を監視して描画するだけ
4. **1ファイル1責務** - 機能を分散させない

### クラス構成

- **game/entities/Player.ts**: プレイヤーデータ・ロジック
- **game/entities/Enemy.ts**: 敵基底クラス（サブクラス: Skeleton.ts, Goblin.ts）
- **game/entities/createEnemy.ts**: 敵ファクトリ関数（type文字列→サブクラスインスタンス）
- **game/systems/TurnManager.ts**: ターン制管理（player → enemy → end）
- **game/systems/CombatSystem.ts**: ダメージ計算
- **game/systems/DungeonGenerator.ts**: rot.jsによるマップ自動生成
- **game/systems/SpawnValidator.ts**: 敵スポーン位置のバリデーション
- **phaser/scenes/DungeonScene.ts**: ダンジョン描画
- **phaser/scenes/UIScene.ts**: HP等のHUD描画
- **stores/gameStore.ts**: 全ゲーム状態の一元管理

### ダンジョン定義（`game/dungeon/`）

ダンジョンはフロア単位のファイル構成で管理する：

```text
game/dungeon/
├── types.ts                    # 型定義（FloorConfig, DungeonDefinition等）
├── index.ts                    # 全ダンジョンexport、getDungeon()
├── presets/                    # ボスマップ等の共通プリセット
│   ├── arenaSmall.ts           # 再利用可能な固定マップ
│   └── ...
├── SilentForest/               # ダンジョン: 静寂の森（5F）
│   ├── index.ts                # ダンジョン定義（id, name, floors）
│   ├── F1.ts                   # 各フロアの設定
│   └── ...
├── DarkCastle/                 # ダンジョン: 暗黒城（8F）
└── Abyss/                      # ダンジョン: 深淵（10F）
```

**新しいダンジョンを追加する手順:**

1. `game/dungeon/NewDungeon/` フォルダを作成
2. 各フロアの `F1.ts` 〜 `FN.ts` を作成（マップサイズ、敵数・種類、アイテム等）
3. ボスフロアは `presets/` の既存プリセットを参照するか新規作成
4. `index.ts` でダンジョン定義をまとめる
5. `game/dungeon/index.ts` に import を追加

**フロアファイルの構造:**

```typescript
// ランダム生成フロア
const floor: FloorConfig = {
  mapSize: { w: 30, h: 30 },
  enemies: { count: 3, types: [{ type: 'skeleton', weight: 1 }] },
  items: { count: 1, types: [{ itemId: 'sword', weight: 1 }] },
}

// ボスフロア（固定マップ）
const floor: FloorConfig = {
  mapSize: { w: 13, h: 13 },
  enemies: { count: 1, types: [{ type: 'skeleton', weight: 1 }] },
  items: { count: 0, types: [] },
  isBossFloor: true,
  fixedMap: arenaSmall, // プリセット参照
}
```

### 設定ファイル

ゲームパラメータは `game/data/gameConfig.json` に集約：

- 画面サイズ、タイルサイズ
- プレイヤーステータス（HP、攻撃力、防御力）
- 敵種類ごとのパラメータ

## ゲームシステム

### 描画方式

- **クォータービュー**（斜め見下ろし視点）
- タイルは正方形グリッドだがY方向が圧縮（幅:高さ = 2:1）
- 壁は立体的に高さを持って描画
- 参考: 不思議のダンジョンシリーズ

### ターン制

1. プレイヤーが行動（移動、攻撃、アイテム使用）
2. 敵が行動
3. ターン終了

### 操作

- 4方向移動（WASD または 矢印キー）
- 攻撃: Enterキー（向いている方向に攻撃、空振りも1ターン消費）
- スマホ: 仮想コントローラー（方向パッド + A/Bボタン）

### UI構成

- **上部**: ステータスバー（階層、Lv、HP、満腹度）
- **中央**: クォータービューダンジョン
- **下部**: メッセージログ（4行）

## 実装時のルール

### スコープを限定した指示例

```text
「game/systems/CombatSystem.tsにダメージ計算ロジックを実装して。
Phaserは使わず、純粋なTypeScriptで。
入力: attacker, defender
出力: ダメージ値」
```

```text
「stores/gameStore.tsにプレイヤー移動のactionを追加して。
移動可能かどうかのチェックはgame/systems/を呼び出す形で」
```

### やってはいけないこと

- `game/` ディレクトリで Phaser をインポートする
- `phaser/` ディレクトリでゲームロジックを書く
- Pinia を経由せずに状態を変更する
- 複数の責務を1ファイルに詰め込む
- Phaser 内のテキストで `fontFamily: 'monospace'` を単体使用する（必ず `'"DotGothic16", monospace'` を使う）
- 嘘をつく、または知らないことを知っているかのように説明する
- 不確実なことを断定する（「〜かもしれません」「確認が必要です」と明示すること）
- 「正直に言うと」など人間の感情を模倣する表現を使う
- ユーザーに迎合してイエスマンになる（間違いは指摘し、できないことはできないと言う）

## 仕様書

詳細な仕様は `docs/roguelike-spec.md` を参照。

## 現在の実装状況

### 完了

- Nuxt 3 + Phaser 3 + Pinia 環境構築
- Docker開発環境
- タイトル画面
- スプライト描画（床8種・壁オートタイル・キャラクターアニメーション）
- プレイヤー移動（4方向）+ 向き管理
- ステータスバー（階層、Lv、HP、満腹度）
- メッセージログ
- rot.jsによるダンジョン自動生成（部屋+通路）
- 複数ダンジョンタイプ（静寂の森5F・暗黒城8F・深淵10F）
- ボスフロア固定マップ（共通プリセット）
- 敵スポーンバリデーション（プレイヤー周辺除外・重複防止）
- 敵パラメータ（HP・攻撃力・防御力・経験値）+ サブクラス構成（Skeleton, Goblin）
- 戦闘システム統合（プレイヤー攻撃・敵攻撃・撃破→経験値）
- 戦闘演出（ダメージ数字ポップアップ・被ダメフラッシュ・MISSテキスト）
- SE基盤（attack, enemy_attack, dodge, critical, swing, item_get, stairs）
- 階層移動（確認ダイアログ + フェードアウト→フロア名表示→フェードイン）
- sessionStorageによる状態保持（リロード対応）

### 未実装

- 敵AI強化（追跡・タイプ別行動）
- 経験値・レベルアップ演出強化
- アイテムシステム
- FOV（視界）
- セーブ/ロード
