import { DepreciationOptions } from '../types/depreciation';

export function calculateMonthlyDepreciation(opts: DepreciationOptions): number[] {
  const months = (opts.years || 0) * 12 + (opts.months || 0);

  const depreciation: number[] = [];
  let bookValue = opts.cost;

  for (let i = 0; i < months; i++) {
    let monthly = 0;

    if (opts.method === 'STRAIGHT_LINE') {
      if (opts.mode === 'FIXED' && months > 0) {
        monthly = opts.cost / months;
      } else if (opts.mode === 'PERCENTAGE' && opts.rate) {
        monthly = (opts.cost * opts.rate) / 100 / 12;
      }
    } else if (opts.method === 'DECLINING_BALANCE' && opts.rate) {
      monthly = (bookValue * opts.rate) / 100 / 12;
      bookValue -= monthly;
    }

    depreciation.push(parseFloat(monthly.toFixed(2)));
  }

  return depreciation;
}
