import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.loadFromStorage()

  const isLoggedIn    = authStore.isLoggedIn
  const employee      = authStore.employee
  const dept          = employee?.department ?? ''
  const role          = employee?.role ?? ''

  if (to.path === '/login') {
    if (isLoggedIn) return navigateTo('/dashboard')
    return
  }

  if (!isLoggedIn) {
    return navigateTo('/login')
  }


  const hrOnlyRoutes = [
    '/employees',
    '/employees/add',
    '/payslip/create',
    '/payslip/list',
    '/admin/payslip/create',
    '/admin/payslip/list',
  ]
  const isHRDept = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)'].includes(dept)
  if (hrOnlyRoutes.some(r => to.path.startsWith(r)) && !isHRDept && role !== 'hr') {
    return navigateTo('/dashboard')
  }

  const authorizedDTRDepts = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)', 'admin']
  if (to.path.startsWith('/admin/dtr') && !authorizedDTRDepts.includes(dept)) {
    return navigateTo('/dashboard')
  }


  if (to.path.startsWith('/audit-logs') && role !== 'hr' && !authorizedDTRDepts.includes(dept)) {
    return navigateTo('/dashboard')
  }
})