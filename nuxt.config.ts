// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
  ],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      title: 'ローグライクゲーム',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: '不思議のダンジョン風ローグライクゲーム' },
      ],
    },
  },

  // クライアントサイドのみでPhaserを使用
  ssr: false,

  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      include: ['phaser', 'rot-js'],
    },
  },
})
