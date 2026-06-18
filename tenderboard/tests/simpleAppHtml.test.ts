import { describe, expect, it } from 'vitest';
import { renderSimpleAppHtml } from '../src/outputs/simpleAppHtml.js';
import { runLaunchKitDemo } from '../src/workflows/launchKitDemo.js';

describe('renderSimpleAppHtml', () => {
  it('uses plain language and keeps the main flow on one page', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T16:30:00.000Z') });
    const html = renderSimpleAppHtml(result);

    expect(html).toContain('Hire AI agents without leaking private stuff.');
    expect(html).toContain('1. Write job');
    expect(html).toContain('2. Hide secrets');
    expect(html).toContain('3. Get offers');
    expect(html).toContain('4. Block bad ones');
    expect(html).toContain('5. Hire');
    expect(html).not.toContain('Presenter note');
  });

  it('has real clickable controls wired to JavaScript', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T16:31:00.000Z') });
    const html = renderSimpleAppHtml(result);

    expect(html).toContain('id="createBtn"');
    expect(html).toContain('id="offersBtn"');
    expect(html).toContain('Hire this agent');
    expect(html).toContain("addEventListener('click', createRequest)");
    expect(html).toContain("addEventListener('click', renderOffers)");
    expect(html).toContain('hireAgent(button.dataset.bid)');
  });

  it('includes safe and blocked example agents', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T16:32:00.000Z') });
    const html = renderSimpleAppHtml(result);

    expect(html).toContain('PitchWriter');
    expect(html).toContain('ReadmeAgent');
    expect(html).toContain('DemoScriptAgent');
    expect(html).toContain('OverpricedAgent');
    expect(html).toContain('EvilAgent');
    expect(html).toContain('Blocked');
  });

  it('does not leak buyer-only secrets', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T16:33:00.000Z') });
    const html = renderSimpleAppHtml(result);

    expect(html).not.toContain('seed phrase alpha beta gamma');
    expect(html).not.toContain('0xdeadbeef');
    expect(html).not.toContain('Internal positioning notes');
  });
});
