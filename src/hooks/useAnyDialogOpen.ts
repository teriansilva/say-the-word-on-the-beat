import { useEffect, useState } from 'react'

const OPEN_DIALOG = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'

/**
 * True while any Radix dialog is open anywhere on the page (gameplayce.io#1348).
 *
 * The editor's dialogs each own their state (Share in App, Add Content and
 * image cropping in ContentPoolManager, the Reset confirmation in
 * FloatingMenu), so rather than threading every flag up to App, the promo
 * watches the DOM for an open dialog. New dialogs are covered automatically.
 */
export function useAnyDialogOpen(): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const check = () => setOpen(document.querySelector(OPEN_DIALOG) !== null)
    check()
    const mo = new MutationObserver(check)
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state', 'role'] })
    return () => mo.disconnect()
  }, [])
  return open
}
