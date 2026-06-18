import { describe, expect, it } from 'vitest';
import { assembleLaunchKit } from '../src/outputs/launchKit.js';
import { runLaunchKitDemo } from '../src/workflows/launchKitDemo.js';

describe('assembleLaunchKit', () => {
  it('renders awarded providers, blocked providers, and mock order ids', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:15:00.000Z') });
    const markdown = assembleLaunchKit(result);

    expect(markdown).toContain('# TenderBoard Launch Kit');
    expect(markdown).toContain('### PitchWriter');
    expect(markdown).toContain('### ReadmeAgent');
    expect(markdown).toContain('### DemoScriptAgent');
    expect(markdown).toContain('### OverpricedAgent');
    expect(markdown).toContain('### EvilAgent');
    expect(markdown).toContain('mock_order_award_rfp_launch_001_pitch_writer');
    expect(markdown).toContain('Completed mock CROO orders: 3');
  });

  it('includes explicit reasons for blocked providers', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:16:00.000Z') });
    const markdown = assembleLaunchKit(result);

    expect(markdown).toContain('exceeds max budget');
    expect(markdown).toContain('requested forbidden privacy labels');
    expect(markdown).toContain('requested sensitive data');
  });

  it('does not leak buyer-only source RFP secrets into the launch kit', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:17:00.000Z') });
    const markdown = assembleLaunchKit(result);

    expect(markdown).not.toContain('seed phrase alpha beta gamma');
    expect(markdown).not.toContain('0xdeadbeef');
    expect(markdown).not.toContain('Internal positioning notes are local-only');
  });
});
