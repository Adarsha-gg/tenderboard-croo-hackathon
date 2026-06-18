export type PrivacyLabel =
  | 'PUBLIC'
  | 'PRIVATE_AFTER_AWARD'
  | 'LOCAL_ONLY'
  | 'NEVER_SHARE';

export interface Money {
  amount: string;
  currency: 'USDC';
}

export interface RfpField {
  key: string;
  label: string;
  value: string;
  privacy: PrivacyLabel;
}

export interface Rfp {
  id: string;
  title: string;
  createdAt: string;
  buyer: string;
  maxBudget: Money;
  deadline: string;
  deliverables: string[];
  fields: RfpField[];
  status: 'draft' | 'published' | 'awarded' | 'cancelled';
}

export interface BidPacket {
  rfpId: string;
  title: string;
  maxBudget: Money;
  deadline: string;
  deliverables: string[];
  publicFields: Array<Pick<RfpField, 'key' | 'label' | 'value'>>;
  privateContextAvailableAfterAward: boolean;
  forbiddenDataNotice: string;
}

export interface Bid {
  id: string;
  rfpId: string;
  providerId: string;
  providerName: string;
  price: Money;
  slaMinutes: number;
  summary: string;
  deliverables: string[];
  requestedData: string[];
  requestedPrivacyLabels: PrivacyLabel[];
  status: 'submitted' | 'blocked' | 'eligible' | 'awarded' | 'lost';
}

export interface BidEvaluationFlag {
  code: string;
  severity: 'info' | 'warn' | 'block';
  message: string;
}

export interface BidEvaluation {
  bidId: string;
  decision: 'eligible' | 'blocked' | 'warn';
  riskScore: number;
  reasons: string[];
  flags: BidEvaluationFlag[];
}

export interface Award {
  id: string;
  rfpId: string;
  bidId: string;
  providerId: string;
  awardedAt: string;
  status: 'pending_order' | 'ordered' | 'delivered' | 'failed';
}

export type OrderEventType =
  | 'NegotiationCreated'
  | 'OrderCreated'
  | 'OrderPaid'
  | 'OrderCompleted'
  | 'OrderRejected'
  | 'OrderExpired';

export interface OrderEvent {
  id: string;
  orderId: string;
  type: OrderEventType;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface OrderRecord {
  id: string;
  awardId: string;
  rfpId: string;
  bidId: string;
  providerId: string;
  status: 'created' | 'paid' | 'completed' | 'rejected' | 'expired';
  createdAt: string;
  completedAt?: string;
  delivery?: string;
}
