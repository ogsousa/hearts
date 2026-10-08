import assert from 'node:assert/strict';
import test from 'node:test';
import { normalize } from '../src/normalize.js';
import { analyzeOpportunity, assessContact, classifyReply, createDraft, type PhoneEvidence } from '../src/journey.js';

const candidate=normalize({business_id:'B1',name:'Oficina Exemplo',city:'Recife',
  website:'https://oficina.example',phone_number:'+12025550101'},'mock');
const observedAt='2026-09-28T12:00:00.000Z';
const official: PhoneEvidence={phoneE164:'+12025550101',kind:'official_website',
  source:'https://oficina.example/contato',unitMatched:true,observedAt};

test('contact evidence distinguishes format, ownership and conflict',() => {
  assert.equal(assessContact(candidate,[]).status,'probable_company');
  assert.equal(assessContact(candidate,[official]).status,'verified_company');
  assert.equal(assessContact(candidate,[{...official,source:'https://other.example/contato'}]).status,'probable_company');
  assert.equal(assessContact(candidate,[official,{...official,kind:'directory',phoneE164:'+12025550102'}]).status,'ambiguous');
  assert.equal(assessContact(normalize({name:'Sem número'},'mock'),[]).status,'missing');
  assert.equal(assessContact(normalize({name:'Local',phone_number:'2025550101'},'mock'),[]).status,'invalid');
  const fromSite=assessContact(normalize({name:'Oficina Exemplo',city:'Recife',website:'https://oficina.example',phone_number:'2025550101'},'mock'),[official]);
  assert.equal(fromSite.status,'verified_company');
  assert.equal(fromSite.phoneE164,'+12025550101');
});

test('offer stays exploratory without sourced observations and draft stays reviewable',() => {
  const empty=analyzeOpportunity([]);
  assert.equal(empty.offer,'exploratory');
  assert.equal(empty.confidence,0);
  const probable=createDraft(candidate,assessContact(candidate,[]),empty);
  assert.equal(probable.readyForReview,false);
  const verified=createDraft(candidate,assessContact(candidate,[official]),analyzeOpportunity([
    {kind:'manual_process',observation:'um cadastro manual no formulário público',source:'https://oficina.example/contato'}
  ]));
  assert.equal(verified.readyForReview,true);
  assert.match(verified.body,/cadastro manual/);
  assert.ok(verified.body.length<=350);
  assert.equal((verified.body.match(/\?/g) ?? []).length,1);
});

test('reply classification blocks opt out before sales signals',() => {
  assert.equal(classifyReply('Quero preço, mas pare de me mandar mensagem'),'blocked');
  assert.equal(classifyReply('Número errado'),'blocked');
  assert.equal(classifyReply('Quero uma proposta'),'hot');
  assert.equal(classifyReply('Como funciona?'),'warm');
  assert.equal(classifyReply('Obrigado'),'review');
});
