// server/api/passlip/form.get.ts — GET form data
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

function getFilingLabel() {
  return new Date().getHours() >= 17
    ? 'Filing is for TOMORROW (submitted after 5:00 PM cutoff)'
    : 'Filing is for TODAY'
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const query = getQuery(event)
  const type  = query.type as string
  if (!['regular', 'jocos'].includes(type)) throw createError({ statusCode: 400, message: 'Invalid passlip type.' })

  const db = initAdmin()

  // Check if privileged
  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any
  const dept    = (empData?.department || '').toLowerCase()
  const isPriv  = ['hrmu', 'admin'].includes(dept)

  // Generate next sequence number
  const snap = await db.collection('passlips').where('type', '==', type).get()
  const maxSeq = snap.docs.reduce((mx, d) => Math.max(mx, d.data().seq_no || 0), 0)
  const nextSeq   = maxSeq + 1
  const prefix    = type === 'regular' ? 'REG' : 'JO'
  const passlipNo = `${prefix}-${String(nextSeq).padStart(6, '0')}`

  // Fetch records
  let recordsSnap
  if (isPriv) {
    recordsSnap = await db.collection('passlips').where('type', '==', type).orderBy('created_at', 'desc').get()
  } else {
    recordsSnap = await db.collection('passlips')
      .where('type', '==', type)
      .where('employee_id', '==', employeeId)
      .orderBy('created_at', 'desc')
      .get()
  }

  const records = recordsSnap.docs.map(d => {
    const r = d.data()
    return {
      id:            d.id,
      passlip_no:    r.passlip_no    || '',
      pass_date:     toISO(r.pass_date),
      employee_name: r.employee_name || '',
      employee_id:   r.employee_no   || '',
      department:    r.department    || '',
      office_visit:  r.office_visit  || '',
      purpose:       r.purpose       || '',
    }
  })

  return { previewNo: passlipNo, today: getFilingDate(), filingLabel: getFilingLabel(), records }
})