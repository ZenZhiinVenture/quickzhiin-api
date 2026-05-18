/**
 * Calculates the Malaysian 5-sen rounding adjustment.
 * @param amount The raw total amount.
 * @returns The rounding adjustment value (positive or negative).
 * 
 * Logic:
 * 0.01 -> -0.01 (10.01 -> 10.00)
 * 0.02 -> -0.02 (10.02 -> 10.00)
 * 0.03 -> +0.02 (10.03 -> 10.05)
 * 0.04 -> +0.01 (10.04 -> 10.05)
 * 0.06 -> -0.01 (10.06 -> 10.05)
 * 0.07 -> -0.02 (10.07 -> 10.05)
 * 0.08 -> +0.02 (10.08 -> 10.10)
 * 0.09 -> +0.01 (10.09 -> 10.10)
 */
export function calculateMalaysianRounding(amount: number): number {
  const rounded = Math.round(amount * 20) / 20;
  // Use a small epsilon to avoid floating point issues
  const adjustment = rounded - amount;
  return Number(adjustment.toFixed(2));
}
