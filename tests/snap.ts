import { chromium } from '@playwright/test';
import * as path from 'path';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto('http://localhost:3000/merch/test');
  await page.waitForLoadState('networkidle');

  const outDir = path.join(process.cwd(), 'tests', 'visual', 'screenshots');
  const outPath = path.join(outDir, 'merch-current.png');
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Saved screenshot to:', outPath);
  await browser.close();
}

main().catch(console.error);
