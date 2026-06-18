import { describe, expect, it } from 'vitest';
import { renderDemoWalkthroughHtml, renderDemoWalkthroughMarkdown } from '../src/outputs/demoWalkthrough.js';
import { runLaunchKitDemo } from '../src/workflows/launchKitDemo.js';

describe('demo walkthrough outputs', () => {
  it('renders a markdown walkthrough with each major flow step', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T15:30:00.000Z') });
    const markdown = renderDemoWalkthroughMarkdown(result);

    expect(markdown).toContain('# TenderBoard Demo Walkthrough');
    expect(markdown).toContain('Buyer creates a privacy-labeled RFP');
    expect(markdown).toContain('Five provider agents bid');
    expect(markdown).toContain('TenderBoard blocks bad bids before award');
    expect(markdown).toContain('Awards become CROO-style orders');
    expect(markdown).toContain('Closing line');
  });

  it('renders an HTML walkthrough with links to demo artifacts', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T15:31:00.000Z') });
    const html = renderDemoWalkthroughHtml(result);

    expect(html).toContain('<title>TenderBoard Demo Walkthrough</title>');
    expect(html).toContain('Safe RFP → provider bids → blocked attackers → awards → CROO-style orders');
    expect(html).toContain('href="dashboard.html"');
    expect(html).toContain('href="launch-kit.md"');
    expect(html).toContain('href="demo-result.json"');
  });

  it('does not leak buyer-only secrets in walkthrough artifacts', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T15:32:00.000Z') });
    const combined = `${renderDemoWalkthroughMarkdown(result)}\n${renderDemoWalkthroughHtml(result)}`;

    expect(combined).not.toContain('seed phrase alpha beta gamma');
    expect(combined).not.toContain('0xdeadbeef');
    expect(combined).not.toContain('Internal positioning notes');
  });
});
