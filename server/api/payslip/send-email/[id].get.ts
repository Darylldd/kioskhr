import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const HR_DEPTS = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)']

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

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: any) {
  return Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function cutoffLabel(c: string) {
  if (c === 'FIRST_HALF')  return '1st Half'
  if (c === 'SECOND_HALF') return '2nd Half'
  return c
}

function monthLabel(month: string) {
  const [y, m] = (month || '').split('-')
  const names = [
    'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
    'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
  ]
  return m && y ? `${names[parseInt(m) - 1]} ${y}` : month
}

/**
 * Builds a self-contained HTML string that mirrors PayslipDocument.vue.
 * Images are loaded from public URLs — adjust the base URL via
 * NUXT_PUBLIC_BASE_URL (runtime config) or hard-code your domain below.
 */
function buildPayslipHtml(row: any, baseUrl: string): string {
  const ml = monthLabel(row.month)
  const cl = cutoffLabel(row.cutoff)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
  .payslip-container {
    width: 720px; margin: 0 auto; padding: 20px 35px;
    background: #fff; position: relative;
  }
  .watermark {
    position: absolute; top: 0; left: 0;
    width: 220px; height: auto; opacity: 0.4; pointer-events: none; z-index: 0;
  }
  .header-row { display: flex; align-items: center; margin-bottom: 10px; position: relative; z-index: 1; }
  .header-row img { height: 48px; margin-right: 10px; }
  .header-text { font-size: 10px; line-height: 1.2; }
  .header-text strong { font-size: 11px; }
  .header-text .region { color: #1a4d80; font-weight: bold; font-size: 11px; display: block; }
  .header-text .email  { color: blue; text-decoration: underline; }
  .title-block { text-align: center; margin-bottom: 10px; }
  .title-block h2 { margin: 0; font-size: 16px; letter-spacing: 1px; line-height: 1; }
  .title-block strong { text-transform: uppercase; font-size: 12px; }
  .meta { margin-bottom: 8px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-top: 10px; font-size: 11px; }
  th, td { border: 1px solid #000; padding: 2px 8px; line-height: 1.2; }
  .bg-blue { background-color: #c0ecf8 !important; font-weight: bold; text-align: center; }
  .text-right { text-align: right; font-family: 'Courier New', Courier, monospace; font-weight: bold; }
  .totals td { font-weight: bold; background: #fafafa; }
  .net-label { text-align: right; border: 1px solid #000; }
  .net-value { border: 1px solid #000; text-align: right; font-family: monospace; font-size: 13px; font-weight: bold; }
  .prepared { margin-top: 8px; text-align: right; font-style: italic; font-size: 10px; }
</style>
</head>
<body>
<div class="payslip-container">
  <img class="watermark" src="${baseUrl}/images/uhi.png" alt="" />

  <div class="header-row">
    <img src="${baseUrl}/images/bp.png"     alt="Bagong Pilipinas" />
    <img src="${baseUrl}/images/dabfar.png" alt="BFAR" />
    <div class="header-text">
      Republic of the Philippines | Department of Agriculture<br/>
      <strong>BUREAU OF FISHERIES AND AQUATIC RESOURCES</strong><br/>
      <span class="region">REGIONAL FISHERIES OFFICE - MIMAROPA</span>
      Sapul, Calapan City 5200, Oriental Mindoro<br/>
      <span class="email">ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph</span>
    </div>
  </div>

  <div class="title-block">
    <h2>PAY SLIP</h2>
    <strong>${ml} - ${cl}</strong>
  </div>

  <div class="meta">
    <strong>Name: ${(row.employee_name || '').toUpperCase()}</strong><br/>
    <strong>Account No.: ${row.account_no || ''}</strong>
  </div>

  <table>
    <thead>
      <tr>
        <th class="bg-blue" style="width:28%;">EARNINGS</th>
        <th class="bg-blue" style="width:22%;">Amount</th>
        <th class="bg-blue" style="width:32%;">DEDUCTIONS</th>
        <th class="bg-blue" style="width:18%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Pay</td>
        <td class="text-right">${fmt(row.basic_pay)}</td>
        <td>LATE/ABSENCES</td>
        <td class="text-right">${fmt(row.late_absences)}</td>
      </tr>
      <tr>
        <td rowspan="8" style="border-bottom:1px solid #000;"></td>
        <td rowspan="8" style="border-bottom:1px solid #000;"></td>
        <td>PAG-IBIG (MP1)</td>
        <td class="text-right">${fmt(row.pagibig_mp1)}</td>
      </tr>
      <tr><td>PAG-IBIG (MP2)</td>        <td class="text-right">${fmt(row.pagibig_mp2)}</td></tr>
      <tr><td>PAG-IBIG (MPL)</td>        <td class="text-right">${fmt(row.pagibig_mpl)}</td></tr>
      <tr><td>PAG-IBIG (Calamity)</td>   <td class="text-right">${fmt(row.pagibig_calamity)}</td></tr>
      <tr><td>SSS</td>                   <td class="text-right">${fmt(row.sss)}</td></tr>
      <tr><td>PHILHEALTH</td>            <td class="text-right">${fmt(row.philhealth)}</td></tr>
      <tr><td>TAX</td>                   <td class="text-right">${fmt(row.tax)}</td></tr>
      <tr><td>DISALLOWANCES</td>         <td class="text-right">${fmt(row.disallowances)}</td></tr>
      <tr class="totals">
        <td>Total Earnings</td>
        <td class="text-right">${fmt(row.basic_pay)}</td>
        <td style="text-align:right;">Total Deductions</td>
        <td class="text-right">${fmt(row.totalDeductions)}</td>
      </tr>
      <tr>
        <td colspan="2" style="border:none;"></td>
        <td class="bg-blue net-label">Net Pay</td>
        <td class="bg-blue net-value">${fmt(row.netPay)}</td>
      </tr>
    </tbody>
  </table>

  <div class="prepared">Prepared by: HRMU</div>
</div>
</body>
</html>`
}

async function generatePdf(html: string): Promise<Buffer> {
  // @sparticuz/chromium ships a Chromium binary that works on cloud/serverless hosts
  const executablePath = await chromium.executablePath()
  const browser = await puppeteer.launch({
    args:            chromium.args,
    defaultViewport: { width: 1280, height: 800 },
    executablePath,
    headless:        true,
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

// ── handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // ── auth ──
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  const actorName  = cookie['employee_name'] ?? ''
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  // ── resolve payslip doc ID from route param ──
  const id = (getRouterParam(event, 'id') ?? '').trim()
  if (!id) throw createError({ statusCode: 400, message: 'Missing payslip ID.' })

  const db      = initAdmin()
  const docSnap = await db.collection('payslips').doc(id).get()

  if (!docSnap.exists) throw createError({ statusCode: 404, message: 'Payslip not found.' })

  const row = docSnap.data() as any

  // ── IDOR guard (same pattern as print.post.ts) ──
  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any
  const isHR    = HR_DEPTS.includes(empData?.department || '')

  if (!isHR && row.employee_id !== employeeId) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  // ── fetch employee email ──
  // Prefer the stored email on the payslip row; fall back to the employees collection.
  let recipientEmail: string | undefined = row.employee_email

  if (!recipientEmail) {
    const targetEmpDoc = await db.collection('employees').doc(row.employee_id).get()
    recipientEmail = (targetEmpDoc.data() as any)?.email
  }

  if (!recipientEmail) {
    throw createError({ statusCode: 422, message: 'No email address on file for this employee.' })
  }

  // ── build PDF ──
  const config  = useRuntimeConfig()
  const baseUrl = (config.public?.baseUrl as string | undefined) ?? 'http://localhost:3000'
  const html    = buildPayslipHtml(row, baseUrl)
  let pdfBuf: Buffer
  try {
    pdfBuf = await generatePdf(html)
  } catch (pdfErr: any) {
    console.error('[send-email] PDF generation failed:', pdfErr?.message ?? pdfErr)
    throw createError({ statusCode: 500, message: `PDF generation failed: ${pdfErr?.message ?? 'Unknown error'}` })
  }

  // ── send email ──
  const transporter = nodemailer.createTransport({
    host:   config.smtpHost   as string,
    port:   Number(config.smtpPort ?? 587),
    secure: config.smtpSecure === 'true',
    auth: {
      user: config.smtpUser as string,
      pass: config.smtpPass as string,
    },
  })

  const ml = monthLabel(row.month)
  const cl = cutoffLabel(row.cutoff)
  const filename = `Payslip_${(row.employee_name || 'Employee').replace(/\s+/g, '_')}_${row.month}_${row.cutoff}.pdf`

  try {
    await transporter.sendMail({
    from:    `"BFAR MIMAROPA" <${config.smtpUser}>`,
    to:      recipientEmail,
   subject: `Payslip — ${ml} (${cl})`,
text:    `Greetings ${row.employee_name},\n\nPlease find attached your payslip for ${ml} – ${cl}.\n\nThis is an automated message. Please do not reply.`,
html: `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">
        <p>Dear <strong>${row.employee_name}</strong>,</p>
        <p>Please find attached your payslip. For concerns, please contact HRMU.</p>
        <p>Thank you.</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;"/>
        <p style="font-size:12px;color:#555;">Automated email — please do not reply.</p>
    </div>
`,
    attachments: [{ filename, content: pdfBuf!, contentType: 'application/pdf' }],
    })
  } catch (mailErr: any) {
    console.error('[send-email] SMTP error:', mailErr?.message ?? mailErr)
    throw createError({ statusCode: 500, message: `Email sending failed: ${mailErr?.message ?? 'Unknown error'}` })
  }

  // ── audit log ──
  await db.collection('audit_logs').add({
    employee_id:   employeeId,
    employee_name: actorName,
    action:        'EMAIL_PAYSLIP',
    details:       `Payslip ID: ${id}, recipient: ${recipientEmail}`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    new Date(),
  })

  return `Payslip emailed to ${recipientEmail}.`
})