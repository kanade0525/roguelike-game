// Katabasis（冥界下り）の物語テキスト。
// Phaser 非依存の純粋データ。会話表示は phaser/ui/DialogOverlay（DialogLine と同形）で行う。
// 世界観の確定版は docs/story.md を参照。

export interface StoryLine {
  speaker?: string // 話者名（無指定はナレーション）
  text: string
}

// 3層のダンジョンID（下降順）。物語進捗の判定に使う。
export const STORY_DUNGEON_ORDER = ['silentForest', 'darkCastle', 'abyss'] as const

// オープニング（「はじめから」→ 拠点に初めて入ったとき・1回のみ）。
// 主人公は故郷を"淀み"に奪われ、決着をつけるため深淵へ下る探索者。
export const OPENING: StoryLine[] = [
  { text: '地の底には「深淵」が口を開けている。' },
  { text: 'かつてそこから這い出た"淀み"が、幾多の村と人を呑んだ。' },
  { text: 'あなたの故郷も、その一つだった。' },
  { text: '——奪われたものへ決着をつけるため、あなたは拠点の村の門をくぐる。' },
  { speaker: '村長', text: '…よく来た、探索者よ。その眼、深淵に何かを奪われた者の眼だ。' },
  {
    speaker: '村長',
    text: 'ここは深淵の唯一の入口を見張る村。深淵は塞げぬ——塞げば淀みは別の地から溢れる。',
  },
  { speaker: '村長', text: 'だから我らは下って鎮める。まずは静寂の森だ。音を失った、かつての緑の森。' },
  { speaker: '村長', text: '淀みの源はさらに深く。…だが焦るな。一歩ずつ、下るのだ。' },
]

// エンディング（深淵＝最終ダンジョン踏破時）。
export const ENDING: StoryLine[] = [
  { text: '深淵の主は、断たれた。' },
  { text: '淀みは鎮まり、地上に束の間の静けさが戻る。' },
  { text: '奪われたものは、還らない。' },
  { text: 'それでも——あなたは確かに、深淵を制したのだ。' },
  { speaker: '村長', text: '…よくぞ戻った。お前の故郷も、少しは安らかになろう。' },
  { text: 'だが深淵は、今日も静かに口を開けている。' },
]

// 村長の会話。踏破済みダンジョン(meta.clearedDungeons)に応じて台詞を変える。
export function chiefLines(cleared: string[]): StoryLine[] {
  const has = (id: string) => cleared.includes(id)

  if (has('abyss')) {
    return [
      { speaker: '村長', text: 'お前は深淵の主を断った者だ。…だが淀みは尽きぬ。' },
      { speaker: '村長', text: 'また潜るというなら止めはせぬ。村はいつでもお前を待っている。' },
    ]
  }
  if (has('darkCastle')) {
    return [
      { speaker: '村長', text: '暗黒城も抜けたか。いよいよ深淵の核心——最深部だ。' },
      {
        speaker: '村長',
        text: 'そこに淀みの源、"深淵の主"がいる。生きて戻る保証はない。それでも行くのだろう？',
      },
    ]
  }
  if (has('silentForest')) {
    return [
      { speaker: '村長', text: '静寂の森を抜けたな。よくやった。' },
      {
        speaker: '村長',
        text: '次は暗黒城。かつて深淵を封じ損ねた者たちが眠る廃墟だ。淀みは一層濃い。備えを。',
      },
    ]
  }
  return [
    { speaker: '村長', text: 'まずは静寂の森を踏破せよ。深淵はそこから始まる。' },
    { speaker: '村長', text: '装備を整え、ゴールドを蓄えよ。焦りは死を招く。' },
  ]
}
