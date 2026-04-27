import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { authService } from '../../core/services/auth/auth.service'

const emptyForm = {
  email: '',
  password: '',
}

export function LoginPage() {
  const { isAuthenticated, setToken } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    navigateTo('/', true)
  }, [isAuthenticated])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const email = form.email.trim()
    const password = form.password.trim()

    if (!email || !password) {
      setErrorMessage('Email and password are required.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const response = await authService.login({
        email,
        password,
      })
      setToken(response.accessToken)
      navigateTo('/', true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Login failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-label="Login form">
        <div className="login-copy">
          <p className="eyebrow">Property Management App</p>
          <h1>Sign in</h1>
          <p className="login-caption">
            Use your API credentials to enter the workspace.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={(event) => {
                setErrorMessage(null)
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => {
                setErrorMessage(null)
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }}
              required
            />
          </label>

          {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  )
}

LoginPage.displayName = 'LoginPage'

function navigateTo(path: string, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', path)
  } else {
    window.history.pushState({}, '', path)
  }

  window.dispatchEvent(new PopStateEvent('popstate'))
}
