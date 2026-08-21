import { useCallback, useEffect, useState } from 'react'
import type { Route } from '../types'
import { pathForRoute, routeFromPath } from '../lib/router'

const base = import.meta.env.BASE_URL

export const useRouter = () => {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname, base))

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname, base))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    const path = pathForRoute(next, base)
    if (options?.replace) window.history.replaceState({}, '', path)
    else window.history.pushState({}, '', path)
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { route, navigate }
}
