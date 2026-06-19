import type { LiveRunReceipt, TenderBoardConfig } from './types.js';
import { storeEvidenceOnWalrus, type WalrusStoreResult } from './walrusRuntime.js';

export type MemoryStoreBackend = 'walrus';

export interface MemoryStore {
  readonly backend: MemoryStoreBackend;
  putEvidenceBundle(receipt: LiveRunReceipt): Promise<WalrusStoreResult>;
}

export class WalrusMemoryStore implements MemoryStore {
  readonly backend = 'walrus' as const;

  constructor(
    private readonly config: TenderBoardConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  putEvidenceBundle(receipt: LiveRunReceipt): Promise<WalrusStoreResult> {
    return storeEvidenceOnWalrus(receipt, this.config, this.fetchImpl);
  }
}

export function createMemoryStore(config: TenderBoardConfig, fetchImpl?: typeof fetch): MemoryStore {
  return new WalrusMemoryStore(config, fetchImpl);
}
