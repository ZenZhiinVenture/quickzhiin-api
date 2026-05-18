export interface AuthUser {
  id: number;
  email: string;
  roleId: number;
  permissions: string[];
  googleAccessToken?: string;
  googleRefreshToken?: string;
  discordAccessToken?: string;
  discordRefreshToken?: string;
}
