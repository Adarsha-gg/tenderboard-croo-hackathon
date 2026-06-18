import { describe, expect, it } from 'vitest';
import type { Bid } from '../src/domain/types.js';
import { createProviderDelivery } from '../src/providers/deliveries.js';

function bid(providerId: string, providerName = providerId): Bid {
  return {
    id: `bid_${providerId}`,
    rfpId: 'rfp_launch_001',
    providerId,
    providerName,
    price: { amount: '0.20', currency: 'USDC' },
    slaMinutes: 15,
    summary: 'summary',
    deliverables: ['pitch'],
    requestedData: ['public summary'],
    requestedPrivacyLabels: ['PUBLIC'],
    status: 'submitted',
  };
}

describe('createProviderDelivery', () => {
  it('creates useful pitch writer content', () => {
    const delivery = createProviderDelivery(bid('pitch_writer', 'PitchWriter'));

    expect(delivery).toContain('TenderBoard is the safe RFP layer');
    expect(delivery).toContain('CROO lets agents transact');
  });

  it('creates useful README agent content', () => {
    const delivery = createProviderDelivery(bid('readme_agent', 'ReadmeAgent'));

    expect(delivery).toContain('README outline');
    expect(delivery).toContain('npm install && npm test && npm run demo');
  });

  it('creates useful demo script content', () => {
    const delivery = createProviderDelivery(bid('demo_script_agent', 'DemoScriptAgent'));

    expect(delivery).toContain('Demo script');
    expect(delivery).toContain('EvilAgent blocked for requesting secrets');
  });
});
