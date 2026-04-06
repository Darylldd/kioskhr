import { useAuthStore } from '~/stores/auth'

let _initialized = false

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  if (!_initialized) {
    authStore.loadFromStorage()
    _initialized = true
  }

  const isLoggedIn = authStore.isLoggedIn
  const employee   = authStore.employee
  const dept       = employee?.department ?? ''
  const role       = employee?.role ?? ''

  // ── /login ─────────────────────────────────────────────
  if (to.path === '/login') {
    if (isLoggedIn) return navigateTo('/dashboard')
    return
  }

  // ── Not logged in → send to login ──────────────────────
  if (!isLoggedIn) {
    return navigateTo('/login')
  }

  // ── HR-only routes ─────────────────────────────────────
  const isHRDept = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)'].includes(dept)

  const hrOnlyRoutes = [
    '/employees',
    '/employees/add',
    '/payslip/create',
    '/payslip/list',
    '/admin/payslip',
  ]
  if (hrOnlyRoutes.some(r => to.path.startsWith(r)) && !isHRDept && role !== 'hr') {
    return navigateTo('/dashboard')
  }

  // ── Admin DTR ──────────────────────────────────────────
  const authorizedDTRDepts = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)', 'admin']
  if (to.path.startsWith('/admin/dtr') && !authorizedDTRDepts.includes(dept)) {
    return navigateTo('/dashboard')
  }

  // ── Audit logs ─────────────────────────────────────────
  if (to.path.startsWith('/audit-logs') && role !== 'hr' && !authorizedDTRDepts.includes(dept)) {
    return navigateTo('/dashboard')
  }
})