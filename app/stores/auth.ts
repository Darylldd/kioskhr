import { defineStore } from 'pinia'

interface Employee {
  id: string
  employee_no: string
  first_name: string
  last_name: string
  middle_name: string
  department: string
  position: string
  profile_pic: string | null
  role: 'employee' | 'hr'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    employee: null as Employee | null,
    isLoggedIn: false,
  }),

  getters: {
    isHR: (state) => state.employee?.role === 'hr',
    isAdminDept: (state) => {
      const adminDepts = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)', 'admin']
      return adminDepts.includes(state.employee?.department ?? '')
    },
    fullName: (state) =>
      state.employee ? `${state.employee.first_name} ${state.employee.last_name}` : '',
  },

  actions: {
    setEmployee(emp: Employee) {
      this.employee = emp
      this.isLoggedIn = true
      if (import.meta.client) {
        localStorage.setItem('employee', JSON.stringify(emp))
      }
    },
  loadFromStorage() {
  if (import.meta.client) {
    const stored = localStorage.getItem('employee')
    const storedVersion = localStorage.getItem('app_version')
    const currentVersion = useRuntimeConfig().public.appVersion

    if (storedVersion !== String(currentVersion)) {
      localStorage.removeItem('employee')
      localStorage.setItem('app_version', String(currentVersion))
      return
    }

    if (stored) {
      try {
        this.employee = JSON.parse(stored)
        this.isLoggedIn = true
      } catch {
        localStorage.removeItem('employee')
      }
    }
  }
},

    logout() {
      this.employee = null
      this.isLoggedIn = false
      if (import.meta.client) {
        localStorage.removeItem('employee')
      }
    },
  },
})