<script setup lang="ts">
useSeoMeta({
  title: 'Print Admin Payslip'
})
definePageMeta({ layout: false })

const payslip  = ref<any>(null)
const otherDeds = ref<any[]>([])

const LABEL_MAP: Record<string, string> = {
  gsis_per_share:'GSIS Per Share', medicare:'Medicare 5%', pagibig:'Pag Ibig',
  withholding_tax:'Withholding Tax', provident_403:'403   Provident Fund',
  gsis_emerg_337:'337   GSIS -Emerg. Loan', gsis_mpl_346:'346   GSIS-MPL',
  hdmf_mpl_440:'440   HDMF-MPL', islai_premium:'ISLAI-Premium', islai_loan:'ISLAI-Loan',
  hdmf_cal:'HDMF-CAL', ucpb_loan:'UCPB Loan', islai_emergency:'ISLAI-Emergency',
  gsis_cpl:'GSIS-CPL', gsis_mpl_lite:'GSIS-MPL LITE', ucpb_kasama_salary:'UCPB KASAMA MO',
  gsis_policy_regular:'GSIS-Policy Reg', palda_capital_share:'PAL-DA Capital',
  palda_coopbank_share:'PAL-DA CoopBank', bfar_coop_additional:"BFAR Coop Addt'l",
  palda_regular:'PAL-DA Regular',
}

onMounted(() => {
  const raw = sessionStorage.getItem('admin_payslip_print')
  if (!raw) { window.close(); return }
  const data = JSON.parse(raw)
  payslip.value   = data
  otherDeds.value = typeof data.other_deductions === 'string'
    ? JSON.parse(data.other_deductions)
    : (data.other_deductions || [])
  sessionStorage.removeItem('admin_payslip_print')
  nextTick(() => setTimeout(() => window.print(), 400))
})

