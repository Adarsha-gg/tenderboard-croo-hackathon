import type { Bid, BidPacket } from '../domain/types.js';
import type { ProviderAgent } from '../providers/registry.js';

export function collectBids(packet: BidPacket, providers: ProviderAgent[]): Bid[] {
  return providers.map((provider) => provider.createBid(packet));
}
