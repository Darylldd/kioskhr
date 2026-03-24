import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

const HR_DEPTS = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)']

function initAdmin() {
  if (!getApps().length) {
    const config = useRuntimeConfig()
    initializeApp({ credential: cert({ projectId: config.firebaseAdminProjectId as string, clientEmail: config.firebaseAdminClientEmail as string, privateKey: (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n') }) })
  }
  return getFirestore()
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const ref = decodeURIComponent(getRouterParam(event, 'ref') ?? '')
  if (!ref) throw createError({ statusCode: 400, message: 'Invalid reference.' })

  const db   = initAdmin()
  const snap = await db.collection('payslips').where('payslip_ref', '==', ref).limit(1).get()
  if (snap.empty) throw createError({ statusCode: 404, message: 'Payslip not found.' })

  const row = snap.docs[0]!.data()

  // IDOR guard
  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any
  if (!HR_DEPTS.includes(empData?.department || '') && row.employee_id !== employeeId) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  return { ...row, payslip_ref: ref }
})