# Reference Patterns — TenderBoard

Date: 2026-06-18

## Purpose

Identify what to borrow for TenderBoard without building a clone or copying unsafe/proprietary code.

## Product patterns to borrow

### Fairmarkit

Pattern:

- Intake agent
- Supplier discovery agent
- RFx execution agent
- Autonomous sourcing
- Competitive bidding
- Award recommendations

Borrow for TenderBoard:

- Treat each RFP as a sourcing event.
- Show request → bids → award as the primary workflow.
- Make the UI speak procurement: RFP, bid, award, supplier/provider, budget, SLA.

Do not copy:

- UI assets, product copy, proprietary workflows beyond general concepts.

### Zip

Pattern:

- AI procurement orchestration from intake to pay.
- RFx generation from requirements.
- Vendor evaluation/scoring.
- Risk/approval routing.

Borrow for TenderBoard:

- Intake-to-order positioning.
- Explicit policy/risk gate before purchase.
- Decision reasons and workflow state.

Do not copy:

- UI, brand, proprietary risk models.

### Coupa

Pattern:

- RFx events.
- Reverse auctions.
- Supplier risk/performance included in award decisions.
- Structured, comparable supplier inputs.

Borrow for TenderBoard:

- Structured bid schema so provider-agent responses are comparable.
- Future extension: reverse auction / counter-bids.

Do not build in MVP:

- Complex auction mechanics.
- Enterprise sourcing scenarios.

## Open-source / code-adjacent references

### CROO Node SDK

Use:

- SDK method names and lifecycle semantics.
- `negotiateOrder`, `payOrder`, `getDelivery`, websocket event names.

Borrowing level:

- Direct integration through dependency is acceptable.
- Do not fork or vendor unless necessary.

### ShipKit

Use:

- Mock lifecycle report/timeline pattern.
- Credible CROO SDK surface in examples.
- Developer-friendly demo scripts.

Avoid:

- ShipKit's exact product lane: scaffold/audit/list.
- Copying UI or validator logic.

### google-agentic-commerce/a2a-x402

Use if license permits after checking:

- Functional core / imperative shell approach.
- Clean payment/protocol boundary ideas.
- Agent-to-agent commerce message shape ideas.

Avoid:

- Copying code before verifying license.

## Implementation borrowing rules

1. Borrow architecture patterns aggressively.
2. Copy code only from permissive-license repositories and preserve attribution.
3. Never copy from proprietary products.
4. For uncertain-license hackathon repos, inspect for ideas only.
5. Reimplement small functions like bid scoring, redaction, and mock lifecycle from scratch.

## Best reusable pattern for our code

Functional core, imperative shell:

```text
Pure core:
- sanitizeRfp(rfp)
- evaluateBid(rfp, bid, peerBids)
- selectAwardableBids(evaluations)

Imperative shell:
- JSON storage
- HTTP routes
- mock provider runner
- CROO SDK adapter
- UI
```

This keeps the security-sensitive logic testable and easy to explain.
