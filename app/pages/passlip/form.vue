<script setup lang="ts">
useSeoMeta({
  title: 'Passlip Form'
})

import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const employee  = computed(() => authStore.employee)
const route     = useRoute()
const type      = computed(() => route.query.type as string)

const isDark = ref(false)
onMounted(async () => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
  await loadForm()
})
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// ── Form data ──────────────────────────────────────────────
const previewNo   = ref('')
const today       = ref('')
const filingLabel = ref('')
const records     = ref<any[]>([])
const loading     = ref(true)
const submitting  = ref(false)
const msg         = ref('')
const msgType     = ref<'success' | 'error'>('success')

const department  = ref('')
const officeVisit = ref('')
const purpose     = ref('')

async function loadForm() {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/passlip/form', { query: { type: type.value } })
    previewNo.value   = data.previewNo
    today.value       = data.today
    filingLabel.value = data.filingLabel
    records.value     = data.records
    department.value  = employee.value?.department || ''
  } catch (e: any) {
    msg.value  = e?.data?.message || 'Error loading form.'
    msgType.value = 'error'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!department.value?.trim() || !officeVisit.value?.trim() || !purpose.value?.trim()) {
    msg.value     = '⚠️ Please fill in all required fields.'
    msgType.value = 'error'
    return
  }
  submitting.value = true
  msg.value = ''
  try {
    const data = await $fetch<any>(`/api/passlip/form?type=${type.value}`, {
      method: 'POST',
      body: { department: department.value, office_visit: officeVisit.value, purpose: purpose.value }
    })
    msg.value         = `✅ Passlip submitted! No: ${data.passlipNo} — Dated: ${data.today}`
    msgType.value     = 'success'
    previewNo.value   = data.passlipNo
    today.value       = data.today
    records.value     = data.records
    officeVisit.value = ''
    purpose.value     = ''
  } catch (e: any) {
    msg.value     = e?.data?.message || 'Error submitting passlip.'
    msgType.value = 'error'
  } finally {
    submitting.value = false
  }
}

// ── Records modal ──────────────────────────────────────────
const showModal   = ref(false)
const searchQuery = ref('')
const perPage     = ref(10)
const currentPage = ref(1)

const filteredRecords = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return records.value
  return records.value.filter(r =>
    [r.passlip_no, r.employee_name, r.employee_id, r.department, r.office_visit, r.purpose,
     fmtDate(r.pass_date)].some(v => String(v || '').toLowerCase().includes(q))
  )
})

const totalPages  = computed(() => perPage.value >= 99999 ? 1 : Math.ceil(filteredRecords.value.length / perPage.value))
const pagedRecords = computed(() => {
  if (perPage.value >= 99999) return filteredRecords.value
  const start = (currentPage.value - 1) * perPage.value
  return filteredRecords.value.slice(start, start + perPage.value)
})

watch(searchQuery, () => { currentPage.value = 1 })

