import { build, preview } from 'vite';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const root = dirname(fileURLToPath(import.meta.url));

if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
  throw new Error(
    'PUPPETEER_EXECUTABLE_PATH is not set. Point it to your Chrome/Chromium executable (e.g. `export PUPPETEER_EXECUTABLE_PATH=$(which google-chrome)`).',
  );
}

await build({
  root,
  build: {
    sourcemap: false,
  },
});
const server = await preview({
  root,
});
let browser;
try {
  browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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
