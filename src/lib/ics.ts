import type { Account } from '@/types/models';
import { getDeadlines } from './interest.ts';

/** Days before each deadline that a reminder fires. */
export const ALARM_DAYS = [30, 7];

const CRLF = '\r\n';

/** Escapes TEXT values per RFC 5545 §3.3.11. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Folds a content line to 75 octets, continuing with a leading space (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let size = 0;
  let limit = 75;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > limit) {
      parts.push(current);
      current = '';
      size = 0;
      limit = 74; // continuation lines spend one octet on the leading space
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join(CRLF + ' ');
}

function compactDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** The day after an ISO date; all-day events end exclusively. */
function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10).replace(/-/g, '');
}

function stamp(now: number): string {
  return new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Builds an iCalendar file with one all-day event per upcoming bonus end or
 * maturity, each with reminders ALARM_DAYS before. Past deadlines are skipped.
 * UIDs are stable per account and deadline, so re-importing updates events
 * rather than duplicating them in most calendar apps.
 *
 * Returns undefined when there is nothing upcoming to export.
 */
export function buildIcs(accounts: Account[], now: number): string | undefined {
  const upcoming = getDeadlines(accounts, now).filter((d) => d.daysAway >= 0);
  if (upcoming.length === 0) return undefined;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RateDrift//Savings deadlines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:RateDrift deadlines',
  ];

  for (const deadline of upcoming) {
    const account = accounts.find((a) => a.id === deadline.accountId);
    if (!account) continue;
    const name = account.product ? `${account.provider} ${account.product}` : account.provider;
    const what = deadline.kind === 'bonus-ends' ? 'bonus rate ends' : 'fixed term matures';
    const atRisk = Math.round(deadline.atRiskPence / 100);
    const description =
      `${name}: ${what} today. Doing nothing could cost about £${atRisk} a year in lost interest ` +
      `(estimate). Check for a better rate before the money drifts.`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${deadline.accountId}-${deadline.kind}@ratedrift`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compactDate(deadline.on)}`,
      `DTEND;VALUE=DATE:${nextDay(deadline.on)}`,
      `SUMMARY:${escapeText(`${name} ${what}`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      'TRANSP:TRANSPARENT',
    );
    for (const days of ALARM_DAYS) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(`${name} ${what} in ${days} days`)}`,
        `TRIGGER:-P${days}D`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}
