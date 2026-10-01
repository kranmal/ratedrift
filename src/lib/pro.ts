import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { activateLicence, revalidateLicence, type ActivateResult, type StoredLicence } from './licence';

/**
 * Set at build time (see the deploy workflow). With no checkout URL the paid
 * unlock is switched off and everything stays free, so merging this before the
 * Lemon Squeezy product exists changes nothing for users.
 */
const CHECKOUT_URL = process.env.EXPO_PUBLIC_LS_CHECKOUT_URL ?? '';
const PRODUCT_ID = Number(process.env.EXPO_PUBLIC_LS_PRODUCT_ID) || undefined;

export const proEnabled = CHECKOUT_URL !== '';
export const checkoutUrl = CHECKOUT_URL;

const KEY = 'ratedrift:licence';
const isBrowser = typeof window !== 'undefined';

interface ProState {
  loaded: boolean;
  licence: StoredLicence | null;
}

let state: ProState = { loaded: false, licence: null };
const listeners = new Set<() => void>();

function setState(next: ProState) {
  state = next;
  listeners.forEach((l) => l());
}

async function load() {
  if (!isBrowser) return;
  let licence: StoredLicence | null = null;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    licence = raw ? (JSON.parse(raw) as StoredLicence) : null;
  } catch {
    licence = null;
  }
  setState({ loaded: true, licence });

  // Revoked or refunded keys stop working; offline never does.
  if (licence && proEnabled) {
    const result = await revalidateLicence(licence, { productId: PRODUCT_ID }, fetch);
    if (result === 'invalid') {
      await AsyncStorage.removeItem(KEY).catch(() => {});
      setState({ loaded: true, licence: null });
    }
  }
}

void load();

export async function activate(key: string): Promise<ActivateResult> {
  const result = await activateLicence(key, { productId: PRODUCT_ID }, fetch);
  if (result.ok) {
    await AsyncStorage.setItem(KEY, JSON.stringify(result.licence)).catch(() => {});
    setState({ loaded: true, licence: result.licence });
  }
  return result;
}

/** True when the paid features are available: always when the unlock is switched off. */
export function usePro(): { hasPro: boolean; loaded: boolean } {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return { hasPro: !proEnabled || state.licence !== null, loaded: state.loaded };
}
