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
  const cookie    = parseCookies(event)
  const actorId   = cookie['employee_id']
  const actorName = cookie['employee_name'] ?? ''
  if (!actorId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const body = await readBody(event)
  const ref  = (body?.ref || '').trim()
  if (!ref) throw createError({ statusCode: 400, message: 'Invalid payslip reference.' })

  const db   = initAdmin()
  const snap = await db.collection('admin_payslips').where('admin_payslip_ref', '==', ref).limit(1).get()
  if (snap.empty) throw createError({ statusCode: 404, message: 'Payslip not found.' })

  const data = snap.docs[0]!.data()

  await db.collection('audit_logs').add({
    employee_id: actorId, employee_name: actorName,
    action: 'PRINT_ADMIN_PAYSLIP', details: ref,
    ip_address: getRequestIP(event) ?? 'unknown', created_at: new Date(),
  })

  return { ...data, id: snap.docs[0]!.id, admin_payslip_ref: ref }
})