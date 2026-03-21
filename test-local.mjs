import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logStream = fs.createWriteStream('error.log', { flags: 'a' });
  
  page.on('console', msg => logStream.write(`PAGE LOG: ${msg.type()} ${msg.text()}\n`));
  page.on('pageerror', error => logStream.write(`\n\n=== PAGE ERROR ===\n${error.stack || error.message}\n==================\n`));

  try {
    await page.goto('http://localhost:4180', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  } catch (err) {
    logStream.write(`Navigation failed: ${err.message}\n`);
  }
  
  await browser.close();
  logStream.end();
})();
