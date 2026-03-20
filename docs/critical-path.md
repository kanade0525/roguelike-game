# クリティカルパス・依存関係図

## WBS

| タスクID | 機能       | タスク                                   | 依存関係           | 見積(h) | 係数 | 調整後(h) |
| -------- | ---------- | ---------------------------------------- | ------------------ | ------- | ---- | --------- |
| A-1      | 基盤       | 敵パラメータ拡充                         | -                  | 4       | 1.3  | 5.2       |
| A-2      | 基盤       | 戦闘システム統合                         | A-1                | 8       | 1.3  | 10.4      |
| A-3      | 基盤       | 敵AI強化                                 | A-1, A-2           | 8       | 1.3  | 10.4      |
| B-1      | ゲーム体験 | アイテムシステム                         | A-2                | 12      | 1.2  | 14.4      |
| B-2      | ゲーム体験 | 満腹度システム                           | B-1                | 6       | 1.2  | 7.2       |
| B-3      | ゲーム体験 | 経験値・レベルアップ                     | A-2                | 8       | 1.2  | 9.6       |
| B-4      | ゲーム体験 | 死亡・ゲームオーバー処理                 | A-2, B-3           | 6       | 1.2  | 7.2       |
| C-1      | マップ     | マップ自動生成                           | -                  | 12      | 1.3  | 15.6      |
| C-2      | マップ     | FOV                                      | C-1, A-3           | 8       | 1.2  | 9.6       |
| D-1      | 描画       | スプライト描画                           | -                  | 12      | 1    | 12        |
| D-2      | 描画       | アニメーション                           | D-1                | 10      | 1    | 10        |
| D-3      | 描画       | ダメージ演出                             | D-2, A-2           | 6       | 1    | 6         |
| E-1      | UI/UX      | ゲームオーバー画面                       | B-4                | 6       | 1    | 6         |
| E-2      | UI/UX      | HPバー・ミニマップ                       | A-2                | 4       | 1    | 4         |
| E-3      | UI/UX      | 8方向移動                                | -                  | 4       | 1    | 4         |
| F-1      | 仕上げ     | BGM・効果音                              | -                  | 8       | 1    | 8         |
| F-2      | 仕上げ     | gameConfig活用                           | -                  | 4       | 1    | 4         |
| F-3      | 仕上げ     | セーブ/ロード                            | B-1                | 10      | 1.3  | 13        |
| F-4      | 仕上げ     | PWA対応                                  | F-3                | 6       | 1.2  | 7.2       |
| F-5      | 仕上げ     | テスト拡充                               | A-3, B-1           | 12      | 1    | 12        |
| F-6      | 仕上げ     | デプロイ                                 | F-5                | 4       | 1    | 4         |
| G-1      | ストーリー | メインストーリー・世界観設計             | -                  | 16      | 1.5  | 24        |
| G-2      | ストーリー | クエストシステム設計                     | G-1                | 12      | 1.3  | 15.6      |
| G-3      | ストーリー | NPC会話・ダイアログシステム              | G-1                | 16      | 1.3  | 20.8      |
| H-1      | 村         | 村マップ・画面設計                       | G-1, D-1           | 16      | 1.3  | 20.8      |
| H-2      | 村         | 村長（クエスト依頼NPC）                  | H-1, G-2, G-3      | 12      | 1.3  | 15.6      |
| H-3      | 村         | 道具屋（売買システム）                   | H-1, B-1           | 12      | 1.2  | 14.4      |
| H-4      | 村         | 倉庫（アイテム預かり）                   | H-1, B-1           | 8       | 1.2  | 9.6       |
| H-5      | 村         | 村⇔ダンジョン遷移                        | H-1                | 8       | 1.2  | 9.6       |
| I-1      | 拠点・経済 | ゴールド・装備データモデル拡張           | B-1                | 6       | 1.2  | 7.2       |
| I-2      | 拠点・経済 | ゴールドシステム（ドロップ・拾得・表示） | I-1, A-2           | 8       | 1.2  | 9.6       |
| I-3      | 拠点・経済 | 装備システム（装備・強化・成長）         | I-1, A-2           | 10      | 1.3  | 13        |
| I-4      | 拠点・経済 | 特殊アイテム（謎の金庫・リレミトの巻物） | I-1, C-1           | 8       | 1.2  | 9.6       |
| I-5      | 拠点・経済 | 死亡ペナルティ・ダンジョン脱出           | I-2, I-4, B-4, H-5 | 10      | 1.3  | 13        |
| I-6      | 拠点・経済 | お店成長・倉庫・ランキング               | I-5, H-3, H-4, F-3 | 16      | 1.3  | 20.8      |
| I-7      | 拠点・経済 | 探索サイクル統合・バランス調整           | I-6                | 12      | 1.3  | 15.6      |

## 依存関係図（クリティカルパス強調）

