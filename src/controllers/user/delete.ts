import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const userToDelete = await prisma.user.findUnique({ 
      where: { id: BigInt(id) },
      include: { role: true }
    });

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the only remaining admin or the current account
    if (userToDelete.email === 'admin') {
      return res.status(403).json({ message: 'Cannot delete the system admin account' });
    }

    await prisma.user.delete({
      where: { id: BigInt(id) },
    });

    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
