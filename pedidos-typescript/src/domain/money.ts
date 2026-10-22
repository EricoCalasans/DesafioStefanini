export const MAX_UNIT_PRICE_CENTS = 100_000_000n;
export const MAX_SUBTOTAL_CENTS = 1_000_000_000_000n;
export const MAX_SAFE_API_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

export interface DiscountResult {
  readonly amountCents: bigint;
  readonly applied: boolean;
}

export function calculateLineSubtotal(unitPriceCents: bigint, quantity: number): bigint {
  if (unitPriceCents < 1n || unitPriceCents > MAX_UNIT_PRICE_CENTS) {
    throw new RangeError('Unit price is outside the allowed range.');
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10_000) {
    throw new RangeError('Quantity is outside the allowed range.');
  }
  return unitPriceCents * BigInt(quantity);
}

export function calculateSubtotal(lines: readonly bigint[]): bigint {
  if (lines.length < 1 || lines.length > 100 || lines.some((line) => line < 1n)) {
    throw new RangeError('Order lines are outside the allowed range.');
  }
  const subtotal = lines.reduce((sum, line) => sum + line, 0n);
  if (subtotal > MAX_SUBTOTAL_CENTS) {
    throw new RangeError('Order subtotal exceeds the allowed limit.');
  }
  return subtotal;
}

export function calculateDiscount(
  subtotalCents: bigint,
  policy: { readonly enabled: boolean; readonly thresholdCents: bigint; readonly rateBps: number },
): DiscountResult {
  if (
    subtotalCents < 0n ||
    policy.thresholdCents < 0n ||
    !Number.isInteger(policy.rateBps) ||
    policy.rateBps < 0 ||
    policy.rateBps > 10_000
  ) {
    throw new RangeError('Discount inputs are outside the allowed range.');
  }
  if (!policy.enabled || subtotalCents < policy.thresholdCents || policy.rateBps === 0) {
    return { amountCents: 0n, applied: false };
  }
  const amountCents = (subtotalCents * BigInt(policy.rateBps) + 5_000n) / 10_000n;
  if (amountCents > subtotalCents) {
    throw new RangeError('Discount cannot exceed the subtotal.');
  }
  return { amountCents, applied: amountCents > 0n };
}

export function toSafeInteger(value: bigint, field: string): number {
  if (value < 0n || value > MAX_SAFE_API_INTEGER) {
    throw new RangeError(`${field} cannot be represented safely as a JSON number.`);
  }
  return Number(value);
}
