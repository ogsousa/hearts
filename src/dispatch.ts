type DispatchStore = {
  claimDispatch(account: string, draftId: string): Promise<{phone_e164:string|null;body:string}>;
  finishDispatch(account: string, draftId: string, providerMessageId?: string, errorCode?: string,
    kind?: 'mock' | 'evolution'): Promise<void>;
};

export interface MessageSender {
  readonly kind: 'mock' | 'evolution';
  send(phoneE164: string, body: string): Promise<string>;
}

export class MockMessageSender implements MessageSender {
  readonly kind = 'mock';
  constructor(private readonly messageId = 'mock-message-1') {}
  async send(_phoneE164: string, _body: string): Promise<string> { return this.messageId; }
}

export async function dispatch(journey: DispatchStore, sender: MessageSender,
  account: string, draftId: string): Promise<{status:'accepted'|'uncertain';providerMessageId?:string}> {
  const draft=await journey.claimDispatch(account,draftId);
  try {
    const providerMessageId=await sender.send(draft.phone_e164!,draft.body);
    if (!providerMessageId.trim()) throw new Error('provider_confirmation_missing');
    await journey.finishDispatch(account,draftId,providerMessageId,undefined,sender.kind);
    return {status:'accepted',providerMessageId};
  } catch (error) {
    const code=error instanceof Error ? error.message : 'provider_unknown';
    await journey.finishDispatch(account,draftId,undefined,code,sender.kind);
    return {status:'uncertain'};
  }
}
