const defaultAppName = 'Property Management App'
const defaultApiBaseUrl = 'http://localhost:5239/api'

export const appEnvironment = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
  appName: import.meta.env.VITE_APP_NAME ?? defaultAppName,
  appStage: import.meta.env.MODE,
} as const
