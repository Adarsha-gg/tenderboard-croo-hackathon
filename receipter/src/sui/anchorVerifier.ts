import { makeSuiDevDigest } from '../live/suiRuntime.js';
import type { LiveRunReceipt, SuiReceiptAnchorPayload, ReceipterConfig } from '../live/types.js';
import { buildSuiAnchorPlan } from './anchorPlan.js';

export class SuiAnchorVerificationError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SuiAnchorVerificationError';
  }
}

export interface SuiAnchorVerification {
  objectType: 'receipter.sui_anchor_verification.v1';
  ok: true;
  runId: string;
  transaction: string;
  network: string;
  verifiedAt: string;
  checks: {
    payloadBound: true;
    transactionSuccessful: true;
    anchorEventVerified: true;
    reputationEventVerified: true;
  };
}

export interface VerifySuiAnchorInput {
  receipt: LiveRunReceipt;
  payload: SuiReceiptAnchorPayload;
  config: ReceipterConfig;
  fetchImpl?: typeof fetch;
  now?: Date;
}

export function parseSuiReceiptAnchorPayload(value: unknown): SuiReceiptAnchorPayload {
  if (!isRecord(value)) {
    throw new SuiAnchorVerificationError(400, 'Sui receipt anchor payload must be a JSON object.');
  }

  const payload = {
    objectType: stringField(value, 'objectType'),
    version: numberField(value, 'version'),
    network: stringField(value, 'network'),
    transaction: stringField(value, 'transaction'),
    runId: stringField(value, 'runId'),
    receiptRegistryId: stringField(value, 'receiptRegistryId'),
    packageId: stringField(value, 'packageId'),
    paymentReference: stringField(value, 'paymentReference'),
    walrusBlobId: stringField(value, 'walrusBlobId'),
    duplicatePreventionKey: stringField(value, 'duplicatePreventionKey'),
    workerAgentId: stringField(value, 'workerAgentId'),
  };

  if (payload.objectType !== 'receipter.sui_receipt_anchor_payload.v1') {
    throw new SuiAnchorVerificationError(400, 'Sui receipt anchor payload objectType is not supported.');
  }
  if (payload.version !== 1) {
    throw new SuiAnchorVerificationError(400, 'Sui receipt anchor payload version is not supported.');
  }

  return payload as SuiReceiptAnchorPayload;
}

export async function verifySuiReceiptAnchor(input: VerifySuiAnchorInput): Promise<SuiAnchorVerification> {
  const { receipt, payload, config } = input;
  if (receipt.status !== 'anchoring' && receipt.status !== 'anchored') {
    throw new SuiAnchorVerificationError(409, `Run is not waiting for receipt anchoring. Current status: ${receipt.status}`);
  }
  if (!receipt.walrusBlobId) {
    throw new SuiAnchorVerificationError(409, 'Run needs a Walrus blob id before Sui anchoring.');
  }

  const plan = buildSuiAnchorPlan(receipt, config);
  if (!plan.ready) {
    throw new SuiAnchorVerificationError(409, `Sui anchor plan is not ready. Missing: ${plan.missing.join(', ')}`);
  }

  assertEqual('network', payload.network, `sui:${plan.network}`);
  assertEqual('run id', payload.runId, receipt.runId);
  assertEqual('receipt registry', payload.receiptRegistryId, plan.receiptRegistryId ?? '');
  assertEqual('package id', payload.packageId, plan.packageId ?? '');
  assertEqual('payment reference', payload.paymentReference, plan.payment.paymentDigest ?? receipt.suiPaymentDigest ?? receipt.workOrderId ?? 'not-paid');
  assertEqual('Walrus blob', payload.walrusBlobId, receipt.walrusBlobId);
  assertEqual('duplicate prevention key', payload.duplicatePreventionKey, plan.payment.duplicatePreventionKey);
  assertEqual('worker agent', payload.workerAgentId, receipt.workerAgentId);
  if (!payload.transaction.trim()) {
    throw new SuiAnchorVerificationError(400, 'Sui receipt anchor payload is missing a transaction digest.');
  }

  if (config.mode === 'sui-dev') {
    assertEqual('Sui dev anchor digest', payload.transaction, makeSuiDevDigest('anchor', receipt.runId));
  } else {
    await verifySuiRpcAnchor({ payload, receipt, config, fetchImpl: input.fetchImpl ?? fetch });
  }

  return {
    objectType: 'receipter.sui_anchor_verification.v1',
    ok: true,
    runId: receipt.runId,
    transaction: payload.transaction,
    network: payload.network,
    verifiedAt: (input.now ?? new Date()).toISOString(),
    checks: {
      payloadBound: true,
      transactionSuccessful: true,
      anchorEventVerified: true,
      reputationEventVerified: true,
    },
  };
}

