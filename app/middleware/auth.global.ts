import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.loadFromStorage()

  const isLoggedIn    = authStore.isLoggedIn
  const employee      = authStore.employee
  const dept          = employee?.department ?? ''
  const role          = employee?.role ?? ''

  // ── Public route — always allow ──────────────────────────
  if (to.path === '/login') {
    // Already logged in → go to dashboard
    if (isLoggedIn) return navigateTo('/dashboard')
    return
  }

  // ── Not logged in → go to login ──────────────────────────
  if (!isLoggedIn) {
    return navigateTo('/login')
  }

  // ── Role-based route guards ───────────────────────────────

  // HR-only routes (replaces onlyHR / onlyHRAdmin)
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

  // Admin DTR routes (replaces onlyAuthorizedDTR)
  const authorizedDTRDepts = ['HR', 'HRMU', 'Finance and Administrative Section (FAS)', 'admin']
  if (to.path.startsWith('/admin/dtr') && !authorizedDTRDepts.includes(dept)) {
    return navigateTo('/dashboard')
  }

  // Audit logs (replaces isAdmin / ensureAdmin)
  if (to.path.startsWith('/audit-logs') && role !== 'hr' && !authorizedDTRDepts.includes(dept)) {
    return navigateTo('/dashboard')
  }
})