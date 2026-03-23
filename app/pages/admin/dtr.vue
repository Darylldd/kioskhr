<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const employee  = computed(() => authStore.employee)

// ── Dark mode ──────────────────────────────────────────────
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

// ── Filters ────────────────────────────────────────────────
const currentYear   = new Date().getFullYear()
const selectedYear  = ref(currentYear)
const selectedMonth = ref(String(new Date().getMonth() + 1))
const months = [
  { value: '0', label: 'All Months' },
  { value: '1',  label: 'January'   }, { value: '2',  label: 'February'  },
  { value: '3',  label: 'March'     }, { value: '4',  label: 'April'     },
  { value: '5',  label: 'May'       }, { value: '6',  label: 'June'      },
  { value: '7',  label: 'July'      }, { value: '8',  label: 'August'    },
  { value: '9',  label: 'September' }, { value: '10', label: 'October'   },
  { value: '11', label: 'November'  }, { value: '12', label: 'December'  },
]

// ── Data ───────────────────────────────────────────────────
const users   = ref<any[]>([])
const loading = ref(true)
const error   = ref('')

async function fetchAll() {
  loading.value = true
  error.value   = ''
  try {
    const data = await $fetch<any>('/api/admin/dtr', {
      query: { year: selectedYear.value, month: selectedMonth.value }
    })
    users.value = data.users
  } catch (e: any) {
    error.value = e?.data?.message || 'Error fetching DTR records.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

// ── Search ─────────────────────────────────────────────────
const searchQuery = ref('')
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.trim().toLowerCase()
  return users.value.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.department.toLowerCase().includes(q)
  )
})

