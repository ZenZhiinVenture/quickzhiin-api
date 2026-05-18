// utils/pagination.ts
export function getPaginationParams(page = 1, limit = 10) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const offset = (safePage - 1) * safeLimit;
  return { offset, limit: safeLimit, page: safePage };
}
