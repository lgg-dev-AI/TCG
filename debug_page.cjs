const { chromium } = require('playwright');
const fs = require('fs');

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log('Navigating to http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    console.log('Page title:', await page.title());
    const html = await page.content();
    fs.writeFileSync('page_dump.html', html);
    console.log('HTML dumped to page_dump.html');
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot saved to screenshot.png');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}
debug();
