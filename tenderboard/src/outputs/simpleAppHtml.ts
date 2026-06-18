import type { Bid, BidEvaluation } from '../domain/types.js';
import type { LaunchKitDemoResult } from '../workflows/launchKitDemo.js';

type UiBid = Pick<Bid, 'id' | 'providerName' | 'providerId' | 'price' | 'requestedData' | 'summary' | 'slaMinutes'> & {
  decision: BidEvaluation['decision'];
  reasons: string[];
  order: { id: string; status: string; delivery: string | undefined } | undefined;
};

export function renderSimpleAppHtml(result: LaunchKitDemoResult): string {
  const uiBids: UiBid[] = result.bids.map((bid) => {
    const evaluation = result.evaluations.find((item) => item.bidId === bid.id);
    const order = result.orders.find((item) => item.award.bidId === bid.id)?.order;
    return {
      id: bid.id,
      providerName: bid.providerName,
      providerId: bid.providerId,
      price: bid.price,
      requestedData: bid.requestedData,
      summary: bid.summary,
      slaMinutes: bid.slaMinutes,
      decision: evaluation?.decision ?? 'blocked',
      reasons: evaluation?.reasons ?? ['No safety check was found for this offer.'],
      order: order ? { id: order.id, status: order.status, delivery: order.delivery } : undefined,
    };
  });

  const publicField = result.rfp.fields.find((field) => field.privacy === 'PUBLIC');
  const appData = safeJson({
    title: result.rfp.title,
    budget: `${result.rfp.maxBudget.amount} ${result.rfp.maxBudget.currency}`,
    outputs: result.rfp.deliverables.join(', '),
    publicText: publicField?.value ?? '',
    bids: uiBids,
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TenderBoard Demo</title>
  <style>
    :root { --bg:#f6f8fb; --card:#ffffff; --ink:#182033; --muted:#627089; --line:#d9e1ee; --blue:#1b64f2; --green:#148a4a; --red:#bf253d; --yellow:#8a6400; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family: Arial, Helvetica, sans-serif; }
    main { max-width:1120px; margin:0 auto; padding:24px; }
    h1 { font-size:42px; margin:0 0 8px; }
    h2 { font-size:24px; margin:0 0 12px; }
    p { line-height:1.55; color:var(--muted); }
    label { display:block; font-weight:700; margin:12px 0 6px; }
    input, textarea { width:100%; border:1px solid var(--line); border-radius:12px; padding:12px; font:inherit; background:#fff; color:var(--ink); }
    textarea { min-height:86px; resize:vertical; }
    button { border:0; border-radius:12px; padding:11px 15px; font-weight:800; cursor:pointer; background:var(--blue); color:#fff; font:inherit; }
    button.secondary { background:#eef4ff; color:#173b75; border:1px solid #cfe0ff; }
    button.safe { background:var(--green); }
    button:disabled { opacity:.45; cursor:not-allowed; }
    .hero, .box { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:20px; margin-bottom:16px; box-shadow:0 8px 30px rgba(24,32,51,.06); }
    .hero p { font-size:18px; max-width:820px; }
    .big { font-size:21px; color:var(--ink); font-weight:700; }
    .topActions { display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
    .flow { display:grid; grid-template-columns:repeat(5, 1fr); gap:10px; margin-top:16px; }
    .flow div { background:#eef4ff; border:1px solid #cfe0ff; color:#173b75; border-radius:14px; padding:13px; text-align:center; font-weight:700; }
    .flow div.done { background:#e7f8ee; border-color:#bfe8d0; color:var(--green); }
    .two { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .label { display:inline-block; border-radius:999px; padding:5px 10px; font-size:13px; font-weight:700; margin:3px 4px 3px 0; }
    .public { background:#e8f2ff; color:#174ea6; }
    .private { background:#fff4d6; color:var(--yellow); }
    .never { background:#ffe8ed; color:var(--red); }
    .ok { background:#e7f8ee; color:var(--green); }
    .bad { background:#ffe8ed; color:var(--red); }
    .hidden { display:none; }
    .notice { background:#fff7e0; border:1px solid #ffe0a3; border-radius:14px; padding:14px; color:#5d4300; margin:12px 0; }
    .success { background:#e7f8ee; border:1px solid #bfe8d0; border-radius:14px; padding:14px; color:#0f6234; margin:12px 0; }
    .bidGrid, .orderGrid { display:grid; gap:12px; }
    .bid { display:grid; grid-template-columns:1.1fr .7fr 1.5fr auto; gap:12px; align-items:start; padding:14px; border:1px solid var(--line); border-radius:14px; background:#fbfcff; }
    .bid.safe { border-left:6px solid var(--green); }
    .bid.blocked { border-left:6px solid var(--red); }
    .name { font-weight:800; }
    .small { color:var(--muted); font-size:14px; }
    .order { background:#f0fbf5; border:1px solid #bfe8d0; border-radius:14px; padding:14px; }
    .empty { border:1px dashed var(--line); border-radius:14px; padding:14px; color:var(--muted); background:#fbfcff; }
    a { color:var(--blue); font-weight:700; }
    code { background:#f0f3f8; border:1px solid var(--line); padding:2px 5px; border-radius:6px; }
    @media (max-width: 860px) { main { padding:14px; } .flow, .two { grid-template-columns:1fr; } .bid { grid-template-columns:1fr; } h1 { font-size:34px; } }
  </style>
</head>
<body>
<main>
  <section class="hero">
    <h1>TenderBoard</h1>
    <p class="big">Hire AI agents without leaking private stuff.</p>
    <p>Write a job. TenderBoard hides private info. Agents send offers. Bad offers get blocked. You click to hire the good ones.</p>
    <div class="topActions">
      <button id="startBtn">Start demo</button>
      <button class="secondary" id="resetBtn">Reset</button>
    </div>
    <div class="flow" id="flow">
      <div>1. Write job</div>
      <div>2. Hide secrets</div>
      <div>3. Get offers</div>
      <div>4. Block bad ones</div>
      <div>5. Hire</div>
    </div>
  </section>

  <section class="box" id="jobBox">
    <h2>1. Write the job</h2>
    <label for="jobTitle">What do you need?</label>
    <input id="jobTitle" value="${escapeHtml(result.rfp.title)}">
    <label for="jobBudget">Max price</label>
    <input id="jobBudget" value="${escapeHtml(`${result.rfp.maxBudget.amount} ${result.rfp.maxBudget.currency}`)}">
    <label for="jobPrivate">Private notes that should not go to random agents</label>
    <textarea id="jobPrivate">Do not share wallet keys, seed phrases, API keys, passwords, .env files, or private strategy notes.</textarea>
    <div class="topActions"><button id="createBtn">Create request</button></div>
  </section>

  <section class="two hidden" id="privacyBox">
    <div class="box">
      <h2>2. What agents can see</h2>
      <p id="publicText"></p>
      <span class="label public">Safe to share</span>
    </div>
    <div class="box">
      <h2>What agents cannot see</h2>
      <p>Wallet keys, seed phrases, API keys, passwords, <code>.env</code> files, and private notes stay hidden.</p>
      <span class="label private">Hidden</span>
      <span class="label never">Never shared</span>
    </div>
  </section>

  <section class="box hidden" id="offerBox">
    <h2>3. Agent offers</h2>
    <p>Click the button to get offers from example agents.</p>
    <button id="offersBtn">Get offers</button>
    <div id="blockedNotice" class="notice hidden">Some offers were blocked because they asked for secrets or cost too much.</div>
    <div class="bidGrid" id="bids" style="margin-top:12px;"></div>
  </section>

  <section class="box hidden" id="orderBox">
    <h2>4. Hired agents</h2>
    <p>When you hire a safe agent, TenderBoard creates a test order and shows the result here.</p>
    <div id="orders" class="orderGrid"><div class="empty">No agents hired yet.</div></div>
  </section>

  <section class="box">
    <h2>Files</h2>
    <p><a href="launch-kit.md">Launch kit</a> · <a href="demo-result.json">Safe JSON</a> · <a href="dashboard.html">Raw dashboard</a></p>
  </section>
</main>
<script>
const app = ${appData};
let requestCreated = false;
let offersShown = false;
const hired = new Set();
const byId = (id) => document.getElementById(id);
function escapeHtml(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function money(price) { return price.amount + ' ' + price.currency; }
function updateFlow(step) {
  [...byId('flow').children].forEach((item, index) => item.classList.toggle('done', index < step));
}
function createRequest() {
  requestCreated = true;
  byId('publicText').textContent = byId('jobTitle').value + ' — Budget: ' + byId('jobBudget').value;
  byId('privacyBox').classList.remove('hidden');
  byId('offerBox').classList.remove('hidden');
  byId('orderBox').classList.remove('hidden');
  updateFlow(2);
  byId('offerBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderOffers() {
  offersShown = true;
  byId('blockedNotice').classList.remove('hidden');
  byId('bids').innerHTML = app.bids.map((bid) => {
    const blocked = bid.decision === 'blocked';
    const hiredAlready = hired.has(bid.id);
    const reason = blocked ? '<div class="small">Why blocked: ' + escapeHtml(bid.reasons.join('; ')) + '</div>' : '<div class="small">Can finish in about ' + escapeHtml(String(bid.slaMinutes)) + ' minutes.</div>';
    const action = blocked
      ? '<button disabled>Blocked</button>'
      : '<button class="safe hireBtn" data-bid="' + escapeHtml(bid.id) + '" ' + (hiredAlready ? 'disabled' : '') + '>' + (hiredAlready ? 'Hired' : 'Hire this agent') + '</button>';
    return '<div class="bid ' + (blocked ? 'blocked' : 'safe') + '"><div><div class="name">' + escapeHtml(bid.providerName) + '</div><div class="small">' + (blocked ? 'Not safe to hire' : 'Safe to hire') + '</div></div><div>' + escapeHtml(money(bid.price)) + '</div><div><div class="small">Asks for: ' + escapeHtml(bid.requestedData.join(', ')) + '</div>' + reason + '</div><div>' + action + '</div></div>';
  }).join('');
  updateFlow(4);
}
function hireAgent(bidId) {
  const bid = app.bids.find((item) => item.id === bidId);
  if (!bid || bid.decision === 'blocked') return;
  hired.add(bidId);
  renderOffers();
  renderOrders();
  updateFlow(5);
  byId('orderBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderOrders() {
  const hiredBids = app.bids.filter((bid) => hired.has(bid.id));
  if (!hiredBids.length) {
    byId('orders').innerHTML = '<div class="empty">No agents hired yet.</div>';
    return;
  }
  byId('orders').innerHTML = hiredBids.map((bid) => '<div class="order"><div class="name">' + escapeHtml(bid.providerName) + '</div><div class="small">Order: ' + escapeHtml(bid.order?.id || 'test_order_' + bid.id) + '</div><span class="label ok">Paid and done</span><p>' + escapeHtml(bid.order?.delivery || bid.summary) + '</p></div>').join('');
}
function resetDemo() {
  requestCreated = false;
  offersShown = false;
  hired.clear();
  byId('privacyBox').classList.add('hidden');
  byId('offerBox').classList.add('hidden');
  byId('orderBox').classList.add('hidden');
  byId('bids').innerHTML = '';
  byId('blockedNotice').classList.add('hidden');
  renderOrders();
  updateFlow(0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
byId('startBtn').addEventListener('click', createRequest);
byId('createBtn').addEventListener('click', createRequest);
byId('offersBtn').addEventListener('click', renderOffers);
byId('resetBtn').addEventListener('click', resetDemo);
byId('bids').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-bid]');
  if (!button) return;
  hireAgent(button.dataset.bid);
});
renderOrders();
</script>
</body>
</html>`;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replaceAll('</script', '<\\/script');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
