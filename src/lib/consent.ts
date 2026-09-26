// Analytics choice (gameplayce.io#1328, switched to opt-out 2026-09-26).
//
// Umami is self-hosted and cookieless. Since 2026-09-26 the operator counts
// visits on the basis of legitimate interest (Art. 6(1)(f) GDPR): analytics is
// ON by default and every visitor can switch it OFF. Nothing is tracked when
//   - the visitor switched it off (stored choice 'denied', or Umami's own
//     `umami.disabled` flag — set by the old opt-in banner's Reject), or
//   - the browser sends Global Privacy Control (`navigator.globalPrivacyControl`).
// So anyone who pressed Reject under the opt-in banner stays opted out; an old
// Accept, no stored choice, garbage or unreadable storage all read as ON.
//
// The choice lives in localStorage — no cookie — under `ANALYTICS_CONSENT_KEY`,
// mirrored into `umami.disabled`, which the v3 tracker re-reads before EVERY
// send. That is what makes "Off" take effect immediately on a page where the
// script is already running.
//
// A tiny external store (not React context): the footer's "Privacy settings"
// panel, the /privacy control and `<Analytics />` must agree on the state.

export const ANALYTICS_CONSENT_KEY = 'gameplayce.analytics-consent';
/** Umami v3's own per-browser opt-out; checked by the tracker before every send. */
export const UMAMI_DISABLED_KEY = 'umami.disabled';

export type ConsentChoice = 'granted' | 'denied';
export type ConsentState = ConsentChoice | 'unset';

function safeStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readConsent(storage: Storage | undefined = safeStorage()): ConsentState {
  try {
    if (storage?.getItem(ANALYTICS_CONSENT_KEY) === 'denied') return 'denied';
    if (storage?.getItem(UMAMI_DISABLED_KEY)) return 'denied';
    return 'granted';
  } catch {
    // Unreadable storage holds no opt-out we could honour: the default applies.
    return 'granted';
  }
}

/** The browser's Global Privacy Control signal. */
export function globalPrivacyControl(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** Whether this browser may be tracked right now: not switched off, no GPC. */
export function trackingAllowed(): boolean {
  return currentConsent() === 'granted' && !globalPrivacyControl();
}

type Listener = () => void;
const listeners = new Set<Listener>();
// The banner can also be re-opened on demand ("Privacy settings") while a
// choice is already stored; that is UI state, not consent state.
let settingsOpen = false;
// The choice made on THIS page, which wins over storage: if the write was
// refused (private mode, quota), a Reject must still stop tracking for the
// rest of the visit rather than fall back to an older stored 'granted'.
let memoryChoice: ConsentChoice | null = null;
// Bumped on every change of choice, here or in another tab. Anything held
// under an earlier epoch (the event queue in track.ts) belongs to a decision
// that may since have been withdrawn — even if it was granted again after.
let epoch = 0;

export function consentEpoch(): number {
  return epoch;
}

function emit(): void {
  for (const listener of listeners) listener();
}

// Another tab changed the choice (e.g. pressed Stop on /legal while this tab
// has a game open). The shared `umami.disabled` flag already stops sends from
// here, but this tab's in-memory choice must not keep overriding storage, and
// the UI (banner, /legal control, <Analytics />) must re-render.
let storageListenerInstalled = false;
function onStorage(event: StorageEvent): void {
  if (event.key !== ANALYTICS_CONSENT_KEY && event.key !== null) return;
  memoryChoice = null;
  epoch += 1;
  emit();
}

export function subscribeConsent(listener: Listener): () => void {
  listeners.add(listener);
  if (!storageListenerInstalled && typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
    storageListenerInstalled = true;
  }
  return () => listeners.delete(listener);
}

/**
 * Record a choice. Writes the choice and the Umami flag together, so the two
 * can never disagree about whether this browser is tracked.
 */
export function setConsent(choice: ConsentChoice, storage: Storage | undefined = safeStorage()): void {
  try {
    storage?.setItem(ANALYTICS_CONSENT_KEY, choice);
    if (choice === 'granted') storage?.removeItem(UMAMI_DISABLED_KEY);
    else storage?.setItem(UMAMI_DISABLED_KEY, '1');
  } catch {
    // Unwritable storage: the choice holds for this page only. For 'denied'
    // that is still honoured below — the in-memory override stops the tracker.
  }
  epoch += 1;
  memoryChoice = choice;
  settingsOpen = false;
  emit();
}

export function currentConsent(storage: Storage | undefined = safeStorage()): ConsentState {
  return memoryChoice ?? readConsent(storage);
}

export function openPrivacySettings(): void {
  settingsOpen = true;
  emit();
}

export function closePrivacySettings(): void {
  settingsOpen = false;
  emit();
}

export function isPrivacySettingsOpen(): boolean {
  return settingsOpen;
}

// ---------------------------------------------------------------------------
// Bot filter — Umami `data-before-send` hook
// ---------------------------------------------------------------------------

/**
 * Screen sizes headless browsers report by default. This is a BEST-EFFORT
 * filter, not a guarantee: a real visitor whose screen is exactly one of these
 * (1280×720 laptops exist) is dropped too, and a bot that fakes its screen and
 * clears `navigator.webdriver` gets through. The operator chose that trade-off
 * (#1328): a missing pageview costs less than the agent fleet in the stats.
 */
export const HEADLESS_SCREENS: readonly string[] = ['800x600', '1024x1024', '1280x720'];

interface BotSignals {
  webdriver?: boolean;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export function isLikelyBot(signals: BotSignals): boolean {
  if (signals.webdriver === true) return true;
  if (signals.userAgent && /HeadlessChrome/i.test(signals.userAgent)) return true;
  if (signals.screenWidth !== undefined && signals.screenHeight !== undefined) {
    if (HEADLESS_SCREENS.includes(`${signals.screenWidth}x${signals.screenHeight}`)) return true;
  }
  return false;
}

function browserSignals(): BotSignals {
  if (typeof window === 'undefined') return {};
  return {
    webdriver: window.navigator?.webdriver,
    userAgent: window.navigator?.userAgent,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
  };
}

/** The global name the tracker's `data-before-send` attribute points at. */
export const BEFORE_SEND_HOOK = 'gameplayceUmamiBeforeSend';

/**
 * Umami v3.2.0 contract (verified against the served `script.js`): the tracker
 * looks up `window[data-before-send]`, calls it as `fn(type, payload)`, awaits
 * the result, and sends only if it is truthy — so returning `false` drops the
 * hit. Also re-checks consent, belt and braces with `umami.disabled`.
 */
export function beforeSend<T>(_type: string, payload: T): T | false {
  if (!trackingAllowed()) return false;
  if (isLikelyBot(browserSignals())) return false;
  return payload;
}

export function installBeforeSendHook(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>)[BEFORE_SEND_HOOK] = beforeSend;
}

export const __testing = {
  reset(): void {
    listeners.clear();
    if (storageListenerInstalled && typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
    storageListenerInstalled = false;
    settingsOpen = false;
    memoryChoice = null;
    epoch = 0;
  },
};
