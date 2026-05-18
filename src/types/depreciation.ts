export interface DepreciationOptions {
  cost: number;
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  mode: 'FIXED' | 'PERCENTAGE';
  rate?: number; // Only for percentage mode
  years?: number; // Only for fixed mode
  months?: number;
  startDate: Date;
  convention?: 'FULL_MONTH' | 'HALF_YEAR' | 'MID_MONTH';
}
