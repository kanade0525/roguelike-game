// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      title: 'Katabasis',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
        },
        { name: 'description', content: 'Katabasis — 不思議のダンジョン風ターン制ローグライク' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'stylesheet', href: 'https://unpkg.com/nes.css@2.3.0/css/nes.min.css' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap',
        },
      ],
    },
  },

  // クライアントサイドのみでPhaserを使用
  ssr: false,

  // Amplify のビルド環境では Nitro のプリセットが aws-amplify に切り替わり、
  // ローカル(static)で効くリンククローラーが動かず / しか生成されない。
  // その結果 /game や /village を直接開く・リロードすると 404 になるため、
  // 生成するルートを明示する。ページを追加したらここにも足すこと。
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/game', '/village', '/gameover', '/settings'],
    },
  },

  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      include: ['phaser', 'rot-js'],
    },
  },
})
