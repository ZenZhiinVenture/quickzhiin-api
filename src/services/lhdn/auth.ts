import axios from 'axios';
import { prisma } from '../prisma/prismaClient';
import logger from '../../utils/logger';

export interface LhdnConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  tin: string;
}

export const lhdnAuthService = {
  /**
   * Fetch LHDN settings for the current tenant from the database.
   */
  async getConfig(): Promise<LhdnConfig> {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['LHDN_CLIENT_ID', 'LHDN_CLIENT_SECRET', 'LHDN_ENVIRONMENT', 'LHDN_TIN'],
        },
      },
    });

    const configMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    if (!configMap['LHDN_CLIENT_ID'] || !configMap['LHDN_CLIENT_SECRET']) {
      throw new Error('LHDN credentials are not configured in settings.');
    }

    return {
      clientId: configMap['LHDN_CLIENT_ID'],
      clientSecret: configMap['LHDN_CLIENT_SECRET'],
      environment: (configMap['LHDN_ENVIRONMENT'] as 'sandbox' | 'production') || 'sandbox',
      tin: configMap['LHDN_TIN'] || '',
    };
  },

  /**
   * Generate an OAuth2 Bearer token from the LHDN Identity Server.
   * Note: The caller must provide the tenant context via the global Prisma proxy,
   * so `getConfig()` will pull the specific tenant's settings.
   */
  async getAccessToken(): Promise<string> {
    const config = await this.getConfig();

    const identityUrl =
      config.environment === 'production'
        ? 'https://api.myinvois.hasil.gov.my/connect/token'
        : 'https://preprod-api.myinvois.hasil.gov.my/connect/token';

    const params = new URLSearchParams();
    params.append('client_id', config.clientId);
    params.append('client_secret', config.clientSecret);
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'InvoicingAPI');

    try {
      const response = await axios.post(identityUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data.access_token;
    } catch (error: any) {
      logger.error('Failed to authenticate with LHDN:', error.response?.data || error.message);
      throw new Error('Failed to get LHDN access token.');
    }
  },
};
