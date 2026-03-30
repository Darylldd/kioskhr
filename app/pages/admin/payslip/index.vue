<script setup lang="ts">
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
const employees = ref<any[]>([])
const search    = ref('')
const selected  = ref('')
const error     = ref('')

async function fetchEmployees() {
  try {
    const data = await $fetch<any>('/api/employees')
    employees.value = data.employees
  } catch { error.value = 'Error loading employees.' }
}

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return employees.value
  return employees.value.filter(e =>
    `${e.first_name} ${e.middle_name || ''} ${e.last_name} ${e.position || ''}`.toLowerCase().includes(q)
  )
})

function proceed() {
  if (!selected.value) { error.value = 'Please select an employee.'; return }
  const emp = employees.value.find(e => e.employee_no === selected.value)
  if (!emp) { error.value = 'Employee not found.'; return }
  sessionStorage.setItem('admin_payslip_employee', JSON.stringify({
    id:          emp.id,
    employee_no: emp.employee_no,
    first_name:  emp.first_name,
    middle_name: emp.middle_name || '',
    last_name:   emp.last_name,
    position:    emp.position || '',
  }))
  router.push('/admin/payslip/create')
}

function empLabel(e: any) {
  return `${e.first_name} ${e.middle_name || ''} ${e.last_name}`.trim() + (e.position ? ` — ${e.position}` : '')
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
          <NuxtLink to="/dashboard" class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span class="hidden sm:inline">Dashboard</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-start justify-center">
      <div class="w-full max-w-lg">
        <div class="mb-6">
          <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Create Gov't Payslip</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Search and select an employee to begin</p>
        </div>

        <div v-if="error" class="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>

        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Search Employee</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
              </span>
              <input v-model="search" type="text" placeholder="Type name or position…" autocomplete="off"
                class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Select Employee</label>
            <select v-model="selected" size="7" @dblclick="proceed"
              class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition">
              <option v-if="filtered.length === 0" disabled>No results found.</option>
              <option v-for="emp in filtered" :key="emp.id" :value="emp.employee_no">{{ empLabel(emp) }}</option>
            </select>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Click to select, then press Proceed. Double-click to proceed immediately.</p>
          </div>

          <div class="flex gap-3 pt-1">
            <button @click="proceed"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-navy-500 hover:bg-navy-600 text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              Proceed
            </button>
            <NuxtLink to="/dashboard"
              class="flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">
              Cancel
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>