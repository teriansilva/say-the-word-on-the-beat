import { useCallback, useEffect, useRef, useState } from 'react'
import { loadRecord, recordDismissed, saveRecord, shouldShowPromo, type Blockers } from '@/lib/promo'
import { trackPromo } from '@/lib/track'

/**
 * Drives the Gameplayce promo strip (gameplayce.io#1348). All rules live in
 * lib/promo.ts: on every page load, until the visitor presses × (then for
 * good); stepping aside while the privacy panel, the player or a dialog is up.
 * `promo:shown` is sent once per page load, the first time it is on screen.
 */
export function usePromo(opts: { enabled: boolean; blockers: Blockers }) {
  const { enabled, blockers } = opts
  const [dismissed, setDismissed] = useState(() => loadRecord().dismissed)
  const trackedShown = useRef(false)
  const visible = enabled && shouldShowPromo({ dismissed }, blockers)

  useEffect(() => {
    if (!visible || trackedShown.current) return
    trackedShown.current = true
    trackPromo('promo:shown')
  }, [visible])

  const dismiss = useCallback(() => {
    saveRecord(recordDismissed())
    setDismissed(true)
    trackPromo('promo:dismiss')
  }, [])

  // Following the link does not hide the strip (operator, 2026-09-27).
  const click = useCallback(() => {
    trackPromo('promo:click')
  }, [])

  return { visible, dismiss, click }
}
