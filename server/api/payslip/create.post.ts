import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

function initAdmin() {
  if (!getApps().length) {
    const config = useRuntimeConfig()
    initializeApp({ credential: cert({ projectId: config.firebaseAdminProjectId as string, clientEmail: config.firebaseAdminClientEmail as string, privateKey: (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n') }) })
  }
  return getFirestore()
}

function sanitize(data: Record<string, any>) {
  const fields = ['basic_pay','late_absences','pagibig_mp1','pagibig_mp2','pagibig_mpl','pagibig_calamity','sss','philhealth','tax','disallowances']
  const clean: Record<string, number> = {}
  for (const f of fields) { const v = parseFloat(data[f]); clean[f] = (isNaN(v) || v < 0) ? 0 : v }
  return clean
}

function makeRef(employee_no: string, month: string, cutoff: string) {
  const cutoffShort = cutoff === 'FIRST_HALF' ? '1H' : '2H'
  const safeNo = (employee_no || 'UNK').replace(/[^A-Za-z0-9_-]/g, '_')
  return `${month}-${cutoffShort}-${safeNo}`
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const actorId    = cookie['employee_id']
  const actorName  = cookie['employee_name'] ?? ''
  if (!actorId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const body = await readBody(event)
  const { employee_id, month, cutoff } = body

  if (!employee_id || !month || !['FIRST_HALF','SECOND_HALF'].includes(cutoff)) {
    throw createError({ statusCode: 400, message: 'Invalid employee, month, or cutoff.' })
  }

  const db = initAdmin()

  // Get employee info
  const empDoc  = await db.collection('employees').doc(employee_id).get()
  if (!empDoc.exists) throw createError({ statusCode: 404, message: 'Employee not found.' })

  const empData = empDoc.data() as any
  const empName = `${empData.first_name} ${empData.middle_name || ''} ${empData.last_name}`.trim()
  const payslip_ref = makeRef(empData.employee_no, month, cutoff)

  const nums = sanitize(body)
  const totalDeductions = Object.entries(nums).filter(([k]) => k !== 'basic_pay').reduce((s, [, v]) => s + v, 0)
  const netPay = nums.basic_pay - totalDeductions

  await db.collection('payslips').add({
    payslip_ref,
    employee_id,
    employee_name: empName,
    account_no:    empData.account_no || '',
    email:         empData.email || '',
    month,
    cutoff,
    ...nums,
    totalDeductions,
    netPay,
    created_at: Timestamp.now(),
  })

  await db.collection('audit_logs').add({
    employee_id:   actorId,
    employee_name: actorName,
    action:        'CREATE_PAYSLIP',
    details:       `${payslip_ref} · ${empName} · Net: ${netPay.toFixed(2)}`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    Timestamp.now(),
  })

  return { success: true, payslip_ref }
})