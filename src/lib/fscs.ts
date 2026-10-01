/**
 * FSCS protection is per **banking licence**, not per brand. Several familiar
 * high-street names share one licence, so £120,000 in Halifax and £120,000 in
 * Birmingham Midshires is NOT £240,000 of cover — it is one £120,000 limit with
 * £120,000 exposed.
 *
 * ---------------------------------------------------------------------------
 * THIS TABLE IS PARTLY VERIFIED, NOT AN AUTHORITY.
 *
 * Brand-to-licence mappings change whenever a bank is acquired or restructured.
 * There is no official bulk list, so groups are checked one at a time against
 * the bank's own FSCS page. A group with `verified` set was checked on
 * VERIFIED_ON (see its `source`); every other group is still a best guess.
 * Re-check and bump VERIFIED_ON when you change a group:
 *
 *   https://www.fscs.org.uk/check/check-your-money-is-protected/
 *
 * The UI must always show VERIFIED_ON and per-group status next to any exposure
 * warning and link to the checker above. Never present this as definitive.
 * ---------------------------------------------------------------------------
 */

import type { Account } from '@/types/models';

/** Last date any group in this table was checked against a first-party source. */
export const VERIFIED_ON = '2026-10-01';

/** £120,000 per person per authorised firm since 1 Dec 2025 (was £85,000). */
export const FSCS_LIMIT_PENCE = 120_000_00;

export interface LicenceGroup {
  id: string;
  /** The licence holder as FSCS names it. */
  name: string;
  /** Consumer brands believed to sit under this licence. */
  brands: string[];
  /** Set when a mapping is known to be in flux and needs checking first. */
  caution?: string;
  /** True when brand membership was confirmed against `source` on VERIFIED_ON. */
  verified?: boolean;
  /** Where it was confirmed, e.g. the bank's own FSCS page. */
  source?: string;
}

export const LICENCE_GROUPS: LicenceGroup[] = [
  {
    id: 'bank-of-scotland',
    name: 'Bank of Scotland plc',
    brands: [
      'Halifax',
      'Bank of Scotland',
      'Birmingham Midshires',
      'Intelligent Finance',
      'Bank of Scotland Private Banking',
      'Bank of Wales',
    ],
    verified: true,
    source: 'Halifax FSCS page (halifax.co.uk/fscs.html) and the Bank of Scotland FSCS information sheet',
  },
  {
    id: 'lloyds',
    name: 'Lloyds Bank plc',
    brands: ['Lloyds Bank', 'Scottish Widows Bank'],
    caution:
      'Lloyds accounts with a sort code starting 11 are Bank of Scotland plc, not Lloyds Bank plc — check your sort code.',
  },
  {
    id: 'barclays',
    name: 'Barclays Bank UK plc',
    brands: ['Barclays', 'Tesco Bank'],
    caution: 'Tesco Bank savings moved to Barclays — confirm yours has transferred.',
  },
  {
    id: 'hsbc-uk',
    name: 'HSBC UK Bank plc',
    brands: ['HSBC', 'first direct', 'M&S Bank', 'HSBC Private Bank'],
    verified: true,
    source: 'HSBC and M&S Bank FSCS pages (hsbc.co.uk/fscs, bank.marksandspencer.com/about-us/fscs-protection)',
  },
  {
    id: 'natwest',
    name: 'National Westminster Bank plc',
    brands: ['NatWest', 'Ulster Bank', "Sainsbury's Bank", 'Mettle'],
    verified: true,
    source: 'NatWest FSCS information; Sainsbury\'s Bank transfer scheme (savings moved to NatWest)',
  },
  { id: 'rbs', name: 'The Royal Bank of Scotland plc', brands: ['Royal Bank of Scotland'] },
  { id: 'santander-uk', name: 'Santander UK plc', brands: ['Santander', 'cahoot'] },
  {
    id: 'nationwide',
    name: 'Nationwide Building Society',
    brands: ['Nationwide', 'Virgin Money', 'Clydesdale Bank', 'Yorkshire Bank'],
    caution:
      'Virgin Money is confirmed combined with Nationwide; Clydesdale and Yorkshire Bank are Virgin Money brands but are not named on Nationwide\'s page — check them.',
    verified: true,
    source: 'Nationwide FSCS page (nationwide.co.uk)',
  },
  { id: 'tsb', name: 'TSB Bank plc', brands: ['TSB'] },
  { id: 'co-op', name: 'The Co-operative Bank plc', brands: ['The Co-operative Bank', 'smile'] },
  { id: 'metro', name: 'Metro Bank plc', brands: ['Metro Bank'] },
  { id: 'starling', name: 'Starling Bank Limited', brands: ['Starling Bank'] },
  { id: 'monzo', name: 'Monzo Bank Limited', brands: ['Monzo'] },
  {
    id: 'goldman-sachs',
    name: 'Goldman Sachs International Bank',
    brands: ['Marcus by Goldman Sachs', 'Saga Savings'],
  },
  { id: 'shawbrook', name: 'Shawbrook Bank Limited', brands: ['Shawbrook Bank'] },
  { id: 'aldermore', name: 'Aldermore Bank PLC', brands: ['Aldermore'] },
  { id: 'paragon', name: 'Paragon Bank PLC', brands: ['Paragon Bank'] },
  { id: 'investec', name: 'Investec Bank plc', brands: ['Investec'] },
  { id: 'close-brothers', name: 'Close Brothers Limited', brands: ['Close Brothers Savings'] },
  { id: 'secure-trust', name: 'Secure Trust Bank PLC', brands: ['Secure Trust Bank'] },
  { id: 'united-trust', name: 'United Trust Bank Limited', brands: ['United Trust Bank'] },
  { id: 'cynergy', name: 'Cynergy Bank Limited', brands: ['Cynergy Bank'] },
  { id: 'zopa', name: 'Zopa Bank Limited', brands: ['Zopa'] },
  { id: 'atom', name: 'Atom Bank plc', brands: ['Atom Bank'] },
  { id: 'tandem', name: 'Tandem Bank Limited', brands: ['Tandem'] },
  { id: 'hampshire-trust', name: 'Hampshire Trust Bank plc', brands: ['Hampshire Trust Bank'] },
  { id: 'oxbury', name: 'Oxbury Bank plc', brands: ['Oxbury'] },
  { id: 'allica', name: 'Allica Bank Limited', brands: ['Allica Bank'] },
  {
    id: 'ybs',
    name: 'Yorkshire Building Society',
    brands: ['Yorkshire Building Society', 'Chelsea Building Society', 'Norwich & Peterborough', 'Accord Mortgages'],
  },
  { id: 'coventry', name: 'Coventry Building Society', brands: ['Coventry Building Society'] },
  { id: 'skipton', name: 'Skipton Building Society', brands: ['Skipton Building Society'] },
  { id: 'leeds', name: 'Leeds Building Society', brands: ['Leeds Building Society'] },
  { id: 'principality', name: 'Principality Building Society', brands: ['Principality'] },
  { id: 'west-brom', name: 'West Bromwich Building Society', brands: ['West Brom'] },
  { id: 'newcastle', name: 'Newcastle Building Society', brands: ['Newcastle Building Society'] },
  { id: 'nottingham', name: 'Nottingham Building Society', brands: ['The Nottingham'] },
  { id: 'family', name: 'National Counties Building Society', brands: ['Family Building Society'] },
  { id: 'ford-money', name: 'FCE Bank plc', brands: ['Ford Money'] },
  {
    id: 'chase-uk',
    name: 'J.P. Morgan Europe Limited',
    brands: ['Chase'],
    verified: true,
    source: 'Chase UK FSCS page (chase.co.uk)',
  },
  {
    id: 'bank-of-ireland-uk',
    name: 'Bank of Ireland (UK) plc',
    brands: ['Post Office Money', 'AA Savings'],
    caution: 'Post Office and AA savings are provided by a third party — confirm the current provider.',
  },
  {
    id: 'osb',
    name: 'OneSavings Bank plc',
    brands: ['Kent Reliance', 'Charter Savings Bank'],
    caution: 'OSB Group restructured its licences — confirm whether Charter Savings still shares this one.',
  },
  { id: 'other', name: 'Other / not listed', brands: [] },
];

