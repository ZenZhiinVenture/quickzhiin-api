import { AuthUser } from './auth';

declare global {
  declare namespace Express {
    interface User {
      id: number;
      email: string;
      roleId: number;
      permissions: string[];
      googleAccessToken?: string;
      googleRefreshToken?: string;
      discordAccessToken?: string;
      discordRefreshToken?: string;
    }

    interface Request {
      user?: User | AuthUser;
    }
  }
}

export { Express };
