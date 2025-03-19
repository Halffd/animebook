// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-03-05',
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  devtools: {
    enabled: false
  },

  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        experimentalDecorators: true
      }
    }
  },

  vite: {
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-')
        }
      }
    },
    optimizeDeps: {
      exclude: ['fsevents']
    },
    build: {
      target: 'esnext',
      minify: 'esbuild'
    }
  },

  imports: {
    autoImport: true,
    dirs: ['composables/**']
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      }
    }
  }
})
