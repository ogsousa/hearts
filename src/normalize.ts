import { hash, type Candidate, type RawBusiness } from './contracts.js';

const text = (raw: RawBusiness, ...keys: string[]): string | undefined => {
  for (const key of keys) if (typeof raw[key] === 'string' && (raw[key] as string).trim()) return (raw[key] as string).trim();
  return undefined;
};
const fold = (value: string): string => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => [k,stable(v)])) : value;
export function normalize(raw: RawBusiness, provider: string): Candidate {
  const name = text(raw,'name','business_name','title');
  if (!name) throw new Error('business_name_missing');
  const normalizedName = fold(name);
  const city = text(raw,'city','cidade');
  const site = text(raw,'website','site');
  let domain: string | undefined;
  if (site) {
    try {
      const url = new URL(/^https?:\/\//i.test(site) ? site : `https://${site}`);
      domain = url.hostname.toLowerCase().replace(/^www\./,'') || undefined;
    } catch { /* Unusable website is kept only in the raw payload. */ }
  }
  const phone = text(raw,'phone_e164','phone_number','phone','telefone');
  const compactPhone = phone?.replace(/[\s().-]/g,'');
  const phoneE164 = compactPhone && /^\+[1-9]\d{7,14}$/.test(compactPhone) ? compactPhone : undefined;
  const providerRecordId = text(raw,'business_id','place_id','google_id','id');
  const payloadHash = hash(JSON.stringify(stable(raw)));
  return {
    provider, providerRecordId, payloadHash, name, normalizedName,
    city: city ? fold(city) : undefined, domain, phoneE164,
    fingerprint: hash(JSON.stringify([provider,providerRecordId ?? '',domain ?? '',phoneE164 ?? '',normalizedName,city ? fold(city) : ''])),
    payload: raw
  };
}
