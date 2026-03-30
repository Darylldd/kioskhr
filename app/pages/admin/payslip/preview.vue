<script setup lang="ts">
useSeoMeta({
  title: 'Preview'
})
const router  = useRouter()
const loading = ref(false)
const error   = ref('')
const data    = ref<any>(null)

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
  const raw = sessionStorage.getItem('admin_payslip_preview')
  if (!raw) { router.push('/admin/payslip'); return }
  data.value = JSON.parse(raw)
})

function n(v: any) { const x = Number(v); return (!isNaN(x) && x >= 0) ? x : 0 }
function fmt(v: number) { return Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const activeDeds = computed(() => {
  if (!data.value) return []
  const rows: { label: string; value: string }[] = []
  for (const [key, label] of Object.entries(LABEL_MAP)) {
    if (n(data.value[key]) > 0) rows.push({ label, value: fmt(n(data.value[key])) })
  }
  for (const d of (data.value.other_deductions || [])) {
    if (d.name?.trim()) rows.push({ label: d.name, value: fmt(n(d.amount)) })
  }
  return rows
})

async function save() {
  if (!data.value) return
  loading.value = true
  error.value   = ''
  try {
    await $fetch('/api/admin/payslip/create', { method: 'POST', body: data.value })
    sessionStorage.removeItem('admin_payslip_preview')
    sessionStorage.removeItem('admin_payslip_employee')
    router.push('/admin/payslip/list')
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to save payslip.'
  } finally {
    loading.value = false
  }
}

function printPage() { window.print() }
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950">
    <!-- Nav (hidden on print) -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm no-print">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <div>
            <p class="font-display text-base text-navy-700 dark:text-navy-200 leading-tight">Payslip Preview</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">{{ data?.month }} {{ data?.year }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="save" :disabled="loading"
            class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span class="hidden sm:inline">{{ loading ? 'Saving...' : 'Confirm & Save' }}</span>
          </button>
          <button @click="printPage"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span class="hidden sm:inline">Print</span>
          </button>
          <NuxtLink to="/admin/payslip/create"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span class="hidden sm:inline">Back to Edit</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <div v-if="error" class="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
      <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>
    </div>

    <!-- Payslip document -->
    <div v-if="data" style="display:flex;flex-direction:column;align-items:center;padding:20px;">
      <div class="payslip-container">
        <img src="/images/uhi.png" class="top-banner" alt="" />
        <div class="header">
          <img src="/images/ggggg.jpg" alt="DA and BFAR Logos" />
          <div class="header-text">
            <h4>Republic of the Philippines</h4>
            <h4>Department of Agriculture</h4>
            <h3>BUREAU OF FISHERIES AND AQUATIC RESOURCES</h3>
            <p>REGIONAL FISHERIES OFFICE - MIMAROPA</p>
            <p class="subtext">Sapul, Calapan City 5200, Oriental Mindoro</p>
            <p class="subtext">Tel. No. (043) 288-6305 | Mobile No. 0917-107-2189</p>
            <p class="subtext" style="color:blue;">ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph</p>
          </div>
          <img src="/images/lho.png" alt="Bagong Pilipinas Logo" />
        </div>

        <div class="payslip-title">
          <div class="ps-label">P A Y S L I P</div>
          <div class="ps-period">{{ data.month?.toUpperCase() }} &nbsp;{{ data.year }}</div>
        </div>

        <div class="emp-row"><div class="emp-cell">EMPL NAME:&nbsp;<span>{{ data.employee?.first_name }} {{ data.employee?.middle_name }} {{ data.employee?.last_name }}</span></div><div class="emp-cell">DIVISION:&nbsp;<span>{{ data.division || 'N/A' }}</span></div></div>
        <div class="emp-row"><div class="emp-cell">POSITION:&nbsp;<span>{{ data.employee?.position || '' }}</span></div><div class="emp-cell">SECTION:&nbsp;<span>{{ data.section || 'N/A' }}</span></div></div>

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
                    <tr><td>Monthly Salary</td><td class="r">{{ fmt(n(data.monthly_salary)) }}</td></tr>
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
                <br /><br /><br /><br />
              </td>
              <td class="col">
                <table class="inner" style="table-layout:fixed;"><colgroup><col style="width:50%"><col style="width:50%"></colgroup>
                  <tbody>
                    <tr><td class="b">1ST PERIOD</td><td class="r">{{ fmt(n(data.first_period)) }}</td></tr>
                  <tr><td class="b">2ND PERIOD</td><td class="r">{{ fmt(n(data.second_period)) }}</td></tr>
               </tbody>
                </table>
              </td>
            </tr>
            <tr class="tfoot">
              <td>GROSS PAY <span style="float:right;">{{ fmt(data.total_gross) }}</span></td>
              <td>TOTAL DEDUCTIONS <span style="float:right;">{{ fmt(data.total_deductions) }}</span></td>
              <td>TOTAL NET PAY <span style="float:right;">{{ fmt(data.net_pay) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style>
.payslip-container { background-color:#fff; width:900px; padding:20px 40px 30px; box-shadow:0 0 10px rgba(0,0,0,0.1); position:relative; }
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
.no-print { display: block; }
@media print {
  .no-print { display:none !important; }
  body { background:#fff; padding:0; }
  .payslip-container { box-shadow:none; width:100%; }
  @page { margin:0.5cm; }
}
</style>