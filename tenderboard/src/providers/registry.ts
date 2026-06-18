import type { Bid, BidPacket } from '../domain/types.js';

export interface ProviderAgent {
  id: string;
  name: string;
  specialty: string;
  createBid(packet: BidPacket): Bid;
}

export function makeBidId(rfpId: string, providerId: string): string {
  return `bid_${rfpId}_${providerId}`;
}
