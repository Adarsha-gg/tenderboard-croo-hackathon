import { describe, expect, it } from 'vitest';
import type { Award } from '../src/domain/types.js';
import { CrooSdkAdapter, requireCrooConfig } from '../src/orders/CrooSdkAdapter.js';

function award(): Award {
  return {
    id: 'award_rfp_launch_001_pitch_writer',
    rfpId: 'rfp_launch_001',
    bidId: 'bid_rfp_launch_001_pitch_writer',
    providerId: 'pitch_writer',
    awardedAt: '2026-06-18T15:00:00.000Z',
    status: 'pending_order',
  };
}

describe('requireCrooConfig', () => {
  it('fails closed when CROO env vars are missing', () => {
    expect(() => requireCrooConfig({})).toThrow(/CROO mode requires env vars/);
    expect(() => requireCrooConfig({ CROO_API_URL: 'https://api.croo.network' })).toThrow(
      /CROO_WS_URL, CROO_SDK_KEY, CROO_TARGET_SERVICE_ID/,
    );
  });

  it('returns required config when all env vars are present', () => {
    expect(
      requireCrooConfig({
        CROO_API_URL: 'https://api.croo.network',
        CROO_WS_URL: 'wss://api.croo.network/ws',
        CROO_SDK_KEY: 'croo_sk_test',
        CROO_TARGET_SERVICE_ID: 'svc_test',
      }),
    ).toEqual({
      CROO_API_URL: 'https://api.croo.network',
      CROO_WS_URL: 'wss://api.croo.network/ws',
      CROO_SDK_KEY: 'croo_sk_test',
      CROO_TARGET_SERVICE_ID: 'svc_test',
    });
  });
});

describe('CrooSdkAdapter', () => {
  it('does not attempt SDK loading when config is missing', async () => {
    const adapter = new CrooSdkAdapter({
      env: {},
      loadSdk: async () => {
        throw new Error('sdk should not load');
      },
    });

    await expect(
      adapter.createOrderFromAward({ award: award(), delivery: 'delivery' }),
    ).rejects.toThrow(/CROO mode requires env vars/);
  });

  it('maps an award to CROO SDK negotiate/pay/getDelivery calls when configured', async () => {
    const calls: string[] = [];
    const adapter = new CrooSdkAdapter({
      now: new Date('2026-06-18T15:01:00.000Z'),
      env: {
        CROO_API_URL: 'https://api.croo.network',
        CROO_WS_URL: 'wss://api.croo.network/ws',
        CROO_SDK_KEY: 'croo_sk_test',
        CROO_TARGET_SERVICE_ID: 'svc_test',
      },
      loadSdk: async () => ({
        AgentClient: class {
          negotiateOrder(req: Record<string, unknown>): Promise<Record<string, unknown>> {
            calls.push(`negotiate:${req.serviceId}`);
            return Promise.resolve({ order: { orderId: 'croo_order_test' } });
          }
          payOrder(orderId: string): Promise<Record<string, unknown>> {
            calls.push(`pay:${orderId}`);
            return Promise.resolve({ txHash: '0xabc' });
          }
          getDelivery(orderId: string): Promise<Record<string, unknown>> {
            calls.push(`delivery:${orderId}`);
            return Promise.resolve({ deliverableText: 'done' });
          }
        },
      }),
    });

    const result = await adapter.createOrderFromAward({ award: award(), delivery: 'delivery' });

    expect(calls).toEqual(['negotiate:svc_test', 'pay:croo_order_test', 'delivery:croo_order_test']);
    expect(result.order.id).toBe('croo_order_test');
    expect(result.events.map((event) => event.type)).toEqual([
      'NegotiationCreated',
      'OrderCreated',
      'OrderPaid',
      'OrderCompleted',
    ]);
  });
});
