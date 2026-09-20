import { AuthUser } from './auth';

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      user?: User | AuthUser;
      tenant?: any;
      tenantAccess?: {
        role: string;
        roleId?: number;
      };
    }
  }
}

export { Express };
