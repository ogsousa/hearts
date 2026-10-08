import { normalize } from '../src/normalize.js';
import { analyzeOpportunity, assessContact, classifyReply, createDraft } from '../src/journey.js';

// Every input is synthetic. This demonstration performs no I/O beyond stdout.
const candidate = normalize({
  business_id: 'demo-business-001',
  name: 'Oficina Exemplo',
  city: 'Recife',
  website: 'https://oficina.example',
  phone_e164: '+12025550101',
}, 'mock');

const unconfirmed = assessContact(candidate, []);
const contact = assessContact(candidate, [{
  phoneE164: '+12025550101',
  kind: 'official_website',
  source: 'https://oficina.example/contato',
  unitMatched: true,
  observedAt: '2026-10-08T12:00:00.000Z',
}]);
const opportunity = analyzeOpportunity([{
  kind: 'manual_process',
  observation: 'um cadastro manual descrito no exemplo de demonstração',
  source: 'https://oficina.example/contato',
}]);
const draft = createDraft(candidate, contact, opportunity);

process.stdout.write(`${JSON.stringify({
  mode: 'synthetic_offline_demo',
  company: candidate.name,
  beforeEvidence: unconfirmed.status,
  afterSyntheticEvidence: contact.status,
  hypothesis: opportunity.offer,
  readyForReview: draft.readyForReview,
  draft: draft.body,
  replyExamples: {
    optOut: classifyReply('Quero saber o preço, mas pare de me mandar mensagem'),
    interest: classifyReply('Como funciona?'),
  },
}, null, 2)}\n`);
