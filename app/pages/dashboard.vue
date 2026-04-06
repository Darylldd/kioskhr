<script setup lang="ts">
useSeoMeta({
  title: 'Dashboard'
})
import { useAuthStore } from '~/stores/auth'
const authStore = useAuthStore()
const employee  = computed(() => authStore.employee)
const router    = useRouter()
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
const showPasslip = ref(false)
const showPayslip = ref(false)
const showProfile = ref(false)
const payslipTab  = ref<'create' | 'list'>('create')
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      showPasslip.value = false
      showPayslip.value = false
      showProfile.value = false
    }
  })
})
const handleLogout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        <!-- Brand -->
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-500 dark:bg-navy-600 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="font-display text-lg text-navy-700 dark:text-navy-200 hidden sm:block">Employee Portal</span>
        </div>

        <!-- User info + actions -->
        <div class="flex items-center gap-2 sm:gap-3">

          <!-- Department badge -->
          <span class="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                       bg-navy-50 dark:bg-navy-900/50 text-navy-600 dark:text-navy-300
                       border border-navy-100 dark:border-navy-800">
            {{ employee?.department }}
          </span>

          <!-- Dark mode toggle -->
          <button @click="toggleTheme" aria-label="Toggle dark mode"
            class="p-2 rounded-lg border border-slate-200 dark:border-slate-700
                   text-slate-500 dark:text-slate-400 hover:text-navy-500 dark:hover:text-navy-300
                   bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700
                   transition-all duration-200">
            <!-- Sun (shown in dark mode) -->
            <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
            <!-- Moon (shown in light mode) -->
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>

          <!-- Logout -->
          <button @click="handleLogout"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                   text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400
                   border border-slate-200 dark:border-slate-700
                   bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20
                   transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="hidden sm:inline">Logout</span>
          </button>

        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════
         PAGE BODY
    ══════════════════════════════════════════ -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Welcome banner -->
      <div class="mb-8 bg-gradient-to-r from-navy-600 to-navy-500 dark:from-navy-700 dark:to-navy-600
                  rounded-2xl px-6 py-5 text-white shadow-lg flex items-center justify-between gap-4">

        <!-- Left: text -->
        <div class="min-w-0">
          <p class="text-navy-200 dark:text-navy-300 text-sm font-medium mb-0.5">Welcome back</p>
          <h2 class="font-display text-xl sm:text-2xl truncate">
            {{ employee?.first_name }} {{ employee?.last_name }}
          </h2>
          <p class="mt-1 text-sm text-navy-200 dark:text-navy-300 truncate">
            {{ employee?.position || employee?.department }}
          </p>
        </div>

        <!-- Right: profile picture -->
        <div class="shrink-0">
          <img v-if="employee?.profile_pic"
               :src="employee.profile_pic"
               :alt="employee.first_name"
               class="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover
                      border-2 border-white/30 shadow-lg ring-2 ring-white/10" />
          <div v-else
               class="w-16 h-16 sm:w-20 sm:h-20 rounded-full
                      bg-white/15 border-2 border-white/30 shadow-lg ring-2 ring-white/10
                      flex items-center justify-center select-none">
            <span class="text-2xl sm:text-3xl font-bold text-white/90 font-display">
              {{ (employee?.first_name || '?').charAt(0).toUpperCase() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Section label -->
      <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
        Quick Actions
      </h3>

      <!-- ── Action cards grid ── -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">

        <!-- DTR -->
        <NuxtLink to="/dtr"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200">
          <span class="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">My DTR</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">Daily time record</p>
          </div>
        </NuxtLink>

        <!-- Admin DTR — authorized departments only -->
        <NuxtLink v-if="authStore.isAdminDept" to="/admin/dtr"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200">
          <span class="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">All DTR</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">All employees</p>
          </div>
        </NuxtLink>

        <!-- Profile — HR opens modal, others go directly -->
        <button v-if="authStore.isHR" @click="showProfile = true"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200
                 text-left w-full">
          <span class="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Profile</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">Manage profiles</p>
          </div>
        </button>
        <NuxtLink v-else to="/profile"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200">
          <span class="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Profile</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">View my profile</p>
          </div>
        </NuxtLink>

        <!-- Travel Orders -->
        <NuxtLink to="/travel-orders/"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200">
          <span class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Travel Orders</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">View &amp; manage TOs</p>
          </div>
        </NuxtLink>

        <!-- Passlip -->
        <button @click="showPasslip = true"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200
                 text-left w-full">
          <span class="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Passlip</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">Submit a passlip</p>
          </div>
        </button>

        <!-- Payslip — HR opens modal, others go directly -->
        <button v-if="authStore.isHR" @click="showPayslip = true"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200
                 text-left w-full">
          <span class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Payslip</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">Manage payslips</p>
          </div>
        </button>
        <NuxtLink v-else to="/payslip/my"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200">
          <span class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Payslip</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">View my payslip</p>
          </div>
        </NuxtLink>

        <!-- Audit Logs — HR / authorized departments only -->
        <NuxtLink v-if="authStore.isHR || authStore.isAdminDept" to="/audit-logs"
          class="action-card animate-slide-up group flex flex-col items-start gap-3 p-4
                 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200">
          <span class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400
                       group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Audit Logs</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">System activity trail</p>
          </div>
        </NuxtLink>

      </div>
    </main>


    <!-- ══════════════════════════════════════════
         PASSLIP MODAL
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showPasslip"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="showPasslip = false">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700
                    w-full max-w-sm p-6 animate-modal-in">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-display text-lg text-navy-700 dark:text-navy-200">Select Passlip Type</h3>
            <button @click="showPasslip = false"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                     hover:bg-slate-100 dark:hover:bg-slate-700 transition" aria-label="Close">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="space-y-2.5">
            <NuxtLink to="/passlip/form?type=regular" @click="showPasslip = false"
              class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                     hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                     text-slate-700 dark:text-slate-200 text-sm font-medium transition-all duration-200 group">
              <span class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400
                           flex items-center justify-center group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </span>
              Regular Employee
            </NuxtLink>
            <NuxtLink to="/passlip/form?type=jocos" @click="showPasslip = false"
              class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                     hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                     text-slate-700 dark:text-slate-200 text-sm font-medium transition-all duration-200 group">
              <span class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400
                           flex items-center justify-center group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </span>
              JO &amp; COS
            </NuxtLink>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- ══════════════════════════════════════════
         PAYSLIP MODAL
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showPayslip"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="showPayslip = false">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700
                    w-full max-w-md p-6 animate-modal-in">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-display text-lg text-navy-700 dark:text-navy-200">Payslip Actions</h3>
            <button @click="showPayslip = false"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                     hover:bg-slate-100 dark:hover:bg-slate-700 transition" aria-label="Close">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-5">
            <button @click="payslipTab = 'create'"
              :class="payslipTab === 'create'
                ? 'bg-white dark:bg-slate-700 text-navy-600 dark:text-navy-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
              class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200">
              Create Payslip
            </button>
            <button @click="payslipTab = 'list'"
              :class="payslipTab === 'list'
                ? 'bg-white dark:bg-slate-700 text-navy-600 dark:text-navy-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
              class="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200">
              View / List
            </button>
          </div>

          <!-- Create tab -->
          <div v-if="payslipTab === 'create'" class="grid grid-cols-2 gap-3">
            <NuxtLink to="/payslip/create" @click="showPayslip = false"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-600
                     hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                     text-slate-700 dark:text-slate-200 text-center text-sm font-medium transition-all duration-200 group">
              <span class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600
                           text-slate-500 dark:text-slate-400 flex items-center justify-center
                           group-hover:bg-navy-500 group-hover:text-white group-hover:border-navy-500 transition-all duration-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </span>
              <span>Standard<br /><span class="text-xs font-normal text-slate-400 dark:text-slate-500">Basic pay &amp; deductions</span></span>
            </NuxtLink>
            <NuxtLink to="/admin/payslip/create" @click="showPayslip = false"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-600
                     hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                     text-slate-700 dark:text-slate-200 text-center text-sm font-medium transition-all duration-200 group">
              <span class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600
                           text-slate-500 dark:text-slate-400 flex items-center justify-center
                           group-hover:bg-navy-500 group-hover:text-white group-hover:border-navy-500 transition-all duration-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </span>
              <span>Gov&apos;t<br /><span class="text-xs font-normal text-slate-400 dark:text-slate-500">GSIS, PERA &amp; more</span></span>
            </NuxtLink>
          </div>

          <!-- List tab -->
          <div v-else class="grid grid-cols-2 gap-3">
            <NuxtLink to="/payslip/list" @click="showPayslip = false"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-600
                     hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                     text-slate-700 dark:text-slate-200 text-center text-sm font-medium transition-all duration-200 group">
              <span class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600
                           text-slate-500 dark:text-slate-400 flex items-center justify-center
                           group-hover:bg-navy-500 group-hover:text-white group-hover:border-navy-500 transition-all duration-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
              </span>
              <span>Standard<br /><span class="text-xs font-normal text-slate-400 dark:text-slate-500">All standard records</span></span>
            </NuxtLink>
            <NuxtLink to="/admin/payslip/list" @click="showPayslip = false"
              class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-600
                     hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                     text-slate-700 dark:text-slate-200 text-center text-sm font-medium transition-all duration-200 group">
              <span class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600
                           text-slate-500 dark:text-slate-400 flex items-center justify-center
                           group-hover:bg-navy-500 group-hover:text-white group-hover:border-navy-500 transition-all duration-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
              </span>
              <span>Gov&apos;t<br /><span class="text-xs font-normal text-slate-400 dark:text-slate-500">All gov&apos;t records</span></span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- ══════════════════════════════════════════
         PROFILE MODAL
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showProfile"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="showProfile = false">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700
                    w-full max-w-sm p-6 animate-modal-in">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-display text-lg text-navy-700 dark:text-navy-200">Profile Actions</h3>
            <button @click="showProfile = false"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                     hover:bg-slate-100 dark:hover:bg-slate-700 transition" aria-label="Close">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="space-y-2.5">
            <NuxtLink to="/profile" @click="showProfile = false"
              class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                     hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                     text-slate-700 dark:text-slate-200 text-sm font-medium transition-all duration-200 group">
              <span class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400
                           flex items-center justify-center group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </span>
              View My Profile
            </NuxtLink>

            <template v-if="authStore.isHR">
              <NuxtLink to="/employees" @click="showProfile = false"
                class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                       hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                       text-slate-700 dark:text-slate-200 text-sm font-medium transition-all duration-200 group">
                <span class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400
                             flex items-center justify-center group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </span>
                Employee List
              </NuxtLink>

              <NuxtLink to="/employees/add" @click="showProfile = false"
                class="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                       hover:border-navy-400 dark:hover:border-navy-500 hover:bg-navy-50 dark:hover:bg-navy-900/30
                       text-slate-700 dark:text-slate-200 text-sm font-medium transition-all duration-200 group">
                <span class="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-500 dark:text-green-400
                             flex items-center justify-center group-hover:bg-navy-500 group-hover:text-white transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </span>
                Add New Employee
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>