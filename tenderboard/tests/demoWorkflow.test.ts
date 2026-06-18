import { describe, expect, it } from 'vitest';
import { runLaunchKitDemo } from '../src/workflows/launchKitDemo.js';

describe('runLaunchKitDemo', () => {
  it('runs the full RFP-to-mock-order flow with deterministic outcomes', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:00:00.000Z') });

    expect(result.summary).toEqual({
      totalBids: 5,
      eligibleBids: 3,
      blockedBids: 2,
      warnedBids: 0,
      awardedBids: 3,
      completedOrders: 3,
    });

    expect(result.awards.map((award) => award.providerId)).toEqual([
      'pitch_writer',
      'readme_agent',
      'demo_script_agent',
    ]);
    expect(result.orders.every((entry) => entry.order.status === 'completed')).toBe(true);
  });

  it('does not award over-budget or malicious provider bids', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:01:00.000Z') });
    const awardedProviders = new Set(result.awards.map((award) => award.providerId));

    expect(awardedProviders.has('overpriced_agent')).toBe(false);
    expect(awardedProviders.has('evil_agent')).toBe(false);

    const blockedBidProviders = result.bids
      .filter((bid) => result.evaluations.find((evaluation) => evaluation.bidId === bid.id)?.decision === 'blocked')
      .map((bid) => bid.providerId);

    expect(blockedBidProviders).toEqual(['overpriced_agent', 'evil_agent']);
  });

  it('preserves privacy through the full workflow result exposed to providers and bids', async () => {
    const resultText = JSON.stringify(await runLaunchKitDemo({ now: new Date('2026-06-18T14:02:00.000Z') }));

    // The full result contains the source RFP for the buyer, so assert specifically that bids/orders do not contain secret values.
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:02:00.000Z') });
    const providerFacingText = JSON.stringify({ bids: result.bids, orders: result.orders });

    expect(resultText).toContain('seed phrase alpha beta gamma');
    expect(providerFacingText).not.toContain('seed phrase alpha beta gamma');
    expect(providerFacingText).not.toContain('0xdeadbeef');
    expect(providerFacingText).not.toContain('Internal positioning notes');
  });
});