function fmtDate(d: any) {
  if (!d) return '—'
  const date = d?._seconds ? new Date(d._seconds * 1000) : new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Print single passlip ───────────────────────────────────
async function printPasslip(passlipNo: string) {
  try {
    const data = await $fetch<any>('/api/passlip/print', { method: 'POST', body: { passlip_no: passlipNo } })
    sessionStorage.setItem('print_passlip_data', JSON.stringify(data))
    window.open('/passlip/print', '_blank')
  } catch (e: any) {
    alert(e?.data?.message || 'Error fetching passlip for print.')
  }
}

// ── Print all records ──────────────────────────────────────
function printAll() {
  const q = searchQuery.value.trim()
  const data = {
    records:   filteredRecords.value,
    typeLabel: type.value === 'regular' ? 'Regular Employee' : 'JO & COS',
    query:     q,
    printed:   new Date().toLocaleString('en-PH'),
  }
  sessionStorage.setItem('print_passlip_all', JSON.stringify(data))
  window.open('/passlip/print-all', '_blank')
}

// ── Toast ──────────────────────────────────────────────────
const showToast = ref(true)

// ── Escape to close modal ──────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') showModal.value = false
  })
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <!-- Filing toast -->
    <div v-if="showToast && filingLabel"
      class="fixed top-20 right-4 z-50 bg-white dark:bg-slate-800 border-l-4 border-amber-400
             rounded-xl shadow-xl flex items-start gap-3 px-4 py-3.5 max-w-xs">
      <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">Filing Notice</p>
        <p class="text-xs text-slate-700 dark:text-slate-200">{{ filingLabel }}</p>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Date on slip: <strong class="text-slate-600 dark:text-slate-300">{{ today }}</strong>
        </p>
      </div>
      <button @click="showToast = false" class="text-slate-300 hover:text-slate-500 transition shrink-0 mt-0.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="font-display text-lg text-navy-700 dark:text-navy-200 hidden sm:block group-hover:text-navy-500 transition-colors">Employee Portal</span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <span :class="type === 'regular'
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
            : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-800'"
            class="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium">
            {{ type === 'regular' ? 'Regular Employee' : 'JO & COS' }}
          </span>
          <button @click="toggleTheme" aria-label="Toggle dark mode"
            class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400
                   bg-white dark:bg-slate-800 hover:text-navy-500 transition-all duration-200">
            <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>
          <NuxtLink to="/dashboard"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                   border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                   text-slate-600 dark:text-slate-300 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span class="hidden sm:inline">Dashboard</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-5">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Pass Slip</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Submit a pass slip for
          <span class="font-medium text-slate-700 dark:text-slate-300">
            {{ type === 'regular' ? 'Regular Employee' : 'JO & COS' }}
          </span>
        </p>
      </div>

      <!-- Alert -->
      <div v-if="msg" :class="msgType === 'error'
        ? 'bg-blue-50 dark:bg-blue-900/25 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
        : 'bg-green-50 dark:bg-green-900/25 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'"
        class="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl border">
        <svg v-if="msgType === 'error'" class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <svg v-else class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-sm font-medium">{{ msg }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-5">
        <button @click="showModal = true"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                 text-slate-600 dark:text-slate-300 hover:text-navy-600 hover:border-navy-400
                 hover:bg-navy-50 transition-all duration-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          View Recorded Passlips
        </button>
      </div>

      <!-- Passlip form document -->
      <div class="passlip-doc">
        <form @submit.prevent="handleSubmit">
          <div class="paper-wrap">
            <img src="/images/uhi.png" class="top-left-banner" alt="" />
            <img src="/images/uhitddd.png" class="bottom-right-banner" alt="" />
            <div class="paper-inner">

              <!-- Header -->
              <div class="header-section">
                <div class="logos">
                  <img src="/images/bp.png" alt="Bagong Pilipinas" />
                  <img src="/images/dabfar.png" alt="DA / BFAR" />
                </div>
                <div class="header-text">
                  Republic of the Philippines<br />
                  Department of Agriculture<br />
                  <strong>BUREAU OF FISHERIES AND AQUATIC RESOURCES</strong><br />
                  REGIONAL FISHERIES OFFICE-MIMAROPA<br />
                  Barangay Sapul, Calapan City, Oriental Mindoro, 5200<br />
                  Tel. No. (043) 288-6305 | Mobile No. 0917-107-2189<br />
                  <span style="font-size:11px; color:#0000EE; text-decoration:underline;">
                    ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph
                  </span>
                </div>
              </div>

              <div class="form-border">
                <div class="section">
                  <div class="control-no">
                    <label>Control No:</label>
                    <input type="text" :value="previewNo" readonly />
                  </div>
                  <h2 class="section-title">PASS SLIP</h2>
                  <div class="pass-slip-top">
                    <div class="left-fields">
                      <div class="input-group">
                        <label>DATE:</label>
                        <input type="text" :value="today" readonly />
                      </div>
                      <div class="input-group">
                        <label>NAME:</label>
                        <input type="text"
                          :value="`${employee?.first_name} ${employee?.middle_name ? employee.middle_name + ' ' : ''}${employee?.last_name}`"
                          readonly />
                      </div>
                      <div class="input-group">
                        <label>DIVISION:</label>
                        <input type="text" v-model="department" required />
                      </div>
                      <div class="input-group">
                        <label>OFFICE/AGENCY TO VISIT:</label>
                        <input type="text" v-model="officeVisit" required />
                      </div>
                    </div>
                    <div class="right-checkboxes">
                      <div class="checkbox-item">
                        <input type="checkbox" :checked="type === 'regular'" disabled />
                        <span>Permanent</span>
                      </div>
                      <div class="checkbox-item">
                        <input type="checkbox" :checked="type !== 'regular'" disabled />
                        <span>COS</span>
                      </div>
                    </div>
                  </div>

                  <div class="purpose-section">
                    <div class="input-group">
                      <label>PURPOSE (specific):</label>
                    </div>
                    <div class="purpose-lines">
                      <input type="text" v-model="purpose" required style="width:100%;" />
                      <input type="text" style="width:100%;" readonly />
                      <input type="text" style="width:100%;" readonly />
                    </div>
                  </div>

                  <div class="signatures">
                    <div class="sig-box">Signature over printed name of employee</div>
                    <div class="sig-box">Signature over printed name of Immediate Supervisor</div>
                  </div>
                </div>

                <div class="section section-divider">
                  <h2 class="section-title">CERTIFICATION</h2>
                  <div class="cert-paragraph">
                    This is to certify that Mr./Ms.
                    <strong class="cert-name-highlight">
                      {{ employee?.first_name }} {{ employee?.middle_name ? employee.middle_name + ' ' : '' }}{{ employee?.last_name }}
                    </strong>
                    of the Bureau of Fisheries and Aquatic Resources (BFAR) has personally appeared at the
                    <input type="text" style="width:80%;margin-top:15px;" readonly />
                    on the above stated purpose.
                  </div>
                  <span class="sub-label">(Name of office)</span>

                  <div class="flex-row" style="margin-top:30px;">
                    <div class="input-group" style="width:48%;">
                      <label>Actual time of visit (log in):</label>
                      <input type="text" />
                    </div>
                    <div class="input-group" style="width:48%;">
                      <label>Actual time finished (log out):</label>
                      <input type="text" />
                    </div>
                  </div>
                  <div class="input-group" style="margin-top:25px;margin-bottom:20px;">
                    <label>Name and signature of staff who assisted:</label>
                    <input type="text" />
                  </div>
                  <div class="input-group" style="margin-bottom:20px;">
                    <label>Position:</label>
                    <input type="text" style="width:50%;" />
                  </div>
                  <div class="flex-row">
                    <div class="input-group" style="width:48%;">
                      <label>Mobile No:</label>
                      <input type="text" />
                    </div>
                    <div class="input-group" style="width:48%;">
                      <label>Telephone No:</label>
                      <input type="text" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="footer-info">
                <span>🌐 www.mimaropa.bfar.da.gov.ph</span>
                <span>ⓕ BFAR Mimaropa Region</span>
              </div>

              <div style="text-align:center;margin:16px 0 8px;">
                <button type="submit" :disabled="submitting"
                  class="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold
                         bg-navy-500 hover:bg-navy-600 text-white shadow-md hover:shadow-lg
                         active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ submitting ? 'Submitting...' : 'Submit Passlip Application' }}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>

    <!-- Records Modal -->
    <Teleport to="body">
      <div v-if="showModal"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="showModal = false">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700
                    w-full max-w-6xl max-h-[92vh] flex flex-col">

          <!-- Modal header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <div>
              <h3 class="font-display text-lg text-navy-700 dark:text-navy-200">Recorded Passlips</h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {{ type === 'regular' ? 'Regular Employee' : 'JO & COS' }} — all submissions
              </p>
            </div>
            <button @click="showModal = false"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Toolbar -->
          <div class="flex flex-wrap items-center gap-2.5 px-6 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0 bg-slate-50/60 dark:bg-slate-800/60">
            <div class="relative flex-1 min-w-[200px] max-w-sm">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input v-model="searchQuery" type="search" placeholder="Search all records…"
                class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-400 transition" />
            </div>
            <select v-model="perPage"
              class="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600
                     bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200
                     text-xs focus:outline-none focus:ring-2 focus:ring-navy-400 transition cursor-pointer">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="99999">All</option>
            </select>
            <span class="text-xs px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              {{ filteredRecords.length }} record{{ filteredRecords.length !== 1 ? 's' : '' }}
            </span>
            <div class="flex-1 hidden sm:block"></div>
            <button @click="printAll"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                     bg-navy-500 hover:bg-navy-600 text-white shadow-sm hover:shadow-md
                     active:scale-[0.97] transition-all duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print All ({{ filteredRecords.length }})
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-y-auto flex-1">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-slate-50 dark:bg-slate-700/90 text-xs uppercase tracking-wider
                              text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 z-10">
                  <tr>
                    <th class="px-5 py-3 text-left font-semibold">Passlip No</th>
                    <th class="px-5 py-3 text-left font-semibold">Date</th>
                    <th class="px-5 py-3 text-left font-semibold">Employee</th>
                    <th class="px-5 py-3 text-left font-semibold hidden md:table-cell">Emp ID</th>
                    <th class="px-5 py-3 text-left font-semibold hidden md:table-cell">Department</th>
                    <th class="px-5 py-3 text-left font-semibold hidden lg:table-cell">Office / Agency</th>
                    <th class="px-5 py-3 text-left font-semibold hidden lg:table-cell">Purpose</th>
                    <th class="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr v-if="filteredRecords.length === 0">
                    <td colspan="8" class="px-5 py-14 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No passlip records found.
                    </td>
                  </tr>
                  <tr v-for="r in pagedRecords" :key="r.id"
                    class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-100">
                    <td class="px-5 py-3.5 font-semibold text-navy-600 dark:text-navy-300 whitespace-nowrap">{{ r.passlip_no }}</td>
                    <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{{ fmtDate(r.pass_date) }}</td>
                    <td class="px-5 py-3.5 text-slate-700 dark:text-slate-200 font-medium">{{ r.employee_name }}</td>
                    <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">{{ r.employee_id || '—' }}</td>
                    <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell max-w-[140px] truncate">{{ r.department }}</td>
                    <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs hidden lg:table-cell max-w-[160px] truncate">{{ r.office_visit }}</td>
                    <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs hidden lg:table-cell max-w-[200px] truncate">{{ r.purpose }}</td>
                    <td class="px-5 py-3.5 text-right">
                      <button @click="printPasslip(r.passlip_no)"
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                               border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900
                               text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600
                               hover:bg-navy-50 dark:hover:bg-navy-900/30 transition-all duration-200">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                        </svg>
                        Print
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination -->
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-3
                      border-t border-slate-100 dark:border-slate-700 shrink-0 bg-slate-50/60 dark:bg-slate-800/60">
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Showing {{ Math.min((currentPage - 1) * perPage + 1, filteredRecords.length) }}–{{ Math.min(currentPage * perPage, filteredRecords.length) }} of {{ filteredRecords.length }}
            </p>
            <div v-if="totalPages > 1" class="flex items-center gap-1">
              <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600
                       bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-navy-50
                       hover:border-navy-400 hover:text-navy-600 transition disabled:opacity-40">‹ Prev</button>
              <button v-for="p in totalPages" :key="p" @click="currentPage = p"
                :class="p === currentPage ? 'bg-navy-500 text-white border-navy-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-navy-50 hover:border-navy-400 hover:text-navy-600'"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border transition">{{ p }}</button>
              <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600
                       bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-navy-50
                       hover:border-navy-400 hover:text-navy-600 transition disabled:opacity-40">Next ›</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style>
