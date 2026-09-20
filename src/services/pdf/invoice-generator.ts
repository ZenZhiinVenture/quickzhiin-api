import puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { prisma } from '../../services/prisma/prismaClient';

const invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Invoice {{invoice.number}}</title>
    <style>
        body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; }
        .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
        .invoice-box table td { padding: 5px; vertical-align: top; }
        .invoice-box table tr td:nth-child(2) { text-align: right; }
        .invoice-box table tr.top table td { padding-bottom: 20px; }
        .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
        .invoice-box table tr.information table td { padding-bottom: 40px; }
        .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
        .invoice-box table tr.details td { padding-bottom: 20px; }
        .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
        .invoice-box table tr.item.last td { border-bottom: none; }
        .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <table>
            <tr class="top">
                <td colspan="2">
                    <table>
                        <tr>
                            <td class="title">
                                <h2>TAX INVOICE</h2>
                            </td>
                            <td>
                                Invoice #: {{invoice.number}}<br />
                                Created: {{date}}<br />
                                Due: {{date}}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="information">
                <td colspan="2">
                    <table>
                        <tr>
                            <td>
                                <strong>From:</strong><br />
                                QuickZhiin Inc.<br />
                                123 Business Rd.<br />
                                Kuala Lumpur, Malaysia
                            </td>
                            <td>
                                <strong>To:</strong><br />
                                {{invoice.contact.legalname}}<br />
                                {{invoice.contact.email}}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <table style="margin-top: 20px;">
            <tr class="heading">
                <td>Item</td>
                <td style="text-align: right;">Quantity</td>
                <td style="text-align: right;">Price</td>
                <td style="text-align: right;">Amount</td>
            </tr>
            {{#each invoice.invoiceLines}}
            <tr class="item">
                <td>{{this.productName}}</td>
                <td style="text-align: right;">{{this.quantity}}</td>
                <td style="text-align: right;">RM {{this.unitPrice}}</td>
                <td style="text-align: right;">RM {{this.total}}</td>
            </tr>
            {{/each}}
            
            <tr class="total">
                <td colspan="3" style="text-align: right; padding-top: 20px;">Subtotal:</td>
                <td style="padding-top: 20px; text-align: right;">RM {{invoice.subtotal}}</td>
            </tr>
            <tr class="total">
                <td colspan="3" style="text-align: right;">Tax:</td>
                <td style="text-align: right;">RM {{invoice.tax}}</td>
            </tr>
            <tr class="total">
                <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                <td style="text-align: right;"><strong>RM {{invoice.total}}</strong></td>
            </tr>
        </table>
    </div>
</body>
</html>
`;

export const pdfGeneratorService = {
    async generateInvoicePdf(invoiceId: bigint): Promise<Buffer> {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                contact: true,
                invoiceLines: true,
            }
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const template = handlebars.compile(invoiceTemplate);
        const html = template({
            invoice,
            date: invoice.date.toISOString().split('T')[0],
        });

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        return Buffer.from(pdfBuffer);
    }
};
