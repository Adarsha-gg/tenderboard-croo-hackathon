# Milestones: Verification as Receipter Moat

Free-form implementation log. Record meaningful phase changes, successful milestones, failed attempts, setbacks, fixes, validation notes, and decisions. Use third-level headings with timestamps down to seconds, for example `### 2026-05-13 14:16:36 - Short milestone title`. No strict schema is required.


### 2026-06-20 12:52:16 - Milestone

Completed research-backed verification moat assessment. Wrote `research/2026-06-20-product-verification-moat-strategy.md` covering agent evals, W3C VC/Data Integrity, SLSA/in-toto, C2PA, Walrus/Sui verification, and local code gaps. Main conclusion: Receipter has a coherent hackathon moat but production moat requires independent Sui RPC event verification, explicit proof levels, wallet-native flows, semantic groundedness/coverage/source-quality checks, and a challenge/slashing loop.

### 2026-06-20 12:55:58 - Milestone

Clarified verification scope: Receipter should not verify only deterministic artifacts. The verifier should separate deterministic cryptographic/storage/chain/payment checks from semantic agent-work checks such as groundedness, coverage, source quality, and acceptance-criteria satisfaction, with proof levels and confidence labels instead of pretending every check is mathematically certain.

### 2026-06-20 13:00:46 - Milestone

Clarified verifier actor model: Walrus stores evidence and Sui anchors compact commitments, but neither automatically recomputes the proof. Verification must be performed by reproducible verifier software run by the marketplace/backend before anchoring, buyers or third-party marketplaces when consuming reputation, and challengers/oracles during disputes. Production direction should expose a public CLI/API/browser verifier that reads Walrus + Sui RPC and recomputes deterministic checks; semantic checks can be signed by named verifier services with rubric/model metadata.

### 2026-06-20 13:02:28 - Milestone

Clarified product positioning: Receipter is best framed as a verifiable reputation data layer for AI agents. It makes reputation inputs and derived numbers auditable from Walrus evidence plus Sui anchors, but should avoid claiming universal truth about agent quality. Deterministic metrics can be recomputed exactly; semantic scores are reproducible policy/evaluator outputs with confidence, source support, and challenge status.

### 2026-06-20 13:03:47 - Milestone

Captured moat clarification: deterministic proof recomputation alone is not a durable moat because competitors can copy a verifier over public Walrus/Sui data. Durable moat would need aggregation of verified work records, default credential schema/protocol adoption, marketplace/agent/wallet integrations, calibrated semantic verifier datasets, challenge/slashing economics, evaluator reputation, and distribution/brand trust. Product claims should distinguish commodity verification primitives from network/protocol/data moats.

### 2026-06-20 13:10:28 - Milestone

User clarified post-hackathon ambition: start with Sui/Walrus for the hackathon, then expand chain-agnostically so economically meaningful agent actions produce blockchain-anchored evidence and contribute to a portable score/reputation layer. Strategic framing updated: avoid literal “every action on-chain”; position as hashed evidence/receipts and verifier outputs anchored across chains, with full action traces stored off-chain/decentralized storage.

### 2026-06-20 13:32:34 - Milestone

Reviewed Synapse competitor repo at commit 9014c34 in a temp clone. Findings: Synapse is a strong Walrus-track competitor with broad Sui/Walrus feature coverage (MemWal tick loop, Walrus artifacts, strategy marketplace, DeepBook treasury agent, Seal, messaging, dev Nautilus attestation, hosted runtime), but its current main has reproducibility issues (`npm test` fails in vault runtime, dashboard `npm ci` fails due lockfile drift, `npm audit` reports vulnerabilities) and strategic weaknesses around self-generated treasury artifacts, dev-enclave/testnet scope, operator/runtime trust, and lack of independent paid-work verification. Competitive response should emphasize Receipter’s narrower but sharper wedge: buyer-paid agent work receipts, independent proof verification, portable reputation/passport, and cleaner validation evidence.
