import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { closePrivacySettings, globalPrivacyControl, setConsent } from '@/lib/consent.js'
import { useAnalyticsConsent, usePrivacySettingsOpen } from '@/lib/use-consent.js'
import { CONSENT_COPY } from '@/lib/copy'

/**
 * Privacy settings panel: the analytics On/Off switch (opt-out since
 * 2026-09-26; see lib/consent.ts). It no longer appears on its own; it opens
 * only from the footer's "Privacy settings". Non-modal, and hidden while the
 * full-screen player is up (`suppressed`).
 */
export function ConsentBanner({ suppressed = false }: { suppressed?: boolean }) {
  const consent = useAnalyticsConsent()
  const reopened = usePrivacySettingsOpen()
  const regionRef = useRef<HTMLElement>(null)
  const visible = !suppressed && reopened
  const gpc = globalPrivacyControl()

  // Opened on request → take focus.
  useEffect(() => {
    if (visible) regionRef.current?.focus()
  }, [visible])

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
      data-testid="privacy-settings"
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
        <p className="text-sm mt-2" data-testid="consent-current">
          {CONSENT_COPY.current(consent === 'denied' ? 'denied' : 'granted')}
        </p>
        {gpc && (
          <p className="text-sm mt-1 text-muted-foreground" data-testid="consent-gpc">
            {CONSENT_COPY.gpc}
          </p>
        )}
      </div>
      <div className="flex gap-3 shrink-0 items-center">
        <div role="group" aria-label={CONSENT_COPY.title} className="flex gap-3 flex-1 md:flex-none">
          <Button
            variant={consent === 'denied' ? 'default' : 'outline'}
            aria-pressed={consent === 'denied'}
            className="h-11 min-w-[108px] flex-1 md:flex-none"
            onClick={() => setConsent('denied')}
          >
            {CONSENT_COPY.off}
          </Button>
          <Button
            variant={consent === 'denied' ? 'outline' : 'default'}
            aria-pressed={consent !== 'denied'}
            className="h-11 min-w-[108px] flex-1 md:flex-none"
            onClick={() => setConsent('granted')}
          >
            {CONSENT_COPY.on}
          </Button>
        </div>
        <button
          type="button"
          onClick={closePrivacySettings}
          aria-label={CONSENT_COPY.close}
          className="h-11 w-11 grid place-items-center rounded-xl text-muted-foreground text-2xl hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60"
        >
          ×
        </button>
      </div>
    </section>
  )
}
