// Gameplayce promo strip — display rules (gameplayce.io#1348, variant A).
//
// Pure logic, no React and no DOM, so every rule is unit tested (promo.test.ts).
// Operator's call, 2026-09-27: "show the gameplayce hint always, only if the
// users close it with an x to disappear".
//   - it shows on every page load, immediately;
//   - never while the privacy panel, the full-screen player or a dialog is up
//     (it comes back when they close);
//   - only × hides it, and for good. Following the link does not.
//
// Older records carried impression counts, cooldowns and a CTA-click flag;
// those no longer hide the strip. Only an earlier × (a `snoozeUntil` from the
// old 90-day snooze) counts, and it now counts as dismissed for good.

export const PROMO_STORAGE_KEY = 'stw.promo';

export const PROMO_URL =
  'https://gameplayce.io/games/say-the-word-on-beat?utm_source=saywordsonbeat&utm_medium=promo&utm_campaign=stw-ai&utm_content=strip';

export interface PromoRecord {
  dismissed: boolean;
}

export const EMPTY_RECORD: PromoRecord = { dismissed: false };

/** Parse whatever is stored; anything malformed counts as a fresh record. */
export function parseRecord(raw: string | null | undefined): PromoRecord {
  if (!raw) return { ...EMPTY_RECORD };
  try {
    const v = JSON.parse(raw) as { dismissed?: unknown; snoozeUntil?: unknown };
    const oldX = typeof v.snoozeUntil === 'number' && Number.isFinite(v.snoozeUntil);
    return { dismissed: v.dismissed === true || oldX };
  } catch {
    return { ...EMPTY_RECORD };
  }
}

export interface Blockers {
  consentBannerVisible: boolean;
  playbackVisible: boolean;
  dialogOpen: boolean;
}

export function isBlocked(b: Blockers): boolean {
  return b.consentBannerVisible || b.playbackVisible || b.dialogOpen;
}

/** Should the strip be on screen now? */
export function shouldShowPromo(record: PromoRecord, blockers: Blockers): boolean {
  return !record.dismissed && !isBlocked(blockers);
}

export function recordDismissed(): PromoRecord {
  return { dismissed: true };
}

function storage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadRecord(s: Storage | undefined = storage()): PromoRecord {
  try {
    return parseRecord(s?.getItem(PROMO_STORAGE_KEY));
  } catch {
    return { ...EMPTY_RECORD };
  }
}

export function saveRecord(record: PromoRecord, s: Storage | undefined = storage()): void {
  try {
    s?.setItem(PROMO_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Unwritable storage: the × still hides it for the rest of this page.
  }
}
