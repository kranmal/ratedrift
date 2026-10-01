import type { AccountKind } from '@/types/models';

/** Raw text as typed into the form. Everything is a string until validated. */
export interface AccountFormFields {
  provider: string;
  product: string;
  kind: AccountKind;
  balance: string;
  aer: string;
  postBonusAer: string;
  bonusEndsOn: string;
  maturesOn: string;
  noticeDays: string;
  notes: string;
}

export type AccountFormErrors = Partial<Record<keyof AccountFormFields, string>>;

export interface ValidAccount {
  provider: string;
  product?: string;
  kind: AccountKind;
  balancePence: number;
  aer: number;
  postBonusAer?: number;
  bonusEndsOn?: string;
  maturesOn?: string;
  noticeDays?: number;
  notes?: string;
}

/** "12,500.50" or "£12500" → pence. Undefined if it is not a non-negative amount with ≤2dp. */
export function parsePounds(text: string): number | undefined {
  const cleaned = text.replace(/[£,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return undefined;
  const [whole, frac = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

/** "4.75" or "4.75%" → 4.75. Undefined unless a sensible AER (0–20). */
export function parseRate(text: string): number | undefined {
  const cleaned = text.replace(/[%\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return n <= 20 ? n : undefined;
}

/** True only for a real calendar date in yyyy-mm-dd form (rejects 2027-02-30). */
export function isValidIsoDate(text: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/**
 * Validates the form. A bonus date with no post-bonus rate is rejected rather
 * than stored, because a deadline we cannot price would silently show £0 at
 * risk — the opposite of what the app is for.
 */
export function validateAccountForm(
  f: AccountFormFields,
): { ok: true; value: ValidAccount } | { ok: false; errors: AccountFormErrors } {
  const errors: AccountFormErrors = {};

  const provider = f.provider.trim();
  if (!provider) errors.provider = 'Enter the bank or building society.';

  const balancePence = parsePounds(f.balance);
  if (balancePence === undefined) errors.balance = 'Enter an amount in pounds, e.g. 12500 or 12,500.50.';

  const aer = parseRate(f.aer);
  if (aer === undefined) errors.aer = 'Enter the AER as a number between 0 and 20, e.g. 4.75.';

  let postBonusAer: number | undefined;
  const bonusEndsOn = f.bonusEndsOn.trim();
  const postText = f.postBonusAer.trim();
  if (bonusEndsOn || postText) {
    if (!bonusEndsOn) errors.bonusEndsOn = 'Enter the date the bonus ends, or clear the rate below.';
    else if (!isValidIsoDate(bonusEndsOn)) errors.bonusEndsOn = 'Use yyyy-mm-dd, e.g. 2027-03-14.';
    if (!postText) errors.postBonusAer = 'Enter the rate it drops to, or clear the date.';
    else {
      postBonusAer = parseRate(postText);
      if (postBonusAer === undefined) errors.postBonusAer = 'Enter a rate between 0 and 20.';
    }
  }

  const maturesOn = f.maturesOn.trim();
  if (f.kind === 'fixed') {
    if (!maturesOn) errors.maturesOn = 'Enter the maturity date.';
    else if (!isValidIsoDate(maturesOn)) errors.maturesOn = 'Use yyyy-mm-dd, e.g. 2027-02-01.';
  }

  let noticeDays: number | undefined;
  if (f.kind === 'notice') {
    const text = f.noticeDays.trim();
    if (!/^\d{1,3}$/.test(text) || Number(text) === 0) errors.noticeDays = 'Enter the notice period in days.';
    else noticeDays = Number(text);
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      provider,
      product: f.product.trim() || undefined,
      kind: f.kind,
      balancePence: balancePence as number,
      aer: aer as number,
      postBonusAer,
      bonusEndsOn: bonusEndsOn || undefined,
      maturesOn: f.kind === 'fixed' ? maturesOn : undefined,
      noticeDays,
      notes: f.notes.trim() || undefined,
    },
  };
}
