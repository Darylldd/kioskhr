import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    employee:  null as any,
    isLoggedIn: false,
  }),

  getters: {
    isHR:        (state) => ['HR', 'HRMU', 'Finance and Administrative Section (FAS)'].includes(state.employee?.department ?? ''),
    isAdminDept: (state) => ['HR', 'HRMU', 'Finance and Administrative Section (FAS)', 'admin'].includes(state.employee?.department ?? ''),
    fullName:    (state) => state.employee ? `${state.employee.first_name} ${state.employee.last_name}` : '',
  },

  actions: {
    loadFromStorage() {
      try {
        const raw = localStorage.getItem('employee')
        if (raw) {
          this.employee   = JSON.parse(raw)
          this.isLoggedIn = true
        } else {
          this.employee   = null
          this.isLoggedIn = false
        }
      } catch {
        this.employee   = null
        this.isLoggedIn = false
        localStorage.removeItem('employee')
      }
    },

    setEmployee(emp: any) {
      this.employee   = emp
      this.isLoggedIn = true
      localStorage.setItem('employee', JSON.stringify(emp))
    },

    logout() {
      this.employee   = null
      this.isLoggedIn = false
      localStorage.removeItem('employee')

      if (import.meta.client) {
        window.location.href = '/login'
      }
    },
  },
})