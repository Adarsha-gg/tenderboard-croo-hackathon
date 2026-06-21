const fallbackPassport = {
  workerAgentId: 'opportunity_scout.public',
  score: 842,
  memoryCount: 7,
  walrusMemoryCount: 7,
  anchoredMemoryCount: 6,
  averageClaimSupport: 96,
  stakeSui: 5,
  slashes: 0,
  latestWalrusBlobId: 'lDssvU3Jw6eRyE2N0X0fvCE3b_oCV5peftFj4UkAklw',
  latestSuiAnchorDigest: 'Hxxuk6jCAMFvUyiif8q6GLjDQ6w6m1BjMAnUb1zNEDLP',
};

const fallbackReceipts = [
  {
    title: 'Find Sui ecosystem builder opportunities',
    support: 100,
    status: 'verified',
    sourceCount: 5,
    walrus: true,
    anchor: true,
  },
  {
    title: 'Compare Walrus memory competitors',
    support: 96,
    status: 'verified',
    sourceCount: 6,
    walrus: true,
    anchor: true,
  },
  {
    title: 'Survey agent payment rails',
    support: 41,
    status: 'requires review',
    sourceCount: 2,
    walrus: true,
    anchor: false,
  },
];

const state = {
  step: 'passport',
  passport: fallbackPassport,
  receipts: fallbackReceipts,
  live: false,
};

const ledgerItems = [
  ['Scope locked', 'Buyer task becomes a safe worker packet with private notes withheld.'],
  ['Payment bound', 'Sui/x402-style intent binds amount, nonce, worker, and resource.'],
  ['Evidence checked', 'Claims must match source observations before settlement.'],
  ['Memory stored', 'The full proof bundle becomes a Walrus artifact.'],
  ['Passport updated', 'Future routing can verify the agent from prior receipts.'],
];

const screens = {
  passport: renderPassport,
  hire: renderHire,
  delivery: renderDelivery,
  publish: renderPublish,
  portable: renderPortable,
};

document.addEventListener('DOMContentLoaded', () => {
  wireControls();
  render();
  hydrateLiveData();
});

function wireControls() {
  document.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      state.step = button.dataset.step;
      render();
    });
  });
}

