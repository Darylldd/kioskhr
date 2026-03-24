<script setup lang="ts">
useSeoMeta({
  title: 'My DTR'
})
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

// ── Data ───────────────────────────────────────────────────
const records     = ref<any[]>([])
const todayRecord = ref<any>(null)
const todayHours  = ref('0.00')
const weekHours   = ref('0.00')
const loading     = ref(true)
const actionLoading = ref(false)
const error       = ref('')

async function fetchDTR() {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/dtr')
    records.value     = data.records
    todayRecord.value = data.todayRecord
    todayHours.value  = data.todayHours
    weekHours.value   = data.weekHours
  } catch (e: any) {
    error.value = e?.data?.message || 'Error fetching DTR.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDTR)

// ── Clock In / Out ─────────────────────────────────────────
async function clockIn() {
  actionLoading.value = true
  error.value = ''
  try {
    await $fetch('/api/dtr/clockin', { method: 'POST' })
    await fetchDTR()
  } catch (e: any) {
    error.value = e?.data?.message || 'Error clocking in.'
  } finally {
    actionLoading.value = false
  }
}

async function clockOut() {
  actionLoading.value = true
  error.value = ''
  try {
    await $fetch('/api/dtr/clockout', { method: 'POST' })
    await fetchDTR()
  } catch (e: any) {
    error.value = e?.data?.message || 'Error clocking out.'
  } finally {
    actionLoading.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────
function formatTime(ts: any) {
  if (!ts) return null
  return new Date(ts).toLocaleTimeString()
}
function formatDate(ts: any) {
  if (!ts) return '—'
  return new Date(ts).toISOString().split('T')[0]
}
function calcHours(timeIn: any, timeOut: any) {
  if (!timeIn || !timeOut) return null
  return ((new Date(timeOut).getTime() - new Date(timeIn).getTime()) / 1000 / 3600).toFixed(2)
}

const todayStatus = computed(() => {
  if (!todayRecord.value?.time_in) return 'not-in'
  if (todayRecord.value?.time_in && !todayRecord.value?.time_out) return 'clocked-in'
  return 'done'
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <!-- ── Top nav ──────────────────────────────────────── -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 group">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="font-display text-lg text-navy-700 dark:text-navy-200 hidden sm:block group-hover:text-navy-500 transition-colors">
            Employee Portal
          </span>
        </NuxtLink>

        <div class="flex items-center gap-2">
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
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      <div class="mb-6">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Daily Time Record</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track your attendance and working hours</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">Loading...</div>

      <template v-else>

        <!-- ── Stat cards ──────────────────────────────── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Status Today</p>
            <p v-if="todayStatus === 'not-in'"    class="text-base font-semibold text-slate-500 dark:text-slate-400">Not yet clocked in</p>
            <p v-else-if="todayStatus === 'clocked-in'" class="text-base font-semibold text-green-600 dark:text-green-400">Currently clocked in</p>
            <p v-else                              class="text-base font-semibold text-navy-600 dark:text-navy-300">Completed</p>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Hours Today</p>
            <p class="text-2xl font-semibold text-navy-700 dark:text-navy-200">
              {{ todayHours }}<span class="text-sm font-normal text-slate-400 dark:text-slate-500"> hrs</span>
            </p>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">This Week</p>
            <p class="text-2xl font-semibold text-navy-700 dark:text-navy-200">
              {{ weekHours }}<span class="text-sm font-normal text-slate-400 dark:text-slate-500"> hrs</span>
            </p>
          </div>
        </div>

        <!-- ── Clock in / out action ───────────────────── -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-5 mb-8
                    flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Attendance Action</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              <template v-if="todayStatus === 'not-in'">Ready to start your shift? Clock in now.</template>
              <template v-else-if="todayStatus === 'clocked-in'">You clocked in at {{ formatTime(todayRecord.time_in) }}. End your shift when ready.</template>
              <template v-else>Shift complete. Clocked out at {{ formatTime(todayRecord.time_out) }}.</template>
            </p>
          </div>

          <!-- Time In -->
          <button v-if="todayStatus === 'not-in'" @click="clockIn" :disabled="actionLoading"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                   bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg
                   active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            {{ actionLoading ? 'Processing...' : 'Time In' }}
          </button>

          <!-- Time Out -->
          <button v-else-if="todayStatus === 'clocked-in'" @click="clockOut" :disabled="actionLoading"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                   bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg
                   active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {{ actionLoading ? 'Processing...' : 'Time Out' }}
          </button>

          <!-- Done -->
          <span v-else class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                              bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400
                              border border-slate-200 dark:border-slate-600">
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Done for today
          </span>
        </div>

        <!-- ── DTR Table ───────────────────────────────── -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Attendance History</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th class="px-5 py-3 text-left font-semibold">Date</th>
                  <th class="px-5 py-3 text-left font-semibold">Time In</th>
                  <th class="px-5 py-3 text-left font-semibold">Time Out</th>
                  <th class="px-5 py-3 text-right font-semibold">Hours Worked</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-if="records.length === 0">
                  <td colspan="4" class="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No attendance records found.
                  </td>
                </tr>
                <tr v-for="record in records" :key="record.id"
                    class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-100">
                  <td class="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                    {{ formatDate(record.date) }}
                  </td>
                  <td class="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    <span v-if="record.time_in" class="inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                      {{ formatTime(record.time_in) }}
                    </span>
                    <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                  </td>
                  <td class="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    <span v-if="record.time_out" class="inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      {{ formatTime(record.time_out) }}
                    </span>
                    <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                  </td>
                  <td class="px-5 py-3.5 text-right">
                    <span v-if="calcHours(record.time_in, record.time_out)" class="font-semibold text-navy-600 dark:text-navy-300">
                      {{ calcHours(record.time_in, record.time_out) }}
                      <span class="text-xs font-normal text-slate-400 dark:text-slate-500">hrs</span>
                    </span>
                    <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>
    </main>
  </div>
</template>