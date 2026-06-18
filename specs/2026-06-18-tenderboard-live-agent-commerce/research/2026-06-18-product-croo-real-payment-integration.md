# Research: CROO Real Payment Integration

Purpose: identify what TenderBoard needs to become a real product with a task-giver agent, worker agent, live status, and actual CROO payments.

## Sources checked

1. Local hackathon notes: `C:/Users/adars/Coding/hackathon/hackathon.md`
2. Local existing TenderBoard specs and implementation under `C:/Users/adars/Coding/hackathon/specs/2026-06-18-tenderboard-agent-rfp` and `tenderboard/`
3. npm package metadata:
   - Command: `npm view @croo-network/sdk version description repository homepage dist-tags --json`
   - Result: latest version `0.2.1`, package description `Node.js SDK for Croo — AI agent marketplace on Base`, repository `https://github.com/CROO-Network/node-sdk`
4. Public GitHub README fetched from `https://github.com/CROO-Network/node-sdk`

## Verified SDK facts

The Node SDK is `@croo-network/sdk`.

Install:

```bash
npm install @croo-network/sdk
```

The SDK requires Node.js 18+.

The README says `AgentClient` is the runtime client. It authenticates with an SDK key from the CROO Dashboard.

Constructor shape from README:

```ts
import { AgentClient } from '@croo-network/sdk';

const client = new AgentClient({
  baseURL: process.env.CROO_API_URL!,
  wsURL: process.env.CROO_WS_URL!,
}, process.env.CROO_SDK_KEY!);
```

Default/configured network facts from README:

```ts
const config = {
  baseURL: 'https://api.croo.network',
  wsURL: 'wss://api.croo.network/ws',
  rpcURL: 'https://mainnet.base.org', // optional, defaults to Base mainnet
};
```

Environment variables documented by CROO:

| Variable | Meaning |
| --- | --- |
| `CROO_API_URL` | API base URL, e.g. `https://api.croo.network` |
| `CROO_WS_URL` | WebSocket URL, e.g. `wss://api.croo.network/ws` |
| `CROO_SDK_KEY` | SDK key in `croo_sk_...` format |
| `CROO_TARGET_SERVICE_ID` | service id negotiated by requester |
| `BASE_RPC_URL` | optional custom JSON-RPC endpoint; defaults to `https://mainnet.base.org` |

Important payment requirement from README:

> Before making payments, deposit payment tokens such as USDC to the agent's AA wallet address visible in the Dashboard, not the controller address. The SDK checks the agent wallet balance before sending transactions.

## Verified order lifecycle

Requester side:

1. Connect websocket.
2. On `EventType.OrderCreated`, call `payOrder(orderId)`.
3. `payOrder` returns an object with `txHash` in README example.
4. On `EventType.OrderCompleted`, call `getDelivery(orderId)`.
5. Start by calling `negotiateOrder({ serviceId, requirements })`.

Provider side:

1. Connect websocket.
2. On `EventType.NegotiationCreated`, call `acceptNegotiation(negotiationId)`.
3. On `EventType.OrderPaid`, call `deliverOrder(orderId, { deliverableType: DeliverableType.Text, deliverableText })`.

Event types documented by SDK:

- `EventType.NegotiationCreated`
- `EventType.NegotiationRejected`
- `EventType.NegotiationExpired`
- `EventType.OrderCreated`
- `EventType.OrderPaid`
- `EventType.OrderCompleted`
- `EventType.OrderRejected`
- `EventType.OrderExpired`

Methods documented by SDK:

- `negotiateOrder(req)`
- `acceptNegotiation(negotiationId)`
- `acceptNegotiationWithFundAddress(negotiationId, providerFundAddress)`
- `rejectNegotiation(negotiationId, reason)`
- `getNegotiation(negotiationId)`
- `listNegotiations(opts?)`
- `payOrder(orderId)`
- `deliverOrder(orderId, req)`
- `rejectOrder(orderId, reason)`
- `getOrder(orderId)`
- `listOrders(opts?)`
- `getDelivery(orderId)`
- `uploadFile(fileName, body)`
- `getDownloadURL(objectKey)`
- `connectWebSocket()`

Delivery types documented:

- `DeliverableType.Text`
- `DeliverableType.Schema`

Error helpers documented:

- `APIError`
- `isNotFound`
- `isUnauthorized`
- `isInvalidParams`
- `isInvalidStatus`
- `isForbidden`
- `isInsufficientBalance`

## Product implications

TenderBoard Live can be a real product if it has at least two live agent processes:

1. **Task-giver agent**
   - Creates a job from the UI.
   - Sends a CROO negotiation to a real service id.
   - Pays the order only after the provider accepts and CROO emits `OrderCreated`.
   - Shows the returned transaction hash.
   - Waits for `OrderCompleted` and fetches delivery.

2. **Worker agent**
   - Owns a CROO Dashboard service id.
   - Listens for negotiations.
   - Accepts a job only if it matches allowed task rules and price limits.
   - Waits for `OrderPaid`.
   - Produces a real output.
   - Calls `deliverOrder`.

3. **Live UI**
   - Shows every event as it happens.
   - Shows negotiation id, order id, payment transaction hash, delivery text, and errors.
   - Does not hide real payment failures.

## Blockers before actual live money run

These are not theoretical; they are required to run real payments:

1. CROO Dashboard access.
2. Requester/task-giver SDK key.
3. Worker/provider SDK key.
4. Registered worker service id.
5. Requester agent AA wallet address from CROO Dashboard.
6. USDC or supported payment token funded into the requester agent AA wallet.
7. Network confirmation that CROO production endpoints are live and reachable.
8. A spending cap and explicit operator approval before calling `payOrder`, because `payOrder` moves real funds.
9. A way to record `txHash`, order id, timestamps, and delivery for the hackathon proof.

## Spec decisions from this research

- Use the real `@croo-network/sdk` lifecycle as the target, not a custom contract.
- Use CROO/SDK payment rails only; do not write custom unaudited smart contracts.
- Treat mock mode as development/test only. The live product path must call CROO SDK methods and show tx hashes.
- Keep payment amounts tiny for live runs and enforce a hard max payment cap.
- Require explicit confirmation before any real payment call in this agent harness.
- Build both sides: task-giver and worker. A product that only calls a mock provider is not enough.
- Build real-time status around CROO websocket events and app-side Server-Sent Events/WebSocket events.

## Unknowns to resolve during implementation

1. Exact Dashboard setup steps are outside the SDK README and must be performed manually or with current Dashboard docs.
2. The exact payment token and denomination accepted by the registered service must be confirmed from CROO Dashboard/runtime data.
3. The exact shape of SDK response types should be verified by installing `@croo-network/sdk@0.2.1` and reading its TypeScript declarations before coding the live adapter.
4. If CROO endpoints require allowlisting or hackathon credentials, implementation cannot complete live payment validation until credentials are available.
