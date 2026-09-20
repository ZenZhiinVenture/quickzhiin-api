import { Request, Response, NextFunction } from 'express';
import { lhdnApiService } from '../../services/lhdn/api';
import logger from '../../utils/logger';

export const submitLhdnInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const result = await lhdnApiService.submitInvoice(BigInt(id));
    
    return res.status(200).json({
      status: 'success',
      message: 'Invoice successfully submitted to LHDN.',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error in submitLhdnInvoice controller:', error);
    return res.status(500).json({ message: error.message || 'Failed to submit invoice to LHDN' });
  }
};

export const getLhdnInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const result = await lhdnApiService.getDocumentStatus(BigInt(id));
    
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error in getLhdnInvoiceStatus controller:', error);
    return res.status(500).json({ message: error.message || 'Failed to get LHDN invoice status' });
  }
};
