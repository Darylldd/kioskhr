<script setup lang="ts">
useSeoMeta({
  title: 'Admin Payslip Create'
})
const isDark = ref(false)
const router = useRouter()

// ── Constants ──────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const FIXED_KEYS = [
  'gsis_per_share','medicare','pagibig','withholding_tax',
  'provident_403','gsis_emerg_337','gsis_mpl_346','hdmf_mpl_440',
  'islai_premium','islai_loan','hdmf_cal','ucpb_loan',
  'islai_emergency','gsis_cpl','gsis_mpl_lite','ucpb_kasama_salary',
  'gsis_policy_regular','palda_capital_share','palda_coopbank_share',
  'bfar_coop_additional','palda_regular',
]
const FIXED_LABELS: Record<string, string> = {
  gsis_per_share:'GSIS Per Share', medicare:'Medicare 5%', pagibig:'Pag Ibig',
  withholding_tax:'Withholding Tax', provident_403:'403 Provident Fund',
  gsis_emerg_337:'337 GSIS-Emerg', gsis_mpl_346:'346 GSIS-MPL',
  hdmf_mpl_440:'440 HDMF-MPL', islai_premium:'ISLAI-Premium', islai_loan:'ISLAI-Loan',
  hdmf_cal:'HDMF-CAL', ucpb_loan:'UCPB Loan', islai_emergency:'ISLAI-Emergency',
  gsis_cpl:'GSIS-CPL', gsis_mpl_lite:'GSIS-MPL LITE', ucpb_kasama_salary:'UCPB KASAMA MO',
  gsis_policy_regular:'GSIS-Policy Reg', palda_capital_share:'PAL-DA Capital',
  palda_coopbank_share:'PAL-DA CoopBank', bfar_coop_additional:"BFAR Coop Addt'l",
  palda_regular:'PAL-DA Regular',
}

// ── Employee ───────────────────────────────────────────────
const employee = ref<any>(null)
const error    = ref('')

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')

  const raw = sessionStorage.getItem('admin_payslip_employee')
  if (!raw) { router.push('/admin/payslip'); return }
  employee.value = JSON.parse(raw)
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// ── Form ───────────────────────────────────────────────────
const form = reactive<Record<string, any>>({
  month: '', year: new Date().getFullYear().toString(),
  division: '', section: '', monthly_salary: '',
  first_period: '', second_period: '',
  ...Object.fromEntries(FIXED_KEYS.map(k => [k, ''])),
})

const otherDeductions = ref<{ name: string; amount: string }[]>([])

function addOther() { otherDeductions.value.push({ name: '', amount: '' }) }
function removeOther(i: number) { otherDeductions.value.splice(i, 1) }

// ── Live totals ────────────────────────────────────────────
const PERA = 2000
function n(v: any) { const x = Number(v); return (!isNaN(x) && x >= 0) ? x : 0 }

const totalGross = computed(() => n(form.monthly_salary) + PERA)
const fixedTotal = computed(() => FIXED_KEYS.reduce((s, k) => s + n(form[k]), 0))
const otherTotal = computed(() => otherDeductions.value.reduce((s, d) => s + n(d.amount), 0))
const totalDeductions = computed(() => fixedTotal.value + otherTotal.value)
const netPay = computed(() => totalGross.value - totalDeductions.value)

