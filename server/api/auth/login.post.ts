import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { employee_no, pin } = body

  if (!employee_no || !pin) {
    throw createError({ statusCode: 400, message: 'Employee number and PIN are required.' })
  }

  // Init Firebase Admin (server-side only)
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

  const db   = getFirestore()
  const snap = await db.collection('employees')
    .where('employee_no', '==', employee_no.trim())
    .limit(1)
    .get()

  if (snap.empty || !snap.docs[0]) {
    throw createError({ statusCode: 401, message: 'Invalid employee number or PIN.' })
  }

  // Non-null assertion — safe because we checked above
  const empDoc   = snap.docs[0]!
  const employee = empDoc.data() as Record<string, any>

  // Verify PIN with argon2
  const argon2 = await import('argon2').catch(() => null)
  let valid    = false

  if (argon2 && typeof employee.pin === 'string' && employee.pin.startsWith('$argon2')) {
    valid = await argon2.verify(employee.pin as string, pin as string)
  } else if (employee.pin === pin) {
    valid = true
    if (argon2) {
      const hashed = await argon2.hash(pin as string, { type: argon2.argon2id })
      await empDoc.ref.update({ pin: hashed })
    }
  }

  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid employee number or PIN.' })
  }

  let role = 'employee'
  const hrDepts     = ['HR', 'HRMU']
  const hrPositions = ['HR Manager', 'HR Officer']
  if (
    hrDepts.includes(employee.department as string) ||
    hrPositions.includes(employee.position as string)
  ) {
    role = 'hr'
  }

  await db.collection('audit_logs').add({
    employee_id:   empDoc.id,
    employee_name: `${employee.first_name as string} ${employee.last_name as string}`,
    action:        'LOGIN',
    details:       'Logged in',
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    new Date(),
  })

setCookie(event, 'employee_id',   empDoc.id,                            { httpOnly: true, path: '/', maxAge: 60 * 60 })
setCookie(event, 'employee_name', `${employee.first_name as string} ${employee.last_name as string}`, { httpOnly: true, path: '/', maxAge: 60 * 60 })

  return {
    employee: {
      id:          empDoc.id,
      employee_no: employee.employee_no  as string,
      first_name:  employee.first_name   as string,
      last_name:   employee.last_name    as string,
      middle_name: (employee.middle_name as string) ?? '',
      department:  employee.department   as string,
      position:    employee.position     as string,
      profile_pic: (employee.profile_pic as string) ?? null,
      role,
    },
  }
  
})

