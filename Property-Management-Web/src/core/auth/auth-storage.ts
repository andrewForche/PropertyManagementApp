const authTokenStorageKey = 'pm.auth.token'

export function getStoredAuthToken() {
  const storedValue = window.localStorage.getItem(authTokenStorageKey)
  return storedValue ? normalizeStoredToken(storedValue) : null
}

export function setStoredAuthToken(token: string) {
  window.localStorage.setItem(authTokenStorageKey, normalizeStoredToken(token))
}

export function clearStoredAuthToken() {
  window.localStorage.removeItem(authTokenStorageKey)
}

export function getAuthTokenStorageKey() {
  return authTokenStorageKey
}

function normalizeStoredToken(token: string) {
  return token.trim().replace(/^Bearer\s+/i, '').replace(/^"(.*)"$/, '$1')
}
