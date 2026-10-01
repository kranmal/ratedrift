import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ASSUMED_POST_MATURITY_AER,
  annualInterestPence,
  atRiskPence,
  daysUntil,
  formatPence,
  getDeadlines,
  rateAfterDrift,
  taxBreakdown,
  totalAtRiskPence,
} from '../src/lib/interest.ts';
import { FSCS_LIMIT_PENCE, findGroupByBrand, getFscsExposure } from '../src/lib/fscs.ts';

import type { Account } from '../src/types/models.ts';

const NOW = Date.UTC(2026, 9, 1); // 2026-10-01

function account(over: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    provider: 'Chase',
    licenceGroupId: 'chase-uk',
    kind: 'easy-access',
    balancePence: 12_000_00,
    aer: 4.75,
    createdAt: 0,
    ...over,
  };
}

test('annual interest is exact in pence', () => {
  assert.equal(annualInterestPence(12_000_00, 4.75), 570_00);
  assert.equal(annualInterestPence(10_000_00, 5), 500_00);
  assert.equal(annualInterestPence(0, 5), 0);
});

test('annual interest rounds to whole pence rather than drifting', () => {
  // 3333p at 3.33% = 110.98...p -> 111p
  assert.equal(annualInterestPence(3333, 3.33), 111);
});

test('daysUntil counts whole days and goes negative after the date', () => {
  assert.equal(daysUntil('2026-10-01', NOW), 0);
  assert.equal(daysUntil('2026-10-31', NOW), 30);
  assert.equal(daysUntil('2026-09-21', NOW), -10);
});

test('daysUntil is unaffected by the time of day', () => {
  const lateEvening = Date.UTC(2026, 9, 1, 23, 59, 59);
  assert.equal(daysUntil('2026-10-31', lateEvening), 30);
});

test('a bonus account drifts to its post-bonus rate', () => {
  const a = account({ aer: 4.75, postBonusAer: 1.5, bonusEndsOn: '2027-03-14' });
  assert.equal(rateAfterDrift(a), 1.5);
});

test('a maturing fixed account drifts to the assumed maturity rate', () => {
  const a = account({ kind: 'fixed', aer: 5.2, maturesOn: '2027-01-10' });
  assert.equal(rateAfterDrift(a), ASSUMED_POST_MATURITY_AER);
});

test('an account with no deadline does not drift and risks nothing', () => {
  const a = account();
  assert.equal(rateAfterDrift(a), 4.75);
  assert.equal(atRiskPence(a), 0);
});

test('at-risk is the annual value of the rate drop', () => {
  // £12,000 falling from 4.75% to 1.5% = 3.25% = £390/yr
  const a = account({ aer: 4.75, postBonusAer: 1.5, bonusEndsOn: '2027-03-14' });
  assert.equal(atRiskPence(a), 390_00);
  assert.equal(formatPence(atRiskPence(a)), '£390');
});

test('a rate that goes up is not a risk', () => {
  const a = account({ aer: 2, postBonusAer: 4, bonusEndsOn: '2027-03-14' });
  assert.equal(atRiskPence(a), 0);
});

test('deadlines are sorted soonest first', () => {
  const accounts = [
    account({ id: 'far', aer: 5, postBonusAer: 1, bonusEndsOn: '2027-06-01' }),
    account({ id: 'soon', aer: 5, postBonusAer: 1, bonusEndsOn: '2026-11-01' }),
  ];
  const deadlines = getDeadlines(accounts, NOW);
  assert.deepEqual(
    deadlines.map((d) => d.accountId),
    ['soon', 'far'],
  );
  assert.equal(deadlines[0].daysAway, 31);
});

test('one account can carry both a bonus end and a maturity', () => {
  const a = account({
    kind: 'fixed',
    aer: 5,
    postBonusAer: 2,
    bonusEndsOn: '2026-12-01',
    maturesOn: '2027-01-01',
  });
  const deadlines = getDeadlines([a], NOW);
  assert.equal(deadlines.length, 2);
  assert.deepEqual(
    deadlines.map((d) => d.kind),
    ['bonus-ends', 'matures'],
  );
});

test('a bonus end date with no post-bonus rate is not a deadline', () => {
  // Nothing is known about the drop, so inventing a number would be a lie.
  const a = account({ bonusEndsOn: '2026-12-01' });
  assert.deepEqual(getDeadlines([a], NOW), []);
  assert.equal(atRiskPence(a), 0);
});

