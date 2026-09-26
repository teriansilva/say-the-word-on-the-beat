import { useEffect } from 'react'
import { BEFORE_SEND_HOOK, globalPrivacyControl, installBeforeSendHook } from '@/lib/consent.js'
import { useAnalyticsConsent } from '@/lib/use-consent.js'
import { SITE_WEBSITE_ID } from '@/lib/track'

const ANALYTICS_SCRIPT_URL = 'https://analytics.superstatus.io/script.js'

/**
 * Umami tracker, opt-out (legitimate interest, 2026-09-26).
 *
 * Loaded by default. Not requested at all when the visitor has switched
 * analytics off (Privacy settings, or an old Reject) or the browser sends
 * Global Privacy Control. Switching off later cannot unload a script, so that
 * is covered by `umami.disabled` (re-read by the tracker before every send)
 * plus the before-send hook, which also drops likely bots.
 */
export function Analytics({ websiteId = SITE_WEBSITE_ID }: { websiteId?: string } = {}) {
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if (!import.meta.env.PROD) return
    if (consent !== 'granted' || globalPrivacyControl()) return

    const existing = document.querySelector(
      `script[src="${ANALYTICS_SCRIPT_URL}"][data-website-id="${websiteId}"]`,
    )
    if (existing) return

    installBeforeSendHook()
    const script = document.createElement('script')
    script.src = ANALYTICS_SCRIPT_URL
    script.defer = true
    script.dataset.websiteId = websiteId
    script.dataset.beforeSend = BEFORE_SEND_HOOK
    document.head.appendChild(script)
  }, [websiteId, consent])

  return null
}
