import { appEnvironment } from './env'

export function AppEnvironmentSummary() {
  return (
    <section className="environment-card" aria-label="Environment configuration">
      <p className="eyebrow">Environment</p>
      <dl className="environment-list">
        <div>
          <dt>App</dt>
          <dd>{appEnvironment.appName}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{appEnvironment.appStage}</dd>
        </div>
        <div>
          <dt>API Base URL</dt>
          <dd>{appEnvironment.apiBaseUrl}</dd>
        </div>
      </dl>
    </section>
  )
}
