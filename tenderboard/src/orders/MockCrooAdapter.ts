import type { OrderEvent, OrderRecord } from '../domain/types.js';
import type { CreateOrderInput, CreateOrderResult, OrderAdapter } from './OrderAdapter.js';

export interface MockCrooAdapterOptions {
  now?: Date;
}

export class MockCrooAdapter implements OrderAdapter {
  private readonly eventsByOrderId = new Map<string, OrderEvent[]>();
  private readonly now: Date;

  constructor(options: MockCrooAdapterOptions = {}) {
    this.now = options.now ?? new Date();
  }

  async createOrderFromAward(input: CreateOrderInput): Promise<CreateOrderResult> {
    const orderId = `mock_order_${input.award.id}`;
    const timestamp = this.now.toISOString();

    const order: OrderRecord = {
      id: orderId,
      awardId: input.award.id,
      rfpId: input.award.rfpId,
      bidId: input.award.bidId,
      providerId: input.award.providerId,
      status: 'completed',
      createdAt: timestamp,
      completedAt: timestamp,
      delivery: input.delivery,
    };

    const events: OrderEvent[] = [
      makeEvent(orderId, 'NegotiationCreated', timestamp, {
        awardId: input.award.id,
        bidId: input.award.bidId,
        providerId: input.award.providerId,
      }),
      makeEvent(orderId, 'OrderCreated', timestamp, {
        rfpId: input.award.rfpId,
      }),
      makeEvent(orderId, 'OrderPaid', timestamp, {
        paymentMode: 'mock',
      }),
      makeEvent(orderId, 'OrderCompleted', timestamp, {
        delivery: input.delivery,
      }),
    ];

    this.eventsByOrderId.set(orderId, events);
    return { order, events };
  }

  async listEvents(orderId: string): Promise<OrderEvent[]> {
    return [...(this.eventsByOrderId.get(orderId) ?? [])];
  }
}

function makeEvent(
  orderId: string,
  type: OrderEvent['type'],
  timestamp: string,
  details: Record<string, unknown>,
): OrderEvent {
  return {
    id: `${orderId}_${type}`,
    orderId,
    type,
    timestamp,
    details,
  };
}
