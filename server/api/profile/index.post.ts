import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

function initAdmin() {
  const config = useRuntimeConfig()

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   config.firebaseAdminProjectId as string,
        clientEmail: config.firebaseAdminClientEmail as string,
        privateKey:  (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n'),
      }),
      storageBucket: config.public.firebaseStorageBucket,
    })
  }

  return {
    db: getFirestore(),
    bucket: getStorage().bucket(config.public.firebaseStorageBucket), 
  }
}

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']

  if (!employeeId) {
    throw createError({ statusCode: 401, message: 'Unauthorized.' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'Invalid form data.' })
  }

  const fields: Record<string, string> = {}
  const files: Record<string, { filename: string; type: string; data: Buffer }> = {}

  for (const part of formData) {
    if (part.filename) {
      files[part.name!] = {
        filename: part.filename,
        type: part.type || '',
        data: part.data,
      }
    } else {
      fields[part.name!] = part.data.toString()
    }
  }

  if (!fields.first_name?.trim() || !fields.last_name?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'First name and last name are required.',
    })
  }

  const { db, bucket } = initAdmin()

  const updates: Record<string, any> = {
    first_name:              fields.first_name?.trim(),
    middle_name:             fields.middle_name?.trim() ?? '',
    last_name:               fields.last_name?.trim(),
    employee_id:             fields.employee_id,
    department:              fields.department,
    position:                fields.position,
    email:                   fields.email,
    contact_no:              fields.contact_no,
    account_no:              fields.account_no,
    tin:                     fields.tin,
    philhealth_no:           fields.philhealth_no,
    gsis_no:                 fields.gsis_no,
    sss_no:                  fields.sss_no,
    emergency_contact_name:  fields.emergency_contact_name,
    emergency_contact_phone: fields.emergency_contact_phone,
    updated_at:              Timestamp.now(),
  }

  // ── Upload Profile Picture ───────────────────────────────
  if (files.profile_pic) {
    const dest = `profile_pics/${employeeId}_${Date.now()}-${files.profile_pic.filename}`
    const file = bucket.file(dest)

    await file.save(files.profile_pic.data, {
      contentType: files.profile_pic.type,
    })

    await file.makePublic()

    updates.profile_pic = `https://storage.googleapis.com/${bucket.name}/${dest}`
  }

  // ── Upload Contract File ────────────────────────────────
  if (files.contract_file) {
    const dest = `contracts/${employeeId}_${Date.now()}-${files.contract_file.filename}`
    const file = bucket.file(dest)

    await file.save(files.contract_file.data, {
      contentType: files.contract_file.type,
    })

    await file.makePublic()

    updates.contract_file = `https://storage.googleapis.com/${bucket.name}/${dest}`
  }

  // ── Update Firestore ────────────────────────────────────
  await db.collection('employees').doc(employeeId).update(updates)

  // ── Audit Log ───────────────────────────────────────────
  await db.collection('audit_logs').add({
    employee_id:   employeeId,
    employee_name: `${updates.first_name} ${updates.last_name}`,
    action:        'UPDATE_PROFILE',
    details:       files.profile_pic
      ? 'Updated profile info and photo'
      : 'Updated profile info',
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    Timestamp.now(),
  })

  return {
    employee: {
      first_name:  updates.first_name,
      last_name:   updates.last_name,
      department:  updates.department,
      position:    updates.position,
      profile_pic: updates.profile_pic,
    },
  }
})