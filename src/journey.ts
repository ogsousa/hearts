import { hash, type Candidate } from './contracts.js';

export type PhoneStatus = 'verified_company' | 'probable_company' | 'ambiguous' | 'invalid' | 'missing';
export type PhoneEvidence = {
  phoneE164: string; kind: 'official_website' | 'provider' | 'directory' | 'manual';
  source: string; unitMatched: boolean; observedAt: string;
};
export type ContactAssessment = { phoneE164?: string; status: PhoneStatus; evidence: PhoneEvidence[]; reason: string };
export type OpportunitySignal = {
  kind: 'followup_gap' | 'inbound_volume' | 'manual_process' | 'custom_workflow' | 'whatsapp_entry';
  observation: string; source: string;
};
export type Opportunity = {
  offer: 'crm_followup' | 'connected_service' | 'process_automation' | 'custom_product' | 'exploratory';
  confidence: number; evidence: OpportunitySignal[]; unknowns: string[]; nextQuestion: string; version: 'hearts-offer-v1';
};
export type ReplyClass = 'hot' | 'warm' | 'cold' | 'blocked' | 'review';

const e164 = (phone: string): boolean => /^\+[1-9]\d{7,14}$/.test(phone);
const clean = (value: string): string => value.replace(/\s+/g,' ').trim();

export function assessContact(candidate: Candidate, evidence: PhoneEvidence[]): ContactAssessment {
  const officialPhones=[...new Set(evidence.filter(item => {
    if (item.kind !== 'official_website' || !item.unitMatched || !e164(item.phoneE164) || !candidate.domain) return false;
    try { return new URL(item.source).hostname.toLowerCase().replace(/^www\./,'') === candidate.domain; }
    catch { return false; }
  }).map(item => item.phoneE164))];
  const phone = candidate.phoneE164 ?? (officialPhones.length === 1 ? officialPhones[0] : undefined);
  if (!candidate.phoneE164 && officialPhones.length > 1)
    return {status:'ambiguous',evidence,reason:'multiple_official_site_numbers'};
  if (!phone) {
    const rawPhone = candidate.payload.phone_e164 ?? candidate.payload.phone_number ?? candidate.payload.phone ?? candidate.payload.telefone;
    return {status:rawPhone ? 'invalid':'missing',evidence,reason:rawPhone ? 'phone_not_e164':'phone_missing'};
  }
  const same = evidence.filter(item => item.phoneE164 === phone && item.unitMatched && e164(item.phoneE164));
  const conflict = evidence.some(item => item.unitMatched && e164(item.phoneE164) && item.phoneE164 !== phone);
  if (conflict) return {phoneE164:phone,status:'ambiguous',evidence,reason:'conflicting_unit_numbers'};
  const official = officialPhones.includes(phone);
  const independentKinds = new Set(same.map(item => item.kind));
  if (official || independentKinds.size >= 2) return {phoneE164:phone,status:'verified_company',evidence,reason:official ? 'official_site_matches_unit':'independent_sources_match_unit'};
  return {phoneE164:phone,status:'probable_company',evidence,reason:'single_unconfirmed_source'};
}

const offers: Record<OpportunitySignal['kind'],Opportunity['offer']> = {
  followup_gap:'crm_followup',inbound_volume:'connected_service',
  manual_process:'process_automation',custom_workflow:'custom_product',whatsapp_entry:'connected_service'
};
const questions: Record<Opportunity['offer'],string> = {
  crm_followup:'Como vocês acompanham cada contato até a próxima etapa?',
  connected_service:'Como vocês distribuem e qualificam os contatos recebidos?',
  process_automation:'Qual tarefa manual mais consome tempo da equipe?',
  custom_product:'Qual etapa do processo as ferramentas atuais não atendem?',
  exploratory:'Como vocês atendem e acompanham novos contatos hoje?'
};
export function analyzeOpportunity(signals: OpportunitySignal[]): Opportunity {
  const valid = signals.filter(item => clean(item.observation) && clean(item.source));
  const offer = valid.length ? offers[valid[0]!.kind] : 'exploratory';
  return {offer,confidence:valid.length ? Math.min(0.85,0.55+(valid.length-1)*0.15) : 0,
    evidence:valid,unknowns:valid.length ? ['volume','responsável','prioridade'] : ['dor','volume','processo','responsável'],
    nextQuestion:questions[offer],version:'hearts-offer-v1'};
}

export function createDraft(candidate: Candidate, contact: ContactAssessment, opportunity: Opportunity):
  {body:string;fingerprint:string;readyForReview:boolean} {
  const name = clean(candidate.name).slice(0,80);
  const signal = opportunity.evidence[0];
  const opening = signal ? `Olá, equipe da ${name}. Vi ${clean(signal.observation).slice(0,90)}.` : `Olá, equipe da ${name}.`;
  const body = [opening,'Sou da Neovian e trabalho com melhorias em atendimento e processos.',opportunity.nextQuestion].join('\n');
  if (body.length > 350 || (body.match(/\?/g) ?? []).length !== 1) throw new Error('draft_contract_invalid');
  return {body,fingerprint:hash(JSON.stringify([candidate.provider,candidate.providerRecordId ?? candidate.payloadHash,contact.phoneE164 ?? '',opportunity.version,body])),
    readyForReview:contact.status === 'verified_company'};
}

export function classifyReply(body: string): ReplyClass {
  const text = clean(body).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if (/\b(parar|pare|remova|nao mande|nao envie|descadastre|numero errado|pessoa errada|nao sou|denuncia)\b/.test(text)) return 'blocked';
  if (/\b(sem interesse|nao tenho interesse|nao preciso|agora nao)\b/.test(text)) return 'cold';
  if (/\b(quero|tenho interesse|preco|orcamento|proposta|reuniao|agendar)\b/.test(text)) return 'hot';
  if (/\b(como funciona|me explique|me conta|talvez|pode falar)\b/.test(text)) return 'warm';
  return 'review';
}
