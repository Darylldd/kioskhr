<script setup lang="ts">
useSeoMeta({
  title: 'Paysliip Create'
})

const isDark = ref(false)
onMounted(async () => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
  await fetchEmployees()
})
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const router    = useRouter()
const loading   = ref(false)
const error     = ref('')
const employees = ref<any[]>([])

async function fetchEmployees() {
  try {
    const data = await $fetch<any>('/api/employees')
    employees.value = data.employees
  } catch {}
}

// ── Form ───────────────────────────────────────────────────
const form = reactive({
  employee_id:      '',
  month:            '',
  cutoff:           '',
  basic_pay:        '',
  late_absences:    '',
  pagibig_mp1:      '',
  pagibig_mp2:      '',
  pagibig_mpl:      '',
  pagibig_calamity: '',
  sss:              '',
  philhealth:       '',
  tax:              '',
  disallowances:    '',
})

const accountNo = computed(() => {
  const emp = employees.value.find(e => String(e.id) === String(form.employee_id))
  return emp?.account_no || '——'
})

// ── Live calculation ───────────────────────────────────────
function n(v: any) { const x = parseFloat(v); return (isNaN(x) || x < 0) ? 0 : x }

const totalEarnings   = computed(() => n(form.basic_pay))
const totalDeductions = computed(() =>
  n(form.late_absences) + n(form.pagibig_mp1) + n(form.pagibig_mp2) +
  n(form.pagibig_mpl) + n(form.pagibig_calamity) + n(form.sss) +
  n(form.philhealth) + n(form.tax) + n(form.disallowances)
)
const netPay = computed(() => totalEarnings.value - totalDeductions.value)

