import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

function initAdmin() {
  if (!getApps().length) {
    const config = useRuntimeConfig()
    initializeApp({ credential: cert({ projectId: config.firebaseAdminProjectId as string, clientEmail: config.firebaseAdminClientEmail as string, privateKey: (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n') }) })
  }
  return getFirestore()
}

export default defineEventHandler(async (event) => {
  const cookie = parseCookies(event)
  if (!cookie['employee_id']) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const db   = initAdmin()
  const snap = await db.collection('payslips').orderBy('created_at', 'desc').get()

  const payslips = snap.docs.map(d => {
    const r = d.data()
    return { id: d.id, payslip_ref: r.payslip_ref, employee_name: r.employee_name || '', month: r.month, cutoff: r.cutoff }
  })

  return { payslips }
})