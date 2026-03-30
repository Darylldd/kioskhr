import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

function initAdmin() {
  if (!getApps().length) {
    const c = useRuntimeConfig()
    initializeApp({ credential: cert({ projectId: c.firebaseAdminProjectId as string, clientEmail: c.firebaseAdminClientEmail as string, privateKey: (c.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n') }) })
  }
  return getFirestore()
}

function n(val: any) { const x = Number(val); return (!isNaN(x) && x >= 0) ? x : 0 }

const FIXED_KEYS = [
  'gsis_per_share','medicare','pagibig','withholding_tax','provident_403',
  'gsis_emerg_337','gsis_mpl_346','hdmf_mpl_440','islai_premium','islai_loan',
  'hdmf_cal','ucpb_loan','islai_emergency','gsis_cpl','gsis_mpl_lite',
  'ucpb_kasama_salary','gsis_policy_regular','palda_capital_share',
  'palda_coopbank_share','bfar_coop_additional','palda_regular',
]

export default defineEventHandler(async (event) => {
  const cookie    = parseCookies(event)
  const actorId   = cookie['employee_id']
  const actorName = cookie['employee_name'] ?? ''
  if (!actorId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const body = await readBody(event)
  const emp  = body.employee

  if (!emp?.id || !body.month || !body.year) {
    throw createError({ statusCode: 400, message: 'Employee, month and year are required.' })
  }

  const db   = initAdmin()
  // Get employee email for future email sends
  const empDoc  = await db.collection('employees').doc(emp.id).get()
  const empData = empDoc.data() as any
  const empName = `${emp.first_name} ${emp.middle_name || ''} ${emp.last_name}`.trim()
  const safeEmpNo = (emp.employee_no || 'UNK').replace(/[^A-Za-z0-9_-]/g, '_')
  const admin_payslip_ref = `${body.year}-${body.month}-${safeEmpNo}`

  const PERA = 2000
  const fixedTotal = FIXED_KEYS.reduce((s, k) => s + n(body[k]), 0)
  const otherDeds  = (body.other_deductions || []).filter((d: any) => d.name?.trim())
  const otherTotal = otherDeds.reduce((s: number, d: any) => s + n(d.amount), 0)
  const total_deductions = fixedTotal + otherTotal
  const total_gross      = n(body.monthly_salary) + PERA
  const net_pay          = total_gross - total_deductions

  const payslipData: Record<string, any> = {
    admin_payslip_ref,
    employee_id:   emp.id,
    employee_name: empName,
    email:         empData?.email || '',
    position:      emp.position || '',
    month:         body.month,
    year:          parseInt(body.year, 10),
    division:      String(body.division || '').slice(0, 100),
    section:       String(body.section  || '').slice(0, 100),
    monthly_salary: n(body.monthly_salary),
    pera:           PERA,
    other_deductions: JSON.stringify(otherDeds),
    total_gross, total_deductions, net_pay,
    first_period:  n(body.first_period),
    second_period: n(body.second_period),
    created_at:    Timestamp.now(),
  }
  for (const k of FIXED_KEYS) { payslipData[k] = n(body[k]) }

  await db.collection('admin_payslips').add(payslipData)

  await db.collection('audit_logs').add({
    employee_id: actorId, employee_name: actorName,
    action: 'CREATE_ADMIN_PAYSLIP',
    details: `${admin_payslip_ref} · ${empName} · Net: ${net_pay.toFixed(2)}`,
    ip_address: getRequestIP(event) ?? 'unknown', created_at: Timestamp.now(),
  })

  return { success: true, admin_payslip_ref }
})