import { prisma } from '../prisma/prismaClient';

export const warehouseService = {
  /**
   * Create a new warehouse.
   */
  async create(data: {
    name: string;
    code: string;
    location?: string;
    description?: string;
    createdBy: bigint;
  }) {
    return await prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code,
        location: data.location,
        description: data.description,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    });
  },

  /**
   * List all active warehouses.
   */
  async list() {
    return await prisma.warehouse.findMany({
      where: { isActive: true },
    });
  },

  /**
   * Get warehouse details by ID, including inventory levels.
   */
  async getDetails(id: bigint) {
    return await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  /**
   * Update warehouse info.
   */
  async update(id: bigint, data: {
    name?: string;
    location?: string;
    description?: string;
    updatedBy: bigint;
  }) {
    return await prisma.warehouse.update({
      where: { id },
      data: {
        ...data,
      },
    });
  },
};
