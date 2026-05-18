import { prisma } from '../prisma/prismaClient';

export async function isEmailExist(email: string): Promise<boolean> {
  const user = await prisma.user.findFirst({ where: { email } });
  return user !== null;
}

export async function registerUser(userData: {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
}) {
  // Ensure a default Admin role exists (id=1), otherwise use the first role
  const defaultRole = await prisma.role.findFirst({
    where: { name: 'Admin' },
    orderBy: { id: 'asc' },
  });

  if (!defaultRole) {
    throw new Error('No roles found. Please seed the database first.');
  }

  return prisma.user.create({
    data: {
      ...userData,
      roleId: defaultRole.id,
    },
  });
}
