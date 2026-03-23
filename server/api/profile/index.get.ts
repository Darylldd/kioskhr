// server/api/profile/index.get.ts
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

function initAdmin() {
  if (!getApps().length) {
    const config = useRuntimeConfig()
    initializeApp({ credential: cert({
      projectId:   config.firebaseAdminProjectId   as string,
      clientEmail: config.firebaseAdminClientEmail as string,
      privateKey:  (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n'),
    })})
  }
  return getFirestore()
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const db  = initAdmin()
  const doc = await db.collection('employees').doc(employeeId).get()

  if (!doc.exists) throw createError({ statusCode: 404, message: 'Profile not found.' })

  const { pin, ...safe } = doc.data() as any
  return { ...safe, id: doc.id }
})