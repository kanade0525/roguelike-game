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
