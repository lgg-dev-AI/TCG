try {
  const { chromium } = require('playwright');
  console.log('Playwright is available!');
} catch (err) {
  console.error('Playwright not found:', err.message);
}
