import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://science.nasa.gov/specials/your-name-in-landsat/', { waitUntil: 'networkidle' });
  
  await page.fill('#nameInput', 'TEST');
  await page.click('#enterButton');
  await page.waitForTimeout(2000); // wait for generation
  
  // Find container for the generated images
  const imgs = await page.$$eval('img', elements => elements.map(e => e.src));
  
  // Also dump large divs
  const divs = await page.$$eval('div', elements => elements.map(e => ({
    id: e.id,
    className: e.className
  })).filter(e => e.id || e.className));

  console.log('Images found:', imgs);
  console.log('Divs:', divs);
  
  await browser.close();
})();
