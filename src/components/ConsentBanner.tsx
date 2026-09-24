import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { closePrivacySettings, setConsent } from '@/lib/consent.js'
import { useAnalyticsConsent, usePrivacySettingsOpen } from '@/lib/use-consent.js'
import { CONSENT_COPY } from '@/lib/copy'

/**
 * Analytics consent banner (gameplayce.io#1348), the saywordsonbeat.com twin of the
 * platform's gameplayce.io#1328 banner: same state (vendored consent.ts), same rules.
 *
 * Non-modal: the page stays usable, and not answering means "no" — nothing
 * loads until Accept. Reject and Accept are the same component, variant and
 * size. `suppressed` hides it while the full-screen player is up; a pending
 * first-visit banner simply waits until playback ends.
 */
export function ConsentBanner({ suppressed = false }: { suppressed?: boolean }) {
  const consent = useAnalyticsConsent()
  const reopened = usePrivacySettingsOpen()
  const regionRef = useRef<HTMLElement>(null)
  const visible = !suppressed && (consent === 'unset' || reopened)

  // Re-opened on request → take focus. A first-visit banner never steals it.
  useEffect(() => {
    if (visible && reopened) regionRef.current?.focus()
  }, [visible, reopened])

  useEffect(() => {
    if (!visible || !reopened) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePrivacySettings()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, reopened])

  // Mirror visibility onto <body> so the floating play menu can lift above
  // the mobile bottom sheet instead of being covered by it (see main.css).
  useEffect(() => {
    const body = document.body
    body.classList.toggle('consent-open', visible)
    const el = regionRef.current
    if (!visible || !el || typeof ResizeObserver === 'undefined') {
      return () => body.classList.remove('consent-open')
    }
    const ro = new ResizeObserver(() => body.style.setProperty('--consent-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => {
      ro.disconnect()
      body.classList.remove('consent-open')
      body.style.removeProperty('--consent-h')
    }
  }, [visible])

  if (!visible) return null

  return (
    <section
      ref={regionRef}
      aria-labelledby="consent-banner-title"
      data-testid="consent-banner"
      tabIndex={-1}
      className="consent-banner fixed z-[60] inset-x-0 bottom-0 md:inset-x-auto md:left-1/2 md:bottom-6 md:-translate-x-1/2 md:w-[min(660px,calc(100%-220px))] bg-card text-card-foreground border-2 border-border border-b-0 md:border-b-2 rounded-t-3xl md:rounded-3xl shadow-2xl p-5 flex flex-col md:flex-row gap-4 md:items-center outline-none focus-visible:ring-4 focus-visible:ring-secondary/60"
    >
      <div className="flex-1 min-w-0">
        <h2 id="consent-banner-title" className="text-lg font-semibold mb-1">
          {CONSENT_COPY.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {CONSENT_COPY.body}{' '}
          <a href="/privacy#analytics" className="text-secondary font-semibold underline underline-offset-2">
            {CONSENT_COPY.policyLink}
          </a>
        </p>
        {reopened && consent !== 'unset' && (
          <p className="text-sm mt-2" data-testid="consent-current">
            {CONSENT_COPY.current(consent)}
          </p>
        )}
      </div>
      <div className="flex gap-3 shrink-0 items-center">
        <Button variant="outline" className="h-11 min-w-[108px] flex-1 md:flex-none" onClick={() => setConsent('denied')}>
          {CONSENT_COPY.reject}
        </Button>
        <Button variant="outline" className="h-11 min-w-[108px] flex-1 md:flex-none" onClick={() => setConsent('granted')}>
          {CONSENT_COPY.accept}
        </Button>
        {reopened && (
          <button
            type="button"
            onClick={closePrivacySettings}
            aria-label={CONSENT_COPY.close}
            className="h-11 w-11 grid place-items-center rounded-xl text-muted-foreground text-2xl hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60"
          >
            ×
          </button>
        )}
      </div>
    </section>
  )
}
