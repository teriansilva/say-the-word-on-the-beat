// User-facing strings for the consent banner, the privacy footer and the
// Gameplayce promo (gameplayce.io#1348). English only for v1; kept in one place so a later
// navigator.language switch (zh / vi / ru first, by traffic) needs no rewrite.

export const CONSENT_COPY = {
  title: 'Anonymous analytics',
  body:
    'May we count visits with our own, self-hosted analytics? The analytics sets no cookies and does no cross-site tracking — and nothing is sent unless you choose Accept. You can change this any time under Privacy settings.',
  policyLink: 'Privacy policy',
  reject: 'Reject',
  accept: 'Accept',
  close: 'Close privacy settings',
  current: (choice: 'granted' | 'denied') => `Currently: ${choice === 'granted' ? 'accepted' : 'rejected'}.`,
} as const;

export const FOOTER_COPY = {
  privacy: 'Privacy policy',
  legal: 'Legal notice',
  settings: 'Privacy settings',
} as const;

export const PROMO_COPY = {
  label: 'From the makers of this game',
  eyebrow: 'New · from the makers of this game',
  eyebrowShort: 'New · from the makers',
  title: 'Make your own rounds with AI',
  body: 'Type a topic, get a ready-to-play round — free on Gameplayce, with new updates all the time.',
  cta: 'Try it on Gameplayce →',
  dismiss: 'Hide this suggestion',
} as const;
