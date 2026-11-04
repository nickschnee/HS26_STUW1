// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Everything in "public" is sent to the browser.
  // Nuxt fills the values from NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabasePublishableKey: '',
    },
  },
})
