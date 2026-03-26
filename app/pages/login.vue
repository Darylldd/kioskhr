<script setup lang="ts">
useSeoMeta({
  title: 'Log In'
})
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth'})

const authStore  = useAuthStore()
const router     = useRouter()

const employeeNo = ref('')
const pin        = ref('')
const showPin    = ref(false)
const error      = ref('')
const loading    = ref(false)

// Dark mode
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

const handleLogin = async () => {
  if (!employeeNo.value || !pin.value) {
    error.value = 'Employee number and PIN are required.'
    return
  }
  loading.value = true
  error.value   = ''
  try {
    const result = await $fetch<{ employee: any }>('/api/auth/login', {
      method: 'POST',
      body: { employee_no: employeeNo.value, pin: pin.value },
    })
    authStore.setEmployee(result.employee)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err?.data?.message || 'Invalid employee number or PIN.'
  } finally {
    loading.value = false
  }
}
</script>


<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col">



    <!-- Dark mode toggle -->
    <div class="absolute top-4 right-4 z-10">
      <button @click="toggleTheme"
        class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
               text-slate-500 dark:text-slate-400 hover:text-navy-500 shadow-sm transition-all duration-200">
        <!-- Sun icon (dark mode) -->
        <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
        <!-- Moon icon (light mode) -->
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      </button>
    </div>

    <!-- Main -->
    <div class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">

        <!-- Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-navy-500 shadow-lg mb-4">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Employee Portal</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to continue</p>
        </div>

        <!-- Card -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">

          <!-- Error -->
          <div v-if="error" role="alert"
            class="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl
                   bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-800
                   text-red-700 dark:text-red-400">
            <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <span class="text-sm font-medium">{{ error }}</span>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="space-y-5">

            <!-- Employee No -->
            <div>
              <label for="employee_no" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Employee No.
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2"/>
                  </svg>
                </span>
                <input id="employee_no" v-model="employeeNo" type="text"
                  placeholder="e.g. EMP-0001" autocomplete="username"
                  class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600
                         bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent
                         transition-shadow duration-150" />
              </div>
            </div>

            <!-- PIN -->
            <div>
              <label for="pin" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                PIN
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </span>
                <input id="pin" v-model="pin" :type="showPin ? 'text' : 'password'"
                  placeholder="Enter your PIN" autocomplete="current-password"
                  class="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600
                         bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent
                         transition-shadow duration-150" />
                <button type="button" @click="showPin = !showPin"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-navy-500 transition-colors">
                  <!-- Eye open -->
                  <svg v-if="!showPin" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <!-- Eye closed -->
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" :disabled="loading"
              class="w-full mt-2 py-2.5 px-4 text-sm font-semibold tracking-wide
                     bg-navy-500 hover:bg-navy-600 text-white rounded-xl shadow-md hover:shadow-lg
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-400
                     active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
        </div>

        <p class="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          &copy; {{ new Date().getFullYear() }} Employee Management System
        </p>
      </div>
    </div>
  </div>
</template>