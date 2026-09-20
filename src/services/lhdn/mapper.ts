import { lhdnAuthService } from './auth';

export const lhdnMapperService = {
  /**
   * Convert an internal Invoice to LHDN JSON Document Format (UBL 2.1 equivalent in JSON)
   */
  async mapInvoiceToLhdnJson(invoice: any): Promise<any> {
    const config = await lhdnAuthService.getConfig();

    // 1. Determine Buyer Details (with Fallback to General Public)
    const isB2B = !!invoice.contact.taxNumber;
    const buyerTin = invoice.contact.taxNumber || 'EI00000000010';
    const buyerName = invoice.contact.name || 'General Public';
    
    // Default to NA if it's a general public walk-in without a BRN/NRIC
    const buyerIdType = isB2B ? 'BRN' : 'NA';
    const buyerIdValue = invoice.contact.registrationNumber || 'NA';

    // 2. Map Lines
    const documentLines = invoice.invoiceLines.map((line: any, index: number) => {
      // These codes are standard LHDN codes. In a real system, you'd map these from the Product/Tax models.
      // E.g., Standard rate is typically '01' (Sales Tax), or '06' for Service Tax, or 'E' for Exempt.
      const taxType = '06'; // Example placeholder
      const taxRate = line.tax > 0 ? 6 : 0; // Example placeholder

      return {
        lineClassification: '01',
        itemClassification: line.product?.classificationCode || '001', // Example MSIC/Classification
        itemDescription: line.productName,
        quantity: parseFloat(line.quantity),
        unitPrice: parseFloat(line.unitPrice),
        discountAmount: parseFloat(line.discount || 0),
        taxType: taxType,
        taxRate: taxRate,
        taxAmount: parseFloat(line.tax || 0),
        subtotal: (parseFloat(line.quantity) * parseFloat(line.unitPrice)) - parseFloat(line.discount || 0),
        totalAmount: parseFloat(line.total),
      };
    });

    // 3. Assemble LHDN JSON
    // Note: This is a simplified version of the LHDN JSON schema for demonstration.
    // The actual MyInvois schema involves deeper nesting (e.g., AccountingSupplierParty, etc.)
    const lhdnDocument = {
      _version: '1.0',
      documentType: '01', // 01 = Invoice
      documentNumber: invoice.number,
      documentDate: invoice.date.toISOString(),
      documentCurrency: invoice.currency,
      issuer: {
        tin: config.tin,
        registrationName: config.tin, // Normally fetched from company settings
        industryCode: '00000', // Need from settings
      },
      buyer: {
        tin: buyerTin,
        registrationName: buyerName,
        idType: buyerIdType,
        idValue: buyerIdValue,
        contact: {
          telephone: invoice.contact.phone || 'NA',
          email: invoice.contact.email || 'NA',
        },
      },
      lines: documentLines,
      summary: {
        subtotal: parseFloat(invoice.subtotal),
        totalTax: parseFloat(invoice.tax),
        totalDiscount: parseFloat(invoice.discount),
        totalAmount: parseFloat(invoice.total),
      },
    };

    return lhdnDocument;
  },
};