test('a non-fixed account ignores a maturity date', () => {
  const a = account({ kind: 'easy-access', maturesOn: '2026-12-01' });
  assert.deepEqual(getDeadlines([a], NOW), []);
});

test('past deadlines surface with negative days rather than disappearing', () => {
  const a = account({ aer: 5, postBonusAer: 1, bonusEndsOn: '2026-08-01' });
  const [d] = getDeadlines([a], NOW);
  assert.equal(d.daysAway, -61);
  assert.equal(d.atRiskPence, 480_00);
});

test('portfolio at-risk sums across accounts', () => {
  const accounts = [
    account({ id: 'a', balancePence: 10_000_00, aer: 5, postBonusAer: 1, bonusEndsOn: '2027-01-01' }),
    account({ id: 'b', balancePence: 20_000_00, aer: 4, postBonusAer: 2, bonusEndsOn: '2027-02-01' }),
  ];
  // 4% of 10k = £400, 2% of 20k = £400
  assert.equal(totalAtRiskPence(accounts), 800_00);
});

// ---- FSCS ----

test('brands sharing a licence are totalled together', () => {
  const accounts = [
    account({ id: 'h', provider: 'Halifax', licenceGroupId: 'bank-of-scotland', balancePence: 50_000_00 }),
    account({ id: 'bm', provider: 'Birmingham Midshires', licenceGroupId: 'bank-of-scotland', balancePence: 76_000_00 }),
  ];
  const [exposure] = getFscsExposure(accounts);
  assert.equal(exposure.groupName, 'Bank of Scotland plc');
  assert.equal(exposure.totalPence, 126_000_00);
  assert.equal(exposure.unprotectedPence, 6_000_00);
  assert.equal(formatPence(exposure.unprotectedPence), '£6,000');
});

test('a balance exactly on the FSCS limit is fully protected', () => {
  const accounts = [account({ balancePence: FSCS_LIMIT_PENCE })];
  assert.equal(getFscsExposure(accounts)[0].unprotectedPence, 0);
});

test('separate licences each get their own limit', () => {
  const accounts = [
    account({ id: 'a', licenceGroupId: 'barclays', balancePence: 110_000_00 }),
    account({ id: 'b', licenceGroupId: 'nationwide', balancePence: 110_000_00 }),
  ];
  const exposure = getFscsExposure(accounts);
  assert.equal(exposure.length, 2);
  assert.equal(exposure.every((e) => e.unprotectedPence === 0), true);
});

test('exposure is sorted worst-breach first', () => {
  const accounts = [
    account({ id: 'ok', licenceGroupId: 'barclays', balancePence: 10_000_00 }),
    account({ id: 'bad', licenceGroupId: 'nationwide', balancePence: 130_000_00 }),
  ];
  assert.equal(getFscsExposure(accounts)[0].licenceGroupId, 'nationwide');
});

test('an unknown licence is flagged unlisted and keyed by provider', () => {
  const accounts = [account({ provider: 'Acme', licenceGroupId: 'not-a-real-group' })];
  const [exposure] = getFscsExposure(accounts);
  assert.equal(exposure.licenceGroupId, 'unlisted:acme');
  assert.equal(exposure.unlisted, true);
});

test('a volatile mapping carries its caution through to the exposure', () => {
  const accounts = [account({ licenceGroupId: 'barclays', balancePence: 1_000_00 })];
  assert.match(getFscsExposure(accounts)[0].caution ?? '', /Tesco/);
});

test('acquired brands resolve to the acquirer licence', () => {
  assert.equal(findGroupByBrand('Sainsbury\'s Bank')?.id, 'natwest');
  assert.equal(findGroupByBrand('Virgin Money')?.id, 'nationwide');
  assert.equal(findGroupByBrand('Tesco Bank')?.id, 'barclays');
});

test('the FSCS limit is £120,000', () => {
  assert.equal(FSCS_LIMIT_PENCE, 120_000_00);
});

test('brand lookup is case-insensitive and finds shared licences', () => {
  assert.equal(findGroupByBrand('halifax')?.id, 'bank-of-scotland');
  assert.equal(findGroupByBrand('Birmingham Midshires')?.id, 'bank-of-scotland');
  assert.equal(findGroupByBrand('first direct')?.id, 'hsbc-uk');
  assert.equal(findGroupByBrand('nonsense'), undefined);
  assert.equal(findGroupByBrand('  '), undefined);
});

