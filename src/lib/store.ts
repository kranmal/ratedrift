import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { generateId } from './id';

import type { Account, TaxProfile } from '@/types/models';

const KEYS = {
  accounts: 'ratedrift:accounts',
  tax: 'ratedrift:tax',
};

const DEFAULT_TAX: TaxProfile = { band: 'basic', psaUsedPence: 0 };

interface State {
  accounts: Account[];
  tax: TaxProfile;
  loaded: boolean;
}

let state: State = { accounts: [], tax: DEFAULT_TAX, loaded: false };
const listeners = new Set<() => void>();

/**
 * AsyncStorage is localStorage-backed on web, so it only exists in the browser.
 * The static web export prerenders every route in Node, where touching it throws.
 */
const isBrowser = typeof window !== 'undefined';

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<State>) {
  state = { ...state, ...partial };
  notify();
  void persist();
}

async function persist() {
  if (!isBrowser) return;
  await Promise.all([
    AsyncStorage.setItem(KEYS.accounts, JSON.stringify(state.accounts)),
    AsyncStorage.setItem(KEYS.tax, JSON.stringify(state.tax)),
  ]);
}

async function load() {
  if (!isBrowser) return;
  const [accounts, tax] = await Promise.all([
    AsyncStorage.getItem(KEYS.accounts),
    AsyncStorage.getItem(KEYS.tax),
  ]);
  state = {
    accounts: accounts ? JSON.parse(accounts) : [],
    tax: tax ? JSON.parse(tax) : DEFAULT_TAX,
    loaded: true,
  };
  notify();
}

void load();

/** Subscribes the calling component to store changes and returns the current state. */
export function useStore(): State {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    // load() may have finished between this render and the subscription, so
    // re-sync once; otherwise the screen can sit on its loading state forever.
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

// ---- Mutations ----

export type AccountInput = Omit<Account, 'id' | 'createdAt'>;

export function addAccount(input: AccountInput): Account {
  const account: Account = {
    ...input,
    provider: input.provider.trim(),
    product: input.product?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    id: generateId(),
    createdAt: Date.now(),
  };
  setState({ accounts: [...state.accounts, account] });
  return account;
}

export function updateAccount(id: string, patch: Partial<AccountInput>) {
  setState({
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  });
}

export function removeAccount(id: string) {
  setState({ accounts: state.accounts.filter((a) => a.id !== id) });
}

export function setTaxProfile(tax: TaxProfile) {
  setState({ tax });
}

// ---- Selectors ----

export function getAccount(s: State, id: string): Account | undefined {
  return s.accounts.find((a) => a.id === id);
}

export function totalBalancePence(s: State): number {
  return s.accounts.reduce((sum, a) => sum + a.balancePence, 0);
}

// ---- Dev seed ----

/**
 * Representative accounts for development and screenshots. Phase 0 has no entry
 * form yet, so this is how the maths gets exercised in the running app.
 * Deliberately includes a shared-licence FSCS breach and an already-lapsed bonus.
 */
export function seedDemoAccounts() {
  const seed: AccountInput[] = [
    {
      provider: 'Chase',
      licenceGroupId: 'chase-uk',
      product: 'Saver',
      kind: 'easy-access',
      balancePence: 12_000_00,
      aer: 4.75,
      postBonusAer: 1.5,
      bonusEndsOn: '2027-03-14',
    },
    {
      provider: 'Halifax',
      licenceGroupId: 'bank-of-scotland',
      product: 'Online Saver',
      kind: 'easy-access',
      balancePence: 50_000_00,
      aer: 4.1,
      postBonusAer: 1.2,
      bonusEndsOn: '2026-10-20',
    },
    {
      provider: 'Birmingham Midshires',
      licenceGroupId: 'bank-of-scotland',
      product: '1 Year Fixed',
      kind: 'fixed',
      balancePence: 76_000_00,
      aer: 5.05,
      maturesOn: '2027-02-01',
    },
    {
      provider: 'Zopa',
      licenceGroupId: 'zopa',
      product: 'Smart Saver',
      kind: 'easy-access',
      balancePence: 8_500_00,
      aer: 4.3,
    },
    {
      provider: 'Nationwide',
      licenceGroupId: 'nationwide',
      product: 'Cash ISA',
      kind: 'cash-isa',
      balancePence: 20_000_00,
      aer: 4.0,
      postBonusAer: 2.1,
      bonusEndsOn: '2026-09-01',
    },
  ];
  setState({ accounts: seed.map((s) => ({ ...s, id: generateId(), createdAt: Date.now() })) });
}

export function clearAll() {
  setState({ accounts: [], tax: DEFAULT_TAX });
}
