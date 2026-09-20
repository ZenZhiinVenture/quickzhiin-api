// services/userService.ts
import { getPaginationParams } from '../utils/pagination';
import { formatPaginatedResult } from '../helpers/formatPaginatedResult';
import { PaginatedResult } from '../types/pagination';
type User = any;
import { centralPrisma } from './prisma/prismaClient';

export async function getPaginatedUsers(
  page = 1,
  limit = 10): Promise<PaginatedResult<User>> {
  const { offset, limit: safeLimit, page: safePage } = getPaginationParams(page, limit);
  const [users, total] = await Promise.all([
    centralPrisma.user.findMany({
      skip: offset,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
    }),
    centralPrisma.user.count(),
  ]);

  return formatPaginatedResult(users, total, safePage, safeLimit);
}
