import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

function initAdmin() {
  if (!getApps().length) {
    const c = useRuntimeConfig()
    initializeApp({ credential: cert({
      projectId:   c.firebaseAdminProjectId   as string,
      clientEmail: c.firebaseAdminClientEmail as string,
      privateKey:  (c.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n'),
    })})
  }
  return getFirestore()
}

const ALLOWED_DEPTS = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)', 'admin']

function toISO(val: any): string | null {
  if (!val) return null
  if (val?.seconds  !== undefined) return new Date(val.seconds  * 1000).toISOString()
  if (val?._seconds !== undefined) return new Date(val._seconds * 1000).toISOString()
  const d = new Date(val); return isNaN(d.getTime()) ? null : d.toISOString()
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  // Check if employee is privileged
  const db      = initAdmin()
  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any
  if (!empData || !ALLOWED_DEPTS.includes(empData.department || '')) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  const query     = getQuery(event)
  const search    = ((query.search as string) || '').trim().slice(0, 100).toLowerCase()
  const rawLimit  = parseInt(query.limit  as string || '25', 10)
  const rawPage   = parseInt(query.page   as string || '1',  10)
  const limit     = Math.min(100, Math.max(10, isNaN(rawLimit) ? 25 : rawLimit))
  const page      = Math.max(1, isNaN(rawPage) ? 1 : rawPage)

  // Fetch all logs ordered by created_at desc
  // Firestore doesn't support server-side full-text search, so we fetch and filter in memory
  // For large datasets consider Algolia or a different strategy
  const snap = await db.collection('audit_logs').orderBy('created_at', 'desc').get()

  let rows = snap.docs.map(d => {
    const r = d.data()
    return {
      id:            d.id,
      employee_id:   r.employee_id   || '',
      employee_name: r.employee_name || '',
      action:        r.action        || '',
      details:       r.details       || '',
      ip_address:    r.ip_address    || '',
      created_at:    toISO(r.created_at),
    }
  })

  // Filter
  if (search) {
    rows = rows.filter(r =>
      r.employee_name.toLowerCase().includes(search) ||
      r.action.toLowerCase().includes(search) ||
      r.details.toLowerCase().includes(search) ||
      r.ip_address.toLowerCase().includes(search)
    )
  }

  const total      = rows.length
  const totalPages = Math.ceil(total / limit) || 1
  const start      = (page - 1) * limit
  const paged      = rows.slice(start, start + limit)

  return { rows: paged, total, page, limit, totalPages }
})