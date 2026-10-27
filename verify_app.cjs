const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('--- STARTING POKEVAULT END-TO-END VERIFICATION TEST ---');
  
  const screenshotsDir = path.resolve('./public/test_results');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Listen to console logs in the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  try {
    // Step 1: Access the Landing Page
    console.log('[STEP 1] Navigating to http://localhost:4000 ...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=POKÉ', { timeout: 15000 });
    console.log('✓ Landing page loaded successfully.');
    await page.screenshot({ path: path.join(screenshotsDir, '01_landing_page.png') });

    // Step 2: Login via Backdoor (Code 2101)
    console.log('[STEP 2] Triggering Admin Backdoor login (2101) ...');
    await page.click('button[title="Iniciar Sesión"]');
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@pokevault.com');
    await page.click('form button[type="submit"]');
    
    // Wait for the OTP input to be visible
    console.log('Waiting for OTP input (------)...');
    await page.waitForSelector('input[placeholder="------"]', { state: 'visible', timeout: 10000 });
    
    // Fill the admin backdoor OTP 2101
    await page.fill('input[placeholder="------"]', '2101');
    await page.click('form button[type="submit"]');
    
    // Wait for redirection to Admin Panel
    console.log('Waiting for Panel de Administración header...');
    await page.waitForSelector('text=Panel de Administración', { state: 'visible', timeout: 15000 });
    
    const headerText = await page.locator('h2').first().innerText();
    console.log(`✓ Logged in. Redirected header text: "${headerText}"`);
    await page.screenshot({ path: path.join(screenshotsDir, '02_admin_panel.png') });

    // Step 3: Add new Single card product using templates & physical parameters
    console.log('[STEP 3] Testing "Agregar Producto" in inventory tab...');
    await page.click('button:has-text("Inventario")');
    await page.click('button:has-text("Agregar Producto")');
    await page.waitForSelector('input[placeholder*="Elite Trainer Box"]', { state: 'visible', timeout: 5000 });
    
    // Fill product details
    await page.fill('input[placeholder*="Elite Trainer Box"]', 'Lugia V (Promo)');
    await page.selectOption('select:has-text("Booster Box")', 'single');
    
    // Check physical inputs are shown
    await page.waitForSelector('select:has-text("Inglés (USA)")', { state: 'visible', timeout: 5000 });
    await page.fill('input[type="number"] >> nth=0', '350'); // Price MXN
    await page.fill('input[type="number"] >> nth=1', '5');   // Stock
    
    // Select physical details
    await page.selectOption('select:has-text("Inglés (USA)")', 'Japonés');
    await page.fill('input[placeholder="e.g. Scarlet & Violet: 151"]', 'Silver Tempest');
    await page.selectOption('select:has-text("Near Mint")', 'NM');
    
    // Save product
    await page.click('button:has-text("Guardar Producto")');
    await delay(3000);
    console.log('✓ Product added successfully.');
    await page.screenshot({ path: path.join(screenshotsDir, '03_product_added.png') });

    // Step 4: Access Shop Catalog as public customer
    console.log('[STEP 4] Logging out and visiting the store catalog...');
    await page.click('button[title="Cerrar Sesión"]');
    await delay(1500);
    await page.click('button:has-text("Tienda")');
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '04_public_catalog.png') });

    // Step 5: Verify product physical details modal
    console.log('[STEP 5] Clicking product to view detailed modal attributes...');
    await page.click('button[title="Ver Detalles"] >> nth=0');
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '05_card_modal_details.png') });
    
    // Close modal
    await page.click('button[aria-label="Cerrar detalles"]');
    await delay(1000);

    console.log('--- ALL E2E TESTS COMPLETED SUCCESSFULY ---');
  } catch (err) {
    console.error('✖ Error occurred during test execution:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'error_screenshot.png') });
  } finally {
    await browser.close();
    console.log('Test browser closed. Results saved in public/test_results/');
  }
}

runTest();
