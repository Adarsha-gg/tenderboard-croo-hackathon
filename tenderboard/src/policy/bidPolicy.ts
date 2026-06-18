import { isGreaterThan } from '../domain/money.js';
import type { Bid, BidEvaluation, BidEvaluationFlag, Rfp } from '../domain/types.js';
import { findSecretPatternMatches } from './secretPatterns.js';

const BLOCKED_PRIVACY_LABELS = new Set(['LOCAL_ONLY', 'NEVER_SHARE']);
const MIN_PLAUSIBLE_SLA_MINUTES = 1;

export function evaluateBid(rfp: Rfp, bid: Bid): BidEvaluation {
  const flags: BidEvaluationFlag[] = [];

  if (bid.rfpId !== rfp.id) {
    flags.push({
      code: 'rfp.mismatch',
      severity: 'block',
      message: `Bid targets ${bid.rfpId}, not RFP ${rfp.id}.`,
    });
  }

  if (isGreaterThan(bid.price, rfp.maxBudget)) {
    flags.push({
      code: 'budget.exceeded',
      severity: 'block',
      message: `Bid price ${bid.price.amount} ${bid.price.currency} exceeds max budget ${rfp.maxBudget.amount} ${rfp.maxBudget.currency}.`,
    });
  }

  const forbiddenPrivacyRequests = bid.requestedPrivacyLabels.filter((label) =>
    BLOCKED_PRIVACY_LABELS.has(label),
  );
  if (forbiddenPrivacyRequests.length > 0) {
    flags.push({
      code: 'privacy.forbidden_label_requested',
      severity: 'block',
      message: `Bid requested forbidden privacy labels: ${[...new Set(forbiddenPrivacyRequests)].join(', ')}.`,
    });
  }

  const secretMatches = findSecretPatternMatches([...bid.requestedData, bid.summary]);
  if (secretMatches.length > 0) {
    flags.push({
      code: 'privacy.secret_requested',
      severity: 'block',
      message: `Bid requested sensitive data: ${secretMatches.join('; ')}.`,
    });
  }

  if (/\b(email|telegram|discord|whatsapp|dm me|contact me|off[- ]platform)\b/i.test(bid.summary)) {
    flags.push({
      code: 'contact.off_platform',
      severity: 'block',
      message: 'Bid asks to move coordination off-platform.',
    });
  }

  if (!Number.isFinite(bid.slaMinutes) || bid.slaMinutes < MIN_PLAUSIBLE_SLA_MINUTES) {
    flags.push({
      code: 'sla.implausible',
      severity: 'warn',
      message: `Bid SLA ${bid.slaMinutes} minutes is implausible.`,
    });
  }

  const requestedDeliverables = new Set(rfp.deliverables.map(normalize));
  const offeredDeliverables = bid.deliverables.map(normalize);
  const overlap = offeredDeliverables.some((deliverable) => requestedDeliverables.has(deliverable));
  if (!overlap) {
    flags.push({
      code: 'deliverables.no_overlap',
      severity: 'warn',
      message: 'Bid deliverables do not overlap requested RFP deliverables.',
    });
  }

  const hasBlock = flags.some((flag) => flag.severity === 'block');
  const hasWarn = flags.some((flag) => flag.severity === 'warn');
  const decision = hasBlock ? 'blocked' : hasWarn ? 'warn' : 'eligible';

  return {
    bidId: bid.id,
    decision,
    riskScore: calculateRiskScore(flags),
    reasons: flags.map((flag) => flag.message),
    flags,
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function calculateRiskScore(flags: BidEvaluationFlag[]): number {
  const score = flags.reduce((total, flag) => {
    if (flag.severity === 'block') return total + 50;
    if (flag.severity === 'warn') return total + 15;
    return total + 5;
  }, 0);

  return Math.min(score, 100);
}
