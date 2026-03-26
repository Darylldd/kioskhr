import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import nodemailer from 'nodemailer'
import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'

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
  const names = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
  return m && y ? `${names[parseInt(m) - 1]} ${y}` : month
}

function loadImageAsBase64(filename: string): string | null {
  try {
    const filePath = path.resolve(process.cwd(), 'public', 'images', filename)
    return fs.readFileSync(filePath).toString('base64')
  } catch {
    console.warn(`[buildPDF] Could not load image: ${filename}`)
    return null
  }
}

function buildPDF(payslip: Record<string, any>): Buffer {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 20
  const tableW = pageW - margin * 2   


  // Logo / header block
  const LOGO_H          = 13   
  const LOGO_BP_W       = 15    
  const LOGO_DABFAR_W   = 16    
  const LOGO_TEXT_GAP   = 2    

  // Header text font sizes
  const FS_GOV_LINE     = 8    
  const FS_BFAR_LINE    = 8    
  const FS_RFO_LINE     = 9   
  const FS_ADDR_LINE    = 7.5  
  const HEADER_GAP      = 6    

  // Title
  const FS_TITLE        = 14  
  const FS_PERIOD       = 10    
  const TITLE_GAP       = 8     

  // Employee info
  const FS_EMPLOYEE     = 10   
  const EMPLOYEE_GAP    = 8    

  // Table
  const ROW_H           = 7    
  const HEADER_H        = 8     
  const FS_TABLE_HDR    = 9     
  const FS_TABLE_DATA   = 8     
  const FS_BASIC_PAY    = 9     
  const FS_TOTALS       = 9    
  const FS_NET_PAY      = 10    

  const PCT_W1 = 0.28   
  const PCT_W2 = 0.22   
  const PCT_W3 = 0.32  
  const PCT_W4 = 0.18   


  const x1 = margin
  const w1 = tableW * PCT_W1
  const x2 = x1 + w1
  const w2 = tableW * PCT_W2
  const x3 = x2 + w2
  const w3 = tableW * PCT_W3
  const x4 = x3 + w3
  const w4 = tableW - w1 - w2 - w3  

  let y = 20

  const imgUhi    = loadImageAsBase64('uhi.png')
  const imgBp     = loadImageAsBase64('bp.png')
  const imgDabfar = loadImageAsBase64('dabfar.png')

  if (imgUhi) {
    doc.addImage(imgUhi, 'PNG', 0, 0, 80, 0)   
    doc.setFillColor(255, 255, 255)
    doc.setGState(new (doc as any).GState({ opacity: 0.2 }))  
    doc.rect(0, 0, 80, 58, 'F')
    doc.setGState(new (doc as any).GState({ opacity: 1 }))
  }

  const logoY = y - 2
  let   logoX = x1

  if (imgBp) {
    doc.addImage(imgBp, 'PNG', logoX, logoY, 0, LOGO_H)
    logoX += LOGO_BP_W
  }
  if (imgDabfar) {
    doc.addImage(imgDabfar, 'PNG', logoX, logoY, 0, LOGO_H)
    logoX += LOGO_DABFAR_W
  }

  const textX = logoX + LOGO_TEXT_GAP
  doc.setFontSize(FS_GOV_LINE)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0)
  doc.text('Republic of the Philippines | Department of Agriculture', textX, y); y += 3.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FS_BFAR_LINE)
  doc.text('BUREAU OF FISHERIES AND AQUATIC RESOURCES', textX, y); y += 3.5
  doc.setTextColor(26, 77, 128)
  doc.setFontSize(FS_RFO_LINE)
  doc.text('REGIONAL FISHERIES OFFICE - MIMAROPA', textX, y); y += 3.5
  doc.setTextColor(0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FS_ADDR_LINE)
  doc.text('Sapul, Calapan City 5200, Oriental Mindoro', textX, y); y += 3.5
  doc.setTextColor(0, 0, 200)
  doc.text('ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph', textX, y)
  doc.setTextColor(0)

  y = Math.max(logoY + LOGO_H, y) + HEADER_GAP

  // ── Title ────────────────────────────────────────────────────────────────
  doc.setFontSize(FS_TITLE)
  doc.setFont('helvetica', 'bold')
  doc.text('PAY SLIP', pageW / 2, y, { align: 'center' }); y += 6
  doc.setFontSize(FS_PERIOD)
  doc.text(
    `${monthLabel(payslip.month).toUpperCase()} - ${cutoffLabel(payslip.cutoff).toUpperCase()}`,
    pageW / 2, y, { align: 'center' }
  ); y += TITLE_GAP

  // ── Employee info ─────────────────────────────────────────────────────────
  doc.setFontSize(FS_EMPLOYEE)
  doc.setFont('helvetica', 'bold')
  doc.text(`Name: ${(payslip.employee_name || '').toUpperCase()}`, x1, y); y += 5
  doc.text(`Account No.: ${payslip.account_no || ''}`, x1, y); y += EMPLOYEE_GAP



  doc.setLineWidth(0.3)

  doc.setFillColor(192, 236, 248)
  doc.rect(x1, y, tableW, HEADER_H, 'FD')
  doc.rect(x1, y, tableW, HEADER_H)
  doc.line(x2, y, x2, y + HEADER_H)
  doc.line(x3, y, x3, y + HEADER_H)
  doc.line(x4, y, x4, y + HEADER_H)
  doc.setFontSize(FS_TABLE_HDR)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text('EARNINGS',   x1 + 2, y + 5.5)
  doc.text('Amount',     x2 + 2, y + 5.5)
  doc.text('DEDUCTIONS', x3 + 2, y + 5.5)
  doc.text('Amount',     x4 + 2, y + 5.5)
  y += HEADER_H

  const deductions: [string, any][] = [
    ['LATE/ABSENCES',         payslip.late_absences],
    ['PAG-IBIG (MP1)',        payslip.pagibig_mp1],
    ['PAG-IBIG (MP2)',        payslip.pagibig_mp2],
    ['PAG-IBIG (MPL)',        payslip.pagibig_mpl],
    ['PAG-IBIG (Calamity Loan)', payslip.pagibig_calamity],
    ['SSS',                   payslip.sss],
    ['PHILHEALTH',            payslip.philhealth],
    ['TAX',                   payslip.tax],
    ['DISALLOWANCES',         payslip.disallowances],
  ]

  const deductionBlockH = ROW_H * deductions.length

  doc.rect(x1, y, w1, deductionBlockH)
  doc.rect(x2, y, w2, deductionBlockH)
  doc.setFontSize(FS_BASIC_PAY)
  doc.setFont('helvetica', 'normal')
  doc.text('Basic Pay', x1 + 2, y + 5)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(payslip.basic_pay), x2 + w2 - 2, y + 5, { align: 'right' })

  deductions.forEach(([label, val], i) => {
    const ry = y + i * ROW_H
    doc.rect(x3, ry, w3, ROW_H)
    doc.rect(x4, ry, w4, ROW_H)
    doc.setFontSize(FS_TABLE_DATA)
    doc.setFont('helvetica', 'normal')
    doc.text(String(label), x3 + 2, ry + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.text(fmt(val), x4 + w4 - 2, ry + 4.5, { align: 'right' })
  })

  y += deductionBlockH

  doc.setFillColor(250, 250, 250)
  doc.rect(x1, y, tableW, ROW_H, 'FD')
  doc.rect(x1, y, w1, ROW_H)
  doc.rect(x2, y, w2, ROW_H)
  doc.rect(x3, y, w3, ROW_H)
  doc.rect(x4, y, w4, ROW_H)
  doc.setFontSize(FS_TOTALS)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Earnings',             x1 + 2,      y + 4.5)
  doc.text(fmt(payslip.basic_pay),       x2 + w2 - 2, y + 4.5, { align: 'right' })
  doc.text('Total Deductions',           x3 + w3 - 2, y + 4.5, { align: 'right' })
  doc.text(fmt(payslip.totalDeductions), x4 + w4 - 2, y + 4.5, { align: 'right' })
  y += ROW_H

  doc.setFillColor(255, 255, 255)              
  doc.rect(x1, y, w1 + w2, ROW_H, 'FD')           
  doc.rect(x1, y, w1 + w2, ROW_H)                 

  doc.setFillColor(192, 236, 248)                 
  doc.rect(x3, y, w3, ROW_H, 'FD')
  doc.rect(x4, y, w4, ROW_H, 'FD')
  doc.rect(x3, y, w3, ROW_H)
  doc.rect(x4, y, w4, ROW_H)

  doc.setFontSize(FS_NET_PAY)
  doc.setFont('helvetica', 'bold')
  doc.text('Net Pay',           x3 + 2,      y + 5)
  doc.text(fmt(payslip.netPay), x4 + w4 - 2, y + 5, { align: 'right' })
  y += ROW_H + 8

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('Prepared by: HRMU', x1 + tableW, y, { align: 'right' })

  return Buffer.from(doc.output('arraybuffer'))
}

