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
  // Get employee from session cookie / auth header
  // For now we read from the request body / cookie that was set at login
  const headers = getRequestHeaders(event)
  const cookie  = parseCookies(event)

  // Employee id must be passed — we store it in a cookie at login
  const employeeId = cookie['employee_id']
  if (!employeeId) {
    throw createError({ statusCode: 401, message: 'Unauthorized.' })
  }

  const db = initAdmin()
  const now = new Date()

  // All records for this employee
  const snap = await db.collection('dtr')
    .where('employee_id', '==', employeeId)
    .orderBy('date', 'desc')
    .get()

  const records = snap.docs.map(d => {
    const data = d.data()
    return {
      id:       d.id,
      date:     toDate(data.date),
      time_in:  toDate(data.time_in),
      time_out: toDate(data.time_out),
    }
  })

  // Today's record
  const todayStr = now.toISOString().split('T')[0]
  const todayRecord = records.find(r => {
    if (!r.date) return false
    return r.date.toISOString().split('T')[0] === todayStr
  }) ?? null

  // Hours today
  let todayHours = 0
  if (todayRecord?.time_in && todayRecord?.time_out) {
    todayHours = (todayRecord.time_out.getTime() - todayRecord.time_in.getTime()) / 1000 / 3600
  }

  // Hours this week (Mon–Sun)
  const startOfWeek = new Date(now)
  const day = now.getDay() === 0 ? 7 : now.getDay()
  startOfWeek.setDate(now.getDate() - day + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const weekHours = records
    .filter(r => r.date && r.date >= startOfWeek)
    .reduce((sum, r) => {
      if (r.time_in && r.time_out) {
        return sum + (r.time_out.getTime() - r.time_in.getTime()) / 1000 / 3600
      }
      return sum
    }, 0)

  return {
    records,
    todayRecord,
    todayHours:  todayHours.toFixed(2),
    weekHours:   weekHours.toFixed(2),
  }
})