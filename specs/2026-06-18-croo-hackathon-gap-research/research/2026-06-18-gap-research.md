# CROO Hackathon Gap Research — Non-validation Ideas

Date: 2026-06-18

## User constraint

The new direction must not be a validation / verification project. The previous delivery-proof direction was removed.

## Sources checked

- CROO Agent Hackathon DoraHacks page: prize pool, tracks, submission requirements.
- CROO website: Agent Protocol, Agent Store, Navigator, Agent Exchange positioning.
- CROO Node SDK README: order negotiation/payment/delivery lifecycle and SDK methods.
- ShipKit CROO BUIDL: CROO-specific developer command center.
- SF Agentic Commerce x402 Hackathon winners and report.
- Adjacent DoraHacks projects: Wispy, NEXUS, MCPay, AgentMarket, AgentFabric, SuperPage, RequestTap, Legasi, Pixie patterns.

## What strong previous/adjacent projects have in common

1. They show an end-to-end commerce workflow, not just chat.
2. They use real or realistic payment/order surfaces.
3. They have a clean demo story: buyer wants something, agent pays/executes, result appears.
4. They often target infrastructure: routers, marketplaces, agent registries, MCP servers, SDKs, DeFi tools.
5. Winners tend to have visible run logs, dashboards, transactions, budgets, and concrete workflows.

## Crowded areas to avoid

### 1. Validation / verification / proof layers

Too many projects lean on receipts, audit trails, proof-of-work, SLA judgement, verification, or dispute packets. The user explicitly rejected this direction.

### 2. Generic agent marketplaces

Many projects claim agent discovery + payment + reputation. It is hard to differentiate unless the marketplace has a very specific demand-side wedge.

### 3. Payment routers / x402 wrappers

RequestTap, AgentMarket, MCPay, and similar projects already cover paid API/tool routing. CROO's own SDK also covers core order lifecycle.

### 4. DeFi/trading agents

Crowded, risky, and demo quality depends on real execution/risk controls. Not the best solo hackathon wedge unless there is a unique dataset or integration.

### 5. SDK scaffolding / CAP conformance

ShipKit is already strong in this exact CROO developer-tooling lane: scaffold, audit, list, E2E harness, CI reports.

## Gap found

The space has lots of **agent supply infrastructure**:

- list agents
- pay agents
- scaffold agents
- register agents
- route to paid APIs
- show payments/reputation

But it has much less **buyer-side work orchestration**:

- How does a non-technical buyer turn an outcome into multiple paid agent jobs?
- How does a buyer compare agent services by budget, SLA, and output fit before ordering?
- How does one agent act as a prime contractor and hire several provider agents?
- How does the buyer see a workroom with all sub-orders, spend, and final deliverable?

CROO hints at this with Navigator and Agent Store, but a hackathon project can demonstrate a concrete app-level wedge on top of the CROO order lifecycle.

## Recommended idea

# AgentCrew

Tagline: **One agent hires the team.**

AgentCrew is a buyer-side project manager for agent commerce. A user gives it an outcome, budget, and deadline. AgentCrew decomposes the job into scoped work packages, selects/hypothesizes provider agents, negotiates/orders work through CROO or mock mode, and assembles the returned outputs into one final deliverable.

It is not validation. It is procurement + orchestration + packaging.

## Concrete first wedge

# LaunchCrew: hire agents to ship a hackathon launch kit

A user says:

> Build my CROO hackathon launch kit for an idea called X. Budget: 1 USDC. Deadline: today.

AgentCrew creates sub-orders:

1. Market Scout Agent — competitor/gap brief.
2. Pitch Writer Agent — 30-sec pitch + DoraHacks description.
3. Demo Script Agent — 2-minute video script.
4. README Agent — submission README skeleton.
5. Landing Copy Agent — hero text + features.

Each sub-order has:

- service id / provider persona
- price
- SLA
- requirements
- expected deliverable type
- order status

Then AgentCrew aggregates outputs into:

- `launch-kit.md`
- `submission.md`
- `demo-script.md`
- dashboard timeline
- spend summary

## Why this fits CROO

CROO wants agent services to become economic units. AgentCrew shows the missing demand-side behavior: one agent can buy other agents' services to complete a bigger job.

It uses CROO's core lifecycle naturally:

1. Create scoped requirement.
2. Negotiate with provider service.
3. Pay order.
4. Receive delivery.
5. Compose final output.

It can run in mock mode and still show the commercial flow. If CROO credentials are available, the same adapter can call `negotiateOrder`, `payOrder`, and `getDelivery`.

## Why it is better than the rejected directions

- Not verification.
- Not another generic marketplace.
- Not a payment-router clone.
- Not ShipKit's developer-tooling lane.
- Not DeFi/trading risk.
- It demonstrates a buyer actually spending through an agent economy.

## Demo story

1. Open AgentCrew dashboard.
2. Enter outcome: "Prepare my CROO hackathon submission for AgentCrew."
3. Set budget: `1 USDC`.
4. Click "Build crew".
5. App decomposes into 5 sub-orders.
6. Mock/CROO lifecycle runs for each provider.
7. Providers deliver outputs.
8. Dashboard shows order statuses and total spend.
9. Final launch kit appears.
10. Pitch: "CROO makes agents commercial. AgentCrew makes them composable."

## MVP scope

Must-have:

- Project brief input.
- Work-package planner.
- Mock CROO order adapter.
- 4-5 provider-agent personas with deterministic local outputs.
- Order timeline and spend summary.
- Final launch-kit assembler.
- CROO SDK adapter skeleton using documented methods.

Should-have:

- Provider selection by price/SLA.
- Budget guardrail: do not create orders beyond budget.
- Retry failed sub-order.
- Export final submission pack.

Do-not-build:

- Real marketplace.
- Complex agent reputation.
- Validation/dispute layer.
- Autonomous real spending without explicit demo controls.
- Broad multi-agent swarm framework.

## Risks

- Might sound like CROO Navigator. Mitigation: frame as a vertical app and A2A buyer workflow, not a generic natural-language order router.
- Mock providers could feel fake. Mitigation: make deterministic useful outputs and show CROO SDK adapter skeleton.
- Too broad. Mitigation: only one vertical: hackathon launch kit.

## Final recommendation

Build **AgentCrew / LaunchCrew**.

It fills the buyer-side gap: turning one intent into a coordinated set of paid agent orders. It is CROO-native, demoable, not validation, and differentiated from ShipKit/payment-router/DeFi projects.
