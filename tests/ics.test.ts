import assert from 'node:assert/strict';
import test from 'node:test';

import { buildIcs, escapeText, foldLine } from '../src/lib/ics.ts';
import type { Account } from '../src/types/models.ts';

const NOW = Date.UTC(2026, 9, 1);

function account(over: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    provider: 'Halifax',
    licenceGroupId: 'bank-of-scotland',
    kind: 'easy-access',
    balancePence: 50_000_00,
    aer: 4.1,
    postBonusAer: 1.2,
    bonusEndsOn: '2026-10-20',
    createdAt: 0,
    ...over,
  };
}

test('no upcoming deadlines gives no file', () => {
  assert.equal(buildIcs([], NOW), undefined);
  assert.equal(buildIcs([account({ bonusEndsOn: '2026-09-01' })], NOW), undefined);
  assert.equal(buildIcs([account({ postBonusAer: undefined, bonusEndsOn: undefined })], NOW), undefined);
});

test('a bonus end becomes an all-day event with 30 and 7 day alarms', () => {
  const ics = buildIcs([account()], NOW)!;
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261020\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261021\r\n/);
  assert.match(ics, /UID:a1-bonus-ends@ratedrift\r\n/);
  assert.match(ics, /TRIGGER:-P30D\r\n/);
  assert.match(ics, /TRIGGER:-P7D\r\n/);
  assert.match(ics.replace(/\r\n /g, ''), /about £1450 a year/);
});

test('a maturity on a month end rolls DTEND into the next month', () => {
  const ics = buildIcs([account({ kind: 'fixed', bonusEndsOn: undefined, postBonusAer: undefined, maturesOn: '2026-12-31' })], NOW)!;
  assert.match(ics, /DTEND;VALUE=DATE:20270101\r\n/);
  assert.match(ics, /UID:a1-matures@ratedrift/);
});

test('past deadlines are skipped but upcoming ones stay', () => {
  const ics = buildIcs([account({ id: 'old', bonusEndsOn: '2026-09-01' }), account({ id: 'new' })], NOW)!;
  assert.doesNotMatch(ics, /old-bonus-ends/);
  assert.match(ics, /new-bonus-ends/);
});

test('text is escaped', () => {
  assert.equal(escapeText('a,b;c\\d\ne'), 'a\\,b\;c\\\\d\\ne');
});

test('long lines fold at 75 octets without splitting characters', () => {
  const folded = foldLine('SUMMARY:' + '£'.repeat(60));
  for (const line of folded.split('\r\n')) {
    assert.ok(new TextEncoder().encode(line).length <= 75);
  }
  assert.equal(folded.replace(/\r\n /g, ''), 'SUMMARY:' + '£'.repeat(60));
});
