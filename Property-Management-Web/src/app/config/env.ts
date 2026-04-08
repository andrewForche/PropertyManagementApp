export const appEnvironment = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api',
  appName: 'Property Management App',
  appStage: import.meta.env.MODE,
} as const
