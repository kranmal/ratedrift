import type { Account, Deadline, TaxBand, TaxProfile } from '@/types/models';

const DAY_MS = 86_400_000;

/**
 * What a maturing fixed-term account is assumed to roll into if the user does
 * nothing. Banks routinely drop matured fixed money into a near-zero "maturity"
 * or "loyalty" account, which is the whole point of this app.
 *
 * It is deliberately pessimistic and deliberately a constant: the app has no
 * rates feed, so this is an assumption, and the UI must label it as one.
 */
export const ASSUMED_POST_MATURITY_AER = 1.5;

/** Personal Savings Allowance by band, in pence. Additional-rate payers get none. */
const PSA_PENCE: Record<TaxBand, number> = {
  none: 1_000_00,
  basic: 1_000_00,
  higher: 500_00,
  additional: 0,
};

const MARGINAL_RATE: Record<TaxBand, number> = {
  none: 0,
  basic: 0.2,
  higher: 0.4,
  additional: 0.45,
};

/** Rounds to whole pence, away from zero, so money never drifts by a half-penny. */
function roundPence(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** Simple gross annual interest on a balance at a given rate, in pence. */
export function annualInterestPence(balancePence: number, aer: number): number {
  return roundPence(balancePence * (aer / 100));
}

/** Parses an ISO yyyy-mm-dd date as UTC midnight, so no timezone drift. */
export function parseIsoDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from `now` to an ISO date. Negative once the date has passed. */
export function daysUntil(iso: string, now: number): number {
  const today = Math.floor(now / DAY_MS) * DAY_MS;
  return Math.round((parseIsoDate(iso) - today) / DAY_MS);
}

/**
 * The rate an account will actually be paying after its next deadline passes,
 * assuming the user does nothing.
 */
export function rateAfterDrift(account: Account): number {
  if (account.bonusEndsOn && account.postBonusAer !== undefined) return account.postBonusAer;
  if (account.kind === 'fixed' && account.maturesOn) return ASSUMED_POST_MATURITY_AER;
  return account.aer;
}

/**
 * Gross interest per year the user loses by letting an account drift, in pence.
 * Zero when there is no deadline, or when the "drop" would be an increase.
 */
export function atRiskPence(account: Account): number {
  const after = rateAfterDrift(account);
  const drop = account.aer - after;
  if (drop <= 0) return 0;
  return annualInterestPence(account.balancePence, drop);
}

/**
 * Every dated event across the portfolio, soonest first, each carrying the
 * annual cost of ignoring it. This is what the home screen renders.
 */
export function getDeadlines(accounts: Account[], now: number): Deadline[] {
  const out: Deadline[] = [];

  for (const account of accounts) {
    if (account.bonusEndsOn && account.postBonusAer !== undefined) {
      out.push({
        accountId: account.id,
        kind: 'bonus-ends',
        on: account.bonusEndsOn,
        daysAway: daysUntil(account.bonusEndsOn, now),
        atRiskPence: annualInterestPence(
          account.balancePence,
          Math.max(0, account.aer - account.postBonusAer),
        ),
      });
    }

    if (account.kind === 'fixed' && account.maturesOn) {
      out.push({
        accountId: account.id,
        kind: 'matures',
        on: account.maturesOn,
        daysAway: daysUntil(account.maturesOn, now),
        atRiskPence: annualInterestPence(
          account.balancePence,
          Math.max(0, account.aer - ASSUMED_POST_MATURITY_AER),
        ),
      });
    }
  }

  return out.sort((a, b) => a.daysAway - b.daysAway || b.atRiskPence - a.atRiskPence);
}

/** Total gross annual interest across the portfolio at current rates, in pence. */
export function totalAnnualInterestPence(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + annualInterestPence(a.balancePence, a.aer), 0);
}

/** Total annual interest at risk across the portfolio, in pence. */
export function totalAtRiskPence(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + atRiskPence(a), 0);
}

// ---- Tax ----

export interface TaxBreakdown {
  grossPence: number;
  /** Interest shielded inside an ISA — never taxable. */
  shieldedPence: number;
  /** Taxable interest covered by remaining Personal Savings Allowance. */
  allowancePence: number;
  taxPence: number;
  netPence: number;
}

/**
 * Splits a year of gross interest into ISA-shielded, PSA-covered and taxed
 * parts. ISA interest is excluded from the PSA calculation entirely, which is
 * why it is computed separately rather than just subtracted at the end.
 *
 * This models the Personal Savings Allowance only. It deliberately ignores the
 * starting rate for savings, which depends on non-savings income the app does
 * not ask for — so the result is an estimate and the UI must say so.
 */
export function taxBreakdown(accounts: Account[], profile: TaxProfile): TaxBreakdown {
  let shielded = 0;
  let taxable = 0;

  for (const account of accounts) {
    const interest = annualInterestPence(account.balancePence, account.aer);
    if (account.kind === 'cash-isa') shielded += interest;
    else taxable += interest;
  }

  const allowanceLeft = Math.max(0, PSA_PENCE[profile.band] - profile.psaUsedPence);
  const covered = Math.min(taxable, allowanceLeft);
  const taxed = taxable - covered;
  const tax = roundPence(taxed * MARGINAL_RATE[profile.band]);

  return {
    grossPence: shielded + taxable,
    shieldedPence: shielded,
    allowancePence: covered,
    taxPence: tax,
    netPence: shielded + taxable - tax,
  };
}

/**
 * Interest per year lost by letting accounts drift, after estimated tax. Works as
 * the difference between the after-tax interest now and after the drift, so the
 * Personal Savings Allowance and ISA shielding are respected: a loss that only
 * eats into untaxed interest costs the full amount, one above the allowance
 * costs it net of the band's rate. Pass `onlyId` to drift just one account.
 */
export function netAtRiskPence(accounts: Account[], profile: TaxProfile, onlyId?: string): number {
  const drifted = accounts.map((a) =>
    onlyId === undefined || a.id === onlyId ? { ...a, aer: Math.min(a.aer, rateAfterDrift(a)) } : a,
  );
  return taxBreakdown(accounts, profile).netPence - taxBreakdown(drifted, profile).netPence;
}

/**
 * After-tax cost of one deadline: the account's after-tax drift cost, scaled by
 * how much of that account's gross drift this deadline accounts for.
 */
export function netDeadlineAtRiskPence(
  accounts: Account[],
  profile: TaxProfile,
  deadline: Deadline,
): number {
  const account = accounts.find((a) => a.id === deadline.accountId);
  if (!account) return 0;
  const gross = atRiskPence(account);
  if (gross <= 0) return 0;
  return roundPence(netAtRiskPence(accounts, profile, account.id) * Math.min(1, deadline.atRiskPence / gross));
}

// ---- Formatting ----

export function formatPence(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

export function formatPencePrecise(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}
