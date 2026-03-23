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

  const db  = initAdmin()
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const snap = await db.collection('dtr')
    .where('employee_id', '==', employeeId)
    .where('date_str', '==', todayStr)
    .limit(1)
    .get()

  if (snap.empty || !snap.docs[0]) {
    throw createError({ statusCode: 400, message: 'Not clocked in today.' })
  }

  const doc  = snap.docs[0]!
  const data = doc.data()

  if (!data.time_in) {
    throw createError({ statusCode: 400, message: 'Not clocked in today.' })
  }
  if (data.time_out) {
    throw createError({ statusCode: 400, message: 'Already clocked out today.' })
  }

  await doc.ref.update({ time_out: Timestamp.fromDate(now) })

  // Calculate hours worked
  const timeIn = data.time_in.toDate()
  const hrs    = ((now.getTime() - timeIn.getTime()) / 1000 / 3600).toFixed(2)

  // Audit log
  await db.collection('audit_logs').add({
    employee_id:   employeeId,
    employee_name: empName ?? '',
    action:        'CLOCK_OUT',
    details:       `Clocked out at ${now.toLocaleTimeString('en-PH')} on ${now.toLocaleDateString('en-PH')} · ${hrs} hrs worked`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    Timestamp.fromDate(now),
  })

  return { success: true }
})