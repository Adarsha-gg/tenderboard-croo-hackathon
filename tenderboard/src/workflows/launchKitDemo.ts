import { awardBid } from '../bidding/awardBid.js';
import { collectBids } from '../bidding/collectBids.js';
import type { Award, Bid, BidEvaluation, OrderRecord, Rfp } from '../domain/types.js';
import { MockCrooAdapter } from '../orders/MockCrooAdapter.js';
import type { OrderAdapter } from '../orders/OrderAdapter.js';
import { evaluateBid } from '../policy/bidPolicy.js';
import { createProviderDelivery } from '../providers/deliveries.js';
import { mockProviders } from '../providers/mockProviders.js';
import { sanitizeRfp } from '../rfp/sanitizeRfp.js';

export interface AwardedOrder {
  award: Award;
  order: OrderRecord;
}

export interface LaunchKitDemoResult {
  rfp: Rfp;
  bids: Bid[];
  evaluations: BidEvaluation[];
  awards: Award[];
  orders: AwardedOrder[];
  summary: {
    totalBids: number;
    eligibleBids: number;
    blockedBids: number;
    warnedBids: number;
    awardedBids: number;
    completedOrders: number;
  };
}

export interface RunLaunchKitDemoOptions {
  now?: Date;
  orderAdapter?: OrderAdapter;
}

export async function runLaunchKitDemo(options: RunLaunchKitDemoOptions = {}): Promise<LaunchKitDemoResult> {
  const now = options.now ?? new Date();
  const rfp = createLaunchKitRfp(now);
  const packet = sanitizeRfp(rfp);
  const bids = collectBids(packet, mockProviders);
  const evaluations = bids.map((bid) => evaluateBid(rfp, bid));
  const orderAdapter = options.orderAdapter ?? new MockCrooAdapter({ now });

  const awards: Award[] = [];
  const orders: AwardedOrder[] = [];

  for (const bid of bids) {
    const evaluation = evaluations.find((candidate) => candidate.bidId === bid.id);
    if (!evaluation || evaluation.decision !== 'eligible') continue;

    const award = awardBid(rfp, bid, evaluation, { now });
    const orderResult = await orderAdapter.createOrderFromAward({
      award,
      delivery: createProviderDelivery(bid),
    });

    awards.push(award);
    orders.push({ award, order: orderResult.order });
  }

  return {
    rfp,
    bids,
    evaluations,
    awards,
    orders,
    summary: {
      totalBids: bids.length,
      eligibleBids: evaluations.filter((evaluation) => evaluation.decision === 'eligible').length,
      blockedBids: evaluations.filter((evaluation) => evaluation.decision === 'blocked').length,
      warnedBids: evaluations.filter((evaluation) => evaluation.decision === 'warn').length,
      awardedBids: awards.length,
      completedOrders: orders.filter((entry) => entry.order.status === 'completed').length,
    },
  };
}

export function createLaunchKitRfp(now: Date): Rfp {
  return {
    id: 'rfp_launch_001',
    title: 'Create a CROO hackathon launch kit',
    createdAt: now.toISOString(),
    buyer: 'buyer_agent_alpha',
    maxBudget: { amount: '1.00', currency: 'USDC' },
    deadline: 'today',
    deliverables: ['pitch', 'README outline', 'demo script', 'submission checklist'],
    fields: [
      {
        key: 'public_summary',
        label: 'Public Summary',
        value: 'TenderBoard is a safe competitive sourcing layer for CROO agent commerce.',
        privacy: 'PUBLIC',
      },
      {
        key: 'repo_tree',
        label: 'Repo Tree',
        value: 'src/domain/types.ts\nsrc/policy/bidPolicy.ts\nsrc/orders/MockCrooAdapter.ts',
        privacy: 'PRIVATE_AFTER_AWARD',
      },
      {
        key: 'private_strategy',
        label: 'Private Strategy',
        value: 'Internal positioning notes are local-only and must not be shared with bidders.',
        privacy: 'LOCAL_ONLY',
      },
      {
        key: 'wallet_key',
        label: 'Wallet Key',
        value: 'seed phrase alpha beta gamma private key 0xdeadbeef',
        privacy: 'NEVER_SHARE',
      },
    ],
    status: 'published',
  };
}

