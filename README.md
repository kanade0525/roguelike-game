# ローグライクゲーム

不思議のダンジョン風のターン制ローグライクゲーム（プロトタイプ版）

## 技術スタック

- **フレームワーク**: Nuxt 3
- **ゲーム描画**: Phaser 3
- **状態管理**: Pinia
- **ダンジョン生成**: rot.js
- **言語**: TypeScript

## 開発環境

### Docker（推奨）

```bash
docker-compose up
```

<http://localhost:4000> でアクセス

### ローカル

```bash
npm install
npm run dev
```

## ディレクトリ構成

```text
├── game/           # 純粋なゲームロジック（Phaser非依存）
│   ├── entities/   # Player, Enemy
│   ├── systems/    # TurnManager, CombatSystem
│   └── data/       # gameConfig.json
├── phaser/         # Phaser描画層のみ
│   └── scenes/     # DungeonScene, UIScene
├── stores/         # Pinia状態管理
├── pages/          # Nuxtページ
├── components/     # Vueコンポーネント
└── docs/           # 仕様書
```

## 設計方針

- **ロジックと描画の分離**: `game/` は Phaser に依存しない純粋な TypeScript
- **Pinia一元管理**: ゲーム状態は全て Pinia ストア経由
- **Phaserは描画専用**: ストアを監視して描画するだけ

## コマンド

| コマンド           | 説明                   |
| ------------------ | ---------------------- |
| `npm run dev`      | 開発サーバー起動       |
| `npm run build`    | 本番ビルド             |
| `npm run generate` | 静的サイト生成         |
| `npm run lint`     | ESLint実行             |
| `npm run format`   | Prettierでフォーマット |

## デプロイ

AWS Amplify を使用。詳細は [docs/roguelike-spec.md](docs/roguelike-spec.md) を参照。

## ライセンス

Private
