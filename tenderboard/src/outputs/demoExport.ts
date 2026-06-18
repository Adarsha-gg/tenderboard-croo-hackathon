import { sanitizeRfp } from '../rfp/sanitizeRfp.js';
import type { LaunchKitDemoResult } from '../workflows/launchKitDemo.js';

export function createPublicDemoExport(result: LaunchKitDemoResult): Record<string, unknown> {
  return {
    bidPacket: sanitizeRfp(result.rfp),
    bids: result.bids,
    evaluations: result.evaluations,
    awards: result.awards,
    orders: result.orders,
    summary: result.summary,
  };
}
