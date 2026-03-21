import { chromium } from 'playwright';
import { spawn } from 'child_process';

(async () => {
  console.log('Starting preview server...');
  const previewProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'preview'], { stdio: 'pipe' });
  
  await new Promise(r => setTimeout(r, 4000));

  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('\n\n=== PAGE ERROR ===\n', error.stack || error.message, '\n==================\n'));

  console.log('Navigating to http://localhost:4173...');
  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('Navigation failed:', err.message);
  }
  
  await browser.close();
  previewProcess.kill();
  console.log('Done.');
})();
