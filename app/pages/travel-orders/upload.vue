<script setup lang="ts">
useSeoMeta({
  title: 'Upload Travel Order'
})

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

const router  = useRouter()
const loading = ref(false)
const msg     = ref('')
const isError = ref(false)

// ── Employees list ─────────────────────────────────────────
const employees = ref<any[]>([])
async function fetchEmployees() {
  try {
    const data = await $fetch<any>('/api/employees')
    employees.value = data.employees
  } catch {}
}

// ── Form ───────────────────────────────────────────────────
const form = reactive({
  to_no: '', travel_date: '', return_date: '', destination: '',
  specific_purpose: '', objectives: '', per_diems_allowed: '',
  appropriation: '', remarks: '', salary_per_diem: '',
  office_station: '', contact_number: '', recommending_approval: '',
  recommending_position: '', approved_by: '',
})

// ── Employee rows ──────────────────────────────────────────
const employeeRows = ref([{ employee_id: '', position: '' }])

function addRow() {
  employeeRows.value.push({ employee_id: '', position: '' })
}
function removeRow(idx: number) {
  employeeRows.value.splice(idx, 1)
}
function onEmployeeSelect(idx: number) {
  const emp = employees.value.find(e => String(e.id) === String(employeeRows.value[idx].employee_id))
  if (emp) employeeRows.value[idx].position = emp.position || ''
}

// ── File ───────────────────────────────────────────────────
const toFile     = ref<File | null>(null)
const fileLabel  = ref('PDF, JPG, or PNG · max 10 MB')
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) { toFile.value = file; fileLabel.value = file.name }
}

// ── Submit ─────────────────────────────────────────────────
async function handleSubmit() {
  if (!toFile.value) { msg.value = 'Please attach a document.'; isError.value = true; return }
  if (!form.to_no || !form.travel_date || !form.return_date || !form.destination) {
    msg.value = 'All required fields are missing.'; isError.value = true; return
  }
  const validRows = employeeRows.value.filter(r => r.employee_id)
  if (!validRows.length) { msg.value = 'Select at least one employee.'; isError.value = true; return }

  loading.value = true
  msg.value     = ''

  try {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    validRows.forEach(r => {
      fd.append('employee_ids[]', r.employee_id)
      fd.append('positions[]',    r.position)
    })
    fd.append('file', toFile.value)

    await $fetch('/api/travel-orders', { method: 'POST', body: fd })
    msg.value     = '✅ Uploaded successfully!'
    isError.value = false
    // Reset form
    Object.keys(form).forEach(k => (form as any)[k] = '')
    employeeRows.value = [{ employee_id: '', position: '' }]
    toFile.value  = null
    fileLabel.value = 'PDF, JPG, or PNG · max 10 MB'
  } catch (e: any) {
    msg.value     = e?.data?.message || 'Error saving travel order. Please try again.'
    isError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

    <!-- Nav -->
    <header class="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
          <NuxtLink to="/travel-orders"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                   border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                   text-slate-600 dark:text-slate-300 hover:text-navy-600 hover:bg-navy-50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span class="hidden sm:inline">Travel Orders</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Upload Travel Order</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fill in the details and attach the travel order document</p>
      </div>

      <!-- Alert -->
      <div v-if="msg" :class="isError
        ? 'bg-red-50 dark:bg-red-900/25 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        : 'bg-green-50 dark:bg-green-900/25 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'"
        class="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border">
        <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!isError" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <span class="text-sm font-medium">{{ msg }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">

        <!-- Trip Details -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Trip Details</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">TO Number <span class="text-red-400">*</span></label>
              <input v-model="form.to_no" type="text" placeholder="e.g. TO-2024-001" required
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Departure Date <span class="text-red-400">*</span></label>
              <input v-model="form.travel_date" type="date" required
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Return Date <span class="text-red-400">*</span></label>
              <input v-model="form.return_date" type="date" required
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
            <div class="sm:col-span-2 lg:col-span-3">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Destination <span class="text-red-400">*</span></label>
              <input v-model="form.destination" type="text" placeholder="City / Province / Region" required
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- Employees -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Employees</h2>
            <button type="button" @click="addRow"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900
                     text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600 transition-all duration-200">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Employee
            </button>
          </div>

          <div class="space-y-3">
            <div v-for="(row, idx) in employeeRows" :key="idx"
              class="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div class="flex-1">
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Employee <span class="text-red-400">*</span></label>
                <select v-model="row.employee_id" @change="onEmployeeSelect(idx)"
                  class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                         bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition">
                  <option value="">Select employee...</option>
                  <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                    {{ emp.first_name }} {{ emp.last_name }} ({{ emp.department || 'No Dept' }})
                  </option>
                </select>
              </div>
              <div class="sm:w-64">
                <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Position</label>
                <input v-model="row.position" type="text" placeholder="Auto-filled from selection"
                  class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
              </div>
              <div class="flex items-end">
                <button v-if="employeeRows.length > 1" type="button" @click="removeRow(idx)"
                  class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                         border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Purpose & Objectives -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Purpose &amp; Objectives</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Specific Purpose of Travel</label>
              <textarea v-model="form.specific_purpose" rows="3" placeholder="Describe the travel purpose..."
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"></textarea>
            </div>
            <div v-for="f in [
              { label:'Objectives',                         key:'objectives',         ph:'List objectives...' },
              { label:'Per Diems Allowed',                  key:'per_diems_allowed',  ph:'e.g. P1,000.00/day' },
              { label:'Appropriation to be Charged',        key:'appropriation',      ph:'Fund source...' },
              { label:'Remarks / Special Instructions',     key:'remarks',            ph:'Additional notes...' },
            ]" :key="f.key">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ f.label }}</label>
              <textarea v-model="(form as any)[f.key]" rows="3" :placeholder="f.ph"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"></textarea>
            </div>
          </div>
        </div>

        <!-- Administrative Details -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Administrative Details</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="f in [
              { label:'Salary / Per Diem',          key:'salary_per_diem',          ph:'e.g. P45,203.00' },
              { label:'Office Station',             key:'office_station',           ph:'Office station' },
              { label:'Contact Number',             key:'contact_number',           ph:'+63 9XX XXX XXXX' },
              { label:'Recommending Approval',      key:'recommending_approval',    ph:'Full name' },
              { label:'Recommending Position',      key:'recommending_position',    ph:'Position / Designation' },
              { label:'Approved By',                key:'approved_by',              ph:'Full name' },
            ]" :key="f.key">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ f.label }}</label>
              <input v-model="(form as any)[f.key]" type="text" :placeholder="f.ph"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- File Upload -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">
            Document Attachment <span class="text-red-400">*</span>
          </h2>
          <div class="flex items-center gap-4">
            <label for="fileUpload"
              class="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                     border-2 border-dashed border-slate-200 dark:border-slate-600
                     bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300
                     hover:border-navy-400 hover:text-navy-600 transition-all duration-200 w-full sm:w-auto">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Choose File
            </label>
            <input id="fileUpload" type="file" accept=".pdf,image/jpeg,image/png,image/webp" class="hidden" @change="onFileChange" />
            <p class="text-sm text-slate-400 dark:text-slate-500">{{ fileLabel }}</p>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <NuxtLink to="/travel-orders"
            class="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700
                   bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all duration-200">
            Cancel
          </NuxtLink>
          <button type="submit" :disabled="loading"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                   bg-navy-500 hover:bg-navy-600 text-white shadow-md hover:shadow-lg
                   active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            {{ loading ? 'Uploading...' : 'Upload Travel Order' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>