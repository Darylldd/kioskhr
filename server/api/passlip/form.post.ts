import { getFirestore, Timestamp } from 'firebase-admin/firestore'
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
  if (val?.seconds  !== undefined) return new Date(val.seconds  * 1000).toISOString()
  if (val?._seconds !== undefined) return new Date(val._seconds * 1000).toISOString()
  const d = new Date(val); return isNaN(d.getTime()) ? null : d.toISOString()
}

function getFilingDate() {
  const now = new Date()
  if (now.getHours() >= 17) {
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }
  return now.toISOString().split('T')[0]
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  const empName    = cookie['employee_name'] ?? ''
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const query = getQuery(event)
  const type  = query.type as string
  if (!['regular', 'jocos'].includes(type)) throw createError({ statusCode: 400, message: 'Invalid passlip type.' })

  const body = await readBody(event)
  const { department, office_visit, purpose } = body

  if (!department?.trim() || !office_visit?.trim() || !purpose?.trim()) {
    throw createError({ statusCode: 400, message: '⚠️ Please fill in all required fields.' })
  }
  if (office_visit.length > 200 || purpose.length > 500) {
    throw createError({ statusCode: 400, message: 'Input exceeds maximum allowed length.' })
  }

  const filingDate = getFilingDate()
  const db = initAdmin()

  // Check existing passlip for today
  const existing = await db.collection('passlips')
    .where('employee_id', '==', employeeId)
    .where('pass_date', '==', filingDate)
    .limit(1)
    .get()

  if (!existing.empty) {
    throw createError({
      statusCode: 400,
      message: `🚫 You already have a passlip filed for ${filingDate}. Only one passlip is allowed per day.`
    })
  }

  // Generate sequence number
  const snap   = await db.collection('passlips').where('type', '==', type).get()
  const maxSeq = snap.docs.reduce((mx, d) => Math.max(mx, d.data().seq_no || 0), 0)
  const nextSeq   = maxSeq + 1
  const prefix    = type === 'regular' ? 'REG' : 'JO'
  const passlipNo = `${prefix}-${String(nextSeq).padStart(6, '0')}`

  // Get employee info for the record
  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any

  await db.collection('passlips').add({
    type,
    seq_no:        nextSeq,
    passlip_no:    passlipNo,
    employee_id:   employeeId,
    employee_no:   empData?.employee_no || '',
    employee_name: empName,
    department:    department.trim(),
    office_visit:  office_visit.trim(),
    purpose:       purpose.trim(),
    pass_date:     filingDate,
    created_at:    Timestamp.now(),
  })

  // Audit log
  await db.collection('audit_logs').add({
    employee_id:   employeeId,
    employee_name: empName,
    action:        'SUBMIT_PASSLIP',
    details:       `${passlipNo} · ${type === 'regular' ? 'Regular' : 'JO/COS'} · To: ${office_visit.trim()} · ${filingDate}`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    Timestamp.now(),
  })

  // Fetch updated records
  const isPriv = ['hrmu', 'admin'].includes((empData?.department || '').toLowerCase())
  let recordsSnap
  if (isPriv) {
    recordsSnap = await db.collection('passlips').where('type', '==', type).orderBy('created_at', 'desc').get()
  } else {
    recordsSnap = await db.collection('passlips')
      .where('type', '==', type).where('employee_id', '==', employeeId)
      .orderBy('created_at', 'desc').get()
  }

  const records = recordsSnap.docs.map(d => {
    const r = d.data()
    return {
      id: d.id, passlip_no: r.passlip_no || '', pass_date: toISO(r.pass_date),
      employee_name: r.employee_name || '', employee_id: r.employee_no || '',
      department: r.department || '', office_visit: r.office_visit || '', purpose: r.purpose || '',
    }
  })

  return { passlipNo, today: filingDate, records }
})