import type { Provider, RawBusiness } from './contracts.js';

export class MockProvider implements Provider {
  readonly name = 'mock';
  constructor(private readonly rows: RawBusiness[]) {}
  async page(_term: string, offset: number, size: number): Promise<RawBusiness[]> {
    return this.rows.slice(offset,offset+size);
  }
}
