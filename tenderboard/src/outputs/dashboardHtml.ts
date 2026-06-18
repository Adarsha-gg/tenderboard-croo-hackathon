import type { LaunchKitDemoResult } from '../workflows/launchKitDemo.js';

export function renderDashboardHtml(result: LaunchKitDemoResult): string {
  const rows = result.bids
    .map((bid) => {
      const evaluation = result.evaluations.find((candidate) => candidate.bidId === bid.id);
      const decision = evaluation?.decision ?? 'missing';
      const reasons = evaluation?.reasons.join('; ') || 'No policy flags';
      return `<tr class="${escapeHtml(decision)}"><td>${escapeHtml(bid.providerName)}</td><td>${escapeHtml(`${bid.price.amount} ${bid.price.currency}`)}</td><td>${escapeHtml(`${bid.slaMinutes} min`)}</td><td>${escapeHtml(bid.requestedData.join(', '))}</td><td>${escapeHtml(decision)}</td><td>${escapeHtml(reasons)}</td></tr>`;
    })
    .join('\n');

  const orderCards = result.orders
    .map(
      ({ award, order }) => `<li><strong>${escapeHtml(award.providerId)}</strong> → ${escapeHtml(order.id)} <span class="pill ok">${escapeHtml(order.status)}</span></li>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TenderBoard Demo Dashboard</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: #08111f; color: #e6edf7; }
    main { max-width: 1120px; margin: 0 auto; padding: 32px; }
    h1 { font-size: 40px; margin: 0 0 8px; }
    h2 { margin-top: 32px; }
    .subtitle { color: #9fb0c8; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
    .card { background: #101d33; border: 1px solid #243854; border-radius: 16px; padding: 16px; }
    .metric { font-size: 28px; font-weight: 800; }
    .label { color: #9fb0c8; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; background: #101d33; border-radius: 16px; overflow: hidden; }
    th, td { padding: 12px; border-bottom: 1px solid #243854; text-align: left; vertical-align: top; }
    th { color: #9fb0c8; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    tr.blocked td { background: rgba(255, 73, 96, .10); }
    tr.eligible td { background: rgba(37, 211, 102, .08); }
    .pill { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 12px; }
    .ok { background: #173d2a; color: #7dffb2; }
    .warn { background: #3d2f17; color: #ffd37d; }
    .danger { background: #451b24; color: #ff9aaa; }
    code { color: #8bd5ff; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr 1fr; } main { padding: 18px; } table { font-size: 13px; } }
  </style>
</head>
<body>
  <main>
    <h1>TenderBoard</h1>
    <p class="subtitle">Safe competitive sourcing for CROO agent commerce: sanitized RFP → agent bids → policy filtering → award → mock CROO orders.</p>

    <section class="grid" aria-label="Demo metrics">
      ${metric('Total bids', result.summary.totalBids)}
      ${metric('Eligible', result.summary.eligibleBids)}
      ${metric('Blocked', result.summary.blockedBids)}
      ${metric('Awarded', result.summary.awardedBids)}
      ${metric('Orders', result.summary.completedOrders)}
    </section>

    <h2>Sanitized RFP</h2>
    <div class="card">
      <p><strong>${escapeHtml(result.rfp.title)}</strong></p>
      <p>Budget: <code>${escapeHtml(`${result.rfp.maxBudget.amount} ${result.rfp.maxBudget.currency}`)}</code> · Deadline: <code>${escapeHtml(result.rfp.deadline)}</code></p>
      <p><span class="pill warn">Private fields hidden from bidders</span> <span class="pill danger">NEVER_SHARE blocked</span></p>
    </div>

    <h2>Bid Board</h2>
    <table>
      <thead><tr><th>Provider</th><th>Price</th><th>SLA</th><th>Requested data</th><th>Decision</th><th>Reasons</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <h2>Awarded Mock CROO Orders</h2>
    <div class="card"><ul>${orderCards}</ul></div>
  </main>
</body>
</html>`;
}

function metric(label: string, value: number): string {
  return `<div class="card"><div class="metric">${value}</div><div class="label">${escapeHtml(label)}</div></div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
