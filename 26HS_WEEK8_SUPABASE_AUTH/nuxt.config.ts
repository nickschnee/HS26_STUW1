// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // The login lives in the browser: supabase-js saves the session in localStorage.
  // The server can't read localStorage, so we turn off server-side rendering
  // and let the whole app run in the browser.
  ssr: false,

  // Everything in "public" is sent to the browser.
  // Nuxt fills the values from NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabasePublishableKey: '',
    },
  },
})
