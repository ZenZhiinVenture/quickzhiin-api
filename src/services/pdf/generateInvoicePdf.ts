import path from 'path';
import fs from 'fs/promises';
// @ts-expect-error: No type definitions for ejs
import ejs from 'ejs';
import puppeteer from 'puppeteer';

// Type for invoice data (reuse your Invoice type or define as needed)
interface InvoiceLine {
  productName: string;
  description: string;
  classificationCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

interface InvoiceData {
  number: string;
  date: Date;
  customer: Record<string, unknown>; // Use Record for flexibility since it points to User in Prisma
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  dueDate?: Date;
  billingAddress?: string;
  shippingAddress?: string;
  invoiceLines: InvoiceLine[];
}

/**
 * Generates a PDF buffer for an invoice using EJS and Puppeteer.
 * @param invoice Invoice data (with lines and customer info)
 * @returns Buffer (PDF)
 */
export async function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  // 1. Load HTML template
  const templatePath = path.resolve(__dirname, '../../template/sampleInvoice.html');
  const template = await fs.readFile(templatePath, 'utf-8');

  // 2. Render HTML with EJS
  const html = ejs.render(template, { invoice });

  // 3. Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // Ensure the return type is Buffer
  return Buffer.from(pdfBuffer);
}
