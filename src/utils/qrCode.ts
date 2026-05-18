import QRCode from 'qrcode';

/**
 * Generates a QR code as a data URL for the LHDN validation link.
 * @param validationLink The validation link from LHDN (e.g., https://myinvois.hasil.gov.my/{uuid}/share/{longid})
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateLhdnQrCode(validationLink: string): Promise<string> {
  return QRCode.toDataURL(validationLink, { errorCorrectionLevel: 'H' });
}

export async function generateQrCode(text: string): Promise<string> {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'H' });
}

export async function generateQrCodeFromJson(json: any): Promise<string> {
  return QRCode.toDataURL(JSON.stringify(json), { errorCorrectionLevel: 'H' });
}