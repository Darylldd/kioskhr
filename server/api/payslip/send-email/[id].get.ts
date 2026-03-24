import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import nodemailer from 'nodemailer'
import { jsPDF } from 'jspdf'

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

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── PDF builder (pure JS, no Chromium needed) ─────────────────────────────────

function generatePdf(row: any): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ml  = monthLabel(row.month)
  const cl  = cutoffLabel(row.cutoff)

  const PW   = 595   // A4 width in pt
  const ML   = 40    // margin left
  const MR   = 40    // margin right
  const TW   = PW - ML - MR  // table width
  let   y    = 40

  // ── header text (no images — avoids fetch issues on server) ──
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text('Republic of the Philippines | Department of Agriculture', ML, y); y += 11
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('BUREAU OF FISHERIES AND AQUATIC RESOURCES', ML, y); y += 11
  doc.setTextColor(26, 77, 128)
  doc.text('REGIONAL FISHERIES OFFICE - MIMAROPA', ML, y); y += 11
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Sapul, Calapan City 5200, Oriental Mindoro', ML, y); y += 11
  doc.text('ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph', ML, y); y += 20

  // ── title ──
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('PAY SLIP', PW / 2, y, { align: 'center' }); y += 16
  doc.setFontSize(10)
  doc.text(`${ml} - ${cl}`, PW / 2, y, { align: 'center' }); y += 20

  // ── employee meta ──
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Name: ${(row.employee_name || '').toUpperCase()}`, ML, y); y += 14
  doc.text(`Account No.: ${row.account_no || ''}`, ML, y); y += 18

  // ── table helper ──
  const ROW_H = 16
  const C = [ML, ML + TW * 0.28, ML + TW * 0.50, ML + TW * 0.82, ML + TW]

  function drawRow(
    earn: string, earnAmt: string,
    ded: string,  dedAmt: string,
    opts: { bold?: boolean; bg?: [number,number,number] } = {}
  ) {
    if (opts.bg) {
      doc.setFillColor(...opts.bg)
      doc.rect(ML, y - ROW_H + 3, TW, ROW_H, 'F')
    }
    doc.setDrawColor(0)
    doc.rect(ML, y - ROW_H + 3, TW, ROW_H)
    // inner vertical lines
    doc.line(C[1], y - ROW_H + 3, C[1], y + 3)
    doc.line(C[2], y - ROW_H + 3, C[2], y + 3)
    doc.line(C[3], y - ROW_H + 3, C[3], y + 3)

    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(8)
    doc.setTextColor(0)
    if (earn)    doc.text(earn,    C[0] + 3,    y - 2)
    if (earnAmt) doc.text(earnAmt, C[2] - 3,    y - 2, { align: 'right' })
    if (ded)     doc.text(ded,     C[2] + 3,    y - 2)
    if (dedAmt)  doc.text(dedAmt,  C[4] - 3,    y - 2, { align: 'right' })
    y += ROW_H
  }

  // header row
  drawRow('EARNINGS', 'Amount', 'DEDUCTIONS', 'Amount', { bold: true, bg: [192, 236, 248] })

  // data rows
  const deductions: [string, string][] = [
    ['LATE/ABSENCES',       fmt(row.late_absences)],
    ['PAG-IBIG (MP1)',      fmt(row.pagibig_mp1)],
    ['PAG-IBIG (MP2)',      fmt(row.pagibig_mp2)],
    ['PAG-IBIG (MPL)',      fmt(row.pagibig_mpl)],
    ['PAG-IBIG (Calamity)', fmt(row.pagibig_calamity)],
    ['SSS',                 fmt(row.sss)],
    ['PHILHEALTH',          fmt(row.philhealth)],
    ['TAX',                 fmt(row.tax)],
    ['DISALLOWANCES',       fmt(row.disallowances)],
  ]

  drawRow('Basic Pay', fmt(row.basic_pay), deductions[0][0], deductions[0][1])
  for (let i = 1; i < deductions.length; i++) {
    drawRow('', '', deductions[i][0], deductions[i][1])
  }

  // totals row
  drawRow('Total Earnings', fmt(row.basic_pay), 'Total Deductions', fmt(row.totalDeductions), { bold: true })

  // net pay row
  doc.setFillColor(192, 236, 248)
  doc.rect(C[2], y - ROW_H + 3, TW - (C[2] - ML), ROW_H, 'F')
  doc.setDrawColor(0)
  doc.rect(ML, y - ROW_H + 3, TW, ROW_H)
  doc.line(C[2], y - ROW_H + 3, C[2], y + 3)
  doc.line(C[3], y - ROW_H + 3, C[3], y + 3)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Net Pay', C[3] - 3, y - 2, { align: 'right' })
  doc.text(fmt(row.netPay), C[4] - 3, y - 2, { align: 'right' })
  y += ROW_H + 10

  // ── footer ──
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text('Prepared by: HRMU', C[4], y, { align: 'right' })

  return Buffer.from(doc.output('arraybuffer'))
}

// ── handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const cookie     = parseCookies(event)
  const employeeId = cookie['employee_id']
  const actorName  = cookie['employee_name'] ?? ''
  if (!employeeId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const id = (getRouterParam(event, 'id') ?? '').trim()
  if (!id) throw createError({ statusCode: 400, message: 'Missing payslip ID.' })

  const db      = initAdmin()
  const docSnap = await db.collection('payslips').doc(id).get()
  if (!docSnap.exists) throw createError({ statusCode: 404, message: 'Payslip not found.' })

  const row = docSnap.data() as any

  const empDoc  = await db.collection('employees').doc(employeeId).get()
  const empData = empDoc.data() as any
  const isHR    = HR_DEPTS.includes(empData?.department || '')
  if (!isHR && row.employee_id !== employeeId)
    throw createError({ statusCode: 403, message: 'Access denied.' })

  let recipientEmail: string | undefined = row.employee_email
  if (!recipientEmail) {
    const targetEmpDoc = await db.collection('employees').doc(row.employee_id).get()
    recipientEmail = (targetEmpDoc.data() as any)?.email
  }
  if (!recipientEmail)
    throw createError({ statusCode: 422, message: 'No email address on file for this employee.' })

  // ── generate PDF ──
  let pdfBuf: Buffer
  try {
    pdfBuf = generatePdf(row)
  } catch (pdfErr: any) {
    console.error('[send-email] PDF generation failed:', pdfErr?.message ?? pdfErr)
    throw createError({ statusCode: 500, message: `PDF generation failed: ${pdfErr?.message ?? 'Unknown error'}` })
  }

  // ── send email ──
  const config      = useRuntimeConfig()
  const transporter = nodemailer.createTransport({
    host:   config.smtpHost   as string,
    port:   Number(config.smtpPort ?? 587),
    secure: config.smtpSecure === 'true',
    auth: {
      user: config.smtpUser as string,
      pass: config.smtpPass as string,
    },
  })

  const ml       = monthLabel(row.month)
  const cl       = cutoffLabel(row.cutoff)
  const filename = `Payslip_${(row.employee_name || 'Employee').replace(/\s+/g, '_')}_${row.month}_${row.cutoff}.pdf`

  try {
    await transporter.sendMail({
      from:    `"BFAR MIMAROPA Payroll" <${config.smtpUser}>`,
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