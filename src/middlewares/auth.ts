import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate requests using JWT.
 * Attaches decoded user payload (id, roleId, permissions) to req.user.
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'error_unauthorized' });
  }

  const token = authHeader.split(' ')[1] || '';

  if (!token) {
    return res.status(401).json({ message: 'error_no_token' });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded.id) {
      return res.status(403).json({ message: 'error_invalid_token_payload' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      roleId: decoded.roleId,
      permissions: decoded.permissions,
      googleAccessToken: decoded.googleAccessToken,
      googleRefreshToken: decoded.googleRefreshToken,
      discordAccessToken: decoded.discordAccessToken,
      discordRefreshToken: decoded.discordRefreshToken,
    };

    next();
    return;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'error_token_expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: 'error_invalid_token' });
    }
    return res.status(403).json({ message: 'error_token_verification_failed' });
  }
};
