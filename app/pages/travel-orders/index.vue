<script setup lang="ts">
useSeoMeta({
  title: 'Travel Order List'
})

import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const employee  = computed(() => authStore.employee)
const isPrivileged = computed(() =>
  ['hrmu', 'admin'].includes((employee.value?.department || '').toLowerCase())
)

const isDark = ref(false)
onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
})
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// ── Data ───────────────────────────────────────────────────
const orders      = ref<any[]>([])
const loading     = ref(true)
const error       = ref('')
const search      = ref('')
const previewToNo = ref('')
const preview     = ref('')

async function fetchOrders() {
  loading.value = true
  error.value   = ''
  try {
    const data = await $fetch<any>('/api/travel-orders', {
      query: { search: search.value, preview_to_no: previewToNo.value }
    })
    orders.value  = data.orders
    preview.value = data.preview || ''
  } catch (e: any) {
    error.value = e?.data?.message || 'Error fetching travel orders.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrders)

function doSearch() { fetchOrders() }
function clearSearch() { search.value = ''; previewToNo.value = ''; preview.value = ''; fetchOrders() }

function selectPreview(toNo: string) {
  previewToNo.value = toNo
  fetchOrders()
}

// ── Print ──────────────────────────────────────────────────
async function printOrder(toNo: string) {
  try {
    const data = await $fetch<any>('/api/travel-orders/print', {
      method: 'POST',
      body: { to_no: toNo }
    })
    // Store print data and open print page
    sessionStorage.setItem('print_to_data', JSON.stringify(data))
    window.open('/travel-orders/print', '_blank')
  } catch (e: any) {
    alert(e?.data?.message || 'Error fetching travel order for print.')
  }
}

// ── Helpers ────────────────────────────────────────────────
function fmtDate(d: any) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

const previewExt = computed(() => preview.value.split('.').pop()?.toLowerCase())
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <!-- Nav -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
          <NuxtLink v-if="isPrivileged" to="/travel-orders/upload"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                   bg-navy-500 hover:bg-navy-600 text-white shadow-sm hover:shadow transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            <span class="hidden sm:inline">Upload TO</span>
          </NuxtLink>

          <button @click="toggleTheme" aria-label="Toggle dark mode"
            class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400
                   bg-white dark:bg-slate-800 hover:text-navy-500 transition-all duration-200">
            <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
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

    <!-- Body -->
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Travel Orders</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">View and manage employee travel documentation</p>
      </div>

      <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>

      <!-- Split layout -->
      <div class="flex flex-col xl:flex-row gap-5">

        <!-- LEFT: document preview -->
        <div class="xl:w-[480px] shrink-0">
          <div class="sticky top-24">

            <!-- Has preview -->
            <div v-if="preview"
              class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Document Preview</h2>
                <a :href="preview" target="_blank"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300
                         hover:border-navy-400 hover:text-navy-600 transition-all duration-200">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Full View
                </a>
              </div>
              <div class="w-full h-[600px] bg-slate-50 dark:bg-slate-900">
                <iframe v-if="previewExt === 'pdf'" :src="preview" class="w-full h-full border-0"></iframe>
                <img v-else :src="preview" class="w-full h-full object-contain" alt="Travel Order Document" />
              </div>
            </div>

            <!-- No preview -->
            <div v-else
              class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                     flex flex-col items-center justify-center py-20 px-8 text-center gap-3">
              <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-1">
                <svg class="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p class="text-sm font-semibold text-slate-600 dark:text-slate-300">No Document Selected</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">Select a travel order from the list to preview it here</p>
            </div>
          </div>
        </div>

        <!-- RIGHT: search + table -->
        <div class="flex-1 min-w-0 space-y-4">

          <!-- Search -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                </svg>
              </span>
              <input v-model="search" type="text"
                placeholder="Search TO #, name, department, or destination..."
                @keyup.enter="doSearch"
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-400
                       focus:border-transparent shadow-sm transition" />
            </div>
            <button @click="doSearch"
              class="px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0
                     bg-navy-500 hover:bg-navy-600 text-white shadow-sm hover:shadow transition-all duration-200">
              Search
            </button>
            <button v-if="search" @click="clearSearch"
              class="px-4 py-2.5 rounded-xl text-sm font-medium shrink-0
                     border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                     text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all duration-200">
              Clear
            </button>
          </div>

          <!-- Table -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div v-if="loading" class="px-4 py-16 text-center text-slate-400 text-sm">Loading...</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase tracking-wider
                             text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                    <th class="px-4 py-3 text-left font-semibold">TO #</th>
                    <th class="px-4 py-3 text-left font-semibold">Employee/s</th>
                    <th class="px-4 py-3 text-left font-semibold hidden md:table-cell">Department</th>
                    <th class="px-4 py-3 text-left font-semibold hidden lg:table-cell">Destination</th>
                    <th class="px-4 py-3 text-left font-semibold hidden lg:table-cell">Departure</th>
                    <th class="px-4 py-3 text-left font-semibold hidden xl:table-cell">Return</th>
                    <th class="px-4 py-3 text-left font-semibold hidden xl:table-cell">Created</th>
                    <th class="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr v-if="orders.length === 0">
                    <td colspan="8" class="px-4 py-14 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No travel records found.
                    </td>
                  </tr>
                  <tr v-for="order in orders" :key="order.to_no"
                    :class="previewToNo === order.to_no
                      ? 'bg-navy-50 dark:bg-navy-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'"
                    class="transition-colors duration-100">

                    <td class="px-4 py-3.5 font-semibold text-navy-600 dark:text-navy-300 whitespace-nowrap">
                      {{ order.to_no }}
                    </td>
                    <td class="px-4 py-3.5 text-slate-700 dark:text-slate-200 max-w-[180px]">
                      <span class="line-clamp-2 leading-snug">{{ order.employees }}</span>
                    </td>
                    <td class="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden md:table-cell max-w-[150px]">
                      <span class="line-clamp-2 leading-snug text-xs">{{ order.departments }}</span>
                    </td>
                    <td class="px-4 py-3.5 text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                      {{ order.destination }}
                    </td>
                    <td class="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden lg:table-cell text-xs whitespace-nowrap">
                      {{ fmtDate(order.travel_date) }}
                    </td>
                    <td class="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden xl:table-cell text-xs whitespace-nowrap">
                      {{ fmtDate(order.return_date) }}
                    </td>
                    <td class="px-4 py-3.5 text-slate-500 dark:text-slate-400 hidden xl:table-cell text-xs whitespace-nowrap">
                      {{ fmtDate(order.created_at) }}
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                      <div class="inline-flex items-center gap-1.5">

                        <!-- View -->
                        <button @click="selectPreview(order.to_no)"
                          :class="previewToNo === order.to_no
                            ? 'bg-navy-500 text-white shadow-sm'
                            : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600 bg-white dark:bg-slate-900 hover:bg-navy-50'"
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                          {{ previewToNo === order.to_no ? 'Viewing' : 'View' }}
                        </button>

                        <!-- Print -->
                        <button @click="printOrder(order.to_no)"
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

                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>