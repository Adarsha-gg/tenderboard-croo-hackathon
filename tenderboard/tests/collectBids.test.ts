import { describe, expect, it } from 'vitest';
import type { Rfp } from '../src/domain/types.js';
import { collectBids } from '../src/bidding/collectBids.js';
import { evaluateBid } from '../src/policy/bidPolicy.js';
import { mockProviders } from '../src/providers/mockProviders.js';
import { sanitizeRfp } from '../src/rfp/sanitizeRfp.js';

function launchKitRfp(): Rfp {
  return {
    id: 'rfp_launch_001',
    title: 'Create a CROO hackathon launch kit',
    createdAt: '2026-06-18T13:30:00.000Z',
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
        value: 'src/domain/types.ts\nsrc/policy/bidPolicy.ts',
        privacy: 'PRIVATE_AFTER_AWARD',
      },
      {
        key: 'private_strategy',
        label: 'Private Strategy',
        value: 'Do not reveal this internal positioning memo.',
        privacy: 'LOCAL_ONLY',
      },
      {
        key: 'wallet_key',
        label: 'Wallet Key',
        value: 'seed phrase alpha beta gamma',
        privacy: 'NEVER_SHARE',
      },
    ],
    status: 'published',
  };
}

describe('collectBids with mock provider agents', () => {
  it('collects one deterministic bid from each mock provider agent', () => {
    const packet = sanitizeRfp(launchKitRfp());
    const bids = collectBids(packet, mockProviders);

    expect(bids.map((bid) => bid.providerId)).toEqual([
      'pitch_writer',
      'readme_agent',
      'demo_script_agent',
      'overpriced_agent',
      'evil_agent',
    ]);
    expect(new Set(bids.map((bid) => bid.id)).size).toBe(5);
    expect(bids.every((bid) => bid.rfpId === 'rfp_launch_001')).toBe(true);
    expect(bids.every((bid) => bid.status === 'submitted')).toBe(true);
  });

  it('does not provide private RFP field values to mock provider agents through the bid packet', () => {
    const packet = sanitizeRfp(launchKitRfp());
    const bidsText = JSON.stringify(collectBids(packet, mockProviders));

    expect(bidsText).not.toContain('src/domain/types.ts');
    expect(bidsText).not.toContain('Do not reveal this internal positioning memo');
    expect(bidsText).not.toContain('seed phrase alpha beta gamma');
  });

  it('produces three eligible bids, one over-budget blocked bid, and one malicious blocked bid after policy evaluation', () => {
    const sourceRfp = launchKitRfp();
    const packet = sanitizeRfp(sourceRfp);
    const bids = collectBids(packet, mockProviders);
    const evaluations = bids.map((bid) => evaluateBid(sourceRfp, bid));

    const byProvider = new Map(bids.map((bid, index) => [bid.providerId, evaluations[index]!]));

    expect(byProvider.get('pitch_writer')?.decision).toBe('eligible');
    expect(byProvider.get('readme_agent')?.decision).toBe('eligible');
    expect(byProvider.get('demo_script_agent')?.decision).toBe('eligible');

    expect(byProvider.get('overpriced_agent')?.decision).toBe('blocked');
    expect(byProvider.get('overpriced_agent')?.flags).toContainEqual(
      expect.objectContaining({ code: 'budget.exceeded', severity: 'block' }),
    );

    expect(byProvider.get('evil_agent')?.decision).toBe('blocked');
    expect(byProvider.get('evil_agent')?.flags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'privacy.forbidden_label_requested', severity: 'block' }),
        expect.objectContaining({ code: 'privacy.secret_requested', severity: 'block' }),
      ]),
    );
  });
});
