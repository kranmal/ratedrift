/**
 * Lemon Squeezy licence-key checks. The licence endpoints are public (no API
 * secret) and allow browser calls, so this runs entirely client-side.
 *
 * It is a convenience gate, not DRM: the app is a static site, so anyone
 * determined can bypass it. That is an accepted trade-off for a small paid
 * unlock. Never put anything here that needs real secrecy.
 */

const API = 'https://api.lemonsqueezy.com/v1/licenses';

export interface LicenceConfig {
  /** When set, a key must belong to this product, so keys from the same store's other products don't unlock this one. */
  productId?: number;
}

export interface StoredLicence {
  key: string;
  instanceId: string;
}

export type ActivateResult =
  | { ok: true; licence: StoredLicence }
  | { ok: false; reason: 'empty' | 'rejected' | 'wrong-product' | 'network'; message: string };

export type RevalidateResult = 'valid' | 'invalid' | 'unknown';

type FetchFn = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  json: () => Promise<unknown>;
}>;

interface LicenceResponse {
  activated?: boolean;
  valid?: boolean;
  error?: string | null;
  license_key?: { status?: string };
  instance?: { id?: string } | null;
  meta?: { product_id?: number };
}

async function post(fetchFn: FetchFn, path: string, params: Record<string, string>): Promise<LicenceResponse> {
  const res = await fetchFn(`${API}/${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  return (await res.json()) as LicenceResponse;
}

function belongsToProduct(res: LicenceResponse, config: LicenceConfig): boolean {
  return config.productId === undefined || res.meta?.product_id === config.productId;
}

/** Trades a purchased key for an activation tied to this browser. */
export async function activateLicence(
  rawKey: string,
  config: LicenceConfig,
  fetchFn: FetchFn,
  instanceName = 'RateDrift web',
): Promise<ActivateResult> {
  const key = rawKey.trim();
  if (!key) return { ok: false, reason: 'empty', message: 'Enter your licence key.' };

  let res: LicenceResponse;
  try {
    res = await post(fetchFn, 'activate', { license_key: key, instance_name: instanceName });
  } catch {
    return { ok: false, reason: 'network', message: 'Could not reach the licence server. Check your connection and try again.' };
  }

  if (!res.activated || res.license_key?.status !== 'active' || !res.instance?.id) {
    return { ok: false, reason: 'rejected', message: res.error || 'That key was not accepted.' };
  }
  if (!belongsToProduct(res, config)) {
    return { ok: false, reason: 'wrong-product', message: 'That key is for a different product.' };
  }
  return { ok: true, licence: { key, instanceId: res.instance.id } };
}

/**
 * Re-checks a saved licence. A network failure is 'unknown', never 'invalid',
 * so a paying user is not locked out just because they are offline.
 */
export async function revalidateLicence(
  stored: StoredLicence,
  config: LicenceConfig,
  fetchFn: FetchFn,
): Promise<RevalidateResult> {
  let res: LicenceResponse;
  try {
    res = await post(fetchFn, 'validate', { license_key: stored.key, instance_id: stored.instanceId });
  } catch {
    return 'unknown';
  }
  if (res.valid === undefined) return 'unknown';
  return res.valid && res.license_key?.status === 'active' && belongsToProduct(res, config) ? 'valid' : 'invalid';
}
