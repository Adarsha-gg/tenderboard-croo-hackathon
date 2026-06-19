import type { AddressInfo } from 'node:net';
import { loadTenderBoardConfig } from '../live/config.js';
import { loadDotEnvFile } from '../live/dotenv.js';
import { stableHash } from '../live/hash.js';
import type { LiveRunReceipt, ScoutClaim, ScoutEvidence, SourceObservation, SourceReceipt } from '../live/types.js';
import { createTenderBoardServer } from '../server/httpServer.js';
import { executeSuiX402Payment } from '../sui/paymentExecutor.js';

async function main(): Promise<void> {
  loadDotEnvFile();
  const config = loadTenderBoardConfig();
  if (config.mode !== 'sui') {
    throw new Error('Full live smoke requires TENDERBOARD_MODE=sui.');
  }

  const server = createTenderBoardServer({ config });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const created = await postJson(`${baseUrl}/api/runs`, {
      title: 'Live Sui Walrus full proof smoke',
      instructions: 'Find public Sui Walrus ecosystem links and produce source-backed evidence.',
      acceptanceCriteria: [
        'Every claim must be supported by source receipts.',
        'The run must produce a Walrus evidence blob and Sui receipt anchor.',
      ],
      requestedDataLabel: 'public',
      checkerPack: 'research',
      maxPayment: { amount: '0.050', currency: 'SUI' },
    });

    const receipt = (await (await fetch(`${baseUrl}/api/runs/${created.runId}`)).json()) as LiveRunReceipt;
    const payment = await executeSuiX402Payment(receipt, config);
    const paid = await postJson(`${baseUrl}/api/x402/verify`, payment.payload);
    const evidence = buildDeterministicSourceEvidence(receipt.runId);
    const delivered = await postJson(`${baseUrl}/api/runs/${receipt.runId}/worker-delivery`, {
      deliveryText: renderDeterministicDelivery(receipt, evidence),
      workerEvidence: evidence,
    });
    const stored = await postJson(`${baseUrl}/api/runs/${receipt.runId}/store-evidence`, {});
    const anchored = await postJson(`${baseUrl}/api/runs/${receipt.runId}/anchor-receipt`, {});
    const verified = await (await fetch(`${baseUrl}/api/oracle/records/${receipt.runId}/verify`)).json();

    console.log(
      JSON.stringify(
        {
          objectType: 'suiproof.live_full_smoke.v1',
          ok: Boolean(verified.verified && anchored.status === 'anchored'),
          runId: receipt.runId,
          packageId: config.suiPackageId,
          paymentDigest: payment.digest,
          walrusBlobId: stored.walrusBlobId,
          walrusReadUrl: stored.walrusReadUrl,
          suiAnchorDigest: anchored.suiAnchorDigest,
          memoryId: anchored.memoryRecord?.memoryId,
          memoryHash: anchored.memoryRecord?.memoryHash,
          x402: paid.verification,
          delivery: {
            evidenceHash: delivered.workerEvidence?.evidenceHash,
            claimCount: delivered.workerEvidence?.claims?.length,
            status: delivered.status,
          },
          verification: verified,
        },
        null,
        2,
      ),
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      }),
    );
  }
}

async function postJson(url: string, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

function buildDeterministicSourceEvidence(runId: string, now = new Date()): ScoutEvidence {
  const generatedAt = now.toISOString();
  const query = 'sui walrus verifiable agent memory';
  const sources = [
    {
      title: 'MystenLabs/walrus verifiable storage',
      url: 'https://github.com/MystenLabs/walrus',
      summary: 'Walrus provides verifiable storage for durable data and agent memory artifacts.',
    },
    {
      title: 'MystenLabs/sui programmable transaction blocks',
      url: 'https://github.com/MystenLabs/sui',
      summary: 'Sui provides Move objects and programmable transaction blocks for composable on-chain workflows.',
    },
  ];
  const observations: SourceObservation[] = sources.map((source, index) => {
    const record = {
      full_name: source.title,
      html_url: source.url,
      description: source.summary,
      runId,
    };
    const recordHash = stableHash(record);
    const observationHash = stableHash({
      source: 'github',
      endpoint: source.url,
      query,
      title: source.title,
      url: source.url,
      recordHash,
    });
    return {
      observationId: `source_${index + 1}_${observationHash.slice('sha256:'.length, 'sha256:'.length + 12)}`,
      source: 'github',
      sourceLabel: 'GitHub',
      endpoint: source.url,
      query,
      observedAt: generatedAt,
      title: source.title,
      url: source.url,
      score: undefined,
      publishedAt: generatedAt,
      recordHash,
      record,
    };
  });
  const warnings: string[] = [];
  const sourceReceiptBody = {
    schema: 'tenderboard.source_receipt.v1' as const,
    generatedAt,
    query,
    observations,
    warnings,
  };
  const sourceReceipt: SourceReceipt = {
    ...sourceReceiptBody,
    receiptId: `source_receipt_${stableHash(sourceReceiptBody).slice('sha256:'.length, 'sha256:'.length + 16)}`,
    receiptHash: stableHash(sourceReceiptBody),
  };
  const claims: ScoutClaim[] = observations.map((observation, index) => ({
    claimId: `claim_${index + 1}_${observation.observationId}`,
    resultIndex: index + 1,
    title: observation.title,
    url: observation.url,
    sourceObservationId: observation.observationId,
    statement: `${observation.title} was used as source evidence because ${String(observation.record.description)}`,
  }));
  const evidenceBody = {
    schema: 'tenderboard.scout_evidence.v1' as const,
    generatedAt,
    query,
    sourceReceipt,
    claims,
  };
  return {
    ...evidenceBody,
    evidenceHash: stableHash(evidenceBody),
  };
}

function renderDeterministicDelivery(receipt: LiveRunReceipt, evidence: ScoutEvidence): string {
  const links = evidence.sourceReceipt.observations.map((observation, index) => `${index + 1}. ${observation.title}\n   Link: ${observation.url}`);
  return [
    `WalrusProof worker completed: ${receipt.taskTitle}`,
    '',
    'What I did:',
    '- Received only the Sui-bound safe task text.',
    '- Used structured public source observations for the verifier.',
    '- Produced evidence for a Walrus memory blob and Sui receipt anchor.',
    '',
    'Source-backed links:',
    ...links,
  ].join('\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
