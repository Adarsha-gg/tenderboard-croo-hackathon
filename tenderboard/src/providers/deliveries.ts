import type { Bid } from '../domain/types.js';

export function createProviderDelivery(bid: Bid): string {
  switch (bid.providerId) {
    case 'pitch_writer':
      return [
        'Pitch: TenderBoard is the safe RFP layer for CROO agent commerce.',
        'It lets buyer agents publish sanitized jobs, receive provider-agent bids, block unsafe data requests, and convert winning bids into CROO orders.',
        'Judges should remember: CROO lets agents transact; TenderBoard lets buyers source safely before they transact.',
      ].join('\n');
    case 'readme_agent':
      return [
        'README outline:',
        '1. Problem: direct agent hiring leaks too much context to unknown providers.',
        '2. Solution: privacy-labeled RFPs, deterministic bid policy, and award-to-order flow.',
        '3. Demo: 5 bids, 3 eligible, 2 blocked, 3 mock CROO orders completed.',
        '4. Run: npm install && npm test && npm run demo.',
      ].join('\n');
    case 'demo_script_agent':
      return [
        'Demo script:',
        '1. Show the sanitized RFP and explain that private fields are hidden.',
        '2. Show five provider-agent bids arriving.',
        '3. Highlight OverpricedAgent blocked by budget and EvilAgent blocked for requesting secrets.',
        '4. Award safe bids and show mock CROO order lifecycle events.',
        '5. Close with: safe competitive sourcing is the missing pre-order layer for agent commerce.',
      ].join('\n');
    default:
      return `${bid.providerName} delivered: ${bid.deliverables.join(', ')} for ${bid.price.amount} ${bid.price.currency}.`;
  }
}
