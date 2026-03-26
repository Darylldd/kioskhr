// migrate-uploads.mjs
import admin from 'firebase-admin'
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)
const serviceAccount = require('./hrkiosk.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db      = admin.firestore()
const bucket  = admin.storage().bucket('kiosk-6c99a.firebasestorage.app')

async function migrateUploads() {
  const employees = await db.collection('employees').get()

  for (const doc of employees.docs) {
    const data = doc.data()
    if (!data.profile_pic) continue

    // e.g. /uploads/profile/1_1773810488692.png
    const localPath = path.join('public', data.profile_pic)
    if (!fs.existsSync(localPath)) {
      console.log(`Skipping ${data.profile_pic} — file not found`)
      continue
    }

    const destination = `profile_pics/${path.basename(data.profile_pic)}`
    await bucket.upload(localPath, {
      destination,
      metadata: { contentType: 'image/jpeg' },
    })

    // Make it publicly readable
    const file = bucket.file(destination)
    await file.makePublic()
    const publicUrl = `https://storage.googleapis.com/kiosk-6c99a.firebasestorage.app/${destination}`

    // Update Firestore with the new URL
    await doc.ref.update({ profile_pic: publicUrl })
    console.log(`Migrated: ${data.profile_pic} → ${publicUrl}`)
  }

  console.log('Done!')
}

migrateUploads().catch(console.error)