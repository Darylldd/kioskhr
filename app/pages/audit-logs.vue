<script setup lang="ts">
useSeoMeta({
  title: 'Audit Logs'
})
const isDark = ref(false)
onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  if (isDark.value) document.documentElement.classList.add('dark')
  fetchLogs()
})
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// ── State ──────────────────────────────────────────────────
const logs        = ref<any[]>([])
const total       = ref(0)
const totalPages  = ref(1)
const loading     = ref(true)
const error       = ref('')

const search      = ref('')
const limit       = ref(25)
const page        = ref(1)

// ── Fetch ──────────────────────────────────────────────────
async function fetchLogs() {
  loading.value = true
  error.value   = ''
  try {
    const data = await $fetch<any>('/api/audit-logs', {
      query: { search: search.value, limit: limit.value, page: page.value }
    })
    logs.value       = data.rows
    total.value      = data.total
    totalPages.value = data.totalPages
  } catch (e: any) {
    error.value = e?.data?.message || 'Error fetching audit logs.'
  } finally {
    loading.value = false
  }
}

function doSearch() { page.value = 1; fetchLogs() }
function clearSearch() { search.value = ''; page.value = 1; fetchLogs() }
function changePage(p: number) { page.value = p; fetchLogs() }
function changeLimit(l: number) { limit.value = l; page.value = 1; fetchLogs() }

// ── Helpers ────────────────────────────────────────────────
function fmtDate(d: any) {
  if (!d) return '—'
  const date = d?._seconds ? new Date(d._seconds * 1000) : new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN:           'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  LOGOUT:          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  CREATE_EMPLOYEE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  UPDATE_PROFILE:  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  DELETE_EMPLOYEE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
}
const DEFAULT_BADGE = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
function badgeClass(action: string) { return ACTION_COLORS[action] || DEFAULT_BADGE }
function actionLabel(action: string) { return action.replace(/_/g, ' ') }

// ── Visible page range for pagination ─────────────────────
const pageRange = computed(() => {
  const start = Math.max(1, page.value - 2)
  const end   = Math.min(totalPages.value, page.value + 2)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <!-- Nav -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
          <button @click="toggleTheme"
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
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      <!-- Header row -->
      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Audit Logs</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            System activity ·
            <span class="font-medium text-slate-600 dark:text-slate-300">{{ total }}</span> total records
          </p>
        </div>
        <!-- Rows per page -->
        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-500 dark:text-slate-400">Rows:</label>
          <select :value="limit" @change="changeLimit(+($event.target as HTMLSelectElement).value)"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600
                   bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                   text-xs focus:outline-none focus:ring-2 focus:ring-navy-400 transition cursor-pointer">
            <option v-for="n in [25, 50, 100]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>

      <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>

      <!-- Search -->
      <div class="relative mb-4 flex gap-2">
        <div class="relative flex-1">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
            </svg>
          </span>
          <input v-model="search" type="text"
            placeholder="Search by name, action, details, or IP…"
            @keyup.enter="doSearch"
            class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600
                   bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-navy-400 shadow-sm transition" />
        </div>
        <button @click="doSearch"
          class="px-4 py-2.5 rounded-xl text-sm font-medium bg-navy-500 hover:bg-navy-600 text-white shadow-sm transition-all duration-200">
          Search
        </button>
        <button v-if="search" @click="clearSearch"
          class="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600
                 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300
                 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">
          Clear
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div v-if="loading" class="px-5 py-16 text-center text-slate-400 text-sm">Loading...</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase tracking-wider
                         text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <th class="px-5 py-3 text-left font-semibold">Timestamp</th>
                <th class="px-5 py-3 text-left font-semibold">Employee</th>
                <th class="px-5 py-3 text-left font-semibold">Action</th>
                <th class="px-5 py-3 text-left font-semibold hidden lg:table-cell">Details</th>
                <th class="px-5 py-3 text-left font-semibold hidden md:table-cell">IP Address</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-if="logs.length === 0">
                <td colspan="5" class="px-5 py-14 text-center">
                  <div class="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <svg class="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="text-sm font-medium">
                      {{ search ? `No logs match "${search}".` : 'No audit logs found.' }}
                    </p>
                  </div>
                </td>
              </tr>
              <tr v-for="log in logs" :key="log.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-100">
                <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                  {{ fmtDate(log.created_at) }}
                </td>
                <td class="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                  {{ log.employee_name }}
                </td>
                <td class="px-5 py-3.5">
                  <span :class="badgeClass(log.action)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border">
                    {{ actionLabel(log.action) }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400 hidden lg:table-cell text-xs max-w-xs truncate"
                    :title="log.details || ''">
                  {{ log.details || '—' }}
                </td>
                <td class="px-5 py-3.5 text-slate-400 dark:text-slate-500 hidden md:table-cell text-xs font-mono">
                  {{ log.ip_address || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p class="text-xs text-slate-400 dark:text-slate-500">
          Page {{ page }} of {{ totalPages }} · {{ total }} records
        </p>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button v-if="page > 1" @click="changePage(page - 1)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600
                   bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300
                   hover:bg-navy-50 hover:border-navy-400 hover:text-navy-600 transition">
            ‹ Prev
          </button>
          <button v-for="p in pageRange" :key="p" @click="changePage(p)"
            :class="p === page
              ? 'bg-navy-500 border-navy-500 text-white'
              : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-navy-50 hover:border-navy-400 hover:text-navy-600'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border transition">
            {{ p }}
          </button>
          <button v-if="page < totalPages" @click="changePage(page + 1)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600
                   bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300
                   hover:bg-navy-50 hover:border-navy-400 hover:text-navy-600 transition">
            Next ›
          </button>
        </div>
      </div>

    </main>
  </div>
</template>