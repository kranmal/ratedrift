export type Id = string;

/**
 * How a savings product behaves, which decides which date matters and whether
 * the money can be moved at all right now.
 */
export type AccountKind =
  | 'easy-access'
  | 'fixed'
  | 'notice'
  | 'cash-isa'
  | 'regular-saver';

export type TaxBand = 'none' | 'basic' | 'higher' | 'additional';

/**
 * One savings account the user holds. Everything here is typed in by hand —
 * there is no rates feed and no bank connection, by design.
 *
 * Money is stored in **pence** as an integer to keep the arithmetic exact.
 * Rates are stored as percentages, i.e. 4.75 means 4.75% AER.
 */
export interface Account {
  id: Id;
  /** Consumer-facing brand, e.g. "Birmingham Midshires". */
  provider: string;
  /** FSCS licence group key, e.g. "lloyds". See lib/fscs.ts. */
  licenceGroupId: string;
  /** Product name, e.g. "1 Year Fixed Rate Cash ISA". */
  product?: string;
  kind: AccountKind;
  /** Current balance in pence. */
  balancePence: number;
  /** Headline rate in percent, e.g. 4.75. */
  aer: number;
  /**
   * The rate this account drops to once an introductory bonus ends.
   * Undefined means no bonus — the rate is simply `aer` until the market moves it.
   */
  postBonusAer?: number;
  /** ISO date (yyyy-mm-dd) the bonus ends and the rate falls to `postBonusAer`. */
  bonusEndsOn?: string;
  /** ISO date a fixed-term product matures. Only meaningful for 'fixed'. */
  maturesOn?: string;
  /** Days of notice required before a withdrawal. Only meaningful for 'notice'. */
  noticeDays?: number;
  notes?: string;
  createdAt: number;
}

/** The user's own tax position, used to show interest net of tax. */
export interface TaxProfile {
  band: TaxBand;
  /** How much Personal Savings Allowance is already used elsewhere, in pence. */
  psaUsedPence: number;
}

/** What kind of deadline an account is facing. */
export type DeadlineKind = 'bonus-ends' | 'matures';

/**
 * A dated event on an account, with the annual cost of ignoring it.
 * This is the core object the home screen is a list of.
 */
export interface Deadline {
  accountId: Id;
  kind: DeadlineKind;
  /** ISO date. */
  on: string;
  /** Whole days from "today" to `on`. Negative means already passed. */
  daysAway: number;
  /**
   * Gross interest per year lost by doing nothing, in pence.
   * For a bonus this is the drop from `aer` to `postBonusAer`. For a maturity
   * it is the drop from `aer` to the assumed post-maturity rate.
   */
  atRiskPence: number;
}