// ---- Tax ----

test('ISA interest is shielded and never uses the allowance', () => {
  const accounts = [account({ kind: 'cash-isa', balancePence: 20_000_00, aer: 5 })];
  const tax = taxBreakdown(accounts, { band: 'higher', psaUsedPence: 0 });
  assert.equal(tax.grossPence, 1_000_00);
  assert.equal(tax.shieldedPence, 1_000_00);
  assert.equal(tax.allowancePence, 0);
  assert.equal(tax.taxPence, 0);
  assert.equal(tax.netPence, 1_000_00);
});

test('a basic-rate payer under the PSA pays no tax', () => {
  const accounts = [account({ balancePence: 10_000_00, aer: 5 })]; // £500
  const tax = taxBreakdown(accounts, { band: 'basic', psaUsedPence: 0 });
  assert.equal(tax.allowancePence, 500_00);
  assert.equal(tax.taxPence, 0);
});

test('a basic-rate payer over the PSA is taxed on the excess only', () => {
  const accounts = [account({ balancePence: 30_000_00, aer: 5 })]; // £1,500
  const tax = taxBreakdown(accounts, { band: 'basic', psaUsedPence: 0 });
  assert.equal(tax.allowancePence, 1_000_00);
  assert.equal(tax.taxPence, 100_00); // 20% of the £500 over
  assert.equal(tax.netPence, 1_400_00);
});

test('a higher-rate payer gets the smaller allowance and the higher rate', () => {
  const accounts = [account({ balancePence: 30_000_00, aer: 5 })]; // £1,500
  const tax = taxBreakdown(accounts, { band: 'higher', psaUsedPence: 0 });
  assert.equal(tax.allowancePence, 500_00);
  assert.equal(tax.taxPence, 400_00); // 40% of £1,000
});

test('an additional-rate payer has no allowance at all', () => {
  const accounts = [account({ balancePence: 10_000_00, aer: 5 })]; // £500
  const tax = taxBreakdown(accounts, { band: 'additional', psaUsedPence: 0 });
  assert.equal(tax.allowancePence, 0);
  assert.equal(tax.taxPence, 225_00); // 45% of £500
});

test('allowance already used elsewhere reduces what is left', () => {
  const accounts = [account({ balancePence: 10_000_00, aer: 5 })]; // £500
  const tax = taxBreakdown(accounts, { band: 'basic', psaUsedPence: 800_00 });
  assert.equal(tax.allowancePence, 200_00);
  assert.equal(tax.taxPence, 60_00); // 20% of the £300 over
});

test('using more allowance than exists does not create negative tax', () => {
  const accounts = [account({ balancePence: 10_000_00, aer: 5 })];
  const tax = taxBreakdown(accounts, { band: 'basic', psaUsedPence: 5_000_00 });
  assert.equal(tax.allowancePence, 0);
  assert.equal(tax.taxPence, 100_00);
});

test('an empty portfolio is all zeroes, not NaN', () => {
  const tax = taxBreakdown([], { band: 'basic', psaUsedPence: 0 });
  assert.deepEqual(tax, {
    grossPence: 0,
    shieldedPence: 0,
    allowancePence: 0,
    taxPence: 0,
    netPence: 0,
  });
  assert.deepEqual(getDeadlines([], NOW), []);
  assert.deepEqual(getFscsExposure([]), []);
  assert.equal(totalAtRiskPence([]), 0);
});

test('unlisted banks are each their own licence, never pooled into one false breach', () => {
  const a = account({ id: 'a', provider: 'Acme Bank', licenceGroupId: 'other', balancePence: 100_000_00 });
  const b = account({ id: 'b', provider: 'Zeta Savings', licenceGroupId: 'other', balancePence: 100_000_00 });
  const exposure = getFscsExposure([a, b]);
  assert.equal(exposure.length, 2);
  assert.ok(exposure.every((e) => e.unprotectedPence === 0 && e.unlisted === true));
});

test('two accounts at the same unlisted bank still total together', () => {
  const a = account({ id: 'a', provider: 'Acme Bank', licenceGroupId: 'other', balancePence: 90_000_00 });
  const b = account({ id: 'b', provider: 'ACME bank ', licenceGroupId: 'other', balancePence: 35_000_00 });
  const [e] = getFscsExposure([a, b]);
  assert.equal(e.totalPence, 125_000_00);
  assert.equal(e.unprotectedPence, 5_000_00);
});
