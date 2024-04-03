import { build, preview } from 'vite';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const root = dirname(fileURLToPath(import.meta.url));

await build({
  root,
});
const server = await preview({
  root,
});
let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction('!!window.TEST', { timeout: 5000 });
  await page.evaluate(() => {
    window.TEST();
  });
} finally {
  server.httpServer.close();
  try {
    await browser.close();
  } catch (e) {
    console.error('Failed to close browser:', e);
  }
}

console.log('Success!');
process.exit(0);