async function hydrateLiveData() {
  const status = document.getElementById('apiStatus');
  const dot = document.querySelector('.liveDot');
  try {
    const response = await fetch('/api/walrus/memory', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const index = await response.json();
    const passport = pickPassport(index);
    if (passport) {
      state.live = true;
      state.passport = normalizePassport(passport);
      state.receipts = normalizeReceipts(passport.records ?? []);
      status.textContent = 'live Receipter API connected';
      dot.classList.add('ok');
      render();
      return;
    }
    throw new Error('No passports returned');
  } catch {
    status.textContent = 'using proof-loop demo data';
  }
}

function pickPassport(index) {
  if (!Array.isArray(index?.passports)) return undefined;
  return (
    index.passports.find((passport) => passport.workerAgentId === 'sui_opportunity_scout') ??
    index.passports.find((passport) => passport.memoryCount > 0)
  );
}

function normalizePassport(passport) {
  return {
    workerAgentId: passport.workerAgentId ?? 'opportunity_scout.public',
    score: scorePassport(passport),
    memoryCount: passport.memoryCount ?? 0,
    walrusMemoryCount: passport.walrusMemoryCount ?? 0,
    anchoredMemoryCount: passport.anchoredMemoryCount ?? 0,
    averageClaimSupport: Math.round(passport.averageClaimSupport ?? 0),
    stakeSui: 5,
    slashes: 0,
    latestWalrusBlobId: passport.latestWalrusBlobId,
    latestSuiAnchorDigest: passport.latestSuiAnchorDigest,
  };
}

function normalizeReceipts(records) {
  const normalized = records.slice(0, 4).map((record) => ({
    title: record.taskTitle ?? record.runId,
    support: Math.round(record.averageClaimSupport ?? 0),
    status: record.marketplaceProof?.suiAnchored ? 'verified' : record.marketplaceProof?.sourceVerified ? 'ready' : 'requires review',
    sourceCount: record.sourceObservationCount ?? 0,
    walrus: Boolean(record.walrusBlobId),
    anchor: Boolean(record.suiAnchorDigest),
  }));
  return normalized.length > 0 ? normalized : fallbackReceipts;
}

function scorePassport(passport) {
  const support = Number(passport.averageClaimSupport ?? 0);
  const anchored = Number(passport.anchoredMemoryCount ?? 0);
  const memory = Math.max(1, Number(passport.memoryCount ?? 1));
  return Math.min(950, Math.round(support * 7 + (anchored / memory) * 200));
}

function render() {
  document.querySelectorAll('.step').forEach((step) => step.classList.toggle('active', step.dataset.step === state.step));
  document.querySelectorAll('.loopNode').forEach((node) => node.classList.toggle('selected', node.dataset.step === state.step));
  document.getElementById('screenPanel').innerHTML = screens[state.step]();
  document.getElementById('statJobs').textContent = state.passport.memoryCount;
  document.getElementById('statWalrus').textContent = state.passport.walrusMemoryCount;
  document.getElementById('statAnchored').textContent = state.passport.anchoredMemoryCount;
  renderLedger();
}

function renderLedger() {
  const activeIndex = ['passport', 'hire', 'delivery', 'publish', 'portable'].indexOf(state.step);
  document.getElementById('ledgerList').innerHTML = ledgerItems
    .map(
      ([title, detail], index) => `
        <li class="${index <= activeIndex ? 'active' : ''}">
          <strong>${title}</strong>
          <span>${detail}</span>
        </li>
      `,
    )
    .join('');
}

function renderPassport() {
  const p = state.passport;
  return `
    <div class="screenHead">
      <div>
        <span class="eyebrow">Start with proof, not a form</span>
        <h2>Agent Passport Directory</h2>
        <p>Before a buyer hires anything, they inspect paid work history that can be opened on Walrus and checked against Sui anchors.</p>
      </div>
      <span class="pill ok">${state.live ? 'Live API' : 'Demo data'}</span>
    </div>

    <div class="grid3">
      <div class="metric"><strong>${p.score}</strong><span>passport score</span></div>
      <div class="metric"><strong>${p.memoryCount}</strong><span>verified work memories</span></div>
      <div class="metric"><strong>${p.stakeSui} SUI</strong><span>stake behind record</span></div>
    </div>

    <div class="grid2" style="margin-top:14px">
      <article class="card">
        <div class="cardTitle">
          <div>
            <span class="eyebrow">Selected agent</span>
            <h2>${escapeHtml(p.workerAgentId)}</h2>
          </div>
          <span class="pill ok">safe to hire for research</span>
        </div>
        <div class="scoreDial">${p.score}</div>
        <div class="grid2">
          <div class="metric"><strong>${p.averageClaimSupport}%</strong><span>avg claim support</span></div>
          <div class="metric"><strong>${p.slashes}</strong><span>slashes</span></div>
        </div>
      </article>

      <article class="card">
        <span class="eyebrow">Receipt history</span>
        <div class="receiptList" style="margin-top:12px">
          ${state.receipts.map(renderReceiptRow).join('')}
        </div>
      </article>
    </div>
  `;
}

function renderHire() {
  return `
    <div class="screenHead">
      <div>
        <span class="eyebrow">Hire agent</span>
        <h2>Routing uses verifiable history, not self-claimed skill.</h2>
        <p>The buyer writes a task once. Receipter sanitizes context, scores workers from prior admitted receipts, and blocks routes that cannot be safely verified.</p>
      </div>
      <span class="pill">Scope -> Worker -> Pay</span>
    </div>

    <div class="grid2">
      <div class="flowForm">
        <div class="field"><label>Task</label><div>Find Sui AI agent grants and builder programs with public links.</div></div>
        <div class="field"><label>Acceptance criteria</label><div>5 sources, deadline or sponsor if visible, ranked recommendation.</div></div>
        <div class="field"><label>Private notes</label><div class="muted">Withheld from worker. Secret scan clean.</div></div>
        <div class="field"><label>Packet hash</label><div>sha256:8ac4...91fd</div></div>
      </div>

      <div class="flowForm">
        ${renderBidCard('Opportunity Scout', '0.035 SUI', '24h', '7 jobs', '96%', '5 SUI', 'available', 'available')}
        ${renderBidCard('Expedited Scout', '0.075 SUI', '4h', '2 jobs', '91%', '1 SUI', 'above budget', 'blocked')}
        ${renderBidCard('Private Context Scout', '0.025 SUI', '12h', 'n/a', 'n/a', '0 SUI', 'requested private data', 'blocked')}
      </div>
    </div>
  `;
}

function renderDelivery() {
  const claims = [
    ['Sui Overflow Walrus track fit', 'go.sui.io/overflow', 'good'],
    ['Walrus memory stores proof artifacts', 'docs.walrus.site', 'good'],
    ['Agent reputation needs claim receipts', 'arxiv.org/abs/2605.00073', 'good'],
    ['Unsupported claim example', 'missing source', 'review'],
  ];
  return `
    <div class="screenHead">
      <div>
        <span class="eyebrow">Verify delivery</span>
        <h2>Bad evidence can be stored, but it cannot become clean reputation.</h2>
        <p>Delivery text is not enough. Claims must bind to source observations and pass the verifier before the receipt becomes reputation.</p>
      </div>
      <span class="pill warn">settlement gate</span>
    </div>

    <div class="grid2">
      <article class="card">
        <span class="eyebrow">Source-backed claims</span>
        <div class="claimList" style="margin-top:12px">
          ${claims.map(([title, source, status]) => renderClaim(title, source, status)).join('')}
        </div>
      </article>
      <article class="card">
        <span class="eyebrow">Settlement verdict</span>
        <div class="scoreDial">75%</div>
        <div class="checkList">
          ${renderCheck('Acceptance coverage', 'good')}
          ${renderCheck('Source receipt hash', 'good')}
          ${renderCheck('Unsupported claims', 'review')}
          ${renderCheck('Reputation update paused', 'review')}
        </div>
      </article>
    </div>
  `;
}

function renderPublish() {
  return `
    <div class="screenHead">
      <div>
        <span class="eyebrow">Publish receipt</span>
        <h2>One verified job becomes a portable work credential.</h2>
        <p>The full evidence bundle goes to Walrus. The compact proof lands on Sui. The passport pointer updates after finality.</p>
      </div>
      <button class="btn">Publish verified receipt</button>
    </div>

    <div class="publishFlow">
      ${renderProofStep('1', 'Store full evidence on Walrus', 'Full source receipt, claim results, task packet, and proof bundle.')}
      ${renderProofStep('2', 'Read it back', 'Aggregator returns the same bytes; evidence hash recomputes.')}
      ${renderProofStep('3', 'Anchor compact receipt on Sui', 'ReceiptAnchored event binds run id, memory hash, and Walrus blob id.')}
      ${renderProofStep('4', 'Update AgentPassport', 'Latest memory pointer and counters become the next trust signal.')}
    </div>
  `;
}

function renderPortable() {
  return `
    <div class="screenHead">
      <div>
        <span class="eyebrow">Next buyer trusts faster</span>
        <h2>The reputation is not trapped in this interface.</h2>
        <p>Two different apps can read the same passport and verify the same Walrus/Sui proofs. That is the infrastructure story.</p>
      </div>
      <span class="pill ok">portable trust</span>
    </div>

    <div class="portableSplit">
      <article class="marketplace">
        <span class="eyebrow">Marketplace A</span>
        <h2>Receipter console</h2>
        <p class="muted">Hires Opportunity Scout and publishes the receipt.</p>
        <div class="receiptRow"><span>Latest memory</span><strong>${shorten(state.passport.latestWalrusBlobId)}</strong></div>
      </article>
      <article class="marketplace">
        <span class="eyebrow">Marketplace B</span>
        <h2>Different frontend</h2>
        <p class="muted">Reads the same AgentPassport before routing a new task.</p>
        <div class="receiptRow"><span>Same anchor</span><strong>${shorten(state.passport.latestSuiAnchorDigest)}</strong></div>
      </article>
    </div>

    <div class="card" style="margin-top:14px">
      <span class="eyebrow">Exact strategy</span>
      <h2>Memory tells an agent what happened. Receipter proves whether the work should count.</h2>
    </div>
  `;
}

function renderReceiptRow(receipt) {
  const statusClass = receipt.status === 'verified' ? 'ok' : receipt.status === 'requires review' ? 'warn' : '';
  return `
    <div class="receiptRow">
      <div>
        <strong>${escapeHtml(receipt.title)}</strong>
        <div class="muted">${receipt.sourceCount} sources · ${receipt.support}% support</div>
      </div>
      <span class="pill ${statusClass}">${receipt.status}</span>
    </div>
  `;
}

function renderBidCard(name, price, sla, jobs, support, stake, verdict, status) {
  return `
    <article class="bidCard ${status === 'available' ? 'available' : 'blocked'}">
      <div class="cardTitle">
        <strong>${name}</strong>
        <span class="pill ${status === 'available' ? 'ok' : 'bad'}">${verdict}</span>
      </div>
      <div class="bidMeta">
        <div><span>Price</span><strong>${price}</strong></div>
        <div><span>SLA</span><strong>${sla}</strong></div>
        <div><span>Past verified jobs</span><strong>${jobs}</strong></div>
        <div><span>Claim support avg</span><strong>${support}</strong></div>
        <div><span>Stake</span><strong>${stake}</strong></div>
        <div><span>Verdict</span><strong>${verdict}</strong></div>
      </div>
    </article>
  `;
}

function renderClaim(title, source, status) {
  return `
    <div class="claimItem ${status === 'good' ? 'good' : 'review'}">
      <div class="checkLeft">
        <span class="checkIcon ${status === 'good' ? '' : 'warn'}">${status === 'good' ? '✓' : '!'}</span>
        <div>
          <strong>${title}</strong>
          <div class="muted">${source}</div>
        </div>
      </div>
    </div>
  `;
}

function renderCheck(label, status) {
  return `
    <div class="checkItem ${status === 'good' ? 'good' : 'review'}">
      <div class="checkLeft">
        <span class="checkIcon ${status === 'good' ? '' : 'warn'}">${status === 'good' ? '✓' : '!'}</span>
        <strong>${label}</strong>
      </div>
    </div>
  `;
}

function renderProofStep(number, title, detail) {
  return `
    <div class="proofStep">
      <div class="checkLeft">
        <span class="checkIcon">${number}</span>
        <div>
          <strong>${title}</strong>
          <div class="muted">${detail}</div>
        </div>
      </div>
      <span class="pill ok">passed</span>
    </div>
  `;
}

function shorten(value) {
  if (!value) return 'not published yet';
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
