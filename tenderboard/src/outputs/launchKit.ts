import type { Bid, BidEvaluation } from '../domain/types.js';
import type { LaunchKitDemoResult } from '../workflows/launchKitDemo.js';

export function assembleLaunchKit(result: LaunchKitDemoResult): string {
  const safeAwards = result.awards.map((award) => {
    const bid = findBid(result.bids, award.bidId);
    const order = result.orders.find((entry) => entry.award.id === award.id)?.order;
    return { award, bid, order };
  });

  const blocked = result.bids
    .map((bid) => ({ bid, evaluation: findEvaluation(result.evaluations, bid.id) }))
    .filter((entry) => entry.evaluation.decision === 'blocked');

  return [
    '# TenderBoard Launch Kit',
    '',
    '## Project pitch',
    '',
    'TenderBoard is the safe competitive sourcing layer for CROO agent commerce. Buyer agents publish sanitized RFPs, provider agents bid, unsafe bids are blocked before private context leaks, and winning bids become CROO orders.',
    '',
    '## RFP summary',
    '',
    `- RFP: ${result.rfp.title}`,
    `- Buyer: ${result.rfp.buyer}`,
    `- Max budget: ${result.rfp.maxBudget.amount} ${result.rfp.maxBudget.currency}`,
    `- Deadline: ${result.rfp.deadline}`,
    `- Deliverables: ${result.rfp.deliverables.join(', ')}`,
    '',
    '## Bid results',
    '',
    `- Total bids: ${result.summary.totalBids}`,
    `- Eligible bids: ${result.summary.eligibleBids}`,
    `- Blocked bids: ${result.summary.blockedBids}`,
    `- Awarded bids: ${result.summary.awardedBids}`,
    `- Completed mock CROO orders: ${result.summary.completedOrders}`,
    '',
    '## Awarded providers',
    '',
    ...safeAwards.flatMap(({ award, bid, order }) => [
      `### ${bid.providerName}`,
      '',
      `- Price: ${bid.price.amount} ${bid.price.currency}`,
      `- SLA: ${bid.slaMinutes} minutes`,
      `- Deliverables: ${bid.deliverables.join(', ')}`,
      `- Award: ${award.id}`,
      `- Mock order: ${order?.id ?? 'not created'}`,
      `- Order status: ${order?.status ?? 'missing'}`,
      `- Delivery: ${order?.delivery ?? 'missing'}`,
      '',
    ]),
    '## Blocked providers',
    '',
    ...blocked.flatMap(({ bid, evaluation }) => [
      `### ${bid.providerName}`,
      '',
      `- Price: ${bid.price.amount} ${bid.price.currency}`,
      `- Decision: ${evaluation.decision}`,
      `- Reasons: ${evaluation.reasons.join('; ')}`,
      '',
    ]),
    '## Demo script beats',
    '',
    '1. Buyer creates a privacy-labeled RFP.',
    '2. TenderBoard publishes only public fields to provider agents.',
    '3. Five provider agents bid.',
    '4. TenderBoard blocks overpriced and malicious bids.',
    '5. Safe bids are awarded and become mock CROO orders.',
    '6. Completed orders produce the launch-kit outputs.',
    '',
    '## Safety claim',
    '',
    'TenderBoard does not validate delivered work. It protects the pre-order sourcing step: data minimization, budget policy, bid comparison, and award-to-order flow.',
    '',
  ].join('\n');
}

function findBid(bids: Bid[], bidId: string): Bid {
  const bid = bids.find((candidate) => candidate.id === bidId);
  if (!bid) throw new Error(`Missing bid for award: ${bidId}`);
  return bid;
}

function findEvaluation(evaluations: BidEvaluation[], bidId: string): BidEvaluation {
  const evaluation = evaluations.find((candidate) => candidate.bidId === bidId);
  if (!evaluation) throw new Error(`Missing evaluation for bid: ${bidId}`);
  return evaluation;
}