const BY_ID = new Map(LICENCE_GROUPS.map((g) => [g.id, g]));

export function getLicenceGroup(id: string): LicenceGroup | undefined {
  return BY_ID.get(id);
}

/** Best-effort brand lookup, so entering "halifax" picks the right licence. */
export function findGroupByBrand(brand: string): LicenceGroup | undefined {
  const needle = brand.trim().toLowerCase();
  if (!needle) return undefined;
  return LICENCE_GROUPS.find((g) =>
    g.brands.some((b) => b.toLowerCase() === needle) || g.name.toLowerCase() === needle,
  );
}

export interface GroupExposure {
  licenceGroupId: string;
  groupName: string;
  totalPence: number;
  /** Amount above the FSCS limit, in pence. Zero when within cover. */
  unprotectedPence: number;
  accountIds: string[];
  caution?: string;
  /** Whether the group's brands were confirmed against a first-party source. */
  verified?: boolean;
  source?: string;
  /** True when the brand is not in the table, so its licence is assumed, not known. */
  unlisted?: boolean;
}

/**
 * Totals balances per banking licence and flags anything over the FSCS limit.
 * A brand missing from the table is treated as its own licence, keyed by the
 * account's licenceGroupId (one per provider) and flagged `unlisted`. Pooling
 * all unknown banks into one bucket would invent over-limit warnings, and
 * the UI says the licence is assumed.
 */
export function getFscsExposure(accounts: Account[]): GroupExposure[] {
  const byGroup = new Map<string, GroupExposure>();

  for (const account of accounts) {
    const listed = getLicenceGroup(account.licenceGroupId);
    const group = listed && listed.id !== 'other' ? listed : undefined;
    const id = group?.id ?? `unlisted:${account.provider.trim().toLowerCase()}`;
    let entry = byGroup.get(id);
    if (!entry) {
      entry = {
        licenceGroupId: id,
        groupName: group?.name ?? account.provider,
        totalPence: 0,
        unprotectedPence: 0,
        accountIds: [],
        caution: group?.caution,
        verified: group?.verified,
        source: group?.source,
        unlisted: group ? undefined : true,
      };
      byGroup.set(id, entry);
    }
    entry.totalPence += account.balancePence;
    entry.accountIds.push(account.id);
  }

  for (const entry of byGroup.values()) {
    entry.unprotectedPence = Math.max(0, entry.totalPence - FSCS_LIMIT_PENCE);
  }

  return [...byGroup.values()].sort((a, b) => b.unprotectedPence - a.unprotectedPence || b.totalPence - a.totalPence);
}