.passlip-doc * { box-sizing: border-box; }
.passlip-doc { font-family: Arial, sans-serif; }
.passlip-doc input[type="text"] { border: none; border-bottom: 1px solid #000; background: transparent; font-size: 14px; padding: 2px 5px; outline: none; color: #000; font-family: "Times New Roman", Times, serif; }
.passlip-doc .form-border { border: 2px solid #0e0e0e; margin-bottom: 10px; background-color: rgba(255,255,255,0.97); }
.passlip-doc .form-border, .passlip-doc .form-border * { font-family: "Times New Roman", Times, serif; color: #000; }
.passlip-doc .section { padding: 30px; position: relative; }
.passlip-doc .section-divider { border-top: 2px solid #0e0e0e; }
.passlip-doc .section-title { text-align: center; color: #4a86e8 !important; font-weight: bold; font-size: 20px; margin: 0 0 30px 0; letter-spacing: 1px; }
.passlip-doc .control-no { position: absolute; top: 20px; right: 30px; font-size: 13px; display: flex; align-items: center; gap: 10px; }
.passlip-doc .control-no input { width: 120px; }
.passlip-doc .flex-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
.passlip-doc .input-group { display: flex; align-items: center; gap: 10px; }
.passlip-doc .input-group label { font-size: 13px; white-space: nowrap; font-weight: bold; }
.passlip-doc .input-group input { flex-grow: 1; }
.passlip-doc .pass-slip-top { display: flex; justify-content: space-between; }
.passlip-doc .left-fields { width: 65%; display: flex; flex-direction: column; gap: 15px; }
.passlip-doc .right-checkboxes { width: 30%; display: flex; flex-direction: column; gap: 10px; padding-top: 20px; font-size: 14px; font-weight: bold; }
.passlip-doc .checkbox-item { display: flex; align-items: center; gap: 8px; }
.passlip-doc .checkbox-item input[type="checkbox"] { width: 18px; height: 18px; border: 2px solid #4a86e8; }
.passlip-doc .purpose-section { margin-top: 25px; }
.passlip-doc .purpose-lines { display: flex; flex-direction: column; gap: 25px; margin-top: 10px; }
.passlip-doc .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
.passlip-doc .sig-box { width: 45%; border-top: 1px solid #000; padding-top: 5px; font-size: 12px; font-style: italic; }
.passlip-doc .cert-paragraph { font-size: 14px; line-height: 2.2; text-align: justify; }
.passlip-doc .cert-name-highlight { border-bottom: 1px solid #000; padding: 0 10px; margin: 0 5px; font-weight: bold; display: inline-block; }
.passlip-doc .sub-label { display: block; text-align: center; font-size: 11px; font-style: italic; margin-top: -10px; margin-bottom: 20px; }
.passlip-doc .header-section { display: flex; align-items: center; justify-content: center; margin-bottom: 25px; position: relative; }
.passlip-doc .logos { display: flex; align-items: center; gap: 15px; position: absolute; left: 0; top: 50%; transform: translateY(-50%); }
.passlip-doc .logos img { max-height: 75px; }
.passlip-doc .header-text { text-align: center; font-size: 11px; line-height: 1.4; color: #555; padding-left: 180px; font-family: Arial, sans-serif; }
.passlip-doc .header-text strong { color: #333; font-size: 13px; font-weight: 700; }
.passlip-doc .footer-info { display: flex; align-items: center; gap: 20px; font-size: 12px; color: #666; padding: 10px 0; margin-bottom: 10px; font-family: Arial, sans-serif; }
.passlip-doc .top-left-banner { position: absolute; top: 0; left: 0; width: 50%; max-width: 400px; z-index: 1; }
.passlip-doc .bottom-right-banner { position: absolute; bottom: 0; right: 0; width: 50%; max-width: 400px; z-index: 1; }
.passlip-doc .paper-inner { position: relative; z-index: 2; padding: 40px 40px 30px 40px; }
.passlip-doc .paper-wrap { position: relative; overflow: hidden; background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
</style>