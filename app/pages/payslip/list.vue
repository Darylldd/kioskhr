<script setup lang="ts">
useSeoMeta({
  title: 'Payslip List'
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

const payslips    = ref<any[]>([])
const loading     = ref(true)
const error       = ref('')
const searchQuery = ref('')

async function fetchPayslips() {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/payslip/list')
    payslips.value = data.payslips
  } catch (e: any) {
    error.value = e?.data?.message || 'Error fetching payslips.'
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return payslips.value
  return payslips.value.filter(p =>
    `${p.employee_name} ${p.month} ${p.cutoff}`.toLowerCase().includes(q)
  )
})

// ── View modal ─────────────────────────────────────────────
const showModal    = ref(false)
const modalLoading = ref(false)
const modalError   = ref('')
const modalData    = ref<any>(null)

async function viewPayslip(ref: string) {
  showModal.value    = true
  modalLoading.value = true
  modalData.value    = null
  modalError.value   = ''
  try {
    const data = await $fetch<any>(`/api/payslip/${encodeURIComponent(ref)}`)
    modalData.value = data
  } catch {
    modalError.value = 'Failed to load payslip.'
  } finally {
    modalLoading.value = false
  }
}

async function printPayslip(ref: string) {
  try {
    const data = await $fetch<any>('/api/payslip/print', { method: 'POST', body: { payslip_ref: ref } })
    sessionStorage.setItem('print_payslip_data', JSON.stringify(data))
    window.open('/payslip/print', '_blank')
  } catch (e: any) {
    alert(e?.data?.message || 'Error loading payslip for print.')
  }
}

// ── Email ──────────────────────────────────────────────────
const showEmailModal  = ref(false)
const pendingEmailId  = ref('')
const emailLoading    = ref(false)
const emailToast      = ref('')
const emailToastOk    = ref(true)
const emailToastShow  = ref(false)

function openEmailModal(id: string) { pendingEmailId.value = id; showEmailModal.value = true }

async function sendEmail() {
  showEmailModal.value = false
  emailLoading.value   = true
  try {
    const msg = await $fetch<string>(`/api/payslip/send-email/${pendingEmailId.value}`)
    emailToast.value   = msg || 'Payslip sent successfully.'
    emailToastOk.value = true
  } catch (e: any) {
    emailToast.value   = e?.data?.message || 'Email sending failed.'
    emailToastOk.value = false
  } finally {
    emailLoading.value  = false
    emailToastShow.value = true
    setTimeout(() => { emailToastShow.value = false }, 4000)
  }
}

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { showModal.value = false; showEmailModal.value = false }
  })
})

function cutoffLabel(c: string) { return c === 'FIRST_HALF' ? '1st Half' : '2nd Half' }
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
          <NuxtLink to="/payslip/create" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-navy-500 hover:bg-navy-600 text-white shadow-sm hover:shadow transition-all duration-200">
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
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">All Payslips</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage and distribute employee payslips</p>
      </div>

      <div v-if="error" class="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>

      <!-- Search -->
      <div class="relative mb-4">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
        </span>
        <input v-model="searchQuery" type="text" placeholder="Search by employee name, month, or cutoff..."
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
                <th class="px-5 py-3 text-left font-semibold hidden sm:table-cell">Cutoff</th>
                <th class="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-if="filtered.length === 0">
                <td colspan="4" class="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">No payslips found.</td>
              </tr>
              <tr v-for="p in filtered" :key="p.payslip_ref" class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-100">
                <td class="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">{{ p.employee_name }}</td>
                <td class="px-5 py-3.5 text-slate-600 dark:text-slate-300">{{ p.month }}</td>
                <td class="px-5 py-3.5 hidden sm:table-cell">
                  <span :class="p.cutoff === 'FIRST_HALF'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'
                    : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                    {{ cutoffLabel(p.cutoff) }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button @click="viewPayslip(p.payslip_ref)" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      View
                    </button>
                    <button @click="printPayslip(p.payslip_ref)" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                      Print
                    </button>
                    <button @click="openEmailModal(p.id)" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      Email
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- View modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" @click.self="showModal = false">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <h3 class="font-display text-lg text-navy-700 dark:text-navy-200">Payslip</h3>
            <button @click="showModal = false" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="overflow-y-auto flex-1 p-4">
            <div v-if="modalLoading" class="flex items-center justify-center py-12">
              <svg class="animate-spin w-6 h-6 text-navy-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            </div>
            <p v-else-if="modalError" class="text-center text-red-500 text-sm py-8">{{ modalError }}</p>
            <template v-else-if="modalData">
              <div style="text-align:right; padding:8px 12px;">
                <button @click="printPayslip(modalData.payslip_ref)"
                  style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;background:#1a5276;color:#fff;border:none;cursor:pointer;">
                  🖨️ Print
                </button>
              </div>
              <PayslipDocument :data="modalData" />
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Email confirm modal -->
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

    <!-- Email toast -->
    <Teleport to="body">
      <div v-if="emailToastShow" class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium">
        <svg :class="emailToastOk ? 'text-emerald-500' : 'text-red-500'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="emailToastOk" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <span>{{ emailToast }}</span>
      </div>
    </Teleport>
  </div>
</template>