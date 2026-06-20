# Research Report: verification-moat-strategy

Spec: `specs\2026-06-20-verification-moat`
Phase: product
Topic: How can Receipter make verification state-of-the-art and defensible? Research current approaches in agent evaluation, provenance, cryptographic verification, decentralized storage proofs, Sui/Walrus anchoring, verifiable credentials, and reputation/challenge systems. Compare against the current project moat and propose a practical hackathon-to-production verification roadmap.

## Purpose

Turn "verification" from a generic claim into Receipter's central product primitive and moat. The specific questions:

1. What does state-of-the-art verification look like for paid AI-agent work?
2. What parts of the current Receipter implementation are already credible?
3. What is still demo-only or trust-me infrastructure?
4. What is the smallest credible roadmap from hackathon proof to defensible product?

## Method

### Web / standards sources inspected

- Anthropic, **Demystifying evals for AI agents**: agent eval structure, groundedness / coverage / source-quality checks, outcome-vs-transcript grading, calibrated LLM graders, `Unknown` escape hatch, pass@k / pass^k, and ongoing human review.
- W3C, **Verifiable Credentials Data Model 2.0**: issuer-holder-verifier model, credentials as tamper-evident but not automatically truthful, evidence / credentialSchema / status, selective disclosure and privacy guidance.
- W3C, **Verifiable Credential Data Integrity 1.0**: proof purpose, verification method binding, proof sets/chains, context validation, resource integrity, challenge/domain anti-replay, cryptographic agility.
- SLSA / in-toto provenance: attestations should capture subject artifacts, builder identity, parameters, dependencies, run metadata, and enough information for downstream verification or rebuild.
- C2PA Content Credentials explainer: signed provenance manifests with assertions, asset binding, trust lists, and a clear warning that provenance proves origin/history/tamper evidence, not truth.
- Walrus docs: Walrus gives content-addressed, highly available, independently verifiable blob storage; any data change creates a new identifier; Sui integration can make blob availability programmable.
- Sui docs / API reference: Sui JSON-RPC supports transaction block reads suitable for independent event verification.
- in-toto overview: supply-chain integrity is strongest when the system records what steps happened, by whom, and in what order.

### Local project sources inspected

- `receipter/src/live/memoryVerifier.ts`
- `receipter/src/server/httpServer.ts`
- `receipter/src/sui/facilitator.ts`
- `receipter/src/sui/paymentExecutor.ts`
- `receipter/src/sui/anchorExecutor.ts`
- `receipter/src/sui/anchorPlan.ts`
- `receipter/src/live/walrusRuntime.ts`
- `receipter/src/live/agentMemory.ts`
- `receipter/src/live/challengeOracle.ts`
- `receipter/sui/sources/receipter_receipts.move`
- `REAL_INTEGRATION_TODO.md`

No new implementation or tests were run for this report; this is product/technical strategy research backed by source inspection and prior verified smoke-test context.

## Observations

### 1. State-of-the-art verification is layered, not one proof

The strongest pattern across sources is **layered evidence with explicit trust boundaries**:

- Cryptographic provenance says: this artifact came from this signer/process and was not changed.
- Storage/content addressing says: this exact data blob can be fetched and checked.
- Chain anchoring says: a compact commitment and event were finalized by a public state machine.
- Semantic evaluation says: the output actually satisfies the task, with supported claims and explicit uncertainty.
- Social/economic accountability says: bad credentials can be challenged, corrected, slashed, revoked, or discounted.

No single layer is enough. C2PA explicitly says provenance does not prove factual truth. W3C VC makes the same distinction: verification proves authenticity/currency of the credential, while validation is the verifier's business-rule decision. Anthropic's agent-eval guidance covers the missing semantic layer: groundedness, coverage, source quality, outcome checks, calibrated LLM graders, and human review.

### 2. The project already has a good substrate

Receipter is not just hand-wavy. The repo already has several real building blocks:

- Evidence bundle construction in `walrusRuntime.ts` includes run metadata, Sui fields, payment intent, receipt plan, agents, reputation, memory record, privacy labels, verification manifest, delivery text, worker evidence, and events.
- `memoryVerifier.ts` recomputes memory hashes, source receipt hashes, worker evidence hashes, checks claim results, checks Walrus URL binding, and can read back a live Walrus HTTP blob.
- `facilitator.ts` has a real-looking Sui RPC verification path for x402-style payments: it calls `sui_getTransactionBlock`, checks success, balance changes, and expected `PaymentIntentRecorded` event fields.
- `receipter_receipts.move` emits `ReceiptAnchored` and `WorkerReputationUpdated` events with exactly the fields needed for an independent verifier: run id, spec hash, evidence hash, trust score, verdict, checker pack, payment reference, Walrus blob id, nonces, amount, receiver, worker id, reputation counters, etc.
- `challengeOracle.ts` already models verifier failures and weak claims as slashable signals, although its strength is capped by the underlying verifier.

