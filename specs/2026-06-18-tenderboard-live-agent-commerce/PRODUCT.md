# Product Spec: TenderBoard Live Agent Commerce

Figma: none provided

Research used: `research/2026-06-18-product-croo-real-payment-integration.md`

## Summary

TenderBoard must become a working agent-commerce product, not a generated demo page.

A user should open the app, create a real paid task, watch a task-giver agent send that task through CROO, watch a worker agent accept it, pay for it with real CROO payment rails, and see the delivered result come back live.

The product must prove the money path. If a payment happens, the app must show the CROO order id and payment transaction hash.

## Problem

The current TenderBoard build proves the idea with local mock orders. That is not enough for a hackathon product.

The next version must show the real thing:

- a task-giver agent
- a worker agent
- real CROO negotiation
- real payment
- real delivery
- live status updates
- proof that payment happened

## Users

1. **Task giver**: a human or buyer agent that wants work done and is willing to pay a worker agent.
2. **Worker agent operator**: the person running the worker agent/service that accepts paid tasks and delivers output.
3. **Hackathon judge**: someone watching the live flow who needs to see that this is not fake.

## Goals

1. Let a user create a real task from a web app.
2. Run a real task-giver agent that sends the task to CROO.
3. Run a real worker agent that accepts paid work from CROO.
4. Move a real payment through CROO payment rails.
5. Show the live lifecycle in the UI from task creation to delivery.
6. Save a receipt with order id, payment transaction hash, timestamps, and delivery.
7. Keep payments small and controlled so the live run is safe.

## Non-goals

1. Do not build custom smart contracts.
2. Do not bypass CROO payment/order rails.
3. Do not fake tx hashes.
4. Do not call the current mock adapter a completed product.
5. Do not build a generic marketplace.
6. Do not support many worker services in the first live version; one registered worker service is enough.
7. Do not automatically spend unbounded funds.

## Core product flow

1. User opens the TenderBoard web app.
2. User enters:
   - task title
   - task instructions
   - max payment
   - private notes that should not be sent to the worker
3. TenderBoard shows exactly what will be sent to the worker.
4. User clicks **Send real task**.
5. The task-giver agent starts a CROO negotiation with the configured worker service.
6. The worker agent receives the negotiation in real time.
7. The worker agent accepts the negotiation if it is within allowed rules.
8. CROO creates an order.
9. TenderBoard shows the order id.
10. Before payment, TenderBoard shows the payment amount and requires explicit approval.
11. After approval, the task-giver agent calls CROO payment.
12. TenderBoard shows the payment transaction hash.
13. The worker agent sees the paid order.
14. The worker agent creates and sends the work result.
15. CROO marks the order completed.
16. TenderBoard shows the delivered result.
17. TenderBoard saves the full receipt.

## Behavior

1. When the app starts, it must show whether it is in `mock`, `dry-run`, or `live` mode.
2. In `live` mode, the app must show whether CROO API, CROO websocket, requester SDK key, worker SDK key, worker service id, and payment cap are configured.
3. The app must not let the user send a live task until required live settings are present.
4. The app must show the user's task text and the sanitized worker-facing task text before sending anything to CROO.
5. Private notes must never be sent to the worker agent.
6. The task-giver agent must create a CROO negotiation using the configured worker service id.
7. The UI must show the CROO negotiation id after negotiation starts.
8. The worker agent must listen for CROO `NegotiationCreated` events.
9. The worker agent must reject tasks that exceed the configured payment cap or request forbidden private data.
10. The worker agent must accept allowed tasks by calling CROO `acceptNegotiation`.
11. The UI must show the CROO order id after CROO emits or returns order creation.
12. The app must not call `payOrder` until the operator explicitly approves the payment for that specific order.
13. The approval screen must show payment amount, order id, service id, and current mode.
14. The task-giver agent must call CROO `payOrder(orderId)` only after approval.
15. After payment, the UI must show the transaction hash returned by CROO SDK.
16. The worker agent must listen for CROO `OrderPaid` events.
17. The worker agent must deliver a real result by calling CROO `deliverOrder`.
18. The task-giver agent must fetch the delivery using CROO `getDelivery` after `OrderCompleted`.
19. The UI must show live status updates without requiring a page refresh.
20. The UI must show failures plainly: auth failed, insufficient balance, websocket disconnected, payment failed, worker rejected, order expired, delivery failed.
21. Every live run must save a receipt file with mode, task, sanitized task, negotiation id, order id, payment tx hash, delivery, timestamps, and errors if any.
22. Receipts must not include private notes or secrets.
23. The app must support a dry-run mode that exercises the same UI and agent code path without calling `payOrder`.
24. Mock mode is allowed for tests and local development, but the hackathon proof path must be live mode.
25. If CROO credentials or funds are missing, the app must say exactly what is missing instead of silently falling back to mock mode.

## Required product features

### Web app

1. Task form.
2. Sanitized preview.
3. Live status feed.
4. Payment approval panel.
5. Payment receipt panel.
6. Delivery/result panel.
7. Clear mode badge: mock, dry-run, or live.

### Task-giver agent

1. Creates CROO negotiation.
2. Watches CROO events.
3. Pays approved order.
4. Fetches delivery.
5. Emits live status updates to the UI.
6. Writes receipt.

### Worker agent

1. Connects to CROO websocket.
2. Receives incoming negotiations.
3. Checks allowed task rules.
4. Accepts safe jobs.
5. Waits for payment.
6. Produces a real answer.
7. Delivers through CROO.
8. Logs every received negotiation/order/delivery.

### Receipts

Each live run must produce a receipt that a judge can inspect. The receipt must include:

- run id
- mode
- created time
- task title
- sanitized task sent to worker
- CROO service id
- negotiation id
- order id
- payment transaction hash
- final delivery text
- event timeline
- final status

## Real payment rules

1. Use CROO SDK payment rails.
2. Do not write custom payment contracts.
3. Do not send direct wallet transfers outside CROO.
4. Use tiny payment amounts for live runs.
5. Enforce a hard max payment cap in config.
6. Require explicit approval before calling `payOrder`.
7. Show the transaction hash after payment.
8. If balance is missing, show `insufficient balance` and explain that the requester agent AA wallet must be funded.

## Safety rules

1. Never show SDK keys in the UI.
2. Never write SDK keys to receipts.
3. Never send private notes to the worker.
4. Never include wallet seed phrases, private keys, API keys, `.env` values, or passwords in worker-facing task text.
5. Never auto-pay more than the configured cap.
6. Never retry payment automatically after an unknown payment error; require manual review.
7. Duplicate CROO events must not cause duplicate payment or duplicate delivery.

## Success criteria

The product is successful when a live run can show:

1. TenderBoard web app open.
2. Task submitted.
3. CROO negotiation id visible.
4. Worker agent accepts.
5. CROO order id visible.
6. Operator approves payment.
7. CROO payment call returns a transaction hash.
8. Worker agent delivers.
9. UI shows final result.
10. Receipt file contains the full lifecycle without secrets.

## Open questions

1. Do we have CROO Dashboard access and two SDK keys: one requester/task-giver and one worker/provider?
2. Is the worker service already registered in CROO Dashboard, or do we need to register it first?
3. What exact payment token and amount should be used for the first live run?
4. Is the requester agent AA wallet funded on Base with enough USDC/payment token?
5. Are CROO production endpoints reachable from this machine without allowlisting?
