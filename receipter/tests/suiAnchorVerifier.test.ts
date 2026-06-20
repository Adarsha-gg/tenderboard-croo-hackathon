import { describe, expect, it } from 'vitest';
import { loadReceipterConfig } from '../src/live/config.js';
import type { LiveRunReceipt, SuiReceiptAnchorPayload } from '../src/live/types.js';
import { buildSuiAnchorPlan } from '../src/sui/anchorPlan.js';
import { verifySuiReceiptAnchor } from '../src/sui/anchorVerifier.js';

describe('Sui anchor verifier', () => {
  it('accepts receipt events emitted under an upgraded package original id', async () => {
    const config = loadReceipterConfig({
      RECEIPTER_MODE: 'sui',
      SUI_NETWORK: 'testnet',
      SUI_OPERATOR_ADDRESS: '0xoperator',
      SUI_PACKAGE_ID: '0xlatestpackage',
      SUI_RECEIPT_REGISTRY_ID: '0xregistry',
      SUI_RPC_URL: 'https://fullnode.testnet.sui.io:443',
      WALRUS_PUBLISHER_URL: 'https://publisher.walrus.testnet.example',
      WALRUS_AGGREGATOR_URL: 'https://aggregator.walrus.testnet.example',
    });
    const receipt = sampleReceipt();
    const plan = buildSuiAnchorPlan(receipt, config);
    const payload: SuiReceiptAnchorPayload = {
      objectType: 'receipter.sui_receipt_anchor_payload.v1',
      version: 1,
      network: 'sui:testnet',
      transaction: '0xanchor_digest',
      runId: receipt.runId,
      receiptRegistryId: config.suiReceiptRegistryId ?? '',
      packageId: config.suiPackageId ?? '',
      paymentReference: plan.payment.paymentDigest ?? '',
      walrusBlobId: receipt.walrusBlobId ?? '',
      duplicatePreventionKey: plan.payment.duplicatePreventionKey,
      workerAgentId: receipt.workerAgentId,
    };

    const verification = await verifySuiReceiptAnchor({
      receipt,
      payload,
      config,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: {
              digest: payload.transaction,
              effects: { status: { status: 'success' } },
              events: [
                {
                  type: '0xoriginalpackage::receipts::ReceiptAnchored',
                  parsedJson: {
                    run_id: payload.runId,
                    payment_reference: payload.paymentReference,
                    walrus_blob_id: payload.walrusBlobId,
                    duplicate_prevention_key: payload.duplicatePreventionKey,
                  },
                },
                {
                  type: '0xoriginalpackage::receipts::WorkerReputationUpdated',
                  parsedJson: {
                    worker_agent_id: payload.workerAgentId,
                    last_run_id: payload.runId,
                    last_walrus_blob_id: payload.walrusBlobId,
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
    });

    expect(verification.ok).toBe(true);
    expect(verification.transaction).toBe(payload.transaction);
  });
});

function sampleReceipt(): LiveRunReceipt {
  return {
    runId: 'run_sui',
    mode: 'sui',
    status: 'anchoring',
    createdAt: '2026-06-19T01:00:00.000Z',
    updatedAt: '2026-06-19T01:00:00.000Z',
    taskTitle: 'Find Sui agent opportunities',
    sanitizedTask: 'Task: Find Sui agent opportunities',
    maxPayment: { amount: '0.050', currency: 'SUI' },
    trustDecision: {
      workerAgentId: 'sui_worker',
      score: 91,
      tier: 'AA',
      verdict: 'allow',
      pricedMultiplier: 1,
      reasons: ['Buyer-defined acceptance criteria were anchored before dispatch.'],
      controls: ['Payment requires explicit approval.'],
    },
    verificationManifest: {
      specHash: 'sha256:spec',
      evidenceHash: 'sha256:evidence',
      checkerPack: 'research',
      acceptanceCriteria: ['Return public Sui links.'],
      requiredChecks: [{ id: 'delivery_evidence', label: 'Delivery evidence', status: 'passed', detail: 'Delivered.' }],
      settlementRule: 'Release after Sui approval and delivery.',
      reputationWriteback: 'Use receipt as Sui feedback.',
    },
    workerAgentId: 'sui_worker',
    workOrderId: 'sui_work_order_1',
    suiNetwork: 'testnet',
    suiPackageId: '0xlatestpackage',
    suiReceiptRegistryId: '0xregistry',
    suiWorkOrderObjectId: '0xworkorder',
    suiEscrowObjectId: '0xescrow',
    suiPaymentDigest: '0xsui_payment',
    suiAnchorDigest: undefined,
    walrusBlobId: 'walrus_blob_123',
    walrusBlobObjectId: '0xwalrus',
    walrusCertifiedEpoch: undefined,
    walrusEndEpoch: 436,
    walrusReadUrl: 'https://aggregator.walrus.testnet.example/v1/blobs/walrus_blob_123',
    deliveryText: 'Sui opportunity report',
    error: undefined,
    events: [],
    paymentIntentPlan: {
      objectType: 'receipter.payment_intent_plan.v1',
      intentId: 'payment_intent_run_sui',
      paymentNonce: 'payment_nonce_123',
      settlementNonce: 'settlement_nonce_456',
      amountMist: '35000000',
      amountSui: '0.035',
      coinType: '0x2::sui::SUI',
      receiverAddress: '0xoperator',
      operatorAddress: '0xoperator',
      selectedBid: {
        bidId: 'public_scout_standard',
        workerAgentId: 'sui_worker',
        priceSui: '0.035',
        sla: '24h',
        requestedDataLabel: 'public',
      },
      specHash: 'sha256:spec',
      expectedNetwork: 'testnet',
      paymentUri: 'sui:pay?recipient=0xoperator&amountMist=35000000&network=testnet&runId=run_sui',
      paymentKitMode: 'sui_pay_uri_metadata_only',
      paymentKitCompatibility: 'sui:pay-uri-v1',
      expiresAt: '2026-06-20T01:00:00.000Z',
      createdAt: '2026-06-19T01:00:00.000Z',
    },
    receiptPlan: {
      objectType: 'receipter.receipt_plan.v1',
      intentId: 'payment_intent_run_sui',
      paymentNonce: 'payment_nonce_123',
      settlementNonce: 'settlement_nonce_456',
      duplicatePreventionKey: 'testnet:payment_intent_run_sui:payment_nonce_123:settlement_nonce_456',
      amountMist: '35000000',
      amountSui: '0.035',
      coinType: '0x2::sui::SUI',
      receiverAddress: '0xoperator',
      operatorAddress: '0xoperator',
      selectedBidId: 'public_scout_standard',
      workerAgentId: 'sui_worker',
      specHash: 'sha256:spec',
      expectedNetwork: 'testnet',
      paymentUri: 'sui:pay?recipient=0xoperator&amountMist=35000000&network=testnet&runId=run_sui',
      paymentKitMode: 'sui_pay_uri_metadata_only',
      paymentKitCompatibility: 'sui:pay-uri-v1',
      paymentDigest: '0xsui_payment',
      walrusBlobId: 'walrus_blob_123',
      walrusBlobObjectId: '0xwalrus',
      walrusCertifiedEpoch: undefined,
      walrusEndEpoch: 436,
      walrusReadUrl: 'https://aggregator.walrus.testnet.example/v1/blobs/walrus_blob_123',
      anchorDigest: undefined,
      updatedAt: '2026-06-19T01:00:00.000Z',
    },
    reputationSnapshot: undefined,
    workerEvidence: undefined,
  };
}
