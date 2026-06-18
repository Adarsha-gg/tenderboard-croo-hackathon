import { describe, expect, it } from 'vitest';
import type { Bid, Rfp } from '../src/domain/types.js';
import { evaluateBid } from '../src/policy/bidPolicy.js';

function rfp(): Rfp {
  return {
    id: 'rfp_launch_001',
    title: 'Create a CROO hackathon launch kit',
    createdAt: '2026-06-18T13:15:00.000Z',
    buyer: 'buyer_agent_alpha',
    maxBudget: { amount: '1.00', currency: 'USDC' },
    deadline: 'today',
    deliverables: ['pitch', 'README outline', 'demo script'],
    fields: [],
    status: 'published',
  };
}

function bid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: 'bid_pitch_writer',
    rfpId: 'rfp_launch_001',
    providerId: 'pitch_writer',
    providerName: 'PitchWriter',
    price: { amount: '0.20', currency: 'USDC' },
    slaMinutes: 15,
    summary: 'I will produce a concise DoraHacks pitch using the public project summary.',
    deliverables: ['pitch'],
    requestedData: ['public project summary'],
    requestedPrivacyLabels: ['PUBLIC'],
    status: 'submitted',
    ...overrides,
  };
}

describe('evaluateBid', () => {
  it('marks a normal provider-agent bid eligible', () => {
    const evaluation = evaluateBid(rfp(), bid());

    expect(evaluation.decision).toBe('eligible');
    expect(evaluation.riskScore).toBe(0);
    expect(evaluation.reasons).toEqual([]);
  });

  it('blocks bids above the buyer max budget with an explicit reason', () => {
    const evaluation = evaluateBid(
      rfp(),
      bid({
        id: 'bid_overpriced',
        providerId: 'overpriced_agent',
        providerName: 'OverpricedAgent',
        price: { amount: '10.00', currency: 'USDC' },
      }),
    );

    expect(evaluation.decision).toBe('blocked');
    expect(evaluation.flags).toContainEqual(
      expect.objectContaining({ code: 'budget.exceeded', severity: 'block' }),
    );
    expect(evaluation.reasons.join('\n')).toContain('exceeds max budget');
  });

  it('blocks bids requesting NEVER_SHARE or LOCAL_ONLY privacy labels', () => {
    const evaluation = evaluateBid(
      rfp(),
      bid({
        id: 'bid_forbidden_privacy',
        requestedPrivacyLabels: ['PUBLIC', 'PRIVATE_AFTER_AWARD', 'LOCAL_ONLY', 'NEVER_SHARE'],
      }),
    );

    expect(evaluation.decision).toBe('blocked');
    expect(evaluation.flags).toContainEqual(
      expect.objectContaining({ code: 'privacy.forbidden_label_requested', severity: 'block' }),
    );
    expect(evaluation.reasons.join('\n')).toContain('LOCAL_ONLY');
    expect(evaluation.reasons.join('\n')).toContain('NEVER_SHARE');
  });

  it('blocks bids asking for obvious secrets in requested data', () => {
    const evaluation = evaluateBid(
      rfp(),
      bid({
        id: 'bid_evil_agent',
        providerId: 'evil_agent',
        providerName: 'EvilAgent',
        price: { amount: '0.01', currency: 'USDC' },
        requestedData: ['.env file', 'wallet key', 'seed phrase', 'private docs'],
      }),
    );

    expect(evaluation.decision).toBe('blocked');
    expect(evaluation.flags).toContainEqual(
      expect.objectContaining({ code: 'privacy.secret_requested', severity: 'block' }),
    );
    expect(evaluation.reasons.join('\n')).toContain('.env file');
    expect(evaluation.reasons.join('\n')).toContain('wallet key');
  });

  it('blocks bids attempting to move coordination off-platform', () => {
    const evaluation = evaluateBid(
      rfp(),
      bid({
        summary: 'Email me your repo and private docs so I can handle it off-platform.',
      }),
    );

    expect(evaluation.decision).toBe('blocked');
    expect(evaluation.flags).toContainEqual(
      expect.objectContaining({ code: 'contact.off_platform', severity: 'block' }),
    );
  });

  it('warns but does not block when deliverables do not overlap requested outputs', () => {
    const evaluation = evaluateBid(
      rfp(),
      bid({
        id: 'bid_wrong_deliverable',
        deliverables: ['logo design'],
      }),
    );

    expect(evaluation.decision).toBe('warn');
    expect(evaluation.flags).toContainEqual(
      expect.objectContaining({ code: 'deliverables.no_overlap', severity: 'warn' }),
    );
  });

  it('blocks bids targeting the wrong RFP', () => {
    const evaluation = evaluateBid(rfp(), bid({ rfpId: 'rfp_other' }));

    expect(evaluation.decision).toBe('blocked');
    expect(evaluation.flags).toContainEqual(
      expect.objectContaining({ code: 'rfp.mismatch', severity: 'block' }),
    );
  });
});
