import type { Award, OrderEvent, OrderRecord } from '../domain/types.js';

export interface CreateOrderInput {
  award: Award;
  delivery: string;
}

export interface CreateOrderResult {
  order: OrderRecord;
  events: OrderEvent[];
}

export interface OrderAdapter {
  createOrderFromAward(input: CreateOrderInput): Promise<CreateOrderResult>;
  listEvents(orderId: string): Promise<OrderEvent[]>;
}
