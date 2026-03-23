export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],



 runtimeConfig: {
  firebaseAdminProjectId:   process.env.NUXT_FIREBASE_ADMIN_PROJECT_ID,
  firebaseAdminClientEmail: process.env.NUXT_FIREBASE_ADMIN_CLIENT_EMAIL,
  firebaseAdminPrivateKey:  process.env.NUXT_FIREBASE_ADMIN_PRIVATE_KEY,
    cloudinaryCloudName:  process.env.NUXT_CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey:     process.env.NUXT_CLOUDINARY_API_KEY,
  cloudinaryApiSecret:  process.env.NUXT_CLOUDINARY_API_SECRET,
  public: {
    firebaseApiKey:            process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain:        process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId:         process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket:     process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId:             process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
    firebaseMeasurementId:     process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }
},

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: false,
  },

  compatibilityDate: '2024-11-01',
})