function fmt(v: any) { return Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const activeDeds = computed(() => {
  if (!payslip.value) return []
  const rows: { label: string; value: string }[] = []
  for (const [key, label] of Object.entries(LABEL_MAP)) {
    if (Number(payslip.value[key] || 0) > 0) rows.push({ label, value: fmt(payslip.value[key]) })
  }
  for (const d of otherDeds.value) {
    if (d.name) rows.push({ label: d.name, value: fmt(d.amount) })
  }
  return rows
})

function printPage() { window.print() }
function closePage() {
  window.close()
}
</script>

<template>
  <div v-if="payslip">
    <div class="no-print">
      <span>🖨 Print View — {{ payslip.month }} {{ payslip.year }}</span>
      <button class="btn btn-print" @click="printPage">🖨 Print</button>
      <button class="btn btn-back" @click="closePage">✕ Close</button>
    </div>

    <div class="payslip-container">
      <img src="/images/uhi.png" class="top-banner" alt="" />
      <div class="header">
        <img src="/images/ggggg.jpg" alt="DA and BFAR Logos" />
        <div class="header-text">
          <h4>Republic of the Philippines</h4>
          <h4>Department of Agriculture</h4>
          <h3>BUREAU OF FISHERIES AND AQUATIC RESOURCES</h3>
          <p>REGIONAL FISHERIES OFFICE - MIMAROPA</p>
          <p class="subtext">Barangay Sapul, Calapan City 5200, Oriental Mindoro</p>
          <p class="subtext">Tel. No. (043) 288-6305 | Mobile No. 0917-107-2189</p>
          <p class="subtext" style="color:blue;">ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph</p>
        </div>
        <img src="/images/lho.png" alt="Bagong Pilipinas Logo" />
      </div>

      <div class="payslip-title">
        <div class="ps-label">P A Y S L I P</div>
        <div class="ps-period">{{ payslip.month?.toUpperCase() }} &nbsp;{{ payslip.year }}</div>
      </div>

      <div class="emp-row"><div class="emp-cell">EMPL NAME:&nbsp;<span>{{ payslip.employee_name }}</span></div><div class="emp-cell">DIVISION:&nbsp;<span>{{ payslip.division || 'N/A' }}</span></div></div>
      <div class="emp-row"><div class="emp-cell">POSITION:&nbsp;<span>{{ payslip.position || '' }}</span></div><div class="emp-cell">SECTION:&nbsp;<span>{{ payslip.section || 'N/A' }}</span></div></div>

      <table class="main-table">
        <thead>
          <tr>
            <th style="width:22%;">GROSS EARNINGS</th>
            <th style="width:46%;">DEDUCTIONS</th>
            <th style="width:32%;">PERIODS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="col">
              <table class="inner" style="table-layout:fixed;"><colgroup><col style="width:55%"><col style="width:45%"></colgroup>
               <tbody>
                <tr><td>Monthly Salary</td><td class="r">{{ fmt(payslip.monthly_salary) }}</td></tr>
                <tr><td>PERA</td><td class="r">2,000.00</td></tr>
              </tbody>
            </table>
            </td>
            <td class="col">
              <table class="inner" style="table-layout:fixed;"><colgroup><col style="width:65%"><col style="width:35%"></colgroup>
                <tbody>
                <tr v-for="d in activeDeds" :key="d.label"><td>{{ d.label }}</td><td class="r">{{ d.value }}</td></tr>
                <tr v-if="activeDeds.length === 0"><td colspan="2" style="color:#aaa;font-style:italic;padding:4px 6px;">No deductions entered</td></tr>
              </tbody>
            </table>
              <br /><br /><br /><br /><br />
            </td>
            <td class="col">
              <table class="inner" style="table-layout:fixed;"><colgroup><col style="width:50%"><col style="width:50%"></colgroup>
              <tbody>
                <tr><td class="b">1ST PERIOD</td><td class="r">{{ fmt(payslip.first_period) }}</td></tr>
                <tr><td class="b">2ND PERIOD</td><td class="r">{{ fmt(payslip.second_period) }}</td></tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr class="tfoot">
            <td>GROSS PAY <span style="float:right;">{{ fmt(payslip.total_gross) }}</span></td>
            <td>TOTAL DEDUCTIONS <span style="float:right;">{{ fmt(payslip.total_deductions) }}</span></td>
            <td>TOTAL NET PAY <span style="float:right;">{{ fmt(payslip.net_pay) }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
@media print {
  .no-print { display: none !important; }
  @page { margin: 0.5cm; }
  body { background: #fff; padding: 0; margin: 0; display: block; }
  .payslip-container { box-shadow: none; width: 100%; margin: 0 auto; padding-top: 0; }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; background-color: #ffffff; display: flex; flex-direction: column; align-items: center; padding: 20px; }
.no-print { width:900px; background:#fff; border:1px solid #ccc; border-bottom:none; padding:10px 20px; display:flex; align-items:center; gap:10px; }
.no-print span { font-size:13px; font-weight:bold; flex:1; color:#333; }
.btn { padding:7px 16px; border:none; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; }
.btn-print { background:#f39c12; color:#fff; }
.btn-back { background:#7f8c8d; color:#fff; }
.payslip-container { background-color:#fff; width:900px; padding:20px 40px 30px; position:relative; }
.top-banner { position:absolute; top:0; left:0; width:35%; height:auto; max-height:90px; z-index:1; }
.header { display:flex; justify-content:space-between; align-items:center; margin-top:20px; position:relative; z-index:2; font-size:12px; }
.header img { height:80px; }
.header-text { flex-grow:1; text-align:center; line-height:1.45; }
.header-text h3, .header-text h4, .header-text p { margin:1px 0; font-weight:bold; }
.header-text h3 { font-size:14px; }
.header-text p.subtext { font-weight:normal; font-size:11px; }
.payslip-title { margin:14px 0 0; border-top:2px solid #333; padding-top:4px; }
.payslip-title .ps-label { font-size:13px; font-weight:bold; letter-spacing:2px; }
.payslip-title .ps-period { font-size:12px; font-weight:bold; margin-top:1px; }
.emp-row { display:grid; grid-template-columns:1fr 1fr; border:1px solid #555; border-bottom:none; font-size:12px; font-weight:bold; }
.emp-row:last-child { border-bottom:1px solid #555; }
.emp-cell { padding:3px 8px; display:flex; align-items:center; gap:4px; }
.emp-cell:first-child { border-right:1px solid #555; }
.main-table { width:100%; border-collapse:collapse; font-size:11px; }
.main-table th { border:1px solid #555; padding:4px 8px; background-color:#f0f0f0; font-size:11px; font-weight:bold; text-align:center; }
.main-table th:not(:last-child) { border-right:1px dashed #777; }
.main-table td.col { border:1px solid #555; padding:0; vertical-align:top; }
.main-table td.col:not(:last-child) { border-right:1px dashed #777; }
.main-table tr.tfoot td { border:1px solid #555; border-top:2px solid #333; padding:4px 8px; font-weight:bold; font-size:11px; background:#fafafa; }
.main-table tr.tfoot td:not(:last-child) { border-right:1px dashed #777; }
.inner { width:100%; border-collapse:collapse; }
.inner td { border:none; padding:2px 6px; font-size:11px; }
.inner td.r { text-align:right; white-space:nowrap; }
.inner td.b { font-weight:bold; }
</style>