function fmt(v: number) { return v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

// ── Preview (go to preview page) ──────────────────────────
function handlePreview() {
  if (!form.month || !form.year) { error.value = 'Month and year are required.'; return }
  if (!form.monthly_salary)      { error.value = 'Monthly salary is required.'; return }
  error.value = ''

  const payload = {
    ...form,
    employee: employee.value,
    other_deductions: otherDeductions.value.filter(d => d.name.trim()),
    pera:             PERA,
    total_gross:      totalGross.value,
    total_deductions: totalDeductions.value,
    net_pay:          netPay.value,
  }
  sessionStorage.setItem('admin_payslip_preview', JSON.stringify(payload))
  router.push('/admin/payslip/preview')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <span class="font-display text-lg text-navy-700 dark:text-navy-200 hidden sm:block group-hover:text-navy-500 transition-colors">Employee Portal</span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <button @click="toggleTheme" class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:text-navy-500 transition-all duration-200">
            <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          </button>
          <NuxtLink to="/admin/payslip/list" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span class="hidden sm:inline">All Payslips</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-5">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Create Gov't Payslip</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5" v-if="employee">
          For: <strong class="text-slate-700 dark:text-slate-200">{{ `${employee.first_name} ${employee.middle_name} ${employee.last_name}`.trim() }}</strong>
          <span v-if="employee.position"> — {{ employee.position }}</span>
        </p>
      </div>

      <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>

      <!-- Payslip document wrapper -->
      <div class="gps-doc bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div class="gps-wrap">
          <img src="/images/uhi.png" class="top-banner" alt="" />
          <div class="header">
            <img src="/images/dabfar.png" alt="DA and BFAR Logos" />
            <div class="header-text">
              <h4>Republic of the Philippines</h4>
              <h4>Department of Agriculture</h4>
              <h3>BUREAU OF FISHERIES AND AQUATIC RESOURCES</h3>
              <p>REGIONAL FISHERIES OFFICE - MIMAROPA</p>
              <p class="subtext">Sapul, Calapan City 5200, Oriental Mindoro</p>
              <p class="subtext">Tel. No. (043) 288-6305 | Mobile No. 0917-107-2189</p>
              <p class="subtext" style="color:blue;">ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph</p>
            </div>
            <img src="/images/bp.png" alt="Bagong Pilipinas Logo" />
          </div>

          <div class="payslip-title">
            <h2>C R E A T E &nbsp; P A Y S L I P</h2>
            <div style="margin-top:10px;">
              <select v-model="form.month" class="select-field" required>
                <option value="" disabled>Select Month</option>
                <option v-for="m in MONTHS" :key="m" :value="m">{{ m }}</option>
              </select>
              <input v-model="form.year" type="number" class="select-field" style="width:70px;" required />
            </div>
          </div>

          <!-- Live totals bar -->
          <div style="display:flex;gap:12px;padding:8px 0;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;">
            <span>Gross: <strong style="color:#1a5276;">₱ {{ fmt(totalGross) }}</strong></span>
            <span>Deductions: <strong style="color:#c0392b;">₱ {{ fmt(totalDeductions) }}</strong></span>
            <span>Net Pay: <strong :style="netPay < 0 ? 'color:#e74c3c' : 'color:#27ae60'">₱ {{ fmt(netPay) }}</strong></span>
          </div>

          <!-- Employee info rows -->
          <div class="emp-row">
            <div class="emp-cell">EMPL NAME:&nbsp;<span>{{ employee ? `${employee.first_name} ${employee.middle_name} ${employee.last_name}`.trim() : 'N/A' }}</span></div>
            <div class="emp-cell">DIVISION:&nbsp;<input v-model="form.division" type="text" /></div>
          </div>
          <div class="emp-row" style="border-bottom:1px solid #555;">
            <div class="emp-cell">POSITION:&nbsp;<span>{{ employee?.position || 'N/A' }}</span></div>
            <div class="emp-cell">SECTION:&nbsp;<input v-model="form.section" type="text" /></div>
          </div>

          <table class="main-table" style="margin-top:8px;">
            <thead>
              <tr>
                <th style="width:25%;">GROSS EARNINGS</th>
                <th style="width:50%;">DEDUCTIONS</th>
                <th style="width:25%;">PERIODS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <!-- Gross Earnings -->
                <td class="valign-top container-cell">
                  <table class="no-border-table" style="width:100%;">
                    <tbody>
                    <tr><td>Monthly Salary</td><td class="text-right"><input v-model="form.monthly_salary" type="number" step="0.01" class="input-field" required /></td></tr>
                    <tr><td>PERA (Fixed)</td><td class="text-right">₱ 2,000.00</td></tr>
                    </tbody>
                  </table>
                </td>

                <!-- Deductions -->
                <td class="valign-top container-cell">
                  <div class="deduction-grid">
                    <div v-for="key in FIXED_KEYS" :key="key" class="deduction-item">
                      <span>{{ FIXED_LABELS[key] }}:</span>
                      <input v-model="form[key]" type="number" step="0.01" class="input-field" />
                    </div>
                  </div>
                  <!-- Other deductions -->
                  <div style="padding:0 8px 4px;">
                    <div v-for="(d, i) in otherDeductions" :key="i"
                      style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:4px;gap:5px;">
                      <input v-model="d.name" type="text" class="input-field-text" placeholder="Name / Code" />
                      <div style="display:flex;align-items:center;gap:3px;">
                        <input v-model="d.amount" type="number" step="0.01" class="input-field" placeholder="0.00" />
                        <button type="button" @click="removeOther(i)" class="remove-btn">✕</button>
                      </div>
                    </div>
                  </div>
                  <div style="text-align:center;margin-bottom:10px;">
                    <button type="button" @click="addOther" class="add-btn">+ Add Other Deduction</button>
                  </div>
                </td>

                <!-- Periods -->
                <td class="valign-top container-cell">
                  <table class="no-border-table" style="width:100%;">
                    <tbody>
                    <tr><td class="bold">1ST PERIOD</td><td class="text-right"><input v-model="form.first_period" type="number" step="0.01" class="input-field" /></td></tr>
                    <tr><td class="bold">2ND PERIOD</td><td class="text-right"><input v-model="form.second_period" type="number" step="0.01" class="input-field" /></td></tr>
                  </tbody>
                </table>
                </td>
              </tr>
            </tbody>
          </table>

          <div style="text-align:center;margin:24px 0 8px;">
            <button @click="handlePreview" type="button"
              style="padding:10px 28px;background:#1a5276;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;">
              Preview Payslip
            </button>
            <NuxtLink to="/admin/payslip/list" style="margin-left:12px;font-size:13px;color:#64748b;text-decoration:none;">Cancel</NuxtLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.gps-doc * { box-sizing: border-box; }
.gps-doc { font-family: Arial, sans-serif; font-size: 12px; }
.gps-doc .top-banner { position:absolute; top:0; left:0; width:35%; max-height:90px; z-index:1; }
.gps-doc .gps-wrap { position:relative; overflow:hidden; background:#fff; padding:20px 40px; }
.gps-doc .header { display:flex; justify-content:space-between; align-items:center; margin-top:20px; position:relative; z-index:2; font-size:12px; }
.gps-doc .header img { height:80px; }
.gps-doc .header-text { flex-grow:1; line-height:1.4; text-align:center; }
.gps-doc .header-text h3 { font-size:14px; font-weight:bold; margin:2px 0; }
.gps-doc .header-text h4, .gps-doc .header-text p { margin:2px 0; font-weight:bold; }
.gps-doc .header-text p.subtext { font-weight:normal; font-size:11px; }
.gps-doc .payslip-title { text-align:center; margin:20px 0; }
.gps-doc .payslip-title h2 { font-size:20px; letter-spacing:5px; font-weight:bold; }
.gps-doc .emp-row { display:grid; grid-template-columns:1fr 1fr; border:1px solid #555; border-bottom:none; font-size:12px; font-weight:bold; }
.gps-doc .emp-row:last-of-type { border-bottom:1px solid #555; }
.gps-doc .emp-cell { padding:4px 8px; display:flex; align-items:center; gap:6px; }
.gps-doc .emp-cell:first-child { border-right:1px solid #555; }
.gps-doc .emp-cell input[type="text"] { width:180px; padding:2px 4px; border:none; border-bottom:1px solid #888; font-size:12px; outline:none; background:transparent; }
.gps-doc table { width:100%; border-collapse:collapse; font-size:12px; }
.gps-doc th, .gps-doc td { border:1px solid #555; padding:6px; }
.gps-doc .no-border-table th, .gps-doc .no-border-table td { border:none; padding:4px 6px; }
.gps-doc .text-right { text-align:right; }
.gps-doc .bold { font-weight:bold; }
.gps-doc .valign-top { vertical-align:top; }
.gps-doc .container-cell { padding:0; }
.gps-doc .main-table > thead > tr > th { background:#f9f9f9; text-align:center; }
.gps-doc .main-table > thead > tr > th:not(:last-child) { border-right:1px dashed #777; }
.gps-doc .main-table > tbody > tr > td.container-cell:not(:last-child) { border-right:1px dashed #777; }
.gps-doc .deduction-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 15px; padding:8px; }
.gps-doc .deduction-item { display:flex; justify-content:space-between; align-items:center; font-size:11px; }
.gps-doc .deduction-item span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-right:5px; }
.gps-doc .input-field { width:80px; padding:3px; border:1px solid #ccc; border-radius:3px; font-size:11px; text-align:right; background:#fff; color:#111; }
.gps-doc .input-field-text { flex:1; min-width:0; padding:3px; border:1px solid #ccc; border-radius:3px; font-size:11px; background:#fff; color:#111; }
.gps-doc .select-field { padding:4px; font-size:14px; border:1px solid #ccc; border-radius:3px; background:#fff; color:#111; }
.gps-doc .add-btn { background:#007bff; color:#fff; border:none; cursor:pointer; padding:5px 10px; font-size:11px; border-radius:4px; }
.gps-doc .remove-btn { background:#d9534f; color:#fff; border:none; padding:3px 5px; border-radius:3px; cursor:pointer; font-size:10px; }
.dark .gps-doc .gps-wrap { background:#1e293b; }
.dark .gps-doc .emp-row { border-color:#475569; color:#e2e8f0; }
.dark .gps-doc .emp-cell:first-child { border-right-color:#475569; }
.dark .gps-doc .emp-cell input[type="text"] { border-bottom-color:#64748b; color:#e2e8f0; }
.dark .gps-doc th, .dark .gps-doc td { border-color:#475569; color:#e2e8f0; background:#1e293b; }
.dark .gps-doc .main-table > thead > tr > th { background:#1e4060; color:#bfdbfe; }
.dark .gps-doc .deduction-item { color:#cbd5e1; }
.dark .gps-doc .input-field, .dark .gps-doc .input-field-text, .dark .gps-doc .select-field { background:#0f172a; border-color:#475569; color:#e2e8f0; }
.dark .gps-doc .header-text h3, .dark .gps-doc .header-text h4, .dark .gps-doc .header-text p { color:#e2e8f0; }
.dark .gps-doc .header-text p.subtext { color:#94a3b8; }
.dark .gps-doc .payslip-title h2 { color:#e2e8f0; }
</style>