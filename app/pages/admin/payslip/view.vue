<script setup lang="ts">
useSeoMeta({
  title: 'View Payslip'
})
const isDark   = ref(false)
const router   = useRouter()
const payslip  = ref<any>(null)
const otherDeds = ref<any[]>([])

const LABEL_MAP: Record<string, string> = {
  gsis_per_share:'GSIS Per Share', medicare:'Medicare 5%', pagibig:'Pag Ibig',
  withholding_tax:'Withholding Tax', provident_403:'403 Provident Fund',
  gsis_emerg_337:'337 GSIS-Emerg. Loan', gsis_mpl_346:'346 GSIS-MPL',
  hdmf_mpl_440:'440 HDMF-MPL', islai_premium:'ISLAI-Premium', islai_loan:'ISLAI-Loan',
  hdmf_cal:'HDMF-CAL', ucpb_loan:'UCPB Loan', islai_emergency:'ISLAI-Emergency',
  gsis_cpl:'GSIS-CPL', gsis_mpl_lite:'GSIS-MPL LITE', ucpb_kasama_salary:'UCPB KASAMA MO',
  gsis_policy_regular:'GSIS-Policy Reg', palda_capital_share:'PAL-DA Capital',
  palda_coopbank_share:'PAL-DA CoopBank', bfar_coop_additional:"BFAR Coop Addt'l",
  palda_regular:'PAL-DA Regular',
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
  const raw = sessionStorage.getItem('admin_payslip_view')
  if (!raw) { router.push('/admin/payslip/list'); return }
  const data = JSON.parse(raw)
  payslip.value  = data
  otherDeds.value = typeof data.other_deductions === 'string'
    ? JSON.parse(data.other_deductions)
    : (data.other_deductions || [])
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function fmt(v: any) { return Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const activeLabelDeds = computed(() =>
  Object.entries(LABEL_MAP)
    .filter(([k]) => Number(payslip.value?.[k] || 0) > 0)
    .map(([k, label]) => ({ label, value: fmt(payslip.value?.[k]) }))
)

async function printPayslip() {
  if (!payslip.value) return
  try {
    const data = await $fetch<any>('/api/admin/payslip/print', {
      method: 'POST',
      body: { ref: payslip.value.admin_payslip_ref }
    })
    sessionStorage.setItem('admin_payslip_print', JSON.stringify(data))
    window.open('/admin/payslip/print', '_blank')
  } catch { alert('Error loading payslip for print.') }
}
</script>

<template>
  <div v-if="payslip" class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <span class="font-display text-lg text-navy-700 dark:text-navy-200 hidden sm:block group-hover:text-navy-500 transition-colors">Employee Portal</span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <button @click="printPayslip"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span class="hidden sm:inline">Print</span>
          </button>
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

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header card -->
      <div class="bg-gradient-to-r from-navy-600 to-navy-500 dark:from-navy-700 dark:to-navy-600 rounded-2xl px-6 py-5 text-white shadow-lg mb-6">
        <p class="text-navy-200 text-sm mb-0.5">Gov't Payslip</p>
        <h2 class="font-display text-xl">{{ payslip.employee_name }}</h2>
        <p class="text-navy-200 text-sm mt-1">{{ payslip.month }} {{ payslip.year }}<span v-if="payslip.position"> — {{ payslip.position }}</span></p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Gross Pay</p>
          <p class="text-2xl font-bold text-slate-700 dark:text-slate-200 font-mono">₱ {{ fmt(payslip.total_gross) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Total Deductions</p>
          <p class="text-2xl font-bold text-red-500 dark:text-red-400 font-mono">₱ {{ fmt(payslip.total_deductions) }}</p>
        </div>
        <div class="bg-navy-50 dark:bg-navy-900/30 rounded-xl border border-navy-200 dark:border-navy-800 px-5 py-4">
          <p class="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">Net Pay</p>
          <p class="text-2xl font-bold text-navy-700 dark:text-navy-200 font-mono">₱ {{ fmt(payslip.net_pay) }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Gross Earnings -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
            <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Gross Earnings</h2>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            <div class="flex justify-between px-5 py-3"><span class="text-slate-600 dark:text-slate-300">Monthly Salary</span><span class="font-mono font-semibold text-slate-700 dark:text-slate-200">₱ {{ fmt(payslip.monthly_salary) }}</span></div>
            <div class="flex justify-between px-5 py-3"><span class="text-slate-600 dark:text-slate-300">PERA</span><span class="font-mono font-semibold text-slate-700 dark:text-slate-200">₱ 2,000.00</span></div>
            <div class="flex justify-between px-5 py-3"><span class="font-semibold text-slate-500 dark:text-slate-400">1st Period</span><span class="font-mono font-semibold text-navy-600 dark:text-navy-300">₱ {{ fmt(payslip.first_period) }}</span></div>
            <div class="flex justify-between px-5 py-3"><span class="font-semibold text-slate-500 dark:text-slate-400">2nd Period</span><span class="font-mono font-semibold text-navy-600 dark:text-navy-300">₱ {{ fmt(payslip.second_period) }}</span></div>
          </div>
        </div>

        <!-- Deductions -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
            <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Deductions</h2>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-700 text-sm max-h-96 overflow-y-auto">
            <div v-for="d in activeLabelDeds" :key="d.label" class="flex justify-between px-5 py-2.5">
              <span class="text-slate-600 dark:text-slate-300">{{ d.label }}</span>
              <span class="font-mono font-semibold text-red-500 dark:text-red-400">₱ {{ d.value }}</span>
            </div>
            <div v-for="d in otherDeds" :key="d.name" class="flex justify-between px-5 py-2.5">
              <span class="text-slate-600 dark:text-slate-300">{{ d.name }}</span>
              <span class="font-mono font-semibold text-red-500 dark:text-red-400">₱ {{ fmt(d.amount) }}</span>
            </div>
            <div v-if="activeLabelDeds.length === 0 && otherDeds.length === 0" class="px-5 py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic">No deductions recorded.</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>