// ── Helpers ────────────────────────────────────────────────
function formatDate(ts: any) {
  if (!ts) return '—'
  return new Date(ts).toISOString().split('T')[0]
}
function formatTime(ts: any) {
  if (!ts) return null
  return new Date(ts).toLocaleTimeString()
}
function totalHours(records: any[]) {
  return records.reduce((sum, r) => {
    if (r.hours && r.hours !== '-') return sum + parseFloat(r.hours)
    return sum
  }, 0).toFixed(2)
}
const selectedMonthLabel = computed(() => {
  if (selectedMonth.value === '0') return 'All Months'
  return new Date(2000, parseInt(selectedMonth.value) - 1).toLocaleString('default', { month: 'long' })
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <!-- ── Top nav ──────────────────────────────────────── -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="font-display text-lg text-navy-700 dark:text-navy-200 hidden sm:block
                       group-hover:text-navy-500 dark:group-hover:text-navy-300 transition-colors">
            Employee Portal
          </span>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <span class="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                       bg-navy-50 dark:bg-navy-900/50 text-navy-600 dark:text-navy-300
                       border border-navy-100 dark:border-navy-800">
            {{ employee?.department }}
          </span>

          <button @click="toggleTheme" aria-label="Toggle dark mode"
            class="p-2 rounded-lg border border-slate-200 dark:border-slate-700
                   text-slate-500 dark:text-slate-400 hover:text-navy-500 dark:hover:text-navy-300
                   bg-white dark:bg-slate-800 transition-all duration-200">
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
                   border border-slate-200 dark:border-slate-700
                   text-slate-600 dark:text-slate-300 hover:text-navy-600 dark:hover:text-navy-300
                   bg-white dark:bg-slate-800 hover:bg-navy-50 dark:hover:bg-navy-900/20 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span class="hidden sm:inline">Dashboard</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- ── Page body ────────────────────────────────────── -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      <div class="mb-6">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">All Employees DTR</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Viewing as <strong class="text-slate-600 dark:text-slate-300">{{ employee?.first_name }} {{ employee?.last_name }}</strong>
        </p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/25 border border-red-200 text-red-700 text-sm">
        {{ error }}
      </div>

      <!-- ── Filter bar ────────────────────────────────── -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                  rounded-xl px-5 py-4 mb-6 shadow-sm">
        <div class="flex flex-wrap items-end gap-4">

          <div class="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
            Filter by:
          </div>

          <!-- Year -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-slate-500 dark:text-slate-400">Year</label>
            <select v-model="selectedYear"
              class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                     bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition">
              <option :value="currentYear">{{ currentYear }} (This Year)</option>
              <option :value="currentYear - 1">{{ currentYear - 1 }} (Last Year)</option>
            </select>
          </div>

          <!-- Month -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-slate-500 dark:text-slate-400">Month</label>
            <select v-model="selectedMonth"
              class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                     bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition">
              <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>

          <button @click="fetchAll" :disabled="loading"
            class="px-5 py-2 rounded-lg text-sm font-semibold
                   bg-navy-500 hover:bg-navy-600 text-white shadow-sm hover:shadow
                   active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
            {{ loading ? 'Loading...' : 'Apply Filter' }}
          </button>
        </div>
      </div>

      <!-- ── Search ────────────────────────────────────── -->
      <div class="relative mb-4">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
        </span>
        <input v-model="searchQuery" type="text"
          placeholder="Search by name, email, or department..."
          class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600
                 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                 placeholder-slate-400 dark:placeholder-slate-500
                 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent shadow-sm transition" />
      </div>

      <!-- Results heading -->
      <div class="flex items-center justify-between mb-5">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Showing:
          <span class="font-semibold text-slate-700 dark:text-slate-200">{{ selectedMonthLabel }} {{ selectedYear }}</span>
          &mdash;
          <span class="font-semibold text-slate-700 dark:text-slate-200">{{ filteredUsers.length }}</span>
          employee{{ filteredUsers.length !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">Loading...</div>

      <!-- No records -->
      <div v-else-if="filteredUsers.length === 0"
        class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-14 text-center">
        <svg class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p class="text-slate-400 dark:text-slate-500 text-sm">
          {{ searchQuery ? 'No employees match your search.' : 'No records found for the selected period.' }}
        </p>
      </div>

      <!-- ── Employee cards ─────────────────────────────── -->
      <div v-else class="space-y-6">
        <div v-for="user in filteredUsers" :key="user.name"
          class="employee-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">

          <!-- Employee header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3
                      px-5 py-4 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-navy-100 dark:bg-navy-900 text-navy-600 dark:text-navy-300
                          flex items-center justify-center text-sm font-bold shrink-0">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ user.name }}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500">{{ user.email }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3 flex-wrap">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                           bg-navy-50 dark:bg-navy-900/50 text-navy-600 dark:text-navy-300
                           border border-navy-100 dark:border-navy-800">
                {{ user.department }}
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                           bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400
                           border border-emerald-100 dark:border-emerald-800">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ totalHours(user.records) }} hrs total
              </span>
            </div>
          </div>

          <!-- Records table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500
                           bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <th class="px-5 py-3 text-left font-semibold">Date</th>
                  <th class="px-5 py-3 text-left font-semibold">Time In</th>
                  <th class="px-5 py-3 text-left font-semibold">Time Out</th>
                  <th class="px-5 py-3 text-right font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-if="user.records.length === 0">
                  <td colspan="4" class="px-5 py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                    No attendance records for this period.
                  </td>
                </tr>
                <tr v-for="record in user.records" :key="record.date"
                    class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-100">
                  <td class="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                    {{ formatDate(record.date) }}
                  </td>
                  <td class="px-5 py-3 text-slate-600 dark:text-slate-400">
                    <span v-if="record.time_in" class="inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                      {{ formatTime(record.time_in) }}
                    </span>
                    <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                  </td>
                  <td class="px-5 py-3 text-slate-600 dark:text-slate-400">
                    <span v-if="record.time_out" class="inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      {{ formatTime(record.time_out) }}
                    </span>
                    <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <span v-if="record.hours && record.hours !== '-'" class="font-semibold text-navy-600 dark:text-navy-300">
                      {{ record.hours }}<span class="text-xs font-normal text-slate-400 dark:text-slate-500"> hrs</span>
                    </span>
                    <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                  </td>
                </tr>

                <!-- Total row -->
                <tr class="bg-slate-50 dark:bg-slate-700/30 border-t-2 border-slate-200 dark:border-slate-600">
                  <td colspan="3" class="px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Total Hours</td>
                  <td class="px-5 py-3 text-right font-bold text-navy-700 dark:text-navy-200">
                    {{ totalHours(user.records) }}<span class="text-xs font-normal text-slate-400 dark:text-slate-500"> hrs</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>