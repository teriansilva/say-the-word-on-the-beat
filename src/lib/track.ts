// Umami events for saywordsonbeat.com (gameplayce.io #1348).
//
// Events use the payload-function form and name this site's Umami website
// explicitly, so they land on the right site even if another tracker is ever
// mounted next to it. Nothing is sent without
// analytics consent — the tracker is not even loaded then, and the
// before-send hook re-checks consent on every hit anyway.
import { trackingAllowed } from './consent.js';

export const SITE_WEBSITE_ID = '9411ff1f-a13e-4671-a1e5-9f949e712b9e';

export type PromoEvent = 'promo:shown' | 'promo:click' | 'promo:dismiss';

type Payload = Record<string, unknown>;
interface UmamiLike {
  track: (fn: (base: Payload) => Payload) => unknown;
}

export function buildEventPayload(base: Payload, name: PromoEvent, data: Record<string, string>): Payload {
  return { ...base, website: SITE_WEBSITE_ID, name, data };
}

export function trackPromo(name: PromoEvent, data: Record<string, string> = { variant: 'strip' }): void {
  if (!trackingAllowed()) return;
  const umami = (window as unknown as { umami?: UmamiLike }).umami;
  if (!umami?.track) return;
  try {
    umami.track((base) => buildEventPayload(base, name, data));
  } catch {
    // Analytics must never break the game.
  }
}
