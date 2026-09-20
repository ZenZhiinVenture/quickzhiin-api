import { centralPrisma } from '../prisma/prismaClient';

export async function isEmailExist(email: string): Promise<boolean> {
  const user = await centralPrisma.user.findFirst({ where: { email } });
  return user !== null;
}

// Kept for backward compatibility — but new code should use centralPrisma directly
export async function registerUser(userData: {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
}) {
  return centralPrisma.user.create({
    data: { ...userData },
  });
}
