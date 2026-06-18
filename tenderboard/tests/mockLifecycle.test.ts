import { describe, expect, it } from 'vitest';
import type { Award } from '../src/domain/types.js';
import { MockCrooAdapter } from '../src/orders/MockCrooAdapter.js';

function award(): Award {
  return {
    id: 'award_rfp_launch_001_pitch_writer',
    rfpId: 'rfp_launch_001',
    bidId: 'bid_rfp_launch_001_pitch_writer',
    providerId: 'pitch_writer',
    awardedAt: '2026-06-18T13:50:00.000Z',
    status: 'pending_order',
  };
}

describe('MockCrooAdapter', () => {
  it('turns an award into a completed mock order with CROO-shaped lifecycle events', async () => {
    const adapter = new MockCrooAdapter({ now: new Date('2026-06-18T13:51:00.000Z') });

    const result = await adapter.createOrderFromAward({
      award: award(),
      delivery: 'Pitch delivery text',
    });

    expect(result.order).toEqual({
      id: 'mock_order_award_rfp_launch_001_pitch_writer',
      awardId: 'award_rfp_launch_001_pitch_writer',
      rfpId: 'rfp_launch_001',
      bidId: 'bid_rfp_launch_001_pitch_writer',
      providerId: 'pitch_writer',
      status: 'completed',
      createdAt: '2026-06-18T13:51:00.000Z',
      completedAt: '2026-06-18T13:51:00.000Z',
      delivery: 'Pitch delivery text',
    });

    expect(result.events.map((event) => event.type)).toEqual([
      'NegotiationCreated',
      'OrderCreated',
      'OrderPaid',
      'OrderCompleted',
    ]);
  });

  it('stores events so callers can list the timeline by order id', async () => {
    const adapter = new MockCrooAdapter({ now: new Date('2026-06-18T13:52:00.000Z') });
    const result = await adapter.createOrderFromAward({
      award: award(),
      delivery: 'Pitch delivery text',
    });

    const events = await adapter.listEvents(result.order.id);

    expect(events).toEqual(result.events);
    expect(events[0]?.details).toEqual({
      awardId: 'award_rfp_launch_001_pitch_writer',
      bidId: 'bid_rfp_launch_001_pitch_writer',
      providerId: 'pitch_writer',
    });
  });

  it('returns an empty timeline for unknown orders', async () => {
    const adapter = new MockCrooAdapter();

    await expect(adapter.listEvents('mock_order_missing')).resolves.toEqual([]);
  });
});
