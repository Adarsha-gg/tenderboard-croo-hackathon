import { describe, expect, it } from 'vitest';
import type { Bid, BidEvaluation, Rfp } from '../src/domain/types.js';
import { awardBid } from '../src/bidding/awardBid.js';

function rfp(): Rfp {
  return {
    id: 'rfp_launch_001',
    title: 'Create a CROO hackathon launch kit',
    createdAt: '2026-06-18T13:40:00.000Z',
    buyer: 'buyer_agent_alpha',
    maxBudget: { amount: '1.00', currency: 'USDC' },
    deadline: 'today',
    deliverables: ['pitch'],
    fields: [],
    status: 'published',
  };
}

function bid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: 'bid_rfp_launch_001_pitch_writer',
    rfpId: 'rfp_launch_001',
    providerId: 'pitch_writer',
    providerName: 'PitchWriter',
    price: { amount: '0.20', currency: 'USDC' },
    slaMinutes: 15,
    summary: 'I will write the pitch.',
    deliverables: ['pitch'],
    requestedData: ['public summary'],
    requestedPrivacyLabels: ['PUBLIC'],
    status: 'submitted',
    ...overrides,
  };
}

function evaluation(overrides: Partial<BidEvaluation> = {}): BidEvaluation {
  return {
    bidId: 'bid_rfp_launch_001_pitch_writer',
    decision: 'eligible',
    riskScore: 0,
    reasons: [],
    flags: [],
    ...overrides,
  };
}

describe('awardBid', () => {
  it('turns an eligible bid into a pending order award', () => {
    const award = awardBid(rfp(), bid(), evaluation(), {
      now: new Date('2026-06-18T13:41:00.000Z'),
    });

    expect(award).toEqual({
      id: 'award_rfp_launch_001_pitch_writer',
      rfpId: 'rfp_launch_001',
      bidId: 'bid_rfp_launch_001_pitch_writer',
      providerId: 'pitch_writer',
      awardedAt: '2026-06-18T13:41:00.000Z',
      status: 'pending_order',
    });
  });

  it('refuses to award blocked bids', () => {
    expect(() =>
      awardBid(
        rfp(),
        bid(),
        evaluation({
          decision: 'blocked',
          riskScore: 50,
          reasons: ['Bid requested NEVER_SHARE data.'],
        }),
      ),
    ).toThrow(/Cannot award blocked bid/);
  });

  it('refuses to award warned bids unless explicitly allowed', () => {
    expect(() =>
      awardBid(
        rfp(),
        bid(),
        evaluation({
          decision: 'warn',
          riskScore: 15,
          reasons: ['Bid deliverables do not overlap requested RFP deliverables.'],
        }),
      ),
    ).toThrow(/without explicit allowWarn=true/);
  });

  it('can award warned bids only with explicit allowWarn', () => {
    const award = awardBid(
      rfp(),
      bid(),
      evaluation({
        decision: 'warn',
        riskScore: 15,
        reasons: ['Bid deliverables do not overlap requested RFP deliverables.'],
      }),
      { allowWarn: true, now: new Date('2026-06-18T13:42:00.000Z') },
    );

    expect(award.status).toBe('pending_order');
    expect(award.awardedAt).toBe('2026-06-18T13:42:00.000Z');
  });

  it('refuses to award when evaluation belongs to another bid', () => {
    expect(() => awardBid(rfp(), bid(), evaluation({ bidId: 'bid_other' }))).toThrow(/evaluation belongs to bid_other/);
  });

  it('refuses to award when bid targets another RFP', () => {
    expect(() => awardBid(rfp(), bid({ rfpId: 'rfp_other' }), evaluation())).toThrow(/not RFP rfp_launch_001/);
  });
});
