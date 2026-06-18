import { describe, expect, it } from 'vitest';
import { renderDashboardHtml } from '../src/outputs/dashboardHtml.js';
import { runLaunchKitDemo } from '../src/workflows/launchKitDemo.js';

describe('renderDashboardHtml', () => {
  it('renders demo metrics, bid decisions, and mock order ids', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T15:15:00.000Z') });
    const html = renderDashboardHtml(result);

    expect(html).toContain('<title>TenderBoard Demo Dashboard</title>');
    expect(html).toContain('Total bids');
    expect(html).toContain('Eligible');
    expect(html).toContain('Blocked');
    expect(html).toContain('PitchWriter');
    expect(html).toContain('OverpricedAgent');
    expect(html).toContain('EvilAgent');
    expect(html).toContain('mock_order_award_rfp_launch_001_pitch_writer');
  });

  it('does not render buyer-only secret values', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T15:16:00.000Z') });
    const html = renderDashboardHtml(result);

    expect(html).not.toContain('seed phrase alpha beta gamma');
    expect(html).not.toContain('0xdeadbeef');
    expect(html).not.toContain('Internal positioning notes');
  });
});
