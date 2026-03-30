import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

function initAdmin() {
  if (!getApps().length) {
    const c = useRuntimeConfig()
    initializeApp({ credential: cert({ projectId: c.firebaseAdminProjectId as string, clientEmail: c.firebaseAdminClientEmail as string, privateKey: (c.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n') }) })
  }
  return getFirestore()
}

export default defineEventHandler(async (event) => {
  const cookie = parseCookies(event)
  if (!cookie['employee_id']) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const ref  = decodeURIComponent(getRouterParam(event, 'ref') ?? '')
  if (!ref) throw createError({ statusCode: 400, message: 'Invalid reference.' })

  const db   = initAdmin()
  const snap = await db.collection('admin_payslips').where('admin_payslip_ref', '==', ref).limit(1).get()
  if (snap.empty) throw createError({ statusCode: 404, message: 'Payslip not found.' })

  const data = snap.docs[0]!.data()
  return { ...data, id: snap.docs[0]!.id, admin_payslip_ref: ref }
})