import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import logger from '../../utils/logger';

async function generatePdf(data: Record<string, unknown>, templateName: string, outputPath: string) {
  // Load the HTML template
  const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  // Compile the Handlebars template with data
  const template = handlebars.compile(templateHtml);
  const html = template(data);

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  logger.info(`PDF generated at: ${outputPath}`);
}

export default generatePdf;
