import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../utils/jwt';
import logger from '../../utils/logger';

/**
 * Verifies the JWT token.
 * Returns the decoded user data.
 */
export default async function verifyJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    try {
      const decoded = verifyToken(token);
      return res.status(200).json({
        user: decoded,
      });
    } catch (error) {
      logger.warn('Token verification failed', { error: (error as Error).message });
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
  } catch (error) {
    next();
    return res.status(500).json({ message: 'Internal server error during verification' });
  }
}
