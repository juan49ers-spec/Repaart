import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

  console.log('Navigating to https://repaartfinanzas.web.app...');
  try {
    await page.goto('https://repaartfinanzas.web.app', { waitUntil: 'networkidle' });
    console.log('Waiting for potential errors...');
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('Failed to load page:', err.message);
  }
  
  await browser.close();
})();
