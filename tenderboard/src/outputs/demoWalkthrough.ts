import type { LaunchKitDemoResult } from '../workflows/launchKitDemo.js';

export function renderDemoWalkthroughMarkdown(result: LaunchKitDemoResult): string {
  return [
    '# TenderBoard Demo Walkthrough',
    '',
    '## 30-second pitch',
    '',
    'CROO lets agents sell services. TenderBoard lets buyers safely source those services before they pay. It publishes a sanitized RFP, lets provider agents bid, blocks unsafe bids, awards safe providers, and turns awards into CROO-style orders.',
    '',
    '## Demo flow',
    '',
    '### 1. Buyer creates a privacy-labeled RFP',
    '',
    `Task: ${result.rfp.title}`,
    `Budget: ${result.rfp.maxBudget.amount} ${result.rfp.maxBudget.currency}`,
    `Deliverables: ${result.rfp.deliverables.join(', ')}`,
    '',
    'Say: “The important part is that not every field is public. Some context can be shared after award, and secrets are never shared.”',
    '',
    '### 2. TenderBoard publishes only the sanitized bid packet',
    '',
    'Say: “Provider agents do not see the repo internals, local notes, wallet keys, env files, or private strategy. They only see the public scope needed to price the work.”',
    '',
    '### 3. Five provider agents bid',
    '',
    ...result.bids.map((bid) => `- ${bid.providerName}: ${bid.price.amount} ${bid.price.currency}, requests ${bid.requestedData.join(', ')}`),
    '',
    '### 4. TenderBoard blocks bad bids before award',
    '',
    ...result.bids
      .map((bid) => ({ bid, evaluation: result.evaluations.find((evaluation) => evaluation.bidId === bid.id) }))
      .filter((entry) => entry.evaluation?.decision === 'blocked')
      .map((entry) => `- ${entry.bid.providerName}: ${entry.evaluation?.reasons.join('; ')}`),
    '',
    'Say: “This is the buyer firewall. Bad agents can bid, but they do not receive sensitive data or an order.”',
    '',
    '### 5. Safe bids are awarded',
    '',
    ...result.awards.map((award) => `- ${award.providerId} awarded via ${award.id}`),
    '',
    '### 6. Awards become CROO-style orders',
    '',
    ...result.orders.map((entry) => `- ${entry.order.id}: ${entry.order.status}`),
    '',
    'Say: “This is where the award becomes commerce. In mock mode we show the lifecycle; in CROO mode this maps to negotiateOrder, payOrder, and getDelivery.”',
    '',
    '### 7. Final outputs are assembled',
    '',
    'Show `outputs/launch-kit.md` and say: “The buyer ends with a launch kit, but the real product is the safe sourcing flow before the order.”',
    '',
    '## Closing line',
    '',
    'TenderBoard is the RFP and buyer-safety layer for the agent economy: safe scope, competitive bids, policy filtering, and award-to-CROO-order.',
    '',
  ].join('\n');
}

export function renderDemoWalkthroughHtml(result: LaunchKitDemoResult): string {
  const blocked = result.bids
    .map((bid) => ({ bid, evaluation: result.evaluations.find((evaluation) => evaluation.bidId === bid.id) }))
    .filter((entry) => entry.evaluation?.decision === 'blocked');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TenderBoard Demo Walkthrough</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: #070d18; color: #edf4ff; }
    main { max-width: 980px; margin: 0 auto; padding: 32px; }
    h1 { font-size: 42px; margin-bottom: 8px; }
    .subtitle { color: #9fb0c8; font-size: 18px; }
    .step { margin: 22px 0; padding: 22px; border-radius: 18px; background: #101d33; border: 1px solid #253a5a; }
    .step h2 { margin-top: 0; }
    .say { border-left: 4px solid #72ddff; padding: 10px 14px; background: rgba(114,221,255,.08); color: #d9f7ff; }
    .bad { color: #ff9aaa; }
    .good { color: #7dffb2; }
    code { color: #8bd5ff; }
    li { margin: 8px 0; }
    a { color: #72ddff; }
  </style>
</head>
<body>
<main>
  <h1>TenderBoard Demo Walkthrough</h1>
  <p class="subtitle">Safe RFP → provider bids → blocked attackers → awards → CROO-style orders.</p>

  <section class="step">
    <h2>0. Pitch</h2>
    <p class="say">CROO lets agents sell services. TenderBoard lets buyers safely source those services before they pay.</p>
  </section>

  <section class="step">
    <h2>1. Buyer creates a privacy-labeled RFP</h2>
    <ul><li>Task: <code>${escapeHtml(result.rfp.title)}</code></li><li>Budget: <code>${escapeHtml(`${result.rfp.maxBudget.amount} ${result.rfp.maxBudget.currency}`)}</code></li><li>Deliverables: ${escapeHtml(result.rfp.deliverables.join(', '))}</li></ul>
    <p class="say">Not every field is public. Some context can be shared after award, and secrets are never shared.</p>
  </section>

  <section class="step">
    <h2>2. TenderBoard publishes a sanitized bid packet</h2>
    <p>Provider agents only receive public scope, budget, deadline, deliverables, and a warning not to request forbidden data.</p>
    <p class="say">They do not see repo internals, local notes, wallet keys, env files, or private strategy.</p>
  </section>

  <section class="step">
    <h2>3. Provider agents bid</h2>
    <ul>${result.bids.map((bid) => `<li>${escapeHtml(bid.providerName)} — <code>${escapeHtml(`${bid.price.amount} ${bid.price.currency}`)}</code>, requests ${escapeHtml(bid.requestedData.join(', '))}</li>`).join('')}</ul>
  </section>

  <section class="step">
    <h2>4. TenderBoard blocks unsafe bids</h2>
    <ul>${blocked.map((entry) => `<li><span class="bad">${escapeHtml(entry.bid.providerName)}</span>: ${escapeHtml(entry.evaluation?.reasons.join('; ') ?? '')}</li>`).join('')}</ul>
    <p class="say">This is the buyer firewall. Bad agents can bid, but they do not receive sensitive data or an order.</p>
  </section>

  <section class="step">
    <h2>5. Safe bids become awards</h2>
    <ul>${result.awards.map((award) => `<li><span class="good">${escapeHtml(award.providerId)}</span> awarded via <code>${escapeHtml(award.id)}</code></li>`).join('')}</ul>
  </section>

  <section class="step">
    <h2>6. Awards become CROO-style orders</h2>
    <ul>${result.orders.map((entry) => `<li><code>${escapeHtml(entry.order.id)}</code> — ${escapeHtml(entry.order.status)}</li>`).join('')}</ul>
    <p class="say">In mock mode we show the lifecycle; in CROO mode this maps to <code>negotiateOrder</code>, <code>payOrder</code>, and <code>getDelivery</code>.</p>
  </section>

  <section class="step">
    <h2>7. Final artifacts</h2>
    <ul><li><a href="dashboard.html">Dashboard</a></li><li><a href="launch-kit.md">Launch kit markdown</a></li><li><a href="demo-result.json">Public demo JSON</a></li></ul>
    <p class="say">TenderBoard is the RFP and buyer-safety layer for the agent economy.</p>
  </section>
</main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
