import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://science.nasa.gov/specials/your-name-in-landsat/', { waitUntil: 'networkidle' });
  const content = await page.content();
  console.log(content);
  await browser.close();
})();
