type AnalyticsPayload = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    ym?: (id: number, method: string, goal: string, payload?: AnalyticsPayload) => void
  }
}

export const track = (goal: string, payload: AnalyticsPayload = {}) => {
  window.dispatchEvent(new CustomEvent('trappola:analytics', { detail: { goal, payload } }))
  const rawId = import.meta.env.VITE_YANDEX_METRIKA_ID
  const id = rawId ? Number(rawId) : 0
  if (id > 0 && typeof window.ym === 'function') window.ym(id, 'reachGoal', goal, payload)
}
