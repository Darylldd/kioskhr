// server/api/employees/index.post.ts — Create employee
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import argon2 from 'argon2'
import { v2 as cloudinary } from 'cloudinary'

function initCloudinary() {
  const config = useRuntimeConfig()
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName as string,
    api_key:    config.cloudinaryApiKey    as string,
    api_secret: config.cloudinaryApiSecret as string,
  })
}

async function uploadToCloudinary(file: { filename: string; type: string; data: Buffer }, folder: string): Promise<string> {
  initCloudinary()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `hrkiosk/${folder}`, resource_type: 'auto' },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve(result.secure_url) 
      }
    )
    stream.end(file.data)
  })
}

function initAdmin() {
  if (!getApps().length) {
    const config = useRuntimeConfig()
    initializeApp({
      credential: cert({
        projectId:   config.firebaseAdminProjectId   as string,
        clientEmail: config.firebaseAdminClientEmail as string,
        privateKey:  (config.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${(useRuntimeConfig().public.firebaseProjectId as string)}.appspot.com`,
    })
  }
  return getFirestore()
}

export default defineEventHandler(async (event) => {
  const cookie = parseCookies(event)
  if (!cookie['employee_id']) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const db     = initAdmin()
  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400, message: 'Invalid form data.' })

  // Parse fields
  const fields: Record<string, string> = {}
  const files:  Record<string, { filename: string; type: string; data: Buffer }> = {}

  for (const part of formData) {
    if (part.filename) {
      files[part.name!] = { filename: part.filename, type: part.type || '', data: part.data }
    } else {
      fields[part.name!] = part.data.toString()
    }
  }

  const { employee_no, first_name, last_name, pin, nature_of_employment, date_hired, ...rest } = fields

  if (!employee_no || !first_name || !last_name || !pin) {
    throw createError({ statusCode: 400, message: 'Employee No, First Name, Last Name, and PIN are required.' })
  }

  const hashedPin = await argon2.hash(pin, { type: argon2.argon2id })

let profile_pic: string | null = null
if (files.profile_pic) {
  profile_pic = await uploadToCloudinary(files.profile_pic, 'profiles')
}

let contract_file: string | null = null
if (files.contract_file) {
  contract_file = await uploadToCloudinary(files.contract_file, 'contracts')
}

  // Date logic same as original employeeController
  const nature = (nature_of_employment || '').toLowerCase()
  const employeeData = {
    ...rest,
    employee_no: employee_no.trim(),
    first_name:  first_name.trim(),
    last_name:   last_name.trim(),
    pin:         hashedPin,
    nature_of_employment,
    date_hired:                   nature !== 'permanent' && nature !== 'casual' ? date_hired : null,
    date_of_appointment:          nature === 'casual'    ? date_hired : null,
    date_of_original_appointment: nature === 'permanent' ? date_hired : null,
    profile_pic,
    contract_file,
    created_at: Timestamp.now(),
  }

  await db.collection('employees').add(employeeData)

  // Audit log
  await db.collection('audit_logs').add({
    employee_id:   cookie['employee_id'],
    employee_name: cookie['employee_name'] ?? '',
    action:        'CREATE_EMPLOYEE',
    details:       `Added: ${first_name.trim()} ${last_name.trim()} (${employee_no.trim()})`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    Timestamp.now(),
  })

  return { success: true }
})