import { Request, Response, NextFunction } from 'express';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tenantAccess = (req as any).tenantAccess;
    const role = (tenantAccess?.role || '').toUpperCase();

    // Allow OWNER or ADMIN
    if (role !== 'ADMIN' && role !== 'OWNER') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    return next();
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
