import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { v2 as cloudinary } from 'cloudinary'

function initAdmin() {
  const config = useRuntimeConfig()

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: config.firebaseAdminProjectId as string,
        clientEmail: config.firebaseAdminClientEmail as string,
        privateKey: (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n'),
      }),
    })
  }

  return {
    db: getFirestore(),
  }
}

// Cloudinary setup (runs once per request safely)
function initCloudinary() {
  const config = useRuntimeConfig()

  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  })

  return cloudinary
}

export default defineEventHandler(async (event) => {
  const cookie = parseCookies(event)
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

  const { db } = initAdmin()
  const cloud = initCloudinary()

  const updates: Record<string, any> = {
    first_name: fields.first_name?.trim(),
    middle_name: fields.middle_name?.trim() ?? '',
    last_name: fields.last_name?.trim(),
    employee_id: fields.employee_id,
    department: fields.department,
    position: fields.position,
    email: fields.email,
    contact_no: fields.contact_no,
    account_no: fields.account_no,
    tin: fields.tin,
    philhealth_no: fields.philhealth_no,
    gsis_no: fields.gsis_no,
    sss_no: fields.sss_no,
    emergency_contact_name: fields.emergency_contact_name,
    emergency_contact_phone: fields.emergency_contact_phone,
    updated_at: Timestamp.now(),
  }

  // ── Upload Profile Picture (CLOUDINARY) ─────────────────
  if (files.profile_pic) {
    const result = await cloud.uploader.upload(
      `data:${files.profile_pic.type};base64,${files.profile_pic.data.toString('base64')}`,
      {
        folder: 'profile_pics',
        public_id: `${employeeId}_${Date.now()}`,
      }
    )

    updates.profile_pic = result.secure_url
  }

  // ── Upload Contract File (CLOUDINARY) ───────────────────
  if (files.contract_file) {
    const result = await cloud.uploader.upload(
      `data:${files.contract_file.type};base64,${files.contract_file.data.toString('base64')}`,
      {
        folder: 'contracts',
        public_id: `${employeeId}_${Date.now()}`,
        resource_type: 'auto',
      }
    )

    updates.contract_file = result.secure_url
  }

  // ── Update Firestore ────────────────────────────────────
  await db.collection('employees').doc(employeeId).update(updates)

  // ── Audit Log ───────────────────────────────────────────
  await db.collection('audit_logs').add({
    employee_id: employeeId,
    employee_name: `${updates.first_name} ${updates.last_name}`,
    action: 'UPDATE_PROFILE',
    details: files.profile_pic
      ? 'Updated profile info and photo'
      : 'Updated profile info',
    ip_address: getRequestIP(event) ?? 'unknown',
    created_at: Timestamp.now(),
  })

  return {
    employee: {
      first_name: updates.first_name,
      last_name: updates.last_name,
      department: updates.department,
      position: updates.position,
      profile_pic: updates.profile_pic,
    },
  }
})