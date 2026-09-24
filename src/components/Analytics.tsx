import { useEffect } from 'react'
import { BEFORE_SEND_HOOK, installBeforeSendHook } from '@/lib/consent.js'
import { useAnalyticsConsent } from '@/lib/use-consent.js'
import { SITE_WEBSITE_ID } from '@/lib/track'

const ANALYTICS_SCRIPT_URL = 'https://analytics.superstatus.io/script.js'

/**
 * Umami tracker, opt-in (gameplayce.io#1348, mirroring the platform's gameplayce.io#1328).
 *
 * The script is not even requested until the visitor presses Accept. Reject
 * (or no answer) means no request to the analytics origin at all. A later
 * withdrawal cannot unload a script, so it is covered by `umami.disabled`
 * (re-read by the tracker before every send) plus the before-send hook, which
 * also drops likely bots.
 */
export function Analytics({ websiteId = SITE_WEBSITE_ID }: { websiteId?: string } = {}) {
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if (!import.meta.env.PROD) return
    if (consent !== 'granted') return

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
