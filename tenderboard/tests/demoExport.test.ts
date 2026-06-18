import { describe, expect, it } from 'vitest';
import { createPublicDemoExport } from '../src/outputs/demoExport.js';
import { runLaunchKitDemo } from '../src/workflows/launchKitDemo.js';

describe('createPublicDemoExport', () => {
  it('exports demo state without buyer-only RFP secrets', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:35:00.000Z') });
    const exported = createPublicDemoExport(result);
    const exportedText = JSON.stringify(exported);

    expect(exportedText).toContain('TenderBoard is a safe competitive sourcing layer');
    expect(exportedText).not.toContain('seed phrase alpha beta gamma');
    expect(exportedText).not.toContain('0xdeadbeef');
    expect(exportedText).not.toContain('Internal positioning notes are local-only');
  });

  it('exports sanitized bid packet instead of the full internal RFP', async () => {
    const result = await runLaunchKitDemo({ now: new Date('2026-06-18T14:36:00.000Z') });
    const exported = createPublicDemoExport(result) as { bidPacket?: unknown; rfp?: unknown };

    expect(exported.rfp).toBeUndefined();
    expect(exported.bidPacket).toBeDefined();
  });
});
