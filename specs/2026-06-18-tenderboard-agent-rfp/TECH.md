# TECH.md — TenderBoard Agent RFP

## Current project context

The hackathon project root is:

```text
C:\Users\adars\Coding\hackathon
```

Current files are intentionally minimal:

- `AGENTS.md` — says hackathon work/specs stay in this folder.
- `hackathon.md` — prior CROO hackathon notes and SDK/order-lifecycle summary.
- `specs/2026-06-18-croo-hackathon-gap-research/` — research validating the TenderBoard direction.

There is no implementation yet. Build TenderBoard as a standalone hackathon app under:

```text
C:\Users\adars\Coding\hackathon\tenderboard
```

Do not depend on LifeOS, SceneTwin, or Knowledgebase code.

## Technical goal

Build a modular TypeScript app that demonstrates safe agent-native sourcing:

```text
RFP intake → privacy sanitization → provider bids → policy evaluation → award → mock/CROO order
```

Default demo path must work offline with deterministic mock providers. CROO integration should be an adapter/skeleton that uses the real SDK surface when credentials exist.

## Stack choice

Use TypeScript end-to-end because CROO's Node SDK is TypeScript/JavaScript native.

Recommended stack:

- Runtime: Node 20+
- Package manager: npm unless there is a reason to switch
- API/server: Express or Hono
- UI: Vite + React
- Schema validation: Zod
- Tests: Vitest
- Persistence: JSON files for MVP (`data/*.json`), not a database
- Styling: plain CSS/Tailwind only if setup cost is low

Do not introduce Next.js, auth, database, queues, or blockchain contracts for MVP. They are not needed for a convincing demo. If a later phase needs smart contracts, do not write custom unaudited contracts; use CROO's existing rails or established audited libraries/primitives such as OpenZeppelin, with attribution and minimal glue code.

## Architecture

```text
tenderboard/
├── package.json
├── README.md
├── .env.example
├── data/
│   ├── rfps.json
│   ├── bids.json
│   ├── awards.json
│   ├── orders.json
│   └── events.json
├── src/
│   ├── domain/
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   └── money.ts
│   ├── policy/
│   │   ├── privacy.ts
│   │   ├── bidPolicy.ts
│   │   ├── secretPatterns.ts
│   │   └── outliers.ts
│   ├── providers/
│   │   ├── registry.ts
│   │   ├── mockProviders.ts
│   │   └── providerRunner.ts
│   ├── rfp/
│   │   ├── createRfp.ts
│   │   ├── sanitizeRfp.ts
│   │   └── publishRfp.ts
│   ├── bidding/
│   │   ├── collectBids.ts
│   │   ├── evaluateBids.ts
│   │   └── awardBid.ts
│   ├── orders/
│   │   ├── OrderAdapter.ts
│   │   ├── MockCrooAdapter.ts
│   │   └── CrooSdkAdapter.ts
│   ├── workflows/
│   │   └── launchKitDemo.ts
│   ├── storage/
│   │   ├── jsonStore.ts
│   │   └── eventLog.ts
│   ├── server/
│   │   ├── index.ts
│   │   └── routes.ts
│   ├── web/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── styles.css
│   └── cli/
│       └── demo.ts
└── tests/
    ├── privacy.test.ts
    ├── bidPolicy.test.ts
    ├── mockLifecycle.test.ts
    └── demoWorkflow.test.ts
```

## Core domain model

### Privacy labels

```ts
export type PrivacyLabel =
  | 'PUBLIC'
  | 'PRIVATE_AFTER_AWARD'
  | 'LOCAL_ONLY'
  | 'NEVER_SHARE';
```

Rules:

- `PUBLIC`: can appear in public RFP/bid packet.
- `PRIVATE_AFTER_AWARD`: can be revealed only to awarded provider, if policy allows.
- `LOCAL_ONLY`: can be used by the buyer locally but never sent to provider.
- `NEVER_SHARE`: must never leave the buyer boundary.

### RFP

```ts
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
```

### Sanitized bid packet

This is what bidders see.

```ts
export interface BidPacket {
  rfpId: string;
  title: string;
  maxBudget: Money;
  deadline: string;
  deliverables: string[];
  publicFields: Pick<RfpField, 'key' | 'label' | 'value'>[];
  privateContextAvailableAfterAward: boolean;
  forbiddenDataNotice: string;
}
```

### Bid

```ts
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
```

### Bid evaluation

```ts
export interface BidEvaluation {
  bidId: string;
  decision: 'eligible' | 'blocked' | 'warn';
  riskScore: number;
  reasons: string[];
  flags: Array<{
    code: string;
    severity: 'info' | 'warn' | 'block';
    message: string;
  }>;
}
```

### Award and order

