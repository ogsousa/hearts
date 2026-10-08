import { validate, type CampaignInput, type ExtractRepository, type Provider, type RunSummary } from './contracts.js';
import { normalize } from './normalize.js';

export class ExtractOnly {
  constructor(private readonly repo: ExtractRepository, private readonly provider: Provider) {}

  async run(request: CampaignInput): Promise<RunSummary> {
    const input = validate(request);
    if (input.provider !== this.provider.name) throw new Error('campaign provider mismatch');
    const started = await this.repo.start(input);
    if (started.previous) return { ...started.previous,replayed:true };
    const summary: RunSummary = {
      accountId:input.accountId,campaignId:started.campaignId,runId:started.runId,provider:input.provider,
      mode:'extract_only',collected:0,created:0,matched:0,review:0,duplicatesInRun:0,
      errors:0,errorCodes:[],status:'completed',replayed:false
    };
    try {
      for (let offset=0; offset<input.limit; offset+=5) {
        const size = Math.min(5,input.limit-offset);
        const rows = await this.provider.page(input.term,offset,size);
        if (!Array.isArray(rows) || rows.length>size) throw new Error('provider_page_invalid');
        for (const row of rows) {
          summary.collected++;
          try {
            const saved = await this.repo.save(input.accountId,started.campaignId,started.runId,normalize(row,input.provider));
            if (!saved.discovered) summary.duplicatesInRun++;
            else if (saved.disposition === 'created') summary.created++;
            else if (saved.disposition === 'matched') summary.matched++;
            else summary.review++;
          } catch (error) {
            summary.errors++;
            summary.errorCodes.push(error instanceof Error ? error.message : 'item_failed');
          }
        }
        if (rows.length<size) break;
      }
    } catch (error) {
      summary.status='failed';
      summary.errors++;
      summary.errorCodes.push(error instanceof Error ? error.message : 'provider_failed');
    }
    if (summary.errors > 0) summary.status='failed';
    await this.repo.finish(summary);
    return summary;
  }
}
