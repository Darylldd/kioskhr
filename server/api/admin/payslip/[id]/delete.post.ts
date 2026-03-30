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

  const id = getRouterParam(event, 'id') ?? ''
  if (!id) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  const db = initAdmin()
  await db.collection('admin_payslips').doc(id).delete()

  await db.collection('audit_logs').add({
    employee_id: actorId, employee_name: actorName,
    action: 'DELETE_ADMIN_PAYSLIP', details: `Doc id: ${id}`,
    ip_address: getRequestIP(event) ?? 'unknown', created_at: new Date(),
  })

  return { success: true }
})