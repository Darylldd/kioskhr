<script setup lang="ts">
useSeoMeta({
  title: 'Add Employee'
})

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

const router  = useRouter()
const loading = ref(false)
const error   = ref('')
const success = ref('')

// ── Form fields ────────────────────────────────────────────
const form = reactive({
  employee_no: '', employee_id: '', account_no: '', pin: '',
  first_name: '', middle_name: '', last_name: '',
  birthdate: '', civil_status: '', sex: '',
  department: '', position: '', status: '', nature_of_employment: '', date_hired: '',
  tin: '', philhealth_no: '', gsis_no: '', sss_no: '',
  email: '', contact_no: '', emergency_contact_name: '', emergency_contact_phone: '',
})

const showPin          = ref(false)
const profileFile      = ref<File | null>(null)
const contractFile     = ref<File | null>(null)
const contractPreview  = ref('')
const contractFileSize = ref('')
const contractInputRef = ref<HTMLInputElement>()
const dragging         = ref(false)
const picFileName      = ref('JPG, PNG or GIF · max 2 MB')

// ── Date label ─────────────────────────────────────────────
const dateLabel = computed(() => {
  const n = (form.nature_of_employment || '').toLowerCase()
  if (n === 'permanent') return 'Date of Original Appointment'
  if (n === 'casual')    return 'Date of Appointment'
  return 'Date Hired'
})

// ── File helpers ───────────────────────────────────────────
function formatSize(bytes: number) {
  if (bytes < 1024)         return bytes + ' B'
  if (bytes < 1024 * 1024)  return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function onProfilePicChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  profileFile.value = file
  picFileName.value = file.name
}

function onContractChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  contractFile.value     = file
  contractPreview.value  = file.name
  contractFileSize.value = formatSize(file.size)
}

function onContractDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (!file) return
  contractFile.value     = file
  contractPreview.value  = file.name
  contractFileSize.value = formatSize(file.size)
}

function clearContract() {
  contractFile.value     = null
  contractPreview.value  = ''
  contractFileSize.value = ''
  if (contractInputRef.value) contractInputRef.value.value = ''
}

// ── Submit ─────────────────────────────────────────────────
async function handleSubmit() {
  if (!form.employee_no || !form.first_name || !form.last_name || !form.pin) {
    error.value = 'Employee No, First Name, Last Name, and PIN are required.'
    return
  }
  loading.value = true
  error.value   = ''

  try {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v as string))
    if (profileFile.value)  fd.append('profile_pic',   profileFile.value)
    if (contractFile.value) fd.append('contract_file', contractFile.value)

    await $fetch('/api/employees', { method: 'POST', body: fd })
    success.value = 'Employee added successfully!'
    router.push('/employees')
  } catch (e: any) {
    error.value = e?.data?.message || 'Error saving employee.'
  } finally {
    loading.value = false
  }
}

