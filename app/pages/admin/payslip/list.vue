<script setup lang="ts">
useSeoMeta({
  title: 'Employee List'
})
const isDark = ref(false)
onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
  fetchPayslips()
})
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const router      = useRouter()
const payslips    = ref<any[]>([])
const loading     = ref(true)
const error       = ref('')
const flashMsg    = ref('')
const flashOk     = ref(true)
const searchQuery = ref('')

async function fetchPayslips() {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/admin/payslip/list')
    payslips.value = data.payslips
  } catch (e: any) {
    error.value = e?.data?.message || 'Error fetching payslips.'
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return payslips.value
  return payslips.value.filter(p =>
    `${p.employee_name} ${p.month} ${p.year}`.toLowerCase().includes(q)
  )
})

function fmt(v: any) { return Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }

// ── View ───────────────────────────────────────────────────
async function viewPayslip(ref: string) {
  try {
    const data = await $fetch<any>(`/api/admin/payslip/${encodeURIComponent(ref)}`)
    sessionStorage.setItem('admin_payslip_view', JSON.stringify(data))
    router.push('/admin/payslip/view')
  } catch { alert('Payslip not found.') }
}

// ── Print ──────────────────────────────────────────────────
async function printPayslip(ref: string) {
  try {
    const data = await $fetch<any>('/api/admin/payslip/print', { method: 'POST', body: { ref } })
    sessionStorage.setItem('admin_payslip_print', JSON.stringify(data))
    window.open('/admin/payslip/print', '_blank')
  } catch { alert('Error loading payslip for print.') }
}

// ── Delete modal ───────────────────────────────────────────
const showDeleteModal = ref(false)
const deleteId        = ref('')
const deleteLabel     = ref('')

function openDelete(id: string, name: string, month: string, year: string) {
  deleteId.value    = id
  deleteLabel.value = `${name} — ${month} ${year}`
  showDeleteModal.value = true
}

async function confirmDelete() {
  showDeleteModal.value = false
  try {
    await $fetch(`/api/admin/payslip/${deleteId.value}/delete`, { method: 'POST' })
    flashMsg.value = 'Payslip deleted successfully.'
    flashOk.value  = true
    await fetchPayslips()
  } catch (e: any) {
    flashMsg.value = e?.data?.message || 'Failed to delete payslip.'
    flashOk.value  = false
  }
  setTimeout(() => { flashMsg.value = '' }, 4000)
}

// ── Email modal ────────────────────────────────────────────
const showEmailModal = ref(false)
const pendingEmailId = ref('')
const emailLoading   = ref(false)
const toastMsg       = ref('')
const toastOk        = ref(true)
const toastShow      = ref(false)

function openEmail(id: string) { pendingEmailId.value = id; showEmailModal.value = true }

async function sendEmail() {
  showEmailModal.value = false
  emailLoading.value   = true
  try {
    const msg = await $fetch<string>(`/api/admin/payslip/${pendingEmailId.value}/send-email`)
    toastMsg.value = msg || 'Payslip sent successfully.'
    toastOk.value  = true
  } catch (e: any) {
    toastMsg.value = e?.data?.message || 'Email sending failed.'
    toastOk.value  = false
  } finally {
    emailLoading.value = false
    toastShow.value    = true
    setTimeout(() => { toastShow.value = false }, 4000)
  }
}

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { showDeleteModal.value = false; showEmailModal.value = false }
  })
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <span class="font-display text-lg text-navy-700 dark:text-navy-200 hidden sm:block group-hover:text-navy-500 transition-colors">Employee Portal</span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <NuxtLink to="/admin/payslip" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-navy-500 hover:bg-navy-600 text-white shadow-sm hover:shadow transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="hidden sm:inline">New Payslip</span>
          </NuxtLink>
          <button @click="toggleTheme" class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:text-navy-500 transition-all duration-200">
            <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          </button>
          <NuxtLink to="/dashboard" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span class="hidden sm:inline">Dashboard</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Gov't Payslip Records</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Government payslips with GSIS, PERA, and period deductions</p>
      </div>

      <div v-if="flashMsg" :class="flashOk ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/25 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/25 dark:border-red-800 dark:text-red-400'"
        class="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium">
        {{ flashMsg }}
      </div>

      <div v-if="error" class="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>

      <!-- Search -->
      <div class="relative mb-4">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
        </span>
        <input v-model="searchQuery" type="text" placeholder="Search by name, month, or year..."
          class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent shadow-sm transition" />
      </div>

      <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ filtered.length }}</span> record{{ filtered.length !== 1 ? 's' : '' }}
      </p>

      <div v-if="loading" class="text-center py-16 text-slate-400 text-sm">Loading...</div>

      <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <th class="px-5 py-3 text-left font-semibold">Employee</th>
                <th class="px-5 py-3 text-left font-semibold">Month</th>
                <th class="px-5 py-3 text-left font-semibold hidden sm:table-cell">Year</th>
                <th class="px-5 py-3 text-left font-semibold hidden md:table-cell">Net Pay</th>
                <th class="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-if="filtered.length === 0">
                <td colspan="5" class="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">No payslips found.</td>
              </tr>
              <tr v-for="p in filtered" :key="p.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-100">
                <td class="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{{ p.employee_name }}</td>
                <td class="px-5 py-3.5 text-slate-600 dark:text-slate-300">{{ p.month }}</td>
                <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{{ p.year }}</td>
                <td class="px-5 py-3.5 hidden md:table-cell">
                  <span class="font-semibold text-navy-600 dark:text-navy-300 font-mono text-xs">₱ {{ fmt(p.net_pay) }}</span>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button @click="viewPayslip(p.admin_payslip_ref)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      View
                    </button>
                    <button @click="printPayslip(p.admin_payslip_ref)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                      Print
                    </button>
                    <button @click="openEmail(p.id)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      Email
                    </button>
                    <button @click="openDelete(p.id, p.employee_name, p.month, p.year)"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Delete modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" @click.self="showDeleteModal = false">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-sm p-6">
          <h3 class="font-display text-lg text-navy-700 dark:text-navy-200 mb-1">Delete Payslip</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Are you sure you want to delete:</p>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-6">{{ deleteLabel }}</p>
          <div class="flex gap-3 justify-end">
            <button @click="showDeleteModal = false" class="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all duration-200">Cancel</button>
            <button @click="confirmDelete" class="px-5 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow transition-all duration-200">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Email modal -->
    <Teleport to="body">
      <div v-if="showEmailModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" @click.self="showEmailModal = false">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-sm p-6">
          <h3 class="font-display text-lg text-navy-700 dark:text-navy-200 mb-2">Send Payslip</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">This will email the payslip PDF to the employee's registered address. Continue?</p>
          <div class="flex gap-3 justify-end">
            <button @click="showEmailModal = false" class="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all duration-200">Cancel</button>
            <button @click="sendEmail" class="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow transition-all duration-200">Send</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toastShow" class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium">
        <svg :class="toastOk ? 'text-emerald-500' : 'text-red-500'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="toastOk" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <span>{{ toastMsg }}</span>
      </div>
    </Teleport>
  </div>
</template>