function fmt(x: number) { return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

async function handleSubmit() {
  if (!form.employee_id || !form.month || !form.cutoff) {
    error.value = 'Employee, Month and Cutoff are required.'
    return
  }
  loading.value = true
  error.value   = ''
  try {
    await $fetch('/api/payslip/create', { method: 'POST', body: { ...form } })
    router.push('/payslip/list')
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to create payslip.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
          <NuxtLink to="/payslip/list" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span class="hidden sm:inline">All Payslips</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Create Payslip</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Bureau of Fisheries and Aquatic Resources · MIMAROPA Region</p>
      </div>

      <div v-if="error" class="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>

      <form @submit.prevent="handleSubmit" class="space-y-5">

        <!-- Employee & Period -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Employee &amp; Period</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <div class="sm:col-span-2 lg:col-span-1">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Employee <span class="text-red-400">*</span></label>
              <select v-model="form.employee_id" required
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition">
                <option value="">-- Select Employee --</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                  {{ `${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''}`.trim().toUpperCase() }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Account No.</label>
              <div class="px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-mono">
                {{ accountNo }}
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Month <span class="text-red-400">*</span></label>
              <input v-model="form.month" type="month" required
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Cutoff <span class="text-red-400">*</span></label>
              <select v-model="form.cutoff" required
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition">
                <option value="">Which Half</option>
                <option value="FIRST_HALF">1st Half</option>
                <option value="SECOND_HALF">2nd Half</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Earnings & Deductions -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Earnings &amp; Deductions</h2>

          <!-- Live totals -->
          <div class="grid grid-cols-3 gap-4 mb-5">
            <div class="bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
              <p class="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Total Earnings</p>
              <p class="text-lg font-bold text-slate-700 dark:text-slate-200 font-mono">{{ fmt(totalEarnings) }}</p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
              <p class="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Total Deductions</p>
              <p class="text-lg font-bold text-slate-700 dark:text-slate-200 font-mono">{{ fmt(totalDeductions) }}</p>
            </div>
            <div class="bg-navy-50 dark:bg-navy-900/30 rounded-lg px-4 py-3 border border-navy-200 dark:border-navy-800">
              <p class="text-xs text-navy-400 uppercase tracking-wide mb-0.5">Net Pay</p>
              <p :class="netPay < 0 ? 'text-red-500' : 'text-navy-700 dark:text-navy-200'" class="text-lg font-bold font-mono">{{ fmt(netPay) }}</p>
            </div>
          </div>

          <!-- Payroll table -->
          <div class="overflow-x-auto">
            <table class="pr-table">
              <thead>
                <tr>
                  <td class="bg-blue" style="width:25%;">EARNINGS</td>
                  <td class="bg-blue" style="width:20%;">Amount</td>
                  <td class="bg-blue" style="width:35%;">DEDUCTIONS</td>
                  <td class="bg-blue" style="width:20%;">Amount</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:10px;vertical-align:top;">Basic Pay</td>
                  <td style="padding:10px;vertical-align:top;text-align:center;">
                    <input v-model="form.basic_pay" type="number" step="0.01" class="calc-input" placeholder="0.00" required />
                  </td>
                  <td style="padding:0;">
                    <div v-for="label in ['LATE/ABSENCES','PAG-IBIG (MP1)','PAG-IBIG (MP2)','PAG-IBIG (MPL)','PAG-IBIG (Calamity Loan)','SSS','PHILHEALTH','TAX','DISALLOWANCES']"
                      :key="label" class="row-label">{{ label }}</div>
                  </td>
                  <td style="padding:0;vertical-align:top;">
                    <div v-for="key in ['late_absences','pagibig_mp1','pagibig_mp2','pagibig_mpl','pagibig_calamity','sss','philhealth','tax','disallowances']"
                      :key="key" style="border-bottom:1px solid #eee;padding:4px 0;">
                      <input v-model="(form as any)[key]" type="number" step="0.01" class="calc-input" placeholder="0.00" />
                    </div>
                  </td>
                </tr>
                <tr style="border-top:2px solid #000;">
                  <td class="pr-total">Total Earnings</td>
                  <td class="pr-total">{{ fmt(totalEarnings) }}</td>
                  <td class="pr-total" style="text-align:right;">Total Deductions</td>
                  <td class="pr-total">{{ fmt(totalDeductions) }}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:none;"></td>
                  <td class="bg-blue" style="border:1px solid #000;padding:12px 10px;text-align:right;font-weight:bold;font-family:Arial,sans-serif;">Net Pay</td>
                  <td class="pr-netpay">{{ fmt(netPay) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <NuxtLink to="/payslip/list" class="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all duration-200">Cancel</NuxtLink>
          <button type="submit" :disabled="loading"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-navy-500 hover:bg-navy-600 text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            {{ loading ? 'Saving...' : 'Save Payslip' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<style>
.pr-table * { box-sizing: border-box; }
.pr-table { width:100%; border-collapse:collapse; border:2px solid #000; font-size:13px; font-family:Arial,sans-serif; }
.pr-table td { border:1px solid #000; vertical-align:top; color:#111; background:#fff; }
.pr-table .bg-blue { background-color:#c0ecf8 !important; font-weight:bold; text-align:center; padding:10px; color:#000; }
.pr-table .row-label { padding:8px 10px; border-bottom:1px solid #eee; font-family:Arial,sans-serif; font-size:13px; color:#111; }
.pr-table .row-label:last-child { border-bottom:none; }
.pr-table .calc-input { width:90%; padding:4px 8px; text-align:right; border:1px solid #ccc; border-radius:3px; font-family:inherit; font-size:13px; background:#fff; color:#111; display:block; margin:4px auto; }
.pr-table .calc-input:focus { outline:none; border-color:#1a4d80; }
.pr-total { font-weight:bold; padding:10px; text-align:center; font-family:Arial,sans-serif; color:#111; }
.pr-netpay { font-weight:bold; padding:12px 10px; text-align:center; font-family:Arial,sans-serif; color:#0056b3; background-color:#c0ecf8 !important; }
.dark .pr-table td { border-color:#475569; background:#1e293b; color:#e2e8f0; }
.dark .pr-table .bg-blue { background-color:#1e4060 !important; color:#bfdbfe; }
.dark .pr-table .row-label { color:#cbd5e1; border-bottom-color:#334155; }
.dark .pr-table .calc-input { background:#0f172a; border-color:#475569; color:#e2e8f0; }
.dark .pr-total { color:#e2e8f0; }
.dark .pr-netpay { background-color:#1e4060 !important; color:#93c5fd; }
</style>