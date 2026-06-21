# Receipter Flow Demo Strategy

## Position

Receipter is a verification layer for paid agent work. It turns an agent task into a work order, payment gate, evidence packet, durable memory record, and reputation update that future agents and buyers can inspect.

Use this framing:

```text
Receipter gives AI workers portable proof of work.
Every task gets paid, checked, stored, anchored, and remembered.
```

Do not position Receipter as a generic agent marketplace, memory SDK, or review site. The wedge is narrower and stronger: evidence-backed trust for agent labor.

## Market Wedge

Buyers already trust marketplaces through receipts:

- G2 and TrustRadius: verified buyer reviews reduce anonymous praise.
- Upwork: paid work history and job success make freelancers easier to hire.
- SOC 2: evidence-backed controls over time create institutional trust.
- MeatLayer: AI/human task routing needs a trust layer between intent and execution.
- Tool receipts, AgentReputation, and inter-agent trust research: future agents need proof, constraints, stake, and reputation rather than vibes.

Receipter applies those patterns to AI workers. It asks: before one agent hires another, what proof does the buyer receive, and what memory follows the worker into the next job?

## Buyer

Primary buyer for the demo:

```text
An operator or agent platform that wants to delegate paid research, sourcing, or execution tasks to worker agents without accepting unaudited output.
```

Buyer pain:

- Agent output is cheap, but verification is expensive.
- Prior agent performance is trapped in app logs or chat history.
- Payment, evidence, memory, and reputation are usually disconnected.
- Buyers need a reason to trust a worker before dispatch and a reason to settle after delivery.

Receipter promise:

```text
Hire the agent with a passport, pay only through a bound work order, admit only source-backed evidence, and reuse the memory on the next route.
```

## Competitive Contrast

Use contrasts that are easy to scan in UI copy:

| Category | What buyers get | Receipter contrast |
| --- | --- | --- |
| Review platforms | Verified human opinions | Receipter verifies agent work artifacts, not just ratings. |
| Freelance marketplaces | Paid work history | Receipter gives agents portable work history with source receipts and anchors. |
| SOC 2/audit tools | Evidence over time | Receipter applies evidence-backed controls to task-level agent execution. |
| Agent memory tools | Better context recall | Receipter stores admissible work memory after verification. |
| RAG/vector DBs | Searchable context | Receipter adds payment, claim binding, Walrus storage, Sui finality, and stake. |
| Generic agent marketplaces | Discovery and routing | Receipter makes routing depend on prior verified work. |

Short line:

```text
Memory tells an agent what happened. Receipter proves whether the work should count.
```

## Trust Model

Receipter should feel like an evidence pipeline:

1. Scope: buyer writes task, private notes, acceptance criteria, and max SUI.
2. Sanitize: private notes and secret-looking lines are stripped from the worker packet.
3. Route: worker is scored against prior Walrus-backed memory.
4. Pay: Sui/x402-style payment unlocks the exact worker task.
5. Deliver: worker submits source-backed evidence.
6. Verify: claims are checked against source receipts and blockers.
7. Store: full memory bundle is written to Walrus.
8. Anchor: compact proof is recorded on Sui.
9. Remember: AgentPassport updates only after the receipt anchor is recorded.

The frontend should show these as gates, not generic status updates.

## Demo Narrative

### Act 1: The Problem

Opening message:

```text
Agents can hire other agents, but they need receipts before trust scales.
```

Show the operator creating a research or sourcing task. Emphasize acceptance criteria, payment cap, and private notes.

### Act 2: The Safe Handoff

Show the sanitized worker packet and trust route score.

Copy:

```text
Private buyer context stays local. The worker sees only the safe packet and the paid work order.
```

### Act 3: Payment-Bound Work

Show HTTP 402 / Sui payment challenge, payment verification, and unlock.

Copy:

```text
The worker cannot access the task until the Sui payment is bound to this resource, worker, amount, and nonce.
```

### Act 4: Evidence Admission

Show claims, source receipts, blocker ids, admissibility, and settlement eligibility.

Copy:

```text
Delivery is not enough. Claims must bind back to source evidence before the work can settle.
```

### Act 5: Portable Reputation

Show Walrus blob, Sui anchor, memory hash, AgentPassport update, and future routing impact.

Copy:

```text
The completed job becomes portable worker memory. Future buyers route using evidence, not reputation theater.
```

## Frontend Copy Bank

Hero:

```text
Verified work memory for AI agents.
```

Subhead:

```text
Receipter turns paid agent tasks into source-backed receipts, Walrus memory, Sui anchors, and worker passports.
```

Primary CTA:

```text
Create work order
```

Secondary CTA:

```text
Inspect passport
```

Gate labels:

- Safe packet
- Trust route
- Sui payment
- Worker delivery
- Evidence check
- Walrus memory
- Sui anchor
- Passport update

Proof labels:

- Source-bound claims
- Settlement eligible
- Reputation eligible
- Replay protected
- Walrus readback passed
- Sui anchor binding passed

Empty state:

```text
No verified work memory yet. Complete a paid task to create the first receipt.
```

Warning state:

```text
This delivery has evidence blockers. Settlement and reputation update are paused.
```

Success state:

```text
Receipt anchored. Worker passport now carries this verified memory into future routing.
```

## What To Avoid

- Do not say Receipter replaces Upwork, G2, SOC 2, or memory SDKs.
- Do not imply mainnet anchoring until the deployment exists.
- Do not describe delivery text as verified unless claims are source-bound.
- Do not call Walrus a backup store; it is the durable memory substrate.
- Do not make reputation sound like a star rating. It is derived from admitted receipts, anchors, and stake.

## One-Sentence Pitch

```text
Receipter is the trust layer for agent-to-agent work: paid tasks become verified receipts, durable memory, and portable reputation.
```
