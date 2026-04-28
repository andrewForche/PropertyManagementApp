import { useEffect, useState } from 'react'
import type { ComponentType, MouseEvent } from 'react'
import { useAuth } from '../core/auth/AuthContext'
import { FEATURE_ROUTES } from '../shared/constants/navigation'
import { ProtectedRoute } from '../shared/auth/ProtectedRoute'
import { DashboardSummaryPage } from '../features/dashboard/DashboardSummaryPage'
import { RentCollectionPage } from '../features/rent-collection/RentCollectionPage'
import { RentRecordsPage } from '../features/rent-records/RentRecordsPage'
import { MaintenanceProjectsPage } from '../features/maintenance/MaintenanceProjectsPage'
import { WorkLogsPage } from '../features/work-logs/WorkLogsPage'
import { InvoicesPage } from '../features/invoices/InvoicesPage'
import { PropertiesPage } from '../features/properties/PropertiesPage'
import { TenantsPage } from '../features/tenants/TenantsPage'
import { LoginPage } from '../features/auth/LoginPage'
import { TenantDashboardPage } from '../features/tenant-dashboard/TenantDashboardPage'
import { SharedDocumentsPage } from '../features/shared-documents/SharedDocumentsPage'

const routeComponents: Record<string, ComponentType & { displayName?: string }> = {
  '/login': LoginPage,
  '/tenant-dashboard': TenantDashboardPage,
  '/shared-documents': SharedDocumentsPage,
  '/': DashboardSummaryPage,
  '/rent-collection': RentCollectionPage,
  '/rent-records': RentRecordsPage,
  '/maintenance': MaintenanceProjectsPage,
  '/work-logs': WorkLogsPage,
  '/invoices': InvoicesPage,
  '/properties': PropertiesPage,
  '/tenants': TenantsPage,
}

export function AppShell() {
  const { clearToken, isAuthenticated, primaryRole } = useAuth()
  const [currentPath, setCurrentPath] = useState(() =>
    normalizePath(window.location.pathname),
  )

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(normalizePath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const activePath = currentPath in routeComponents ? currentPath : '/'
  const isLoginRoute = activePath === '/login'
  const accessibleRoutes = FEATURE_ROUTES.filter((route) =>
    primaryRole ? route.allowedRoles.includes(primaryRole) : false,
  )


  console.log('primaryRole:', primaryRole)
  console.log('accessibleRoutes:', accessibleRoutes.map(r => r.path))
  
  const fallbackRoute = accessibleRoutes[0] ?? FEATURE_ROUTES[0]
  const activeRoute =
    FEATURE_ROUTES.find((route) => route.path === activePath) ?? fallbackRoute
  const ActivePage = routeComponents[isLoginRoute ? '/login' : activeRoute.path]
  const isAllowedRoute = accessibleRoutes.some((route) => route.path === activePath)

  useEffect(() => {
    if (!isAuthenticated) {
      if (!isLoginRoute) {
        navigateTo('/login', true)
      }
      return
    }

    if (isLoginRoute) {
      navigateTo(fallbackRoute.path, true)
      return
    }

    if (accessibleRoutes.length === 0) {
      return
    }

    if (!accessibleRoutes.some((route) => route.path === activePath)) {
      navigateTo(fallbackRoute.path, true)
    }
  }, [activePath, accessibleRoutes, fallbackRoute.path, isAuthenticated, isLoginRoute])

  function navigateTo(path: string, replace = false) {
    const nextPath = normalizePath(path)

    if (replace) {
      window.history.replaceState({}, '', nextPath)
    } else {
      window.history.pushState({}, '', nextPath)
    }

    setCurrentPath(nextPath)
  }

  function handleNavigate(path: string, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    if (path === currentPath) {
      return
    }

    navigateTo(path)
  }

  function handleSignOut() {
    clearToken()
    navigateTo('/login', true)
  }

  if (!isAuthenticated && !isLoginRoute) {
    return null
  }

  if (isAuthenticated && isLoginRoute) {
    return null
  }

  if (isAuthenticated && accessibleRoutes.length > 0 && !isAllowedRoute) {
    return null
  }

  if (isLoginRoute) {
    return <LoginPage />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Property Management App</p>
          <h1>Operations workspace</h1>
          <p className="panel-caption">
            {isAuthenticated
              ? `Signed in as ${primaryRole ?? 'Unknown role'}`
              : 'Waiting for a valid JWT session'}
          </p>
        </div>

        <nav aria-label="Primary">
          <ul className="nav-list">
            {accessibleRoutes.map((route) => (
              <li key={route.path}>
                <a
                  href={route.path}
                  className={route.path === activePath ? 'active' : undefined}
                  aria-current={route.path === activePath ? 'page' : undefined}
                  onClick={(event) => handleNavigate(route.path, event)}
                >
                  {route.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {isAuthenticated ? (
          <button type="button" className="secondary-button" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : null}
      </aside>

      <main className="content">
        <section className="hero-card">
          <div className="hero-copy">
            <h2>{activeRoute.label}</h2>
            <p className="panel-caption">{activeRoute.description}</p>
          </div>
        </section>

        <section className="page-stage" aria-label={`${activeRoute.label} page`}>
          <ProtectedRoute allowedRoles={activeRoute.allowedRoles}>
            <ActivePage />
          </ProtectedRoute>
        </section>
      </main>
    </div>
  )
}

function normalizePath(pathname: string) {
  if (pathname === '/dashboard') {
    return '/'
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}
