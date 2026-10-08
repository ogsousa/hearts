import assert from 'node:assert/strict';
import test from 'node:test';
import { dispatch } from '../src/dispatch.js';

test('uncertain provider outcome is persisted without a retry',async () => {
  let calls=0;
  let completion: [string | undefined,string | undefined] | undefined;
  const journey={
    async claimDispatch() { return {phone_e164:'+12025550101',body:'Olá'}; },
    async finishDispatch(_account:string,_draft:string,id?:string,code?:string) { completion=[id,code]; }
  };
  const result=await dispatch(journey,{kind:'mock',async send() { calls++; throw new Error('timeout'); }},
    '11111111-1111-4111-8111-111111111111','draft');
  assert.deepEqual(result,{status:'uncertain'});
  assert.deepEqual(completion,[undefined,'timeout']);
  assert.equal(calls,1);
});
