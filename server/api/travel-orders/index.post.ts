import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

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

async function saveFile(file: { filename: string; type: string; data: Buffer }): Promise<string> {
  const dir = join(process.cwd(), 'public', 'uploads', 'travel_orders')
  await mkdir(dir, { recursive: true })
  const ext      = file.filename.split('.').pop()
  const safeName = `TO_${Date.now()}.${ext}`
  await writeFile(join(dir, safeName), file.data)
  return `/uploads/travel_orders/${safeName}`
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  const empName    = cookie['employee_name'] ?? ''
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400, message: 'Invalid form data.' })

  const fields: Record<string, string[]> = {}
  let uploadedFile: { filename: string; type: string; data: Buffer } | null = null

  for (const part of formData) {
    if (part.filename) {
      uploadedFile = { filename: part.filename, type: part.type || '', data: part.data }
    } else {
      const key = part.name!
      if (!fields[key]) fields[key] = []
      fields[key].push(part.data.toString())
    }
  }

  const get = (k: string) => fields[k]?.[0] ?? ''

  if (!uploadedFile)        throw createError({ statusCode: 400, message: 'Document file is required.' })
  if (!get('to_no'))        throw createError({ statusCode: 400, message: 'TO Number is required.' })
  if (!get('travel_date'))  throw createError({ statusCode: 400, message: 'Departure date is required.' })
  if (!get('destination'))  throw createError({ statusCode: 400, message: 'Destination is required.' })

  const file_path = await saveFile(uploadedFile)

  const db        = initAdmin()
  const toNo      = get('to_no')
  const empIds    = fields['employee_ids[]'] ?? []
  const positions = fields['positions[]']    ?? []

  // Get employee details for each
  const inserts = []
  for (let i = 0; i < empIds.length; i++) {
    const empDoc  = await db.collection('employees').doc(empIds[i]).get()
    const empData = empDoc.data() as any

    inserts.push({
      employee_id:           empIds[i],
      employee_name:         empData ? `${empData.first_name} ${empData.last_name}` : '',
      department:            empData?.department ?? '',
      to_no:                 toNo,
      travel_date:           get('travel_date'),
      return_date:           get('return_date')            || null,
      destination:           get('destination'),
      salary_per_diem:       get('salary_per_diem')        || null,
      specific_purpose:      get('specific_purpose')       || null,
      objectives:            get('objectives')             || null,
      per_diems_allowed:     get('per_diems_allowed')      || null,
      appropriation:         get('appropriation')          || null,
      remarks:               get('remarks')                || null,
      office_station:        get('office_station')         || null,
      recommending_approval: get('recommending_approval')  || null,
      recommending_position: positions[i]                  || '',
      contact_number:        get('contact_number')         || null,
      approved_by:           get('approved_by')            || null,
      file_name:             uploadedFile.filename,
      file_path,
      uploaded_by:           employeeId,
      created_at:            Timestamp.now(),
    })
  }

  for (const data of inserts) {
    await db.collection('travel_orders').add(data)
  }

  // Audit log
  await db.collection('audit_logs').add({
    employee_id:   employeeId,
    employee_name: empName,
    action:        'UPLOAD_TRAVEL_ORDER',
    details:       `TO# ${toNo} · ${get('destination')} · ${get('travel_date')} → ${get('return_date')} · ${inserts.length} employee(s)`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    Timestamp.now(),
  })

  return { success: true }
})