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

function toISO(val: any): string | null {
  if (!val) return null
  if (val?.seconds !== undefined)  return new Date(val.seconds * 1000).toISOString()
  if (val?._seconds !== undefined) return new Date(val._seconds * 1000).toISOString()
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const body = await readBody(event)
  const toNo = (body?.to_no || '').trim()
  if (!toNo) throw createError({ statusCode: 400, message: 'Invalid Travel Order number.' })

  const db = initAdmin()

  // Check if privileged
  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any
  const dept    = (empData?.department || '').toLowerCase()
  const isPrivileged = ['hrmu', 'admin'].includes(dept)

  // Verify access for non-privileged
  if (!isPrivileged) {
    const accessSnap = await db.collection('travel_orders')
      .where('to_no', '==', toNo)
      .where('employee_id', '==', employeeId)
      .limit(1)
      .get()
    if (accessSnap.empty) {
      throw createError({ statusCode: 403, message: 'Travel Order not found or access denied.' })
    }
  }

  // Fetch all rows for this TO
  const snap = await db.collection('travel_orders')
    .where('to_no', '==', toNo)
    .orderBy('created_at', 'asc')
    .get()

  if (snap.empty) throw createError({ statusCode: 404, message: 'Travel Order not found.' })

  const rows     = snap.docs.map(d => d.data())
  const first    = rows[0]
  const order    = {
    to_no:                 first.to_no,
    travel_date:           toISO(first.travel_date),
    return_date:           toISO(first.return_date),
    destination:           first.destination,
    specific_purpose:      first.specific_purpose,
    objectives:            first.objectives,
    per_diems_allowed:     first.per_diems_allowed,
    appropriation:         first.appropriation,
    remarks:               first.remarks,
    salary_per_diem:       first.salary_per_diem,
    office_station:        first.office_station,
    contact_number:        first.contact_number,
    recommending_approval: first.recommending_approval,
    recommending_position: first.recommending_position,
    approved_by:           first.approved_by,
    created_at:            toISO(first.created_at),
  }

  const employees = rows.map(r => ({
    employee_id: r.employee_id,
    full_name:   r.employee_name || '',
    position:    r.recommending_position || '',
  }))

  // Audit log
  await db.collection('audit_logs').add({
    employee_id:   employeeId,
    employee_name: `${empData?.first_name} ${empData?.last_name}`,
    action:        'PRINT_TRAVEL_ORDER',
    details:       `TO# ${toNo}`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    new Date(),
  })

  return { order, employees }
})