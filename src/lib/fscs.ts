/**
 * FSCS protection is per **banking licence**, not per brand. Several familiar
 * high-street names share one licence, so £85,000 in Halifax and £85,000 in
 * Birmingham Midshires is NOT £170,000 of cover — it is one £85,000 limit with
 * £85,000 exposed.
 *
 * ---------------------------------------------------------------------------
 * THIS TABLE IS A SEED, NOT AN AUTHORITY.
 *
 * Brand-to-licence mappings change whenever a bank is acquired or restructured,
 * and several moved recently. Verify every group against the official FSCS bank
 * and savings checker before trusting it, and bump VERIFIED_ON when you do:
 *
 *   https://www.fscs.org.uk/check/check-your-money-is-protected/
 *
 * The UI must always show VERIFIED_ON next to any exposure warning and link to
 * the checker above. Never present this as definitive.
 * ---------------------------------------------------------------------------
 */

import type { Account } from '@/types/models';

/** Last date a human checked this table against the FSCS checker. */
export const VERIFIED_ON = 'unverified';

export const FSCS_LIMIT_PENCE = 85_000_00;

export interface LicenceGroup {
  id: string;
  /** The licence holder as FSCS names it. */
  name: string;
  /** Consumer brands believed to sit under this licence. */
  brands: string[];
  /** Set when a mapping is known to be in flux and needs checking first. */
  caution?: string;
}

export const LICENCE_GROUPS: LicenceGroup[] = [
  {
    id: 'bank-of-scotland',
    name: 'Bank of Scotland plc',
    brands: ['Halifax', 'Bank of Scotland', 'Birmingham Midshires', 'Intelligent Finance'],
  },
  { id: 'lloyds', name: 'Lloyds Bank plc', brands: ['Lloyds Bank', 'Scottish Widows Bank'] },
  { id: 'barclays', name: 'Barclays Bank UK plc', brands: ['Barclays'] },
  {
    id: 'hsbc-uk',
    name: 'HSBC UK Bank plc',
    brands: ['HSBC', 'first direct', 'M&S Bank'],
  },
  { id: 'natwest', name: 'National Westminster Bank plc', brands: ['NatWest'] },
  { id: 'rbs', name: 'The Royal Bank of Scotland plc', brands: ['Royal Bank of Scotland'] },
  { id: 'santander-uk', name: 'Santander UK plc', brands: ['Santander', 'cahoot'] },
  { id: 'nationwide', name: 'Nationwide Building Society', brands: ['Nationwide'] },
  { id: 'tsb', name: 'TSB Bank plc', brands: ['TSB'] },
  { id: 'co-op', name: 'The Co-operative Bank plc', brands: ['The Co-operative Bank', 'smile'] },
  {
    id: 'clydesdale',
    name: 'Clydesdale Bank plc',
    brands: ['Virgin Money', 'Clydesdale Bank', 'Yorkshire Bank'],
  },
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
    caution: 'Chase UK sits under a J.P. Morgan entity — confirm which one before relying on this.',
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
  {
    id: 'tesco-bank',
    name: 'Tesco Personal Finance plc',
    brands: ['Tesco Bank'],
    caution: 'Tesco Bank savings moved to Barclays. If yours transferred, the licence is Barclays — check.',
  },
  {
    id: 'sainsburys-bank',
    name: "Sainsbury's Bank plc",
    brands: ["Sainsbury's Bank"],
    caution: "Sainsbury's Bank savings moved to NatWest. Confirm which licence now holds yours.",
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
}

/**
 * Totals balances per banking licence and flags anything over the FSCS limit.
 * Accounts assigned to the 'other' group are still totalled, but they are a
 * single bucket and the UI should say the grouping is unknown.
 */
export function getFscsExposure(accounts: Account[]): GroupExposure[] {
  const byGroup = new Map<string, GroupExposure>();

  for (const account of accounts) {
    const group = getLicenceGroup(account.licenceGroupId);
    const id = group?.id ?? 'other';
    let entry = byGroup.get(id);
    if (!entry) {
      entry = {
        licenceGroupId: id,
        groupName: group?.name ?? 'Other / not listed',
        totalPence: 0,
        unprotectedPence: 0,
        accountIds: [],
        caution: group?.caution,
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
