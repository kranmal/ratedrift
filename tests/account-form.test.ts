import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isValidIsoDate,
  parsePounds,
  parseRate,
  validateAccountForm,
  type AccountFormFields,
} from '../src/lib/account-form.ts';

const base: AccountFormFields = {
  provider: 'Chase',
  product: '',
  kind: 'easy-access',
  balance: '12,000',
  aer: '4.75',
  postBonusAer: '',
  bonusEndsOn: '',
  maturesOn: '',
  noticeDays: '',
  notes: '',
};

describe('parsePounds', () => {
  it('parses whole and decimal amounts to exact pence', () => {
    assert.equal(parsePounds('12500'), 1_250_000);
    assert.equal(parsePounds('£12,500.50'), 1_250_050);
    assert.equal(parsePounds('0.5'), 50);
    assert.equal(parsePounds('19.99'), 1999);
  });
  it('rejects negatives, junk, empty and sub-penny input', () => {
    for (const bad of ['', '-5', 'abc', '1.234', '1.2.3', '£']) assert.equal(parsePounds(bad), undefined, bad);
  });
});

describe('parseRate', () => {
  it('accepts plain and percent-suffixed rates', () => {
    assert.equal(parseRate('4.75'), 4.75);
    assert.equal(parseRate('4.75%'), 4.75);
    assert.equal(parseRate('0'), 0);
  });
  it('rejects nonsense and implausible rates', () => {
    for (const bad of ['', 'x', '-1', '21', '4,5']) assert.equal(parseRate(bad), undefined, bad);
  });
});

describe('isValidIsoDate', () => {
  it('accepts real dates including leap day', () => {
    assert.equal(isValidIsoDate('2027-03-14'), true);
    assert.equal(isValidIsoDate('2028-02-29'), true);
  });
  it('rejects impossible and malformed dates', () => {
    for (const bad of ['2027-02-30', '2027-13-01', '2027-2-1', '14/03/2027', '', '2027-00-10'])
      assert.equal(isValidIsoDate(bad), false, bad);
    assert.equal(isValidIsoDate('2027-02-29'), false);
  });
});

describe('validateAccountForm', () => {
  it('accepts a plain easy-access account and trims text', () => {
    const r = validateAccountForm({ ...base, provider: '  Chase ', product: ' Saver ' });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.provider, 'Chase');
      assert.equal(r.value.product, 'Saver');
      assert.equal(r.value.balancePence, 1_200_000);
      assert.equal(r.value.postBonusAer, undefined);
    }
  });

  it('requires provider, balance and AER', () => {
    const r = validateAccountForm({ ...base, provider: ' ', balance: '', aer: '' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ['aer', 'balance', 'provider']);
  });

  it('rejects a bonus date without a post-bonus rate, and vice versa', () => {
    const a = validateAccountForm({ ...base, bonusEndsOn: '2027-03-14' });
    assert.equal(a.ok, false);
    if (!a.ok) assert.ok(a.errors.postBonusAer);
    const b = validateAccountForm({ ...base, postBonusAer: '1.5' });
    assert.equal(b.ok, false);
    if (!b.ok) assert.ok(b.errors.bonusEndsOn);
  });

  it('accepts a complete bonus pair', () => {
    const r = validateAccountForm({ ...base, bonusEndsOn: '2027-03-14', postBonusAer: '1.5' });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.postBonusAer, 1.5);
  });

  it('requires a valid maturity date for fixed accounts only', () => {
    const missing = validateAccountForm({ ...base, kind: 'fixed' });
    assert.equal(missing.ok, false);
    const ok = validateAccountForm({ ...base, kind: 'fixed', maturesOn: '2027-02-01' });
    assert.equal(ok.ok, true);
    // A stray maturity date on a non-fixed account is dropped, not stored.
    const stray = validateAccountForm({ ...base, maturesOn: '2027-02-01' });
    assert.equal(stray.ok, true);
    if (stray.ok) assert.equal(stray.value.maturesOn, undefined);
  });

  it('requires a notice period for notice accounts', () => {
    assert.equal(validateAccountForm({ ...base, kind: 'notice' }).ok, false);
    const ok = validateAccountForm({ ...base, kind: 'notice', noticeDays: '95' });
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.value.noticeDays, 95);
  });
});
