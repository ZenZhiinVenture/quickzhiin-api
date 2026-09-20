import nodemailer from 'nodemailer';
import { pdfGeneratorService } from '../pdf/invoice-generator';
import logger from '../../utils/logger';

// Create reusable transporter object using standard SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  async sendInvoiceEmail(invoiceId: bigint, toEmail: string, invoiceNumber: string) {
    try {
      const pdfBuffer = await pdfGeneratorService.generateInvoicePdf(invoiceId);

      const info = await transporter.sendMail({
        from: `"QuickZhiin Accounting" <${process.env.SMTP_FROM || 'no-reply@quickzhiin.com'}>`,
        to: toEmail,
        subject: `Invoice ${invoiceNumber} from QuickZhiin`,
        text: `Please find attached your invoice ${invoiceNumber}.`,
        html: `<p>Dear Customer,</p><p>Please find attached your invoice <b>${invoiceNumber}</b>.</p><p>Thank you for your business!</p>`,
        attachments: [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      logger.info('Message sent: %s', info.messageId);
      return info;
    } catch (error) {
      logger.error('Error sending invoice email:', error);
      throw error;
    }
  }
};
