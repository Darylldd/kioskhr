<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder?: string
  options?: string[]
  groups?: { label: string; options: string[] }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const inputVal  = ref(props.modelValue)
const showDrop  = ref(false)
const inputRef  = ref<HTMLInputElement>()

// Keep in sync if parent changes value
watch(() => props.modelValue, v => { inputVal.value = v })

// Filter options based on what user typed
const filteredGroups = computed(() => {
  const q = inputVal.value.trim().toLowerCase()
  if (props.groups) {
    return props.groups
      .map(g => ({
        label: g.label,
        options: g.options.filter(o => !q || o.toLowerCase().includes(q))
      }))
      .filter(g => g.options.length > 0)
  }
  if (props.options) {
    return [{ label: '', options: props.options.filter(o => !q || o.toLowerCase().includes(q)) }]
  }
  return []
})

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  inputVal.value = val
  emit('update:modelValue', val)   // ← free-text is immediately the value
  showDrop.value = true
}

function pick(option: string) {
  inputVal.value = option
  emit('update:modelValue', option)
  showDrop.value = false
  inputRef.value?.focus()
}

function onFocus() { showDrop.value = true }
function onBlur()  { setTimeout(() => { showDrop.value = false }, 160) }
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      :value="inputVal"
      :placeholder="placeholder"
      type="text"
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
             bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100
             focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"
    />

    <!-- Dropdown -->
    <div v-if="showDrop && filteredGroups.length > 0"
      class="absolute left-0 right-0 top-full mt-1 z-50 max-h-56 overflow-y-auto
             bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600
             rounded-lg shadow-lg">

      <template v-for="group in filteredGroups" :key="group.label">
        <!-- Group label -->
        <div v-if="group.label"
          class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider
                 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50
                 border-b border-slate-100 dark:border-slate-700">
          {{ group.label }}
        </div>
        <!-- Options -->
        <button v-for="option in group.options" :key="option"
          type="button"
          @mousedown.prevent="pick(option)"
          class="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200
                 hover:bg-navy-500 hover:text-white transition-colors duration-100">
          {{ option }}
        </button>
      </template>
    </div>
  </div>
</template>