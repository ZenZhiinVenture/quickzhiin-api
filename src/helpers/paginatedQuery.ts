import { Request } from 'express';

export async function paginatedQuery<T extends { findMany: Function; count: Function }>(
  model: T,
  req: Request,
  select = {},
  extraWhere = {}
) {
  const page = Number(req.query.page) || 1;
  const size = Number(req.query.size) || 10;
  const skip = (page - 1) * size;
  const take = size;

  const where = { ...extraWhere };
  const orderBy = req.query.sortBy
    ? { [req.query.sortBy as string]: req.query.sortOrder === 'desc' ? 'desc' : 'asc' }
    : { createdAt: 'desc' };

  const [data, total] = await Promise.all([
    model.findMany({ select, where, skip, take, orderBy }),
    model.count({ where }),
  ]);

  return {
    items: data,
    pagination: {
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    },
  };
}
