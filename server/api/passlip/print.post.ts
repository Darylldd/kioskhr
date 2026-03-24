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
  if (val?.seconds  !== undefined) return new Date(val.seconds  * 1000).toISOString()
  if (val?._seconds !== undefined) return new Date(val._seconds * 1000).toISOString()
  const d = new Date(val); return isNaN(d.getTime()) ? null : d.toISOString()
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const body      = await readBody(event)
  const passlipNo = (body?.passlip_no || '').trim()
  if (!passlipNo) throw createError({ statusCode: 400, message: 'Invalid passlip number.' })

  const db   = initAdmin()
  const snap = await db.collection('passlips').where('passlip_no', '==', passlipNo).limit(1).get()

  if (snap.empty) throw createError({ statusCode: 404, message: 'Passlip not found.' })

  const data = snap.docs[0]!.data()

  return {
    passlip: {
      passlip_no:    data.passlip_no,
      pass_date:     toISO(data.pass_date),
      employee_name: data.employee_name || '',
      employee_id:   data.employee_no   || '',
      department:    data.department    || '',
      office_visit:  data.office_visit  || '',
      purpose:       data.purpose       || '',
      type:          data.type          || 'regular',
    }
  }
})