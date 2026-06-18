import type { Award, OrderEvent, OrderRecord } from '../domain/types.js';
import type { CreateOrderInput, CreateOrderResult, OrderAdapter } from './OrderAdapter.js';

interface CrooSdkModule {
  AgentClient: new (config: Record<string, unknown>, sdkKey: string) => {
    negotiateOrder(req: Record<string, unknown>): Promise<Record<string, unknown>>;
    payOrder(orderId: string): Promise<Record<string, unknown>>;
    getDelivery(orderId: string): Promise<Record<string, unknown>>;
  };
}

export interface CrooSdkAdapterEnv {
  CROO_API_URL?: string;
  CROO_WS_URL?: string;
  CROO_SDK_KEY?: string;
  CROO_TARGET_SERVICE_ID?: string;
}

export interface CrooSdkAdapterOptions {
  env?: CrooSdkAdapterEnv;
  now?: Date;
  loadSdk?: () => Promise<CrooSdkModule>;
}

export class CrooSdkAdapter implements OrderAdapter {
  private readonly env: CrooSdkAdapterEnv;
  private readonly now: Date;
  private readonly loadSdk: () => Promise<CrooSdkModule>;
  private readonly eventsByOrderId = new Map<string, OrderEvent[]>();

  constructor(options: CrooSdkAdapterOptions = {}) {
    this.env = options.env ?? process.env;
    this.now = options.now ?? new Date();
    this.loadSdk = options.loadSdk ?? loadCrooSdk;
  }

  async createOrderFromAward(input: CreateOrderInput): Promise<CreateOrderResult> {
    const config = requireCrooConfig(this.env);
    const sdk = await this.loadSdk();
    const client = new sdk.AgentClient(
      {
        baseURL: config.CROO_API_URL,
        wsURL: config.CROO_WS_URL,
      },
      config.CROO_SDK_KEY,
    );

    const requirements = JSON.stringify({
      source: 'tenderboard',
      awardId: input.award.id,
      rfpId: input.award.rfpId,
      bidId: input.award.bidId,
      providerId: input.award.providerId,
      deliveryPreview: input.delivery,
    });

    const negotiation = await client.negotiateOrder({
      serviceId: config.CROO_TARGET_SERVICE_ID,
      requirements,
    });
    const orderId = extractOrderId(negotiation, input.award);
    await client.payOrder(orderId);
    const delivery = await client.getDelivery(orderId).catch(() => undefined);

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
      delivery: JSON.stringify(delivery ?? { note: 'CROO delivery not yet available in skeleton mode' }),
    };

    const events: OrderEvent[] = [
      makeEvent(orderId, 'NegotiationCreated', timestamp, { negotiation }),
      makeEvent(orderId, 'OrderCreated', timestamp, { source: 'croo-sdk' }),
      makeEvent(orderId, 'OrderPaid', timestamp, { source: 'croo-sdk' }),
      makeEvent(orderId, 'OrderCompleted', timestamp, { delivery: order.delivery }),
    ];
    this.eventsByOrderId.set(orderId, events);

    return { order, events };
  }

  async listEvents(orderId: string): Promise<OrderEvent[]> {
    return [...(this.eventsByOrderId.get(orderId) ?? [])];
  }
}

export function requireCrooConfig(env: CrooSdkAdapterEnv): Required<CrooSdkAdapterEnv> {
  const required = ['CROO_API_URL', 'CROO_WS_URL', 'CROO_SDK_KEY', 'CROO_TARGET_SERVICE_ID'] as const;
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`CROO mode requires env vars: ${missing.join(', ')}. Use mock mode or copy .env.example.`);
  }

  return {
    CROO_API_URL: env.CROO_API_URL!,
    CROO_WS_URL: env.CROO_WS_URL!,
    CROO_SDK_KEY: env.CROO_SDK_KEY!,
    CROO_TARGET_SERVICE_ID: env.CROO_TARGET_SERVICE_ID!,
  };
}

async function loadCrooSdk(): Promise<CrooSdkModule> {
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (
      specifier: string,
    ) => Promise<CrooSdkModule>;
    return await dynamicImport('@croo-network/sdk');
  } catch (error) {
    throw new Error(
      `CROO mode could not load @croo-network/sdk. Install it before using CROO mode. Cause: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function extractOrderId(negotiation: Record<string, unknown>, award: Award): string {
  const direct = negotiation.orderId ?? negotiation.negotiationId;
  if (typeof direct === 'string' && direct.length > 0) return direct;

  const order = negotiation.order;
  if (order && typeof order === 'object') {
    const nestedOrderId = (order as Record<string, unknown>).orderId ?? (order as Record<string, unknown>).order_id;
    if (typeof nestedOrderId === 'string' && nestedOrderId.length > 0) return nestedOrderId;
  }

  return `croo_order_${award.id}`;
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