// ── Dropdown options ───────────────────────────────────────
const civilStatusOptions = ['Single','Married','Widowed','Separated']
const sexOptions         = ['Male','Female']
const natureOptions      = ['Permanent','Casual','JO/COS']
const departmentGroups   = [
  { label: 'Office / Department', options: ['Finance and Administrative Section (FAS)','HRMU','Records','Budget','Accounting','Cashier','Property Unit','General Service Unit (GSU)','Office of the Regional Director','Planning Unit (SAAD / FishCore)','Legal Unit','Regional Fisheries Information Management Unit (RFIMU)','BAC Secretariat','Fisheries Inspection and Quarantine Unit (FIQU)','Fisheries Management Regulatory and Enforcement Division (FMRED)','Fisheries Production and Support Service Division (FPSSD)','Regional Fisheries Training and Fisherfolk Coordination Division (RFTFCD)'] },
  { label: 'PFO — Provincial Fisheries Offices', options: ['Provincial Fisheries Office - Occidental Mindoro','Provincial Fisheries Office - Oriental Mindoro','Provincial Fisheries Office - Marinduque','Provincial Fisheries Office - Romblon','Provincial Fisheries Office - Northern Palawan','Provincial Fisheries Office - Southern Palawan'] },
  { label: 'Technology Outreach Station', options: ['Inland Sea-Ranching Station Puerto Palawan'] },
  { label: 'Operating Unit', options: ['Brackishwater Fisheries Research Station San Jose Uno Naujan Oriental Mindoro','Freshwater Tech Station (Barcenaga Naujan Oriental Mindoro)','Multi Species Marine Hatchery Station','Mindoro Shrimp Hatchery'] },
]
const positionOptions = ['Director II','Administrative Officer V','Attorney II','Administrative Officer IV','Accountant I','Administrative Officer II','Legal Assistant I','Administrative Officer III','Administrative Officer I','Administrative Aide IV','Senior Fishing Regulations Officer','Veterinarian II','Fishing Regulations Officer II','Fishing Regulations Officer I','Aquaculturist I','Librarian I','Training Specialist I','Aquacultural Technician I','Farm Foreman','Farm Worker II','Security Guard I','Farm Worker I','Administrative Aide I','Chief Fishing Regulations Officer','Senior Aquaculturist','Aquaculturist II','Launch Service Supervisor','Administrative Assistant III','Watchman III','Chief Aquaculturist','Biologist I','Chemist I','Laboratory Technician II','Training Center Superintendent II','Community Development Officer II','Training Specialist II','Community Development Officer I','Agricultural Center Chief II','Aquacultural Technologist']
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

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6">
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">Add New Employee</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Bureau of Fisheries and Aquatic Resources · MIMAROPA Region</p>
      </div>

      <div v-if="error"   class="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{{ error }}</div>
      <div v-if="success" class="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{{ success }}</div>

      <form @submit.prevent="handleSubmit" class="space-y-5">

        <!-- Identity & Access -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Identity &amp; Access</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <div v-for="f in [
              { label:'Employee No', key:'employee_no', ph:'e.g. 2024-001', req:true },
              { label:'Employee ID', key:'employee_id', ph:'System ID', req:false },
              { label:'Account No',  key:'account_no',  ph:'Bank account', req:false },
            ]" :key="f.key">
              <label :for="f.key" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                {{ f.label }} <span v-if="f.req" class="text-red-400">*</span>
              </label>
              <input :id="f.key" v-model="(form as any)[f.key]" type="text" :placeholder="f.ph" :required="f.req"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>

            <!-- PIN -->
            <div>
              <label for="pin" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                PIN <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <input id="pin" v-model="form.pin" :type="showPin ? 'text' : 'password'"
                  placeholder="Min. 4 characters" required
                  class="w-full pl-3 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                         bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
                <button type="button" @click="showPin = !showPin"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-navy-500 transition-colors">
                  <svg v-if="!showPin" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Profile Pic -->
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Profile Picture</label>
              <label for="profile_pic_add"
                class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900
                       text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600 transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Choose Photo
              </label>
              <input id="profile_pic_add" type="file" accept="image/*" class="hidden" @change="onProfilePicChange" />
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{{ picFileName }}</p>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Personal Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="f in [
              { label:'First Name',  key:'first_name',  ph:'Given name' },
              { label:'Middle Name', key:'middle_name', ph:'Middle name' },
              { label:'Last Name',   key:'last_name',   ph:'Surname' },
            ]" :key="f.key">
              <label :for="f.key" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ f.label }}</label>
              <input :id="f.key" v-model="(form as any)[f.key]" type="text" :placeholder="f.ph"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
            <div>
              <label for="birthdate" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Birthdate</label>
              <input id="birthdate" v-model="form.birthdate" type="date"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Civil Status</label>
            <ComboInput v-model="form.civil_status" placeholder="e.g. Single" :options="civilStatusOptions" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Sex</label>
             <ComboInput v-model="form.sex" placeholder="e.g. Male" :options="sexOptions" />
            </div>
          </div>
        </div>

        <!-- Employment Details -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Employment Details</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Department / Office</label>
            <div class="sm:col-span-2">

  <ComboInput
    v-model="form.department"
    placeholder="Select or type department"
    :groups="departmentGroups"
  />