This is enough to pitch a coherent hackathon thesis: paid agent work becomes a portable work-memory credential backed by Walrus evidence and Sui finality.

### 3. The current moat is real but shallow

Current defensible value:

- The product narrative is strong: paid agent work -> evidence -> public receipt -> portable reputation.
- The evidence bundle shape is more complete than a simple "store JSON on IPFS" demo.
- The Sui Move receipt event schema is a good anchor point for independent verification.
- The UI/CLI already expose a proof loop judges can understand.

But current moat is not deep yet:

- Walrus and Sui are public infrastructure; competitors can also store blobs and emit receipt events.
- The current verifier is mostly a local consistency checker. `verifySuiAnchorBinding()` only checks that `suiAnchorDigest` exists and that the local memory proof marks the record anchored; it does not independently query Sui and match the on-chain event.
- `/approve-payment` can still accept a manually supplied `suiPaymentDigest` in live mode, bypassing the stronger x402 facilitator path.
- `/anchor-receipt` can accept a manually supplied `suiAnchorDigest` unless CLI fallback is used; the backend does not yet verify the emitted on-chain receipt before trusting it.
- Semantic verification is basic: it verifies stored claim-result consistency, but not high-quality groundedness against source text with calibrated rubrics.
- Challenge/slashing is conceptually present but only as credible as the verifier checks.

Bluntly: today the moat is the **concept and integration prototype**, not the verification engine. The moat becomes real only if Receipter owns the best verifier, schema, challenge loop, and proof graph for agent work.

### 4. The strongest product primitive is a portable "work credential", not just a receipt

W3C VC and C2PA suggest a useful reframing: Receipter should not merely export "a proof markdown file". It should export a machine-verifiable credential/presentation for a completed work unit.

A strong Receipter credential should include:

- Subject: worker agent / passport object / owner address.
- Issuer(s): buyer/hirer, worker agent, verifier service, optionally independent challenge resolvers.
- Claim: this worker completed task X under acceptance criteria Y, for payment Z, with score/verdict/checker pack C.
- Evidence: Walrus blob id + content hash + read URL + source receipts + worker evidence hash.
- Chain status: Sui transaction digest, package id, registry object id, event type, decoded event fields.
- Validation policy: which checks passed, which were skipped, which are required for each proof level.
- Status/revocation/challenge: whether the claim has been disputed, corrected, slashed, or superseded.

This maps to W3C VC/Data Integrity without requiring full JSON-LD implementation on day one. The important idea is issuer/holder/verifier separation plus signed, versioned, schema-bound credentials.

### 5. A state-of-the-art Receipter verifier should grade both artifact integrity and work quality

Borrowing from Anthropic's agent-eval guidance, verification for agent work should separate:

1. **Outcome checks**: Did the paid task reach the expected final state? For research work, this could mean required facts, output schema, source count, freshness, no unsupported critical claims. For code work, tests/builds. For browser tasks, external state.
2. **Groundedness checks**: Are claims supported by cited observations/source receipts?
3. **Coverage checks**: Did the delivery cover the buyer's required acceptance criteria?
4. **Source-quality checks**: Were sources authoritative enough, current enough, and not just convenient first hits?
5. **Transcript/process checks**: Did the worker use allowed tools, avoid private notes, preserve constraints, and not leak secrets?
6. **Cryptographic/storage/chain checks**: Does every hash, Walrus blob, Sui transaction, emitted event, and passport update bind to the same run?

The verifier should prefer deterministic checks wherever possible, use LLM judges only for semantic dimensions, calibrate judges against human examples, and allow `unknown` instead of forcing false certainty.

## Conclusions

### Current moat assessment

**Hackathon moat: good enough.** Receipter has a credible, demoable wedge: agent work receipts with full evidence on Walrus and compact state on Sui.

**Production moat: not yet.** The current verifier does not independently prove enough. It still trusts local JSON and manually recorded digests too much.

**Potential moat: strong if built as the open verifier layer for agent work.** The defensible position is not "we use Walrus" or "we use Sui". It is:

> Receipter defines the portable proof graph, verifier schema, scoring rubric, and challenge economy for paid agent work credentials.

That becomes hard to copy when it accumulates:

- a canonical credential schema,
- a public verifier CLI/API,
- many verified work records,
- challenge/slashing history,
- trust calibration data,
- evaluator reputation,
- integrations with wallets, agent runtimes, and marketplaces.

### Recommended proof levels

Use explicit levels so the project stops overclaiming:

