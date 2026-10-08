import assert from 'node:assert/strict';
import test from 'node:test';
import { ExtractOnly } from '../src/extract.js';
import { MockProvider } from '../src/providers.js';
import { normalize } from '../src/normalize.js';
import type { CampaignInput, Candidate, ExtractRepository, RunSummary, SaveResult } from '../src/contracts.js';

const A='11111111-1111-4111-8111-111111111111';
const input: CampaignInput={accountId:A,campaignKey:'c1',runKey:'r1',provider:'mock',term:'oficina recife',limit:3,mode:'extract_only'};

class FakeRepository implements ExtractRepository {
  saved: Candidate[]=[];
  summary?: RunSummary;
  async start(_input: CampaignInput) { return {campaignId:'c',runId:'r',...(this.summary ? {previous:this.summary} : {})}; }
  async save(_account: string,_campaign: string,_run: string,c: Candidate): Promise<SaveResult> {
    this.saved.push(c);
    return {disposition:'created',matchMethod:'new',leadId:'l',sourceId:'s',discovered:true};
  }
  async finish(summary: RunSummary) { this.summary=summary; }
}

test('mock extract only normalizes, persists, summarizes and replays without recollection',async () => {
  const repo=new FakeRepository();
  const provider=new MockProvider([{business_id:'B1',name:'Oficina A',city:'Recife',phone_e164:'+12025550101'},
    {business_id:'B2',name:'Oficina B',city:'Recife'}]);
  const service=new ExtractOnly(repo,provider);
  const first=await service.run(input);
  assert.equal(first.collected,2); assert.equal(first.created,2); assert.equal(first.errors,0);
  assert.equal(repo.saved[0]?.phoneE164,'+12025550101');
  assert.equal((await service.run(input)).replayed,true);
  assert.equal(repo.saved.length,2);
});

test('item failure marks the persisted run as failed while retaining successful items',async () => {
  const repo=new class extends FakeRepository {
    override async save(account: string,campaign: string,run: string,candidate: Candidate): Promise<SaveResult> {
      if (candidate.name === 'Oficina A') throw new Error('item_write_failed');
      return super.save(account,campaign,run,candidate);
    }
  }();
  const service=new ExtractOnly(repo,new MockProvider([
    {business_id:'B1',name:'Oficina A',city:'Recife'},
    {business_id:'B2',name:'Oficina B',city:'Recife'}
  ]));
  const first=await service.run(input);
  assert.equal(first.status,'failed');
  assert.equal(first.collected,2);
  assert.equal(first.created,1);
  assert.equal(first.errors,1);
  assert.deepEqual(first.errorCodes,['item_write_failed']);
  assert.equal(repo.summary?.status,'failed');
  assert.equal((await service.run(input)).replayed,true);
  assert.equal(repo.saved.length,1);
});

test('invalid account and non extract mode fail before repository access',async () => {
  const service=new ExtractOnly(new FakeRepository(),new MockProvider([]));
  await assert.rejects(service.run({...input,accountId:''}),/UUID/);
  await assert.rejects(service.run({...input,accountId:undefined as unknown as string}),/UUID/);
  await assert.rejects(service.run({...input,mode:'extract_and_draft' as 'extract_only'}),/extract_only/);
});

test('normalizer does not invent country code or merge by fingerprint',() => {
  const first=normalize({name:'Ação Ltda',city:'Recife',phone:'2025550101',website:'www.example.com'},'mock');
  assert.equal(first.normalizedName,'acao ltda');
  assert.equal(first.phoneE164,undefined);
  assert.equal(first.domain,'example.com');
  assert.equal(first.payloadHash,normalize({website:'www.example.com',phone:'2025550101',city:'Recife',name:'Ação Ltda'},'mock').payloadHash);
});