export default defineEventHandler(async (event) => {
  const cookie    = parseCookies(event)
  const actorId   = cookie['employee_id']
  const actorName = cookie['employee_name'] ?? ''
  if (!actorId) throw createError({ statusCode: 401, message: 'Unauthorized.' })

  const id = getRouterParam(event, 'id') ?? ''
  if (!id) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  const db     = initAdmin()
  const config = useRuntimeConfig()

  const docRef  = db.collection('payslips').doc(id)
  const docSnap = await docRef.get()
  if (!docSnap.exists) throw createError({ statusCode: 404, message: 'Payslip not found.' })

  const payslip = docSnap.data() as Record<string, any>

  if (!payslip.email) {
    throw createError({ statusCode: 400, message: 'Employee has no email address on file.' })
  }

  const pdfBuffer = buildPDF(payslip)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.emailUser as string,
      pass: config.emailPass as string,
    },
  })

  await transporter.sendMail({
    from:    config.emailFrom as string,
    to:      payslip.email,
    subject: `Payslip — ${payslip.month}`,
    text:    `Greetings ${payslip.employee_name},\n\nPlease find attached your payslip for ${payslip.month}.\n\nThis is an automated message. Please do not reply.`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">
        <p>Dear Maam/Sir<strong>${payslip.employee_name}</strong>,</p>
        <p>Kindly acknowledge the attached file with the subject mentioned above</strong>. For your concerns or clarifications, don't hesitate to contact us.</p>
        <p>Thank you and God Bless.</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;"/>
        <p style="font-size:12px;color:#555;">Automated email — please do not reply.</p>
      </div>
    `,
    attachments: [{
      filename:    `Payslip_${payslip.month}.pdf`,
      content:     pdfBuffer,
      contentType: 'application/pdf',
    }],
  })

  await db.collection('audit_logs').add({
    employee_id:   actorId,
    employee_name: actorName,
    action:        'EMAIL_PAYSLIP',
    details:       `${payslip.payslip_ref || id} → ${payslip.email}`,
    ip_address:    getRequestIP(event) ?? 'unknown',
    created_at:    new Date(),
  })

  return 'Payslip sent successfully.'
})