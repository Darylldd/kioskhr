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

// ← ADD THIS
function serializeDoc(data: Record<string, any>) {
  const result: Record<string, any> = {}
  for (const [key, val] of Object.entries(data)) {
    if (val?._seconds !== undefined || val?.seconds !== undefined) {
      const secs = val._seconds ?? val.seconds
      result[key] = new Date(secs * 1000).toISOString()
    } else {
      result[key] = val
    }
  }
  return result
}

export default defineEventHandler(async (event) => {
  const cookie = parseCookies(event)
  if (!cookie['employee_id']) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const db   = initAdmin()
  const snap = await db.collection('employees').orderBy('first_name').get()

  const employees = snap.docs.map(d => {
    const { pin, ...safe } = d.data() as any
    return serializeDoc({ ...safe, id: d.id })  
  })

  return { employees }
})