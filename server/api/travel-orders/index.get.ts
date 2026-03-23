// server/api/travel-orders/index.get.ts
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
  if (val?.seconds !== undefined) return new Date(val.seconds * 1000).toISOString()
  if (val?._seconds !== undefined) return new Date(val._seconds * 1000).toISOString()
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const query        = getQuery(event)
  const search       = ((query.search as string) || '').toLowerCase().trim()
  const previewToNo  = (query.preview_to_no as string) || ''

  const db = initAdmin()

  // Get employee info to check if privileged
  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any
  const dept    = (empData?.department || '').toLowerCase()
  const isPrivileged = ['hrmu', 'admin'].includes(dept)

  // Get all travel order rows
  let snap
  if (isPrivileged) {
    snap = await db.collection('travel_orders').orderBy('created_at', 'desc').get()
  } else {
    // Get only TOs where this employee appears
    snap = await db.collection('travel_orders')
      .where('employee_id', '==', employeeId)
      .orderBy('created_at', 'desc')
      .get()
  }

  // Group by to_no
  const grouped: Record<string, any> = {}
  const toNos = new Set<string>()

  snap.docs.forEach(d => {
    const r = d.data()
    toNos.add(r.to_no)
    if (!grouped[r.to_no]) {
      grouped[r.to_no] = {
        to_no:       r.to_no,
        travel_date: toISO(r.travel_date),
        return_date: toISO(r.return_date),
        destination: r.destination,
        created_at:  toISO(r.created_at),
        file_path:   r.file_path,
        employees:   [],
        departments: [],
      }
    }
  })

  // For non-privileged — also fetch the other rows of same TO_nos (to get all employees on their TOs)
  if (!isPrivileged && toNos.size > 0) {
    for (const toNo of toNos) {
      const toSnap = await db.collection('travel_orders').where('to_no', '==', toNo).get()
      toSnap.docs.forEach(d => {
        const r = d.data()
        if (grouped[toNo]) {
          grouped[toNo].employees.push(r.employee_name || r.employee_id)
          grouped[toNo].departments.push(r.department || '')
        }
      })
    }
  } else {
    snap.docs.forEach(d => {
      const r = d.data()
      if (grouped[r.to_no]) {
        grouped[r.to_no].employees.push(r.employee_name || '')
        grouped[r.to_no].departments.push(r.department || '')
      }
    })
  }

  let orders = Object.values(grouped).map((o: any) => ({
    ...o,
    employees:   [...new Set(o.employees)].join(', '),
    departments: [...new Set(o.departments)].join(', '),
  }))

  // Search filter
  if (search) {
    orders = orders.filter((o: any) =>
      o.to_no?.toLowerCase().includes(search) ||
      o.destination?.toLowerCase().includes(search) ||
      o.employees?.toLowerCase().includes(search) ||
      o.departments?.toLowerCase().includes(search)
    )
  }

  // Preview file path
  let preview = ''
  if (previewToNo) {
    const previewOrder = orders.find((o: any) => o.to_no === previewToNo)
    if (previewOrder?.file_path) preview = previewOrder.file_path
  }

  return { orders, preview }
})