async function verifySuiRpcAnchor(input: {
  payload: SuiReceiptAnchorPayload;
  receipt: LiveRunReceipt;
  config: ReceipterConfig;
  fetchImpl: typeof fetch;
}): Promise<void> {
  if (!input.config.suiRpcUrl) {
    throw new SuiAnchorVerificationError(500, 'SUI_RPC_URL is required for Sui receipt anchor verification.');
  }

  const response = await input.fetchImpl(input.config.suiRpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sui_getTransactionBlock',
      params: [
        input.payload.transaction,
        {
          showEffects: true,
          showEvents: true,
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new SuiAnchorVerificationError(502, `Sui RPC returned HTTP ${response.status}.`);
  }

  const rpc = (await response.json()) as unknown;
  if (!isRecord(rpc)) {
    throw new SuiAnchorVerificationError(502, 'Sui RPC returned an invalid response.');
  }
  if (rpc.error !== undefined) {
    throw new SuiAnchorVerificationError(402, `Sui anchor transaction could not be verified: ${JSON.stringify(rpc.error)}`);
  }

  const result = recordField(rpc, 'result');
  if (stringOptional(result.digest) && result.digest !== input.payload.transaction) {
    throw new SuiAnchorVerificationError(402, 'Sui transaction digest does not match the anchor payload.');
  }
  if (!hasSuccessfulEffects(result)) {
    throw new SuiAnchorVerificationError(402, 'Sui anchor transaction did not finish successfully.');
  }
  if (!hasMatchingAnchorEvent(result, input.payload, input.config)) {
    throw new SuiAnchorVerificationError(402, 'Sui transaction is missing the expected ReceiptAnchored event.');
  }
  if (!hasMatchingReputationEvent(result, input.payload, input.config)) {
    throw new SuiAnchorVerificationError(402, 'Sui transaction is missing the expected WorkerReputationUpdated event.');
  }
}

function hasSuccessfulEffects(result: Record<string, unknown>): boolean {
  const effects = recordOptional(result.effects);
  const status = recordOptional(effects?.status);
  return status?.status === 'success';
}

function hasMatchingAnchorEvent(result: Record<string, unknown>, payload: SuiReceiptAnchorPayload, config: ReceipterConfig): boolean {
  const events = Array.isArray(result.events) ? result.events : [];
  return events.some((event) => {
    if (!isRecord(event)) return false;
    const type = stringOptional(event.type);
    if (!type || !isEventType(type, config.suiPackageId, 'ReceiptAnchored')) return false;
    const parsedJson = recordOptional(event.parsedJson);
    if (!parsedJson) return false;

    return (
      eventString(parsedJson, 'run_id', 'runId') === payload.runId &&
      eventString(parsedJson, 'payment_reference', 'paymentReference') === payload.paymentReference &&
      eventString(parsedJson, 'walrus_blob_id', 'walrusBlobId') === payload.walrusBlobId &&
      eventString(parsedJson, 'duplicate_prevention_key', 'duplicatePreventionKey') === payload.duplicatePreventionKey
    );
  });
}

function hasMatchingReputationEvent(result: Record<string, unknown>, payload: SuiReceiptAnchorPayload, config: ReceipterConfig): boolean {
  const events = Array.isArray(result.events) ? result.events : [];
  return events.some((event) => {
    if (!isRecord(event)) return false;
    const type = stringOptional(event.type);
    if (!type || !isEventType(type, config.suiPackageId, 'WorkerReputationUpdated')) return false;
    const parsedJson = recordOptional(event.parsedJson);
    if (!parsedJson) return false;

    return (
      eventString(parsedJson, 'worker_agent_id', 'workerAgentId') === payload.workerAgentId &&
      eventString(parsedJson, 'last_run_id', 'lastRunId') === payload.runId &&
      eventString(parsedJson, 'last_walrus_blob_id', 'lastWalrusBlobId') === payload.walrusBlobId
    );
  });
}

function isEventType(type: string, packageId: string | undefined, eventName: string): boolean {
  if (!type.endsWith(`::receipts::${eventName}`)) return false;
  if (!packageId) return true;
  return type.toLowerCase().startsWith(`${packageId.toLowerCase()}::`);
}

function eventString(value: Record<string, unknown>, snakeField: string, camelField?: string): string | undefined {
  return decodedStringOptional(value[snakeField]) ?? (camelField ? decodedStringOptional(value[camelField]) : undefined);
}

function decodedStringOptional(value: unknown): string | undefined {
  if (typeof value === 'string') return decodeBase64Printable(value) ?? value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'number')) {
    return Buffer.from(value).toString('utf8');
  }
  return undefined;
}

function decodeBase64Printable(value: string): string | undefined {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return undefined;
  const decoded = Buffer.from(value, 'base64').toString('utf8');
  if (!decoded || decoded.includes('\u0000')) return undefined;
  if (!/^[\x20-\x7E]+$/.test(decoded)) return undefined;
  return decoded;
}

function assertEqual(label: string, actual: string, expected: string): void {
  if (actual !== expected) {
    throw new SuiAnchorVerificationError(402, `Sui anchor ${label} mismatch.`);
  }
}

function stringField(value: Record<string, unknown>, field: string): string {
  const next = value[field];
  if (typeof next !== 'string' || next.trim() === '') {
    throw new SuiAnchorVerificationError(400, `Sui receipt anchor payload is missing ${field}.`);
  }
  return next;
}

function numberField(value: Record<string, unknown>, field: string): number {
  const next = value[field];
  if (typeof next !== 'number') {
    throw new SuiAnchorVerificationError(400, `Sui receipt anchor payload is missing ${field}.`);
  }
  return next;
}

function recordField(value: Record<string, unknown>, field: string): Record<string, unknown> {
  const next = value[field];
  if (!isRecord(next)) {
    throw new SuiAnchorVerificationError(502, `Sui RPC response is missing ${field}.`);
  }
  return next;
}

function recordOptional(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function stringOptional(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