```mermaid
graph LR

    subgraph A["A: 基盤（敵・戦闘）"]
        direction TB
        A1["A-1 敵パラメータ拡充<br>5.2h"]
        A2["A-2 戦闘システム統合<br>10.4h"]
        A3["A-3 敵AI強化<br>10.4h"]
    end

    subgraph B["B: ゲーム体験"]
        direction TB
        B1["B-1 アイテムシステム<br>14.4h"]
        B2["B-2 満腹度システム<br>7.2h"]
        B3["B-3 経験値・レベルアップ<br>9.6h"]
        B4["B-4 死亡・ゲームオーバー処理<br>7.2h"]
    end

    subgraph C["C: マップ"]
        direction TB
        C1["C-1 マップ自動生成<br>15.6h"]
        C2["C-2 FOV<br>9.6h"]
    end

    subgraph D["D: 描画"]
        direction TB
        D1["D-1 スプライト描画<br>12h"]
        D2["D-2 アニメーション<br>10h"]
        D3["D-3 ダメージ演出<br>6h"]
    end

    subgraph E["E: UI/UX"]
        direction TB
        E1["E-1 ゲームオーバー画面<br>6h"]
        E2["E-2 HPバー・ミニマップ<br>4h"]
        E3["E-3 8方向移動<br>4h"]
    end

    subgraph F["F: 仕上げ"]
        direction TB
        F1["F-1 BGM・効果音<br>8h"]
        F2["F-2 gameConfig活用<br>4h"]
        F3["F-3 セーブ/ロード<br>13h"]
        F4["F-4 PWA対応<br>7.2h"]
        F5["F-5 テスト拡充<br>12h"]
        F6["F-6 デプロイ<br>4h"]
    end

    subgraph G["G: ストーリー"]
        direction TB
        G1["G-1 メインストーリー・世界観設計<br>24h"]
        G2["G-2 クエストシステム設計<br>15.6h"]
        G3["G-3 NPC会話・ダイアログシステム<br>20.8h"]
    end

    subgraph H["H: 村"]
        direction TB
        H1["H-1 村マップ・画面設計<br>20.8h"]
        H2["H-2 村長（クエスト依頼NPC）<br>15.6h"]
        H3["H-3 道具屋（売買システム）<br>14.4h"]
        H4["H-4 倉庫（アイテム預かり）<br>9.6h"]
        H5["H-5 村⇔ダンジョン遷移<br>9.6h"]
    end

    subgraph I["I: 拠点・経済"]
        direction TB
        I1["I-1 ゴールド・装備データモデル拡張<br>7.2h"]
        I2["I-2 ゴールドシステム（ドロップ・拾得・表示）<br>9.6h"]
        I3["I-3 装備システム（装備・強化・成長）<br>13h"]
        I4["I-4 特殊アイテム（謎の金庫・リレミトの巻物）<br>9.6h"]
        I5["I-5 死亡ペナルティ・ダンジョン脱出<br>13h"]
        I6["I-6 お店成長・倉庫・ランキング<br>20.8h"]
        I7["I-7 探索サイクル統合・バランス調整<br>15.6h"]
    end

    A1 -.-> A2
    A1 -.-> A3
    A2 -.-> A3
    A2 -.-> B1
    B1 -.-> B2
    A2 -.-> B3
    A2 -.-> B4
    B3 -.-> B4
    C1 -.-> C2
    A3 -.-> C2
    D1 -.-> D2
    D2 -.-> D3
    A2 -.-> D3
    B4 -.-> E1
    A2 -.-> E2
    B1 -.-> F3
    F3 -.-> F4
    A3 -.-> F5
    B1 -.-> F5
    F5 -.-> F6
    G1 -.-> G2
    G1 -.-> G3
    G1 ==> H1
    D1 -.-> H1
    H1 -.-> H2
    G2 -.-> H2
    G3 -.-> H2
    H1 -.-> H3
    B1 -.-> H3
    H1 -.-> H4
    B1 -.-> H4
    H1 ==> H5
    B1 -.-> I1
    I1 -.-> I2
    A2 -.-> I2
    I1 -.-> I3
    A2 -.-> I3
    I1 -.-> I4
    C1 -.-> I4
    I2 -.-> I5
    I4 -.-> I5
    B4 -.-> I5
    H5 ==> I5
    I5 ==> I6
    H3 -.-> I6
    H4 -.-> I6
    F3 -.-> I6
    I6 ==> I7

    style A1 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style A2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style A3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style B1 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style B2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style B3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style B4 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style C1 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style C2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style D1 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style D2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style D3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style E1 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style E2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style E3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style F1 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style F2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style F3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style F4 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style F5 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style F6 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style G1 fill:#ff6b6b,stroke:#c0392b,color:#fff
    style G2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style G3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style H1 fill:#ff6b6b,stroke:#c0392b,color:#fff
    style H2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style H3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style H4 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style H5 fill:#ff6b6b,stroke:#c0392b,color:#fff
    style I1 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style I2 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style I3 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style I4 fill:#bdc3c7,stroke:#7f8c8d,color:#2c3e50
    style I5 fill:#ff6b6b,stroke:#c0392b,color:#fff
    style I6 fill:#ff6b6b,stroke:#c0392b,color:#fff
    style I7 fill:#ff6b6b,stroke:#c0392b,color:#fff
```

## クリティカルパス（最長経路: 103.8h）

```text
G-1 メインストーリー・世界観設計 (24h)
 → H-1 村マップ・画面設計 (20.8h)
  → H-5 村⇔ダンジョン遷移 (9.6h)
   → I-5 死亡ペナルティ・ダンジョン脱出 (13h)
    → I-6 お店成長・倉庫・ランキング (20.8h)
     → I-7 探索サイクル統合・バランス調整 (15.6h)
```

## 凡例

| 色        | 意味                                           |
| --------- | ---------------------------------------------- |
| 赤        | クリティカルパス（遅延でプロジェクト全体遅延） |
| グレー    | 並行可能タスク                                 |
| ==> 太線  | クリティカルパス上の依存                       |
| -.-> 破線 | その他の依存                                   |
