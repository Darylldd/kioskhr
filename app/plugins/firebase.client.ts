import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey:            config.public.firebaseApiKey,
    authDomain:        config.public.firebaseAuthDomain,
    projectId:         config.public.firebaseProjectId,
    storageBucket:     config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId:             config.public.firebaseAppId,
    measurementId:     config.public.firebaseMeasurementId,  
  }

  const app     = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  const db      = getFirestore(app)
  const auth    = getAuth(app)
  const storage = getStorage(app)

  return {
    provide: { db, auth, storage }
  }
})