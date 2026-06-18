import type { BidPacket, Rfp } from '../domain/types.js';

export const FORBIDDEN_DATA_NOTICE =
  'Bidders must not request LOCAL_ONLY or NEVER_SHARE data such as .env files, wallet keys, seed phrases, API keys, credentials, private docs, or off-platform access. Private context is disclosed only after award when explicitly allowed by policy.';

export function sanitizeRfp(rfp: Rfp): BidPacket {
  const publicFields = rfp.fields
    .filter((field) => field.privacy === 'PUBLIC')
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: field.value,
    }));

  const privateContextAvailableAfterAward = rfp.fields.some(
    (field) => field.privacy === 'PRIVATE_AFTER_AWARD',
  );

  return {
    rfpId: rfp.id,
    title: rfp.title,
    maxBudget: { ...rfp.maxBudget },
    deadline: rfp.deadline,
    deliverables: [...rfp.deliverables],
    publicFields,
    privateContextAvailableAfterAward,
    forbiddenDataNotice: FORBIDDEN_DATA_NOTICE,
  };
}
