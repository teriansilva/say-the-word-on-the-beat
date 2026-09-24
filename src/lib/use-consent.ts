import { useSyncExternalStore } from 'react';
import {
  currentConsent,
  isPrivacySettingsOpen,
  subscribeConsent,
  type ConsentState,
} from './consent.js';

/** The stored analytics choice, re-rendering on change (#1328). */
export function useAnalyticsConsent(): ConsentState {
  return useSyncExternalStore(subscribeConsent, () => currentConsent(), () => 'unset');
}

/** Whether "Privacy settings" has re-opened the banner over a stored choice. */
export function usePrivacySettingsOpen(): boolean {
  return useSyncExternalStore(subscribeConsent, isPrivacySettingsOpen, () => false);
}