</div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Position / Designation</label>
            <div class="sm:col-span-2">
 
  <ComboInput
    v-model="form.position"
    placeholder="Select or type position"
    :options="positionOptions"
  />
</div>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Employment Status</label>
              <input v-model="form.status" type="text" placeholder="ACTIVE"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Nature of Employment</label>
             <ComboInput v-model="form.nature_of_employment" placeholder="Select nature of employment" :options="natureOptions" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ dateLabel }}</label>
              <input v-model="form.date_hired" type="date"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- Government IDs -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Government IDs</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div v-for="f in [
              { label:'TIN',           key:'tin',           ph:'000-000-000' },
              { label:'PhilHealth No', key:'philhealth_no', ph:'00-000000000-0' },
              { label:'GSIS No',       key:'gsis_no',       ph:'GSIS number' },
              { label:'SSS No',        key:'sss_no',        ph:'00-0000000-0' },
            ]" :key="f.key">
              <label :for="f.key" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ f.label }}</label>
              <input :id="f.key" v-model="(form as any)[f.key]" type="text" :placeholder="f.ph"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Contact Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div v-for="f in [
              { label:'Email Address',           key:'email',                   type:'email', ph:'name@bfar.da.gov.ph' },
              { label:'Contact No',              key:'contact_no',              type:'text',  ph:'+63 9XX XXX XXXX' },
              { label:'Emergency Contact Name',  key:'emergency_contact_name',  type:'text',  ph:'Full name' },
              { label:'Emergency Contact Phone', key:'emergency_contact_phone', type:'text',  ph:'+63 9XX XXX XXXX' },
            ]" :key="f.key">
              <label :for="f.key" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ f.label }}</label>
              <input :id="f.key" v-model="(form as any)[f.key]" :type="f.type" :placeholder="f.ph"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

       <!-- Contract Upload -->
<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
  <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Contract / Document</h2>
  <p class="text-xs text-slate-400 dark:text-slate-500 mb-4">Optional — attach an employment contract or appointment order</p>

  <!-- Input outside drop zone to prevent click loop -->
  <input
    ref="contractInputRef"
    id="contract_file"
    type="file"
    accept=".pdf,image/jpeg,image/png,image/gif"
    class="hidden"
    @change="onContractChange"
  />

  <div v-if="!contractPreview"
    @click="contractInputRef?.click()"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onContractDrop"
    :class="dragging ? 'border-navy-400 bg-navy-50 dark:border-navy-500 dark:bg-slate-700/40' : 'border-slate-200 dark:border-slate-600'"
    class="border-2 border-dashed rounded-xl p-7 text-center cursor-pointer
           hover:border-navy-400 hover:bg-navy-50 dark:hover:border-navy-500 dark:hover:bg-slate-700/40 transition-all">
    <svg class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
    </svg>
    <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Click or drag &amp; drop your contract here</p>
    <p class="text-xs text-slate-400 mt-1">PDF, JPG, PNG · max 10 MB · optional</p>
  </div>

  <div v-else class="border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-7 text-center">
    <svg class="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ contractPreview }}</p>
    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">{{ contractFileSize }}</p>
    <button type="button" @click.stop="clearContract"
      class="mt-2 text-xs text-red-500 hover:text-red-700 underline transition">Remove</button>
  </div>
</div>

        <!-- Submit -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <NuxtLink to="/employees"
            class="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700
                   bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all duration-200">
            Cancel
          </NuxtLink>
          <button type="submit" :disabled="loading"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                   bg-navy-500 hover:bg-navy-600 text-white shadow-md hover:shadow-lg
                   active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            {{ loading ? 'Saving...' : 'Save Employee' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>