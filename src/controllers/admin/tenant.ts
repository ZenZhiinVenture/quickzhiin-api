import { Request, Response, NextFunction } from 'express';
import { tenantProvisionerService } from '../../../services/tenant/provisioner';
import logger from '../../../utils/logger';

export const provisionTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, companyCode, adminEmail, adminPassword } = req.body;

    if (!companyName || !companyCode || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const tenant = await tenantProvisionerService.provisionNewTenant(
      companyName,
      companyCode,
      adminEmail,
      adminPassword
    );

    res.status(201).json({
      status: 'success',
      data: {
        tenantId: tenant.id.toString(),
        code: tenant.code,
        dbName: tenant.dbName
      }
    });
  } catch (error: any) {
    logger.error('Error provisioning tenant:', error);
    res.status(500).json({ message: error.message || 'Failed to provision tenant' });
  }
};
