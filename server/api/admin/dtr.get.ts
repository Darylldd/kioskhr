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

function toDate(val: any): Date | null {
  if (!val) return null
  if (val instanceof Timestamp) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) {
    throw createError({ statusCode: 401, message: 'Unauthorized.' })
  }

  const query = getQuery(event)
  const year  = parseInt(query.year  as string) || new Date().getFullYear()
  const month = parseInt(query.month as string) || 0   // 0 = all months

  const db = initAdmin()

  // Get all employees
  const empSnap = await db.collection('employees').orderBy('first_name').get()
  const empMap: Record<string, any> = {}
  empSnap.docs.forEach(d => {
    const e = d.data()
    empMap[d.id] = {
      name:       `${e.first_name} ${e.last_name}`,
      email:      e.email ?? '',
      department: e.department ?? '',
      records:    [],
    }
  })

  // Get DTR records filtered by year (and optionally month)
  let dtrQuery: any = db.collection('dtr')

  const startDate = new Date(year, month ? month - 1 : 0, 1)
  const endDate   = month
    ? new Date(year, month, 1)          // first day of next month
    : new Date(year + 1, 0, 1)          // first day of next year

  const dtrSnap = await db.collection('dtr')
    .where('date', '>=', Timestamp.fromDate(startDate))
    .where('date', '<',  Timestamp.fromDate(endDate))
    .orderBy('date', 'asc')
    .get()

  dtrSnap.docs.forEach(d => {
    const r   = d.data()
    const emp = empMap[r.employee_id]
    if (!emp) return

    const timeIn  = toDate(r.time_in)
    const timeOut = toDate(r.time_out)
    const hours   = (timeIn && timeOut)
      ? ((timeOut.getTime() - timeIn.getTime()) / 1000 / 3600).toFixed(2)
      : '-'

    emp.records.push({
      date:     toDate(r.date),
      time_in:  timeIn,
      time_out: timeOut,
      hours,
    })
  })

  return {
    users: Object.values(empMap),
  }
})