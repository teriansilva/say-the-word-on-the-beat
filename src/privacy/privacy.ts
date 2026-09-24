// /privacy page script (gameplayce.io#1348). No React: the static policy page renders the
// current analytics choice and the same Reject / Accept banner as the game,
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
} from '../lib/consent.js'
import { CONSENT_COPY } from '../lib/copy.ts'

const LABEL = { granted: 'Accepted', denied: 'Rejected', unset: 'Not decided' } as const

const stateEl = document.querySelector<HTMLElement>('[data-consent-state]')
const banner = document.querySelector<HTMLElement>('[data-testid="consent-banner"]')
const bodyEl = document.querySelector<HTMLElement>('[data-consent-body]')
const currentEl = document.querySelector<HTMLElement>('[data-consent-current]')
const openBtn = document.querySelector<HTMLButtonElement>('[data-open-consent]')

if (bodyEl) bodyEl.textContent = CONSENT_COPY.body

function render(): void {
  const consent = currentConsent()
  if (stateEl) stateEl.textContent = LABEL[consent]
  if (!banner) return
  // On this page the banner opens only on request: the policy is readable
  // first, and not answering still means nothing is sent.
  const open = isPrivacySettingsOpen()
  const wasHidden = banner.hidden
  banner.hidden = !open
  if (currentEl) currentEl.textContent = consent === 'unset' ? '' : CONSENT_COPY.current(consent)
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
