import { createHash } from 'node:crypto';

export type RawBusiness = Record<string, unknown>;
export type CampaignInput = {
  accountId: string; campaignKey: string; runKey: string;
  provider: 'mock' | 'rapidapi'; term: string; limit: number;
  mode: 'extract_only';
};
export type Candidate = {
  provider: string; providerRecordId?: string; payloadHash: string;
  name: string; normalizedName: string; city?: string;
  domain?: string; phoneE164?: string; fingerprint: string;
  payload: RawBusiness;
};
export type SaveResult = { disposition: 'created' | 'matched' | 'review'; matchMethod: string; leadId: string | null; sourceId: string; discovered: boolean };
export type RunSummary = {
  accountId: string; campaignId: string; runId: string; provider: string; mode: 'extract_only';
  collected: number; created: number; matched: number; review: number; duplicatesInRun: number;
  errors: number; errorCodes: string[]; status: 'completed' | 'failed'; replayed: boolean;
};

export interface Provider {
  readonly name: 'mock' | 'rapidapi';
  page(term: string, offset: number, size: number): Promise<RawBusiness[]>;
}
export interface ExtractRepository {
  start(input: CampaignInput): Promise<{ campaignId: string; runId: string; previous?: RunSummary }>;
  save(accountId: string, campaignId: string, runId: string, candidate: Candidate): Promise<SaveResult>;
  finish(summary: RunSummary): Promise<void>;
}

export function accountId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)
      || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(value)) throw new Error('explicit canonical UUID accountId required');
  return value;
}
export function validate(input: CampaignInput): CampaignInput {
  accountId(input.accountId);
  if (!input.campaignKey?.trim() || !input.runKey?.trim()) throw new Error('campaignKey and runKey required');
  if (input.provider !== 'mock' && input.provider !== 'rapidapi') throw new Error('invalid provider');
  if (!input.term?.trim()) throw new Error('term required');
  if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100) throw new Error('limit must be 1..100');
  if (input.mode !== 'extract_only') throw new Error('only extract_only is available');
  return { ...input, term: input.term.trim().replace(/\s+/g, ' ') };
}
export const hash = (value: string): string => createHash('sha256').update(value).digest('hex');
