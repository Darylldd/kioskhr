<script setup lang="ts">
useSeoMeta({
  title: 'Profile'
})
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
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

// ── Load profile ───────────────────────────────────────────
const profile  = ref<any>(null)
const loading  = ref(true)
const saving   = ref(false)
const success  = ref('')
const error    = ref('')

async function fetchProfile() {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/profile')
    profile.value = { ...data }
  } catch (e: any) {
    error.value = e?.data?.message || 'Error loading profile.'
  } finally {
    loading.value = false
  }
}
onMounted(fetchProfile)

// ── Files ──────────────────────────────────────────────────
const profileFile   = ref<File | null>(null)
const contractFile  = ref<File | null>(null)
const contractPreview = ref('')
const picPreviewUrl = ref<string | null>(null)

function onProfilePicChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  profileFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { picPreviewUrl.value = ev.target?.result as string }
  reader.readAsDataURL(file)
}
function onContractChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) { contractFile.value = file; contractPreview.value = file.name }
}
function clearContract() { contractFile.value = null; contractPreview.value = '' }

// ── Submit ─────────────────────────────────────────────────
async function handleSubmit() {
  if (!profile.value?.first_name?.trim() || !profile.value?.last_name?.trim()) {
    error.value = 'First name and last name are required.'
    return
  }
  saving.value  = true
  success.value = ''
  error.value   = ''

  try {
    const fd = new FormData()
    const fields = ['first_name','middle_name','last_name','employee_id','department',
                    'position','email','contact_no','account_no','tin','philhealth_no',
                    'gsis_no','sss_no','emergency_contact_name','emergency_contact_phone']
    fields.forEach(f => fd.append(f, profile.value?.[f] ?? ''))
    if (profileFile.value)  fd.append('profile_pic',   profileFile.value)
    if (contractFile.value) fd.append('contract_file', contractFile.value)

    const updated = await $fetch<any>('/api/profile', { method: 'POST', body: fd })

    // Update auth store with new info
    if (updated.employee) {
      authStore.setEmployee({ ...authStore.employee!, ...updated.employee })
    }

    success.value = 'Profile updated successfully.'
    window.scrollTo({ top: 0, behavior: 'smooth' })
    await fetchProfile()
  } catch (e: any) {
    error.value = e?.data?.message || 'Error updating profile.'
  } finally {
    saving.value = false
  }
}

const displayPic = computed(() => picPreviewUrl.value || profile.value?.profile_pic || null)
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
        <h1 class="font-display text-2xl text-navy-700 dark:text-navy-200">My Profile</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update your personal information and account details</p>
      </div>

      <div v-if="success" class="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/25 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
        <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span class="text-sm font-medium">{{ success }}</span>
      </div>
      <div v-if="error" class="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
        <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        <span class="text-sm font-medium">{{ error }}</span>
      </div>

      <div v-if="loading" class="text-center py-16 text-slate-400 text-sm">Loading...</div>

      <form v-else-if="profile" @submit.prevent="handleSubmit" class="space-y-5">

        <!-- Profile Picture -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Profile Picture</h2>
          <div class="flex items-center gap-5">
            <div class="shrink-0">
              <img v-if="displayPic" :src="displayPic" alt="Profile"
                class="w-20 h-20 rounded-full object-cover border-2 border-navy-200 dark:border-navy-700 shadow" />
              <div v-else class="w-20 h-20 rounded-full bg-navy-100 dark:bg-navy-900 border-2 border-navy-200 dark:border-navy-700
                   flex items-center justify-center text-2xl font-bold text-navy-500 dark:text-navy-300 shadow select-none">
                {{ (profile.first_name || '?').charAt(0).toUpperCase() }}
              </div>
            </div>
            <div>
              <label for="profile_pic"
                class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900
                       text-slate-600 dark:text-slate-300 hover:border-navy-400 hover:text-navy-600 transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Change Photo
              </label>
              <input id="profile_pic" type="file" accept="image/*" class="hidden" @change="onProfilePicChange" />
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5">JPG, PNG or GIF · max 2 MB</p>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Personal Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="f in [
              { label:'First Name',  key:'first_name',  req:true },
              { label:'Middle Name', key:'middle_name', req:false },
              { label:'Last Name',   key:'last_name',   req:true },
              { label:'Employee ID', key:'employee_id', req:false },
              { label:'Department',  key:'department',  req:false },
              { label:'Position',    key:'position',    req:false },
            ]" :key="f.key">
              <label :for="f.key" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                {{ f.label }}<span v-if="f.req" class="text-red-400 ml-0.5">*</span>
              </label>
              <input :id="f.key" v-model="profile[f.key]" type="text" :required="f.req"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Contact Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="f in [
              { label:'Email',          key:'email',      type:'email' },
              { label:'Contact Number', key:'contact_no', type:'text' },
              { label:'Account Number', key:'account_no', type:'text' },
            ]" :key="f.key">
              <label :for="f.key" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ f.label }}</label>
              <input :id="f.key" v-model="profile[f.key]" :type="f.type"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- Government Details -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Government Details</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div v-for="f in [
              { label:'TIN',           key:'tin' },
              { label:'PhilHealth No', key:'philhealth_no' },
              { label:'GSIS No',       key:'gsis_no' },
              { label:'SSS No',        key:'sss_no' },
            ]" :key="f.key">
              <label :for="f.key" class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{{ f.label }}</label>
              <input :id="f.key" v-model="profile[f.key]" type="text"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- Emergency Contact -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">Emergency Contact</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Contact Name</label>
              <input v-model="profile.emergency_contact_name" type="text"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Contact Phone</label>
              <input v-model="profile.emergency_contact_phone" type="text"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition" />
            </div>
          </div>
        </div>

        <!-- Contract Upload -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-start justify-between mb-4 gap-3">
            <div>
              <h2 class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Contract / Document</h2>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Optional — PDF, JPG, or PNG · max 10 MB</p>
            </div>
            <a v-if="profile.contract_file" :href="profile.contract_file" target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/30
                     text-navy-600 dark:text-navy-300 hover:bg-navy-100 transition-all duration-200 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              View Current
            </a>
          </div>

          <input id="contract_file_profile" type="file" accept=".pdf,image/jpeg,image/png,image/gif" class="hidden" @change="onContractChange" />

          <div v-if="!contractPreview"
            class="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-7 text-center cursor-pointer
                   hover:border-navy-400 hover:bg-navy-50 dark:hover:border-navy-500 dark:hover:bg-slate-700/40 transition-all">
            <svg class="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <label for="contract_file_profile" class="text-sm font-medium text-slate-500 dark:text-slate-400 cursor-pointer">
              {{ profile.contract_file ? 'Click to replace contract' : 'Click or drag & drop your contract here' }}
            </label>
            <p class="text-xs text-slate-400 mt-1">PDF, JPG, PNG · max 10 MB · optional</p>
          </div>

          <div v-else class="border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-7 text-center">
            <svg class="w-9 h-9 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ contractPreview }}</p>
            <button type="button" @click="clearContract"
              class="mt-2 text-xs text-red-500 hover:text-red-700 underline transition">Remove</button>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex justify-end">
          <button type="submit" :disabled="saving"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                   bg-navy-500 hover:bg-navy-600 text-white shadow-md hover:shadow-lg
                   active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ saving ? 'Saving...' : 'Update Profile' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>