```ts
export interface Award {
  id: string;
  rfpId: string;
  bidId: string;
  providerId: string;
  awardedAt: string;
  orderId?: string;
  status: 'pending_order' | 'ordered' | 'delivered' | 'failed';
}

export interface OrderEvent {
  id: string;
  orderId: string;
  type:
    | 'NegotiationCreated'
    | 'OrderCreated'
    | 'OrderPaid'
    | 'OrderCompleted'
    | 'OrderRejected'
    | 'OrderExpired';
  timestamp: string;
  details: Record<string, unknown>;
}
```

## Critical modules

### `rfp/sanitizeRfp.ts`

Pure function. No IO.

Input: full `Rfp`.
Output: `BidPacket`.

Invariants:

- Include only `PUBLIC` fields.
- Do not include raw values from `PRIVATE_AFTER_AWARD`, `LOCAL_ONLY`, or `NEVER_SHARE`.
- Include only a boolean that private context exists after award.
- Include a clear forbidden-data notice.

### `policy/bidPolicy.ts`

Pure function. No IO.

Input: `Rfp`, `Bid`, optional peer bids for outlier checks.
Output: `BidEvaluation`.

Checks:

1. `price <= rfp.maxBudget`.
2. Requested privacy labels do not include `LOCAL_ONLY` or `NEVER_SHARE`.
3. Requested data names do not match secret patterns.
4. Bid summary does not request off-platform contact.
5. Bid SLA is plausible.
6. Price is not an extreme outlier compared with other bids.
7. Deliverables overlap with requested deliverables.

Blocking flags should be deterministic and easy to explain in the UI.

### `policy/secretPatterns.ts`

Pattern list for obvious sensitive terms:

```text
.env
private key
wallet key
seed phrase
mnemonic
api key
token
password
ssh key
cookie
session
credential
gmail
database dump
```

This is not a complete DLP system. It is a demo-grade procurement firewall.

### `orders/OrderAdapter.ts`

Adapter boundary so the rest of the app does not care whether orders are mock or CROO.

```ts
export interface OrderAdapter {
  createOrderFromAward(input: CreateOrderInput): Promise<CreateOrderResult>;
  payOrder(orderId: string): Promise<PayOrderResult>;
  getDelivery(orderId: string): Promise<DeliveryResult>;
  listEvents(orderId: string): Promise<OrderEvent[]>;
}
```

### `orders/MockCrooAdapter.ts`

Deterministic adapter for the demo.

Flow:

```text
AwardCreated → NegotiationCreated → OrderCreated → OrderPaid → provider delivery → OrderCompleted
```

Must write events to `data/events.json` so UI and CLI show the same timeline.

### `orders/CrooSdkAdapter.ts`

Skeleton using real `@croo-network/sdk` surface.

Required env vars:

```text
CROO_API_URL
CROO_WS_URL
CROO_SDK_KEY
CROO_TARGET_SERVICE_ID
```

Methods should map to documented SDK methods:

- `negotiateOrder(req)`
- `payOrder(orderId)`
- `getDelivery(orderId)`
- event listeners for `OrderCreated`, `OrderPaid`, `OrderCompleted` where practical

Do not make this the default demo path. It should fail closed with a clear message when credentials are missing.

### `providers/mockProviders.ts`

Seed five providers:

1. `pitch_writer` — eligible.
2. `readme_agent` — eligible, requests `PRIVATE_AFTER_AWARD` repo tree.
3. `demo_script_agent` — eligible, requests screenshots after award.
4. `overpriced_agent` — blocked by budget.
5. `evil_agent` — blocked by forbidden data request.

Provider outputs should be deterministic and useful enough for the final launch-kit artifact.

### `workflows/launchKitDemo.ts`

One-command demo orchestration:

1. Create sample RFP.
2. Sanitize and publish bid packet.
3. Collect mock provider bids.
4. Evaluate bids.
5. Award safe bids.
6. Create mock orders.
7. Collect provider deliveries.
8. Assemble `outputs/launch-kit.md`.

## UI requirements

Single-page app is enough.

Main panels:

1. **RFP Composer**
   - task title
   - max budget
   - deadline
   - field table with privacy labels

2. **Sanitized Bid Packet Preview**
   - show exactly what bidders see
   - highlight private fields that are hidden

3. **Bid Board**
   - provider
   - price
   - SLA
   - requested data
   - decision: eligible/warn/blocked
   - reasons

4. **Award + Order Timeline**
   - award selected bids
   - show mock CROO event sequence

5. **Final Output**
   - generated launch kit
   - spend summary
   - blocked-bid summary

Demo must visibly show a malicious bid being blocked.

## API routes

Minimum API:

```text
GET  /api/demo/state
POST /api/demo/reset
POST /api/demo/run
POST /api/rfps
POST /api/rfps/:id/publish
POST /api/rfps/:id/collect-bids
POST /api/rfps/:id/evaluate-bids
POST /api/bids/:id/award
GET  /api/orders/:id/events
GET  /api/outputs/launch-kit
```

