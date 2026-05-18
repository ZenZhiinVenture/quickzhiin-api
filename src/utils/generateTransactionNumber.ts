// utils/generateTransactionNumber.ts

export function generateTransactionNumber(prefix: string = 'TXN', no: number): string {
  const timestamp = Date.now();
  const randomDigits = Math.floor(Math.random() * Math.pow(10, no));
  return `${prefix}-${timestamp}-${randomDigits}`;
}
