// UI テキスト色（CSS形式 - Phaser Text用）
export const TEXT_COLOR = {
  white: '#ffffff',
  light: '#dddddd',
  muted: '#cccccc',
  subtle: '#aaaaaa',
  dim: '#888888',
} as const

// タイル描画色（数値形式 - Phaser Graphics用）
export const TILE_COLOR = {
  floor: 0x333333,
  wall: 0x888888,
  stairs: 0xccaa00,
  player: 0x4444ff,
  enemy: 0xff4444,
  item: 0x44cc44,
} as const

// ステータスゲージ色（数値形式 - Phaser Graphics/Rectangle用）
// 残量に応じて normal → warn → danger と切り替える共通ルール。
export const GAUGE_COLOR = {
  trackBg: 0x0f0f1c,
  trackBorder: 0x3a3a5e,
  hp: 0x4ade80,
  hpWarn: 0xfacc15,
  hpDanger: 0xf87171,
  satiation: 0xf59e0b,
  satiationDanger: 0xf87171,
  stamina: 0x38bdf8,
  staminaDanger: 0xf87171,
  guardBadge: 0x60a5fa,
} as const

// UI背景色（数値形式）
export const UI_COLOR = {
  panelBg: 0x1a1a2e,
  panelBorder: 0x3a3a5e,
  controllerBg: 0x2a2a3e,
  buttonBg: 0x4a4a5a,
  buttonBorder: 0x5a5a6a,
  buttonHighlight: 0x4a4a6a,
  buttonHighlightBorder: 0x6a6a8a,
  abButton: 0x5a5a7a,
  abButtonBorder: 0x7a7a9a,
  selectButton: 0x3a3a4a,
} as const
