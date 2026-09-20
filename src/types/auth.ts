export interface TenantAccess {
  tenantCode: string;
  tenantId: number;
  role: string;       // OWNER | ACCOUNTANT | CASHIER | INVENTORY_MANAGER
  roleId?: number;    // Points to Role.id in the tenant DB
}

export interface AuthUser {
  id: number;
  email: string;
  tenantAccess: TenantAccess[];
  // Legacy fields kept for backward compatibility during migration
  roleId?: number;
  permissions?: string[];
  googleAccessToken?: string;
  googleRefreshToken?: string;
  discordAccessToken?: string;
  discordRefreshToken?: string;
}
