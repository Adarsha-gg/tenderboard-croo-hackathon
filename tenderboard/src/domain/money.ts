import type { Money } from './types.js';

export function parseMoneyAmount(money: Money): number {
  const amount = Number(money.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid ${money.currency} amount: ${money.amount}`);
  }
  return amount;
}

export function isGreaterThan(left: Money, right: Money): boolean {
  if (left.currency !== right.currency) {
    throw new Error(`Currency mismatch: ${left.currency} vs ${right.currency}`);
  }
  return parseMoneyAmount(left) > parseMoneyAmount(right);
}
