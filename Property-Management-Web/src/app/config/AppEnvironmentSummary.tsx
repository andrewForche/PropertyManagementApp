import { appEnvironment } from './env'

export function AppEnvironmentSummary() {
  const connectionLabel = appEnvironment.apiBaseUrl.includes('localhost')
    ? 'Local API'
    : 'Remote API'

  return (
    <section className="environment-card" aria-label="Environment configuration">
      <p className="eyebrow">Workspace</p>
      <dl className="environment-list">
        <div>
          <dt>Application</dt>
          <dd>{appEnvironment.appName}</dd>
        </div>
        <div>
          <dt>Environment</dt>
          <dd>{appEnvironment.appStage}</dd>
        </div>
        <div>
          <dt>Connection</dt>
          <dd>{connectionLabel}</dd>
        </div>
      </dl>
    </section>
  )
}
