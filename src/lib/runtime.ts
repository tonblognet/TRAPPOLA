export const backendMode = import.meta.env.VITE_BACKEND_MODE === 'api' ? 'api' : 'demo'
export const apiEnabled = backendMode === 'api'
export const apiBaseUrl = (import.meta.env.VITE_PUBLIC_API_URL ?? '').replace(/\/$/, '')
