import config from '../config';
import { Email } from '../../types/email';
import logger from '../../utils/logger';

export async function sendEmail(emailContext: Email) {
  if (emailContext.from.length === 0) {
    emailContext.from = [config.email.from];
  }

  // Implement your email sending logic here
  logger.info(`Sending email to ${emailContext.to} with subject "${emailContext.subject}"`);
}

export async function sendResetEmail(email: string, token: string) {
  const resetLink = `${config.server.publicUrl}/resetpassword?token=${token}`;
  const subject = 'Password Reset Request';
  const text = `Click the link to reset your password: ${resetLink}`;

  await sendEmail({
    to: [email],
    from: [config.email.from],
    subject,
    text,
    html: `<p>${text}</p>`,
  });
}
