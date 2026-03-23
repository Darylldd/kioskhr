// migrate.js
import mysql from 'mysql2/promise'
import admin from 'firebase-admin'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('./hrkiosk.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const firestore = admin.firestore()

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'kiosk'
  })

  // Migrate employees
  const [employees] = await conn.execute('SELECT * FROM employees')
  for (const emp of employees) {
    await firestore.collection('employees').doc(String(emp.id)).set({
      ...emp,
      id: String(emp.id),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log(`Migrated employee: ${emp.employee_no}`)
  }

  // Migrate audit_logs
  const [logs] = await conn.execute('SELECT * FROM audit_logs ORDER BY id')
  for (const log of logs) {
    await firestore.collection('audit_logs').add({
      ...log,
      created_at: log.created_at || admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  console.log('Migration complete!')
  await conn.end()
}

migrate().catch(console.error)