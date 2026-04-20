import { useEffect, useState } from 'react'
import type { ComponentType, MouseEvent } from 'react'
import { FEATURE_ROUTES } from '../shared/constants/navigation'
import { AppEnvironmentSummary } from './config/AppEnvironmentSummary'
import { DashboardSummaryPage } from '../features/dashboard/DashboardSummaryPage'
import { RentCollectionPage } from '../features/rent-collection/RentCollectionPage'
import { RentRecordsPage } from '../features/rent-records/RentRecordsPage'
import { MaintenanceProjectsPage } from '../features/maintenance/MaintenanceProjectsPage'
import { WorkLogsPage } from '../features/work-logs/WorkLogsPage'
import { InvoicesPage } from '../features/invoices/InvoicesPage'
import { PropertiesPage } from '../features/properties/PropertiesPage'
import { TenantsPage } from '../features/tenants/TenantsPage'

const routeComponents: Record<string, ComponentType & { displayName?: string }> = {
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
  const ActivePage = routeComponents[activePath]
  const activeRoute =
    FEATURE_ROUTES.find((route) => route.path === activePath) ?? FEATURE_ROUTES[0]

  function handleNavigate(path: string, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    if (path === currentPath) {
      return
    }

    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Property Management App</p>
          <h1>Operations workspace</h1>
        </div>

        <nav aria-label="Primary">
          <ul className="nav-list">
            {FEATURE_ROUTES.map((route) => (
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

        <AppEnvironmentSummary />
      </aside>

      <main className="content">
        <section className="hero-card">
          <div className="hero-copy">
            <h2>{activeRoute.label}</h2>
            <p className="panel-caption">{activeRoute.description}</p>
          </div>
        </section>

        <section className="page-stage" aria-label={`${activeRoute.label} page`}>
          <ActivePage />
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
