import { productSchema } from '../../schemas/product';
import { Product } from '@prisma/client';
import { prisma } from '../prisma/prismaClient';

export default async function upsertProduct(
  data: Product,
  userId: number,
  productId: number | undefined) {
  try {
    const now = new Date();

    const validateData = productSchema.parse(data);

    return await prisma.product.upsert({
      where: {
        id: productId ? BigInt(productId) : 0n,
      },
      create: {
        name: validateData.name,
        sku: validateData.sku,
        barcode: validateData.barcode,
        description: validateData.description,
        classificationCode: validateData.classificationCode ? BigInt(validateData.classificationCode) : null,
        productType: validateData.productType,
        salePrice: validateData.salePrice,
        saleDescription: validateData.saleDescription,
        saleAccountId: validateData.saleAccountId ? BigInt(validateData.saleAccountId) : null,
        purchasePrice: validateData.purchasePrice,
        purchaseAccountId: validateData.purchaseAccountId ? BigInt(validateData.purchaseAccountId) : null,
        purchaseDescription: validateData.purchaseDescription,
        uom: validateData.uom,
        quantityOnHand: validateData.quantityOnHand,
        reorderLevel: validateData.reorderLevel,
        isInventory: validateData.isInventory, msicCode: validateData.msicCode, msicDescription: validateData.msicDescription,
        categoryId: validateData.categoryId ? BigInt(validateData.categoryId) : null,
        isActive: validateData.isActive,
        createdAt: now,
        createdBy: BigInt(userId),
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
      update: {
        name: validateData.name,
        sku: validateData.sku,
        barcode: validateData.barcode,
        description: validateData.description,
        classificationCode: validateData.classificationCode ? BigInt(validateData.classificationCode) : null,
        productType: validateData.productType,
        salePrice: validateData.salePrice,
        saleDescription: validateData.saleDescription,
        saleAccountId: validateData.saleAccountId ? BigInt(validateData.saleAccountId) : null,
        purchasePrice: validateData.purchasePrice,
        purchaseAccountId: validateData.purchaseAccountId ? BigInt(validateData.purchaseAccountId) : null,
        purchaseDescription: validateData.purchaseDescription,
        uom: validateData.uom,
        quantityOnHand: validateData.quantityOnHand,
        reorderLevel: validateData.reorderLevel,
        isInventory: validateData.isInventory, msicCode: validateData.msicCode, msicDescription: validateData.msicDescription,
        categoryId: validateData.categoryId ? BigInt(validateData.categoryId) : null,
        isActive: validateData.isActive,
        updatedAt: now,
        updatedBy: BigInt(userId),
      },
    });
  } catch (err) {
    throw err;
  }
}
