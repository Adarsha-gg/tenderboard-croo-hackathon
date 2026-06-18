import { describe, expect, it } from 'vitest';
import type { Rfp } from '../src/domain/types.js';
import { sanitizeRfp } from '../src/rfp/sanitizeRfp.js';

function sampleRfp(overrides: Partial<Rfp> = {}): Rfp {
  return {
    id: 'rfp_launch_001',
    title: 'Create a CROO hackathon launch kit',
    createdAt: '2026-06-18T13:10:00.000Z',
    buyer: 'buyer_agent_alpha',
    maxBudget: { amount: '1.00', currency: 'USDC' },
    deadline: 'today',
    deliverables: ['pitch', 'README outline', 'demo script'],
    fields: [
      {
        key: 'public_summary',
        label: 'Public Summary',
        value: 'Prepare a launch kit for TenderBoard, a safe RFP layer for CROO agents.',
        privacy: 'PUBLIC',
      },
      {
        key: 'repo_tree',
        label: 'Repo Tree',
        value: 'src/server.ts\nsrc/.env\nprivate/roadmap.md',
        privacy: 'PRIVATE_AFTER_AWARD',
      },
      {
        key: 'local_notes',
        label: 'Local Notes',
        value: 'Adar internal notes: do not share this strategy memo.',
        privacy: 'LOCAL_ONLY',
      },
      {
        key: 'wallet_key',
        label: 'Wallet Key',
        value: 'seed phrase alpha beta gamma private key 0xdeadbeef',
        privacy: 'NEVER_SHARE',
      },
    ],
    status: 'draft',
    ...overrides,
  };
}

describe('sanitizeRfp', () => {
  it('publishes only PUBLIC fields to provider-agent bid packets', () => {
    const packet = sanitizeRfp(sampleRfp());

    expect(packet.publicFields).toEqual([
      {
        key: 'public_summary',
        label: 'Public Summary',
        value: 'Prepare a launch kit for TenderBoard, a safe RFP layer for CROO agents.',
      },
    ]);
  });

  it('does not leak PRIVATE_AFTER_AWARD, LOCAL_ONLY, or NEVER_SHARE field values anywhere in the packet', () => {
    const packetText = JSON.stringify(sanitizeRfp(sampleRfp()));

    expect(packetText).not.toContain('src/server.ts');
    expect(packetText).not.toContain('private/roadmap.md');
    expect(packetText).not.toContain('Adar internal notes');
    expect(packetText).not.toContain('seed phrase alpha beta gamma');
    expect(packetText).not.toContain('0xdeadbeef');
  });

  it('signals that private context can exist after award without exposing the private context', () => {
    const packet = sanitizeRfp(sampleRfp());

    expect(packet.privateContextAvailableAfterAward).toBe(true);
    expect(packet.forbiddenDataNotice).toContain('LOCAL_ONLY');
    expect(packet.forbiddenDataNotice).toContain('NEVER_SHARE');
  });

  it('reports no private-after-award context when the RFP has only public, local-only, and never-share fields', () => {
    const rfp = sampleRfp({
      fields: sampleRfp().fields.filter((field) => field.privacy !== 'PRIVATE_AFTER_AWARD'),
    });

    expect(sanitizeRfp(rfp).privateContextAvailableAfterAward).toBe(false);
  });

  it('returns defensive copies for mutable arrays and objects', () => {
    const rfp = sampleRfp();
    const packet = sanitizeRfp(rfp);

    packet.maxBudget.amount = '999';
    packet.deliverables.push('malicious extra deliverable');

    expect(rfp.maxBudget.amount).toBe('1.00');
    expect(rfp.deliverables).toEqual(['pitch', 'README outline', 'demo script']);
  });
});
