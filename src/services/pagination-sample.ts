// services/userService.ts
import { getPaginationParams } from '../utils/pagination';
import { formatPaginatedResult } from '../helpers/formatPaginatedResult';
import { PaginatedResult } from '../types/pagination';
import { User } from '@prisma/client';
import { prisma } from './prisma/prismaClient';

export async function getPaginatedUsers(
  page = 1,
  limit = 10): Promise<PaginatedResult<User>> {
  const { offset, limit: safeLimit, page: safePage } = getPaginationParams(page, limit);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: offset,
      take: safeLimit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return formatPaginatedResult(users, total, safePage, safeLimit);
}
