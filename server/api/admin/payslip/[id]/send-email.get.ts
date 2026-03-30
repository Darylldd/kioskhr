import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import fs from 'fs'
import path from 'path'

function initAdmin() {
  if (!getApps().length) {
    const c = useRuntimeConfig()
    initializeApp({
      credential: cert({
        projectId: c.firebaseAdminProjectId as string,
        clientEmail: c.firebaseAdminClientEmail as string,
        privateKey: (c.firebaseAdminPrivateKey as string)?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return getFirestore()
}

function imgToBase64(publicPath: string) {
  const filePath = path.join(process.cwd(), 'public', publicPath)
  const file = fs.readFileSync(filePath)
  return `data:image/png;base64,${file.toString('base64')}`
}

const LABEL_MAP: Record<string, string> = {
  gsis_per_share: 'GSIS Per Share',
  medicare: 'Medicare 5%',
  pagibig: 'Pag Ibig',
  withholding_tax: 'Withholding Tax',
  provident_403: '403    Provident Fund',
  gsis_emerg_337: '337    GSIS -Emerg. Loan',
  gsis_mpl_346: '346    GSIS-MPL',
  hdmf_mpl_440: '440    HDMF-MPL',
  islai_premium: 'ISLAI-Premium',
  islai_loan: 'ISLAI-Loan',
  hdmf_cal: 'HDMF-CAL',
  ucpb_loan: 'UCPB Loan',
  islai_emergency: 'ISLAI-Emergency',
  gsis_cpl: 'GSIS-CPL',
  gsis_mpl_lite: 'GSIS-MPL LITE',
  ucpb_kasama_salary: 'UCPB KASAMA MO',
  gsis_policy_regular: 'GSIS-Policy Reg',
  palda_capital_share: 'PAL-DA Capital',
  palda_coopbank_share: 'PAL-DA CoopBank',
  bfar_coop_additional: "BFAR Coop Addt'l",
  palda_regular: 'PAL-DA Regular',
}

function fmt(v: any) {
  return Number(v || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

async function buildPDF(p: any): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = 210
  const margin = 10
  let y = 15

  const uhi = imgToBase64('images/uhi.png')
  const bp = imgToBase64('images/bp.png')
  const bfar = imgToBase64('images/dabfar.png')

  // --- LOGO SIZING & POSITIONING ---
  // Banner size (uhi)
  doc.addImage(uhi, 'PNG', 0, 0, 100, 30) 

  // Side Logo sizes (Increased for better visibility)
  const logoSize = 24 
  doc.addImage(bfar, 'PNG', margin + 2, 12, logoSize, logoSize)
  doc.addImage(bp, 'PNG', pageW - margin - logoSize - 2, 12, logoSize, logoSize)

  y = 18 

  doc.setFontSize(8)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('Republic of the Philippines', pageW / 2, y, { align: 'center' })
  y += 4
  doc.text('Department of Agriculture', pageW / 2, y, { align: 'center' })
  y += 5

  doc.setFontSize(10)
  doc.text('BUREAU OF FISHERIES AND AQUATIC RESOURCES', pageW / 2, y, { align: 'center' })
  y += 4

  doc.setFontSize(8)
  doc.text('REGIONAL FISHERIES OFFICE - MIMAROPA', pageW / 2, y, { align: 'center' })
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.text('Barangay Sapul, Calapan City 5200, Oriental Mindoro', pageW / 2, y, { align: 'center' })
  y += 3.5
  doc.text('Tel. No. (043) 288-6305 | Mobile No. 0917-107-2189', pageW / 2, y, { align: 'center' })
  y += 3.5
  doc.setTextColor(0, 0, 255)
  doc.text('ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph', pageW / 2, y, { align: 'center' })
  y += 5

  doc.setDrawColor(0)
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // --- PAYSLIP HEADER ---
  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('P A Y S L I P', margin, y)
  y += 5
  doc.setFontSize(9)
  doc.text(`${p.month?.toUpperCase()} ${p.year}`, margin, y)
  y += 4

  const tableW = pageW - (margin * 2)
  doc.setLineWidth(0.2)
  
  // EMP NAME / DIVISION Row
  doc.rect(margin, y, tableW, 6) 
  doc.line(pageW * 0.6, y, pageW * 0.6, y + 12) 
  doc.setFontSize(8)
  doc.text(`EMPL NAME:  ${(p.employee_name || '').toUpperCase()}`, margin + 2, y + 4.2)
  doc.text(`DIVISION:  ${(p.division || 'N/A').toUpperCase()}`, pageW * 0.6 + 2, y + 4.2)
  y += 6

  // POSITION / SECTION Row
  doc.rect(margin, y, tableW, 6)
  doc.text(`POSITION:  ${(p.position || 'N/A').toUpperCase()}`, margin + 2, y + 4.2)
  doc.text(`SECTION:  ${(p.section || 'N/A').toUpperCase()}`, pageW * 0.6 + 2, y + 4.2)
  y += 6

  // --- MAIN TABLE SETUP ---
  const col1W = tableW * 0.28
  const col2W = tableW * 0.44
  const col3W = tableW * 0.28
  const headerH = 5
  
  // ADJUST THIS: bodyH controls the total vertical length of the empty table boxes
  const bodyH = 30 

  doc.setFont('helvetica', 'bold')
  doc.rect(margin, y, col1W, headerH)
  doc.rect(margin + col1W, y, col2W, headerH)
  doc.rect(margin + col1W + col2W, y, col3W, headerH)
  
  doc.text('GROSS EARNINGS', margin + (col1W / 2), y + 3.5, { align: 'center' })
  doc.text('DEDUCTIONS', margin + col1W + (col2W / 2), y + 3.5, { align: 'center' })
  doc.text('PERIODS', margin + col1W + col2W + (col3W / 2), y + 3.5, { align: 'center' })
  y += headerH

  // Outer border and vertical dividers
  doc.rect(margin, y, tableW, bodyH)
  doc.line(margin + col1W, y, margin + col1W, y + bodyH)
  doc.line(margin + col1W + col2W, y, margin + col1W + col2W, y + bodyH)

  doc.setFont('helvetica', 'normal')
  
  // ADJUST THIS: The spacing between rows of text (currently 4.5mm)
  const rowSpacing = 4.5 
  let contentY = y + 4 

  // Earnings
  doc.text('Monthly Salary', margin + 2, contentY)
  doc.text(fmt(p.monthly_salary), margin + col1W - 2, contentY, { align: 'right' })
  doc.text('PERA', margin + 2, contentY + rowSpacing)
  doc.text('2,000.00', margin + col1W - 2, contentY + rowSpacing, { align: 'right' })

  // Deductions
  const otherDeds = typeof p.other_deductions === 'string' ? JSON.parse(p.other_deductions) : p.other_deductions || []
  const activeDeds: { label: string; value: string }[] = []
  for (const [key, label] of Object.entries(LABEL_MAP)) {
    if (Number(p[key] || 0) > 0) activeDeds.push({ label, value: fmt(p[key]) })
  }
  for (const d of otherDeds) {
    if (d.name?.trim()) activeDeds.push({ label: d.name, value: fmt(d.amount) })
  }

  activeDeds.forEach((d, i) => {
    const itemY = y + 4 + (i * rowSpacing)
    if (itemY < y + bodyH - 2) {
      doc.text(d.label, margin + col1W + 2, itemY)
      doc.text(d.value, margin + col1W + col2W - 2, itemY, { align: 'right' })
    }
  })

  // Periods
  doc.setFont('helvetica', 'bold')
  doc.text('1ST PERIOD', margin + col1W + col2W + 2, y + 4)
  doc.text(fmt(p.first_period), margin + tableW - 2, y + 4, { align: 'right' })
  doc.text('2ND PERIOD', margin + col1W + col2W + 2, y + 4 + rowSpacing)
  doc.text(fmt(p.second_period), margin + tableW - 2, y + 4 + rowSpacing, { align: 'right' })

  y += bodyH

  // --- TOTALS FOOTER ---
  doc.setFont('helvetica', 'bold')
  doc.rect(margin, y, tableW, 7)
  doc.text('GROSS PAY', margin + 2, y + 4.5)
  doc.text(fmt(p.total_gross), margin + col1W - 2, y + 4.5, { align: 'right' })
  doc.text('TOTAL DEDUCTIONS', margin + col1W + 2, y + 4.5)
  doc.text(fmt(p.total_deductions), margin + col1W + col2W - 2, y + 4.5, { align: 'right' })
  doc.text('TOTAL NET PAY', margin + col1W + col2W + 2, y + 4.5)
  doc.text(fmt(p.net_pay), margin + tableW - 2, y + 4.5, { align: 'right' })

  return Buffer.from(doc.output('arraybuffer'))
}

export default defineEventHandler(async (event) => {
  const cookie = parseCookies(event)
  const actorId = cookie['employee_id']
  const actorName = cookie['employee_name'] ?? ''

  if (!actorId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const id = getRouterParam(event, 'id') ?? ''
  if (!id) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  const db = initAdmin()
  const payslipDoc = await db.collection('admin_payslips').doc(id).get()

  if (!payslipDoc.exists) throw createError({ statusCode: 404, message: 'Payslip not found.' })

  const p = payslipDoc.data() as any
  if (!p.email) throw createError({ statusCode: 400, message: 'Employee has no email address on file.' })

  const pdfBuffer = await buildPDF(p)
  const nodemailer = await import('nodemailer')
  const config = useRuntimeConfig()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.emailUser as string,
      pass: config.emailPass as string,
    },
  })

  await transporter.sendMail({
    from: config.emailFrom as string,
    to: p.email,
    subject: `Payslip – ${p.month} ${p.year}`,
    html: `<div style="font-family:Arial;font-size:14px;">
      <p>Dear <strong>${p.employee_name}</strong>,</p>
      <p>Please find attached your payslip for <strong>${p.month} ${p.year}</strong>.</p>
      <hr/>
      <p style="font-size:12px;color:#888;">Automated email</p>
    </div>`,
    attachments: [
      {
        filename: `Payslip_${p.month}_${p.year}_${(p.employee_name || '').replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })

  await db.collection('audit_logs').add({
    employee_id: actorId,
    employee_name: actorName,
    action: 'EMAIL_ADMIN_PAYSLIP',
    details: `${p.admin_payslip_ref || id} → ${p.email}`,
    ip_address: getRequestIP(event) ?? 'unknown',
    created_at: new Date(),
  })

  return 'Payslip sent successfully.'
})