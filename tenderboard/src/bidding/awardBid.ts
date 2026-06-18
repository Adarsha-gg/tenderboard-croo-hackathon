import type { Award, Bid, BidEvaluation, Rfp } from '../domain/types.js';

export interface AwardBidOptions {
  now?: Date;
  allowWarn?: boolean;
}

export function awardBid(rfp: Rfp, bid: Bid, evaluation: BidEvaluation, options: AwardBidOptions = {}): Award {
  if (bid.rfpId !== rfp.id) {
    throw new Error(`Cannot award bid ${bid.id}: bid targets ${bid.rfpId}, not RFP ${rfp.id}.`);
  }

  if (evaluation.bidId !== bid.id) {
    throw new Error(`Cannot award bid ${bid.id}: evaluation belongs to ${evaluation.bidId}.`);
  }

  if (evaluation.decision === 'blocked') {
    throw new Error(`Cannot award blocked bid ${bid.id}: ${evaluation.reasons.join('; ')}`);
  }

  if (evaluation.decision === 'warn' && options.allowWarn !== true) {
    throw new Error(`Cannot award warned bid ${bid.id} without explicit allowWarn=true: ${evaluation.reasons.join('; ')}`);
  }

  const awardedAt = (options.now ?? new Date()).toISOString();

  return {
    id: `award_${rfp.id}_${bid.providerId}`,
    rfpId: rfp.id,
    bidId: bid.id,
    providerId: bid.providerId,
    awardedAt,
    status: 'pending_order',
  };
}
