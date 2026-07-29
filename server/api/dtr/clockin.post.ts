import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'


function initAdmin() {
  if (!getApps().length) {
    const config = useRuntimeConfig()
    initializeApp({
      credential: cert({
        projectId:   config.firebaseAdminProjectId   as string,
        clientEmail: config.firebaseAdminClientEmail as string,
        privateKey:  (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return getFirestore()
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  const empName    = cookie['employee_name']

  if (!employeeId) {
    throw createError({ statusCode: 401, message: 'Unauthorized.' })
  }
const OFFICE_IPS = ['122.53.222.239']
const clientIp   = getRequestIP(event) ?? ''
if (!OFFICE_IPS.some(ip => clientIp.startsWith(ip))) {
  throw createError({ statusCode: 403, message: 'DTR can only be submitted from the office network.' })
}
  const db  = initAdmin()
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // Check if already clocked in today
  const existing = await db.collection('dtr')
    .where('employee_id', '==', employeeId)
    .where('date_str', '==', todayStr)
    .limit(1)
    .get()

  if (!existing.empty && existing.docs[0]?.data().time_in) {
    throw createError({ statusCode: 400, message: 'Already clocked in today.' })
  }

  await db.collection('dtr').add({
    employee_id: employeeId,
    date:        Timestamp.fromDate(now),
    date_str:    todayStr,
    time_in:     Timestamp.fromDate(now),
    time_out:    null,
  })

  // Audit log
  await db.collection('audit_logs').add({
    employee_id:   employeeId,
    employee_name: empName ?? '',
    action:        'CLOCK_IN',
    details:       `Clocked in at ${now.toLocaleTimeString('en-PH')} on ${now.toLocaleDateString('en-PH')}`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    Timestamp.fromDate(now),
  })

  return { success: true }
})