For MVP, routes can call synchronous local functions and JSON storage. No background jobs.

## Implementation plan

### Phase 0 — scaffold

- Create `tenderboard/` npm TypeScript project.
- Add Vite React app and simple server.
- Add scripts:
  - `npm run dev`
  - `npm run test`
  - `npm run demo`

Verification:

- `npm install`
- `npm run test`
- `npm run demo`

### Phase 1 — domain and privacy core

- Implement domain types and Zod schemas.
- Implement `sanitizeRfp`.
- Implement privacy-label invariants.
- Add tests for redaction.

Verification:

- Tests prove `LOCAL_ONLY` and `NEVER_SHARE` values never enter `BidPacket`.

### Phase 2 — bid policy engine

- Implement `evaluateBid`.
- Add budget, forbidden data, privacy request, off-platform contact, SLA, outlier, and deliverable-overlap checks.
- Add test fixtures for normal, overpriced, and malicious bids.

Verification:

- Tests prove malicious bid is blocked with explicit reasons.
- Tests prove over-budget bid is blocked.

### Phase 3 — mock providers and RFP workflow

- Add provider registry and deterministic bids.
- Add `launchKitDemo` workflow.
- Add JSON event log and storage.

Verification:

- `npm run demo` prints eligible/blocked bids and writes `outputs/launch-kit.md`.

### Phase 4 — mock CROO order lifecycle

- Implement `OrderAdapter` and `MockCrooAdapter`.
- Awarded bids create mock orders and event timelines.
- Provider delivery is attached to order.

Verification:

- Unit test confirms event order:
  `NegotiationCreated → OrderCreated → OrderPaid → OrderCompleted`.

### Phase 5 — dashboard

- Implement single-page UI.
- Display RFP, sanitized packet, bids, award, timeline, output.
- Add reset/run demo buttons.

Verification:

- Run locally and manually confirm demo story fits in 2 minutes.

### Phase 6 — CROO adapter skeleton

- Add `@croo-network/sdk` dependency only if needed for adapter build.
- Implement guarded `CrooSdkAdapter`.
- Add `.env.example` and README docs.

Verification:

- If env missing, adapter returns clear error and mock mode still works.
- If dependency is unavailable, keep skeleton isolated so the app still builds in mock mode.

### Phase 7 — demo polish

- Write README.
- Write DoraHacks submission copy.
- Write demo script.
- Add screenshots or CLI output examples.

Verification:

- Fresh clone path documented.
- Demo can be run without CROO credentials.

## Reference projects and code borrowing

Use these as pattern sources, not blind copy targets.

### Safe to borrow patterns from

- **CROO Node SDK** — MIT. Use documented SDK method shapes and event names.
- **ShipKit** — MIT per public page. Borrow the idea of a mock lifecycle timeline and reports, but do not clone its scaffold/audit/list product lane.
- **google-agentic-commerce/a2a-x402** — use protocol/interface ideas if license permits after checking. Borrow functional-core/imperative-shell style, not source blindly.

### Product patterns only, not code

- **Fairmarkit** — autonomous sourcing/RFx product pattern.
- **Zip** — intake-to-sourcing orchestration, RFx generation, supplier risk, approval flow.
- **Coupa** — RFx/reverse auction/supplier risk concepts.

These are proprietary products. Do not copy source or UI assets.

### Hard rule

Do not copy code from repos without a permissive license. If code is MIT/Apache/BSD, preserve attribution where copied. Prefer reimplementing small patterns from scratch.

## Things worth noting

1. **The product can easily collapse into a generic marketplace. Do not let it.** Keep the demo centered on RFP, bids, policy, award, order.
2. **The security value is pre-order data minimization.** Do not claim to verify delivered work.
3. **Real payments are dangerous in a hackathon demo.** Mock mode first; real CROO mode opt-in only.
4. **Do not build real provider discovery.** Seed provider personas are enough; the key behavior is bid competition and filtering.
5. **Make risk decisions explainable.** Judges should see exact blocked reasons.
6. **CROO integration should be credible, not blocking.** Use real method names and env docs; mock lifecycle should carry the demo.
7. **Keep modules pure where possible.** Sanitization and policy should be pure functions with tests. IO belongs in adapters/storage.
8. **If time gets tight, prioritize CLI/demo workflow over UI polish.** A working deterministic demo beats a pretty incomplete UI.

## Validation checklist

- `sanitizeRfp` never leaks private or forbidden fields.
- Over-budget bid is blocked.
- Malicious secret-request bid is blocked.
- Safe bid is eligible.
- Award creates order.
- Mock order reaches completed state.
- Dashboard displays blocked reasons.
- `npm run demo` works from clean local state.
- README clearly explains mock vs CROO mode.