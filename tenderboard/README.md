# TenderBoard

Safe competitive sourcing for CROO agent commerce.

> Let agents bid without leaking the job.

TenderBoard demonstrates an agent-native RFP flow:

```text
buyer intent → sanitized RFP → provider-agent bids → policy filtering → award → CROO/mock order
```

It is not a validator, generic marketplace, payment router, or DeFi agent. It is the pre-order procurement layer for agent commerce.

## Product server

Run the actual local product app:

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:4174
```

The app is backed by API routes, saves run receipts under `data/runs`, and has a live event feed. Mock mode does not send real CROO payments.

Live mode now uses the real `@croo-network/sdk` runtime path with two SDK clients: requester/task-giver and worker/provider. It connects CROO websockets, creates negotiations, accepts worker negotiations, calls `payOrder` after approval, delivers after `OrderPaid`, and fetches delivery after `OrderCompleted`.

## Generated demo artifacts

```bash
npm test
npm run typecheck
npm run demo
```

The demo writes:

```text
outputs/app.html
outputs/launch-kit.md
outputs/demo-result.json
```

Open `outputs/app.html` only as a static artifact. The product app is `npm start` at `http://127.0.0.1:4174`.

Expected summary:

```text
Bids: 5
Eligible: 3
Blocked: 2
Awarded: 3
Completed mock CROO orders: 3
```

## What the demo proves

- Buyer creates a privacy-labeled RFP.
- Provider agents receive only sanitized public context.
- Three provider agents submit safe bids.
- One provider is blocked for exceeding budget.
- One provider is blocked for requesting secrets/private data.
- Safe bids become mock CROO orders.
- Generated public outputs do not contain buyer-only RFP secrets.

## Privacy labels

Every RFP field has one label:

| Label | Meaning |
| --- | --- |
| `PUBLIC` | Included in provider-agent bid packets. |
| `PRIVATE_AFTER_AWARD` | Hidden from bidders; may be disclosed only after award if policy allows. |
| `LOCAL_ONLY` | Buyer-local context. Never sent to providers. |
| `NEVER_SHARE` | Secrets/credentials/private docs. Never sent to providers or orders. |

## Mock providers

The seeded provider agents are deterministic:

| Provider | Expected result |
| --- | --- |
| `PitchWriter` | Eligible |
| `ReadmeAgent` | Eligible |
| `DemoScriptAgent` | Eligible |
| `OverpricedAgent` | Blocked: over budget |
| `EvilAgent` | Blocked: requests forbidden data/secrets |

## CROO mode

Mock mode is the default. CROO mode is intentionally opt-in.

Copy env template:

```bash
cp .env.example .env
```

Required live vars:

```text
TENDERBOARD_MODE=live
CROO_API_URL
CROO_WS_URL
CROO_REQUESTER_SDK_KEY
CROO_WORKER_SDK_KEY
CROO_WORKER_SERVICE_ID
TENDERBOARD_MAX_PAYMENT_USDC
```

The adapter skeleton is in:

```text
src/orders/CrooSdkAdapter.ts
```

It maps awards to the documented CROO SDK flow:

```text
negotiateOrder → payOrder → getDelivery
```

If live env vars or funds are missing, the product fails closed with a clear error. Real payment calls are not faked.

Before live payment:

1. Create/register the worker service in CROO Dashboard.
2. Put requester and worker SDK keys in local `.env` or shell env.
3. Fund the requester agent AA wallet shown in CROO Dashboard with the required payment token.
4. Set a tiny `TENDERBOARD_MAX_PAYMENT_USDC`.
5. For one-process live demo, set `TENDERBOARD_EMBED_WORKER=true` and run `npm start`.
6. For separate task-giver/worker terminals, set `TENDERBOARD_EMBED_WORKER=false`, run `npm run worker` in one terminal, then run `npm start` in another.
7. Approve payment only after the UI shows the real CROO order id.

The live code path is in:

```text
src/live/crooRuntime.ts
src/agents/workerAgent.ts
```

The SDK-stub integration test is:

```text
tests/crooRuntime.test.ts
```

## Smart contract rule

TenderBoard does not write custom smart contracts. If contracts are ever needed, use CROO rails or audited primitives/libraries such as OpenZeppelin. No unaudited custom escrow/payment contracts.

## Development

```bash
npm test
npm run typecheck
npm run demo
```

Current test coverage includes:

- RFP sanitization
- bid policy blocking
- mock provider bid collection
- award rules
- mock CROO lifecycle
- end-to-end launch-kit workflow
- public export redaction
- CROO adapter fail-closed behavior

## Known issues

See `ISSUES.md`.
