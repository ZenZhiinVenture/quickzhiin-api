// helpers/formatPaginatedResult.ts
import { PaginatedResult } from '../types/pagination';

export function formatPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