- **L0 Local receipt**: local JSON hashes recompute; no live storage/chain proof.
- **L1 Walrus-backed**: Walrus blob readback succeeds and content matches receipt/evidence hashes.
- **L2 Sui-anchored**: Sui RPC confirms successful transaction and `ReceiptAnchored` event fields match run id, evidence hash, Walrus blob id, payment reference, nonces, receiver, amount, and package/registry.
- **L3 Source-verified**: deterministic and/or calibrated semantic checks pass for groundedness, coverage, and source quality.
- **L4 Challenge-hardened**: record is past a challenge window or has survived challenges; slashing/correction status is inspectable.

Current live demo can claim L1 for known Walrus readback and partial L2 for transaction existence, but not full L2 until event-field matching is automated in the verifier.

### Smallest high-leverage implementation steps

1. **Add independent Sui anchor verifier.**
   - Query `sui_getTransactionBlock` for `suiAnchorDigest`.
   - Require effects success.
   - Locate `::receipts::ReceiptAnchored` from the configured package.
   - Decode/match `run_id`, `spec_hash`, `evidence_hash`, `payment_reference`, `walrus_blob_id`, `payment_nonce`, `amount_mist`, `receiver`, `settlement_nonce`, and duplicate key.
   - Return a structured check with raw event excerpt.

2. **Wire that verifier into `/api/oracle/records/:id/verify` and `verifyMemoryRecord()`.**
   - Replace local-only `sui_anchor_binding` with `sui_anchor_event_verified`.
   - If RPC/config is missing, mark as `skipped`, not `passed`.

3. **Remove unverified digest acceptance for production mode.**
   - Payment should enter through verified x402 payload or signed wallet result verified through Sui RPC.
   - Anchor should be accepted only after emitted event verification.

4. **Export a verifier package, not only Markdown.**
   - `proof.json`: receipt, evidence bundle hash, Walrus readback result, Sui event proof, verification levels, package/registry ids.
   - `proof.md`: human-readable rendering.
   - `receipter verify proof.json`: independent offline/online verifier.

5. **Make `proof:latest` pick the latest anchored/verifiable run.**
   - Avoid selecting unfinished runs that are not ready to anchor.

6. **Add transparent proof-level badges in UI.**
   - Label L0/L1/L2/L3/L4 honestly.
   - Never show "verified" for skipped Sui/Walrus checks.

7. **Add semantic verifier v1.**
   - Structured claim extraction.
   - Source support checks.
   - Coverage against acceptance criteria.
   - Source quality/freshness checks.
   - LLM judge only where deterministic checks are impossible, with `supported | unsupported | unknown` output.

## Impact on spec or plan

### Product direction

Verification should become the product, not a supporting detail. The user-facing object is a **Receipter Work Credential**:

> A portable, inspectable credential for a completed paid agent job: full evidence on Walrus, finality on Sui, semantic checks attached, and challenge status visible.

### Hackathon positioning

Safe claim:

> Receipter demonstrates the proof loop: paid agent work produces a Walrus evidence bundle and a Sui-anchored receipt that can become portable reputation.

Avoid until fixed:

- "Fully trustless verifier"
- "Production payment settlement"
- "Independent Sui verification" unless the RPC event matching exists
- "Slashing-backed reputation" unless live stake/challenge resolution is wired

### Production roadmap

**Phase 1 — Credible verifier (days):** independent Sui RPC event verifier, proof levels, proof export JSON, anchored-latest selection, manual digest bypass removed.

**Phase 2 — Wallet-native proof loop (1-2 weeks):** wallet/sponsored transaction flows for payment and anchoring; backend verifies events before state updates; passport update event verification.

**Phase 3 — State-of-the-art semantic verification (2-6 weeks):** groundedness/coverage/source-quality graders; calibration set; human review loop; verifier confidence metrics; public verifier CLI/API.

**Phase 4 — Defensible network moat (months):** challenge market, slashing, verifier reputation, schema registry, trust lists, external marketplace integrations, and a growing corpus of verified work credentials.

## Sources / evidence notes

- Anthropic agent-eval guidance supports the need for layered graders, outcome checks, groundedness, coverage, source quality, LLM-judge calibration, `Unknown`, transcript review, and pass@k/pass^k.
- W3C VC 2.0 supports issuer-holder-verifier separation, tamper-evident credentials, credential schemas, evidence, status, selective disclosure, and the distinction between verification and validation.
- W3C Data Integrity supports proof purpose, verification method binding, proof sets/chains, resource integrity, context validation, anti-replay challenge/domain, and crypto agility.
- SLSA/in-toto support using structured attestations for who/what/when/how/dependencies rather than ad hoc proof text.
- C2PA supports signed provenance manifests with assertions and asset binding, while explicitly warning that provenance does not equal truth.
- Walrus docs support content-addressed, independently verifiable, highly available blob storage with Sui programmability.
- Local code shows good evidence/receipt foundations but currently weak independent chain verification.
