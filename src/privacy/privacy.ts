// /privacy page script (gameplayce.io#1348). No React: the static policy page renders the
// current analytics choice and the same On / Off panel as the game,
// both driven by the vendored consent store — so a visitor can withdraw on a
// direct visit or after a refresh, without the SPA being loaded.
import './privacy.css'
import {
  closePrivacySettings,
  currentConsent,
  isPrivacySettingsOpen,
  openPrivacySettings,
  setConsent,
  subscribeConsent,
  type ConsentChoice,
  globalPrivacyControl,
} from '../lib/consent.js'
import { CONSENT_COPY } from '../lib/copy.ts'

const LABEL = { granted: 'On', denied: 'Off', unset: 'On' } as const

const stateEl = document.querySelector<HTMLElement>('[data-consent-state]')
const banner = document.querySelector<HTMLElement>('[data-testid="consent-banner"]')
const bodyEl = document.querySelector<HTMLElement>('[data-consent-body]')
const currentEl = document.querySelector<HTMLElement>('[data-consent-current]')
const openBtn = document.querySelector<HTMLButtonElement>('[data-open-consent]')

if (bodyEl) bodyEl.textContent = CONSENT_COPY.body

function render(): void {
  const consent = currentConsent()
  const gpc = globalPrivacyControl()
  if (stateEl) stateEl.textContent = gpc ? 'Off (Global Privacy Control)' : LABEL[consent]
  if (!banner) return
  // The On/Off panel opens only on request (analytics is opt-out).
  const open = isPrivacySettingsOpen()
  const wasHidden = banner.hidden
  banner.hidden = !open
  if (currentEl) currentEl.textContent = gpc ? CONSENT_COPY.gpc : CONSENT_COPY.current(consent === 'denied' ? 'denied' : 'granted')
  if (open && wasHidden) banner.focus()
  if (!open && !wasHidden) openBtn?.focus()
}

openBtn?.addEventListener('click', () => openPrivacySettings())
banner?.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((b) => {
  b.addEventListener('click', () => setConsent(b.dataset.consent as ConsentChoice))
})
banner?.querySelector('[data-consent-close]')?.addEventListener('click', () => closePrivacySettings())
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isPrivacySettingsOpen()) closePrivacySettings()
})

// subscribeConsent also follows choices made in other tabs (storage event).
subscribeConsent(render)
render()
