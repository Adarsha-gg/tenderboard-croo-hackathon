# TenderBoard Issues Log

This file tracks concrete issues encountered during implementation. Do not use it as a task wishlist.

## Open

None.

## Closed

### TB-ISSUE-001 — npm audit reported one low-severity vulnerability

- Found during: Slice 1 dependency install
- Command: `npm install`
- Symptom: npm reported `1 low severity vulnerability`.
- Root cause: `vitest@3` pulled `vite@7.3.5`, which pulled vulnerable `esbuild@0.27.7` on Windows.
- Attempted fix: `npm audit fix` did not resolve it.
- Fix: Upgraded Vitest to current (`4.1.9`), which removed the vulnerable dependency chain.
- Verification: `npm test`, `npm run typecheck`, `npm run demo`, and `npm audit --audit-level=low` all passed; audit reports `found 0 vulnerabilities`.

### TB-ISSUE-002 — CLI public JSON export leaked internal RFP secrets

- Found during: Slice 8 CLI verification
- Command: `grep -RIn "seed phrase alpha beta gamma\|0xdeadbeef\|Internal positioning notes" outputs/launch-kit.md outputs/demo-result.json`
- Symptom: `launch-kit.md` was clean, but `demo-result.json` contained the full internal RFP, including `LOCAL_ONLY` and `NEVER_SHARE` field values.
- Root cause: CLI wrote the internal `LaunchKitDemoResult` directly instead of an export-safe public representation.
- Fix: Added `createPublicDemoExport(result)` and changed CLI to write sanitized bid packet + bids/evaluations/awards/orders/summary, not full internal RFP.
- Verification: Added `tests/demoExport.test.ts`; reran `npm test`, `npm run typecheck`, `npm run demo`, and grep leak check. All passed; output files no longer contain buyer-only secrets.

### TB-ISSUE-003 — Guided app generator failed from nested template literals

- Found during: Slice 13 guided frontend verification
- Command: `npm test` / `npm run typecheck` / `npm run demo`
- Symptom: TypeScript/esbuild parse errors around generated HTML strings in `guidedAppHtml.ts`.
- Root cause: Browser-side JavaScript template literals were embedded inside a TypeScript template literal, so TypeScript parsed the inner backticks as source code.
- Fix: Rewrote `renderGuidedAppHtml` to pre-render step HTML in TypeScript and pass a JSON-serialized `steps` array to simple browser JS. This removes nested template literals from the generated script.
- Verification: `npm test`, `npm run typecheck`, `npm run demo`, leak check, audit, and local server smoke test passed.

### TB-ISSUE-004 — Guided app generator violated exact optional property typing

- Found during: Slice 13 typecheck
- Command: `npm run typecheck`
- Symptom: `exactOptionalPropertyTypes` rejected passing `evaluation: undefined` to a parameter typed as optional `evaluation?`.
- Root cause: Optional properties are not equivalent to explicit `undefined` under `exactOptionalPropertyTypes`.
- Fix: Changed the `bidCard` input type to `evaluation: ... | undefined`.
- Verification: `npm run typecheck` passed.

### TB-ISSUE-005 — Guided frontend was not user-friendly

- Found during: user review after Slice 13
- Symptom: The app used too many buttons, presenter controls, and jargon. It felt like a dashboard/walkthrough artifact, not a simple user-facing product flow.
- Root cause: The frontend optimized for presentation steps instead of a plain one-page product story.
- Fix: Replaced generated `app.html` with `renderSimpleAppHtml(result)`: one page, no step buttons, normal language, clear top-to-bottom flow, visible safe/blocked offers, and final orders.
- Verification: Added `tests/simpleAppHtml.test.ts`; removed guided app generator/tests; ran `npm test`, `npm run typecheck`, `npm run demo`, leak checks, audit, and local server smoke test.

### TB-ISSUE-006 — One-page frontend was still a static poster

- Found during: user review after Slice 14
- Symptom: The page looked better, but the buttons/labels were not a real product flow. It was static HTML, not a working demo.
- Root cause: The app was optimized for readable output instead of interactive behavior.
- Fix: Rebuilt `outputs/app.html` as a small working browser app with JavaScript state. Users can start the demo, create a request, get offers, see bad offers blocked, click `Hire this agent`, and see test orders appear.
- Verification: Added tests that assert clickable controls and click handlers exist; ran `npm test`, `npm run typecheck`, `npm run demo`, leak checks, audit, and local server smoke test.

### TB-ISSUE-007 — Product server did not start on Windows

- Found during: product server smoke test
- Command: `npm start`
- Symptom: the process printed the npm script header and exited; `http://127.0.0.1:4174` refused connections.
- Root cause: the server entrypoint check compared `import.meta.url` to `file://${process.argv[1]}`, which is not reliable for Windows paths under `tsx`.
- Fix: compare `fileURLToPath(import.meta.url)` to `path.resolve(process.argv[1])`.
- Verification: `npm test`, `npm run typecheck`, and a local server/API smoke test passed.

### TB-ISSUE-008 — Receipt JSON could be corrupted by concurrent live events

- Found during: CROO live-runtime SDK-stub integration test.
- Symptom: `RunStore.get()` sometimes failed with `Unexpected non-whitespace character after JSON` while worker/requester events updated the same receipt quickly.
- Root cause: multiple async event handlers could write the same receipt file at the same time using the same temp path.
- Fix: Serialized `RunStore` mutations through an internal promise queue so create/update/append operations run one at a time.
- Verification: Added `tests/crooRuntime.test.ts`; `npm test` and `npm run typecheck` passed.
