
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

  const db   = initAdmin()
  const snap = await db.collection('admin_payslips').orderBy('year', 'desc').orderBy('month', 'desc').get()

  const payslips = snap.docs.map(d => {
    const r = d.data()
    return { id: d.id, admin_payslip_ref: r.admin_payslip_ref, employee_name: r.employee_name || '', month: r.month, year: r.year, net_pay: r.net_pay }
  })

  return { payslips }
})