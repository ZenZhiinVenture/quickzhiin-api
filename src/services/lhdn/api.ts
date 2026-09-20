import axios from 'axios';
import { lhdnAuthService } from './auth';
import { lhdnMapperService } from './mapper';
import { prisma } from '../prisma/prismaClient';
import logger from '../../utils/logger';

export const lhdnApiService = {
  /**
   * Submit an invoice to LHDN MyInvois System
   */
  async submitInvoice(invoiceId: bigint): Promise<any> {
    // 1. Fetch Invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contact: true,
        invoiceLines: true
      }
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.lhdnUuid && invoice.lhdnStatus === 'Valid') {
      throw new Error('Invoice is already successfully submitted and validated by LHDN.');
    }

    // 2. Map to LHDN format
    const lhdnDocument = await lhdnMapperService.mapInvoiceToLhdnJson(invoice);
    
    // 3. Get Credentials & Token
    const config = await lhdnAuthService.getConfig();
    const token = await lhdnAuthService.getAccessToken();

    const apiUrl = config.environment === 'production'
      ? 'https://api.myinvois.hasil.gov.my'
      : 'https://preprod-api.myinvois.hasil.gov.my';

    // 4. Submit to MyInvois (Batch structure)
    const payload = {
      documents: [
        {
          format: 'JSON',
          documentHash: 'calculate-sha256-hash-here', // Required by LHDN in real implementation
          document: lhdnDocument
        }
      ]
    };

    try {
      const response = await axios.post(`${apiUrl}/api/v1.0/documentsubmissions`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;
      
      // Update our database with the returned UUID (Assuming success for the batch)
      const lhdnUuid = result.acceptedDocuments?.[0]?.uuid || null;
      
      if (lhdnUuid) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            lhdnUuid,
            lhdnStatus: 'Submitted', // Requires polling to become 'Valid'
            lhdnSubmissionDate: new Date(),
          }
        });
      }

      return result;
    } catch (error: any) {
      logger.error('LHDN Submission Error:', error.response?.data || error.message);
      
      // Record the error
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          lhdnStatus: 'Invalid',
          lhdnError: JSON.stringify(error.response?.data || error.message)
        }
      });

      throw new Error('Failed to submit document to LHDN');
    }
  },

  /**
   * Poll LHDN to get the validation status of a submitted document
   */
  async getDocumentStatus(invoiceId: bigint): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { lhdnUuid: true }
    });

    if (!invoice?.lhdnUuid) {
      throw new Error('Invoice has not been submitted to LHDN yet.');
    }

    const config = await lhdnAuthService.getConfig();
    const token = await lhdnAuthService.getAccessToken();

    const apiUrl = config.environment === 'production'
      ? 'https://api.myinvois.hasil.gov.my'
      : 'https://preprod-api.myinvois.hasil.gov.my';

    try {
      const response = await axios.get(`${apiUrl}/api/v1.0/documents/${invoice.lhdnUuid}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data;
      
      // Update our DB if status changed
      if (data.status) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            lhdnStatus: data.status, // e.g. 'Valid', 'Invalid'
            lhdnValidationLink: data.validationUrl || null,
            lhdnLongId: data.longId || null,
          }
        });
      }

      return data;
    } catch (error: any) {
      logger.error('LHDN Status Check Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch LHDN document status');
    }
  }
};
