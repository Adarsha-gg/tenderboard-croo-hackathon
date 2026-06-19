/**
 * Seed verifiable agent work-memory by driving the real product loop over HTTP.
 *
 * For each task it: creates a Sui work order, approves the SUI payment,
 * runs the worker delivery, stores the evidence bundle on Walrus, and anchors
 * the compact receipt on Sui. The result populates the Walrus memory index and
 * per-worker memory passports with real records.
 *
 * Usage:
 *   npm run seed:memory                 # against http://127.0.0.1:4174
 *   BASE_URL=http://127.0.0.1:4174 npm run seed:memory
 */

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4174').replace(/\/+$/, '');

interface SeedTask {
  title: string;
  instructions: string;
  acceptanceCriteria: string[];
  privateNotes?: string;
  checkerPack: 'research' | 'code' | 'commerce';
  requestedDataLabel: 'public' | 'buyer_private' | 'secret';
  amount: string;
  preferredBidId: string;
}

const SEED_TASKS: SeedTask[] = [
  {
    title: 'Find AI agent hackathons and builder programs',
    instructions:
      'Search public sources for active AI agent hackathons, grants, and builder programs. Return the strongest opportunities with links and a short recommendation.',
    acceptanceCriteria: [
      'Return at least 5 public-source opportunities with links.',
      'Flag deadline, sponsor, and fit when visible.',
      'End with a ranked recommendation and why.',
    ],
    privateNotes: 'Internal angle: prioritize Walrus, Sui, and verifiable memory. Do not expose this field.',
    checkerPack: 'research',
    requestedDataLabel: 'public',
    amount: '0.050',
    preferredBidId: 'public_scout_standard',
  },
  {
    title: 'Scout decentralized storage and data-availability projects',
    instructions:
      'Find high-signal projects and discussions on decentralized storage, blob storage, and verifiable data availability. Return links and why each matters.',
    acceptanceCriteria: [
      'Return at least 5 source-backed items with links.',
      'Note the angle relevant to agent memory when visible.',
      'End with a ranked recommendation.',
    ],
    checkerPack: 'research',
    requestedDataLabel: 'public',
    amount: '0.050',
    preferredBidId: 'public_scout_deep',
  },
  {
    title: 'Track open-source agent-memory frameworks',
    instructions:
      'Survey active open-source agent memory frameworks and recent releases. Return repositories and notable threads with links and short notes.',
    acceptanceCriteria: [
      'Return at least 5 repositories or threads with links.',
      'Note stars, recency, or traction when visible.',
      'End with a ranked recommendation.',
    ],
    checkerPack: 'research',
    requestedDataLabel: 'public',
    amount: '0.050',
    preferredBidId: 'public_scout_lite',
  },
  {
    title: 'Monitor verifiable-compute and proof tooling',
    instructions:
      'Find recent work on verifiable compute, proofs, and on-chain attestation tooling relevant to agent workflows. Return links and why each matters.',
    acceptanceCriteria: [
      'Return at least 5 source-backed items with links.',
      'Flag the relevance to agent settlement or proof when visible.',
      'End with a ranked recommendation.',
    ],
    checkerPack: 'research',
    requestedDataLabel: 'public',
    amount: '0.050',
    preferredBidId: 'public_scout_deep',
  },
  {
    title: 'Find Sui ecosystem builder opportunities',
    instructions:
      'Search public sources for Sui ecosystem grants, hackathons, and builder programs. Return the strongest opportunities with links and recommendations.',
    acceptanceCriteria: [
      'Return at least 5 public-source opportunities with links.',
      'Flag deadline and funding when visible.',
      'End with a ranked recommendation.',
    ],
    checkerPack: 'research',
    requestedDataLabel: 'public',
    amount: '0.050',
    preferredBidId: 'public_scout_standard',
  },
  {
    title: 'Survey AI agent payment and settlement rails',
    instructions:
      'Find current work on agent payments, x402, and on-chain settlement for autonomous agents. Return links and why each matters.',
    acceptanceCriteria: [
      'Return at least 5 source-backed items with links.',
      'Note the settlement or payment angle when visible.',
      'End with a ranked recommendation.',
    ],
    checkerPack: 'research',
    requestedDataLabel: 'public',
    amount: '0.050',
    preferredBidId: 'public_scout_lite',
  },
];

async function api<T = unknown>(method: string, pathName: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${pathName}`, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${pathName} failed (${response.status}): ${text.slice(0, 300)}`);
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function seedOne(task: SeedTask, index: number): Promise<void> {
  const label = `[${index + 1}/${SEED_TASKS.length}] ${task.title}`;
  const created = await api<{ runId: string }>('POST', '/api/runs', {
    title: task.title,
    instructions: task.instructions,
    acceptanceCriteria: task.acceptanceCriteria,
    privateNotes: task.privateNotes,
    checkerPack: task.checkerPack,
    requestedDataLabel: task.requestedDataLabel,
    preferredBidId: task.preferredBidId,
    maxPayment: { amount: task.amount, currency: 'SUI' },
  });
  const runId = created.runId;

  await api('POST', `/api/runs/${runId}/approve-payment`, {});
  await api('POST', `/api/runs/${runId}/worker-delivery`, {});
  await api('POST', `/api/runs/${runId}/store-evidence`, {});
  const anchored = await api<{ workerAgentId?: string; walrusBlobId?: string; suiAnchorDigest?: string }>(
    'POST',
    `/api/runs/${runId}/anchor-receipt`,
    {},
  );

  console.log(
    `${label}\n   worker=${anchored.workerAgentId ?? 'n/a'} blob=${anchored.walrusBlobId ?? 'n/a'} anchor=${
      anchored.suiAnchorDigest ?? 'n/a'
    }`,
  );
}

async function main(): Promise<void> {
  console.log(`Seeding verifiable agent memory against ${BASE_URL}\n`);
  for (let index = 0; index < SEED_TASKS.length; index += 1) {
    try {
      await seedOne(SEED_TASKS[index]!, index);
    } catch (error) {
      console.error(`   failed: ${(error as Error).message}`);
    }
  }

  const index = await api<{ workerCount: number; totalMemoryRecords: number; walrusBackedRecords: number; suiAnchoredRecords: number }>(
    'GET',
    '/api/walrus/memory',
  );
  console.log(
    `\nWalrus memory index: workers=${index.workerCount} records=${index.totalMemoryRecords} walrusBacked=${index.walrusBackedRecords} suiAnchored=${index.suiAnchoredRecords}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
