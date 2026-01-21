# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Nuxt 3 + Phaser 3 を使用した「不思議のダンジョン」風ターン制ローグライクゲーム。

## 開発コマンド

```bash
# Docker開発環境（推奨）
docker-compose up

# ローカル開発
npm install
npm run dev       # 開発サーバー起動（ポート3000、Docker経由は4000）
npm run build     # 本番ビルド
npm run generate  # 静的サイト生成
npm run lint      # ESLint実行
npm run format    # Prettierでフォーマット
```

## アーキテクチャ

### ディレクトリ構成と責務

| ディレクトリ | 責務 | Phaser依存 |
|-------------|------|-----------|
| `game/` | 純粋なゲームロジック・計算 | ❌ なし |
| `stores/` | Pinia状態管理 | ❌ なし |
| `composables/` | ロジック橋渡し | ❌ なし |
| `phaser/` | 描画のみ | ✅ あり |
| `components/` | Vue UI | ❌ なし |
| `pages/` | 画面ルーティング | ❌ なし |

### 設計原則（必ず守ること）

1. **game/ は純粋な TypeScript** - Phaser を一切使わない、テスト可能
2. **Pinia 一元管理** - 状態変更は必ず `stores/gameStore.ts` 経由
3. **Phaser は描画専用** - store を監視して描画するだけ
4. **1ファイル1責務** - 機能を分散させない

### クラス構成

- **game/entities/Player.ts**: プレイヤーデータ・ロジック
- **game/entities/Enemy.ts**: 敵データ・ロジック（スライム、ゴブリン）
- **game/systems/TurnManager.ts**: ターン制管理（player → enemy → end）
- **game/systems/CombatSystem.ts**: ダメージ計算
- **phaser/scenes/DungeonScene.ts**: ダンジョン描画
- **phaser/scenes/UIScene.ts**: HP等のHUD描画
- **stores/gameStore.ts**: 全ゲーム状態の一元管理

### 設定ファイル

ゲームパラメータは `game/data/gameConfig.json` に集約：
- 画面サイズ、タイルサイズ
- プレイヤーステータス（HP、攻撃力、防御力）
- 敵種類ごとのパラメータ
- ダンジョン設定（階層数、敵出現数）

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
- スマホ: 仮想方向パッド（未実装）

### UI構成

- **上部**: ステータスバー（階層、Lv、HP、満腹度）
- **中央**: クォータービューダンジョン
- **下部**: メッセージログ（4行）

## 実装時のルール

### スコープを限定した指示例

```
「game/systems/CombatSystem.tsにダメージ計算ロジックを実装して。
Phaserは使わず、純粋なTypeScriptで。
入力: attacker, defender
出力: ダメージ値」
```

```
「stores/gameStore.tsにプレイヤー移動のactionを追加して。
移動可能かどうかのチェックはgame/systems/を呼び出す形で」
```

### やってはいけないこと

- `game/` ディレクトリで Phaser をインポートする
- `phaser/` ディレクトリでゲームロジックを書く
- Pinia を経由せずに状態を変更する
- 複数の責務を1ファイルに詰め込む

## 仕様書

詳細な仕様は `docs/roguelike-spec.md` を参照。

## 現在の実装状況

### 完了

- Nuxt 3 + Phaser 3 + Pinia 環境構築
- Docker開発環境
- タイトル画面
- クォータービューダンジョン描画
- プレイヤー移動（4方向）
- ステータスバー（階層、Lv、HP、満腹度）
- メッセージログ

### 未実装

- 敵の配置と戦闘
- ターン制システム
- アイテムシステム
- 階層移動
- FOV（視界）
- セーブ/ロード
