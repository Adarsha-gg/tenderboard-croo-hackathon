# PRODUCT.md — TenderBoard Agent RFP

## Summary

Build **TenderBoard**, a safe competitive sourcing layer for CROO agent commerce.

Tagline: **Let agents bid without leaking the job.**

TenderBoard lets a buyer or buyer-agent publish a sanitized RFP, receive bids from provider agents, block unsafe or overpriced offers, award a safe bid, and turn the winning bid into a CROO order.

This is not a validator, generic marketplace, payment router, or middleman agent. It is the missing pre-order procurement layer:

```text
buyer intent → sanitized RFP → provider-agent bids → risk/budget filtering → award → CROO order
```

## Problem

CROO and adjacent agent-commerce systems give agents identity, services, payments, order lifecycle, and delivery. But before a buyer pays an agent, the buyer still needs to answer:

1. What exactly can be safely shared publicly?
2. Which provider agents want the job?
3. What will each provider charge?
4. What data access does each provider require?
5. Which bids violate budget or privacy policy?
6. Which bid should become an order?

Direct agent-to-agent hiring has a trap: if the buyer broadcasts full context to every possible provider, malicious agents can exfiltrate sensitive information before any order exists.

TenderBoard solves this by making the RFP itself policy-aware.

## Target users

- Human buyers who want to hire agents safely.
- Buyer agents that need a structured process for sourcing work from other agents.
- Provider agents that want to compete for paid work.
- CROO ecosystem builders who need an app-level demo of agent-to-agent commerce before order creation.

## Core user experience

### Demo scenario: CROO hackathon launch kit

The user enters:

```text
Task: Create a CROO hackathon launch kit for TenderBoard.
Budget: 1 USDC.
Deadline: today.
Private notes: repo is local, do not share .env, wallet keys, or private docs.
Deliverables: pitch, README outline, demo script, submission checklist.
```

TenderBoard converts that into a privacy-labeled RFP:

- public task summary
- max budget
- deadline
- deliverables
- fields available only after award
- fields never shared

Provider agents bid:

1. **PitchWriter** — 0.20 USDC, needs public project summary.
2. **ReadmeAgent** — 0.30 USDC, needs repo tree after award.
3. **DemoScriptAgent** — 0.25 USDC, needs screenshots after award.
4. **OverpricedAgent** — 10 USDC, asks for normal context but exceeds budget.
5. **EvilAgent** — 0.01 USDC, asks for `.env`, wallet key, and private docs.

TenderBoard blocks unsafe bids before award:

```text
OverpricedAgent: blocked — price exceeds max budget.
EvilAgent: blocked — requested NEVER_SHARE data.
```

The buyer awards one or more safe bids. Winning bids become mock/CROO orders. The dashboard shows RFP → bids → risk decisions → award → order lifecycle.

## Behavior invariants

1. TenderBoard must publish only sanitized RFP fields to bidders.
2. Every RFP field must have a privacy label: `PUBLIC`, `PRIVATE_AFTER_AWARD`, `LOCAL_ONLY`, or `NEVER_SHARE`.
3. `LOCAL_ONLY` and `NEVER_SHARE` fields must never be included in bid packets or order requirements.
4. Bids over the buyer's max budget must be blocked.
5. Bids requesting forbidden data must be blocked.
6. Bids requesting more access than the RFP policy allows must be blocked.
7. Bid evaluation must produce explicit reasons, not opaque scores only.
8. Awarding a bid must create a corresponding order record in mock mode.
9. Real CROO spending must not happen automatically in the MVP; real mode must be opt-in via environment/config.
10. The demo must show at least one safe bid accepted, one overpriced bid blocked, and one malicious data-request bid blocked.

## Product scope

### Must-have

- RFP composer with privacy-labeled fields.
- Sanitized bid packet generation.
- Provider-agent bid simulator with at least five deterministic provider personas.
- Bid policy engine:
  - budget cap
  - requested data access
  - secret keyword detection
  - off-platform contact requests
  - bid outlier warnings
- Bid comparison UI.
- Award flow.
- Mock CROO order lifecycle for awarded bids.
- Exportable demo artifact showing RFP, bids, award, and order timeline.
- CROO SDK adapter skeleton using documented methods.

### Should-have

- Multiple awards from one RFP.
- Budget remaining tracker.
- Retry/replace blocked or failed providers.
- Final launch-kit assembler from provider deliveries.
- Provider registry seed file.
- CLI command to run the full demo without the UI.

### Non-goals

- No validation/verification/dispute product.
- No full public marketplace.
- No DeFi/trading agent.
- No autonomous real spending by default.
- No broad live agent discovery in MVP.
- No complex reputation protocol.
- No storing secrets in the app.

## Tracks

Primary:

- **Open — Any A2A Agents**: buyer agents can source work from provider agents.
- **Developer Tooling Agents**: gives CROO builders an RFP/award/order layer.

Secondary:

- **Research & Intelligence Agents**: initial demo can source research/pitch work.
- **Creator & Content Ops Agents**: launch-kit deliverables include pitch, README, demo script, and landing copy.

## Judge-facing pitch

> CROO lets agents sell services. TenderBoard lets buyers safely source those services.

> It is a reverse marketplace for agents: publish a sanitized RFP, let provider agents bid, block unsafe data requests, award the best offer, and turn that award into a CROO order.

## Why this is differentiated

- ShipKit helps developers create/list agents. TenderBoard helps buyers source and award work.
- Payment routers help agents pay APIs/tools. TenderBoard decides which provider should receive the job before payment.
- Generic marketplaces list agents. TenderBoard runs an RFP event with bids, budget policy, and data minimization.
- Validation products inspect delivery. TenderBoard controls pre-order procurement and disclosure.

## Success criteria

- A judge understands the product in under 30 seconds.
- The demo visibly blocks a malicious data-request bid.
- The demo visibly blocks an over-budget bid.
- The demo awards a safe bid and turns it into a mock/CROO order.
- The UI makes sanitized vs private vs never-share data obvious.
- The codebase is modular enough to replace mock providers with real provider-agent integrations later.
- The README explains mock mode, CROO mode, and the security model.

## Open questions

1. Should the MVP award one bid or multiple bids per RFP?
2. Should the final demo output be a hackathon launch kit, a repo task, or a content ops task?
3. Should the first UI be a polished single-page app or CLI-first with a simple dashboard?

Recommendation: award multiple bids for the launch-kit demo, but keep the implementation capable of single-award events.