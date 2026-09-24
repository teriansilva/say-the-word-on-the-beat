import { useEffect, useState } from 'react'

/**
 * Whether the admin has the Gameplayce hint switched on (admin dashboard →
 * Settings). Fails closed: until the setting has loaded, and if it cannot be
 * loaded at all, the hint stays hidden.
 */
export function usePromoEnabled(): boolean {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/api/site-settings', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { promoEnabled?: unknown } | null) => {
        if (!cancelled) setEnabled(data?.promoEnabled === true)
      })
      .catch(() => {
        if (!cancelled) setEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return enabled
}
