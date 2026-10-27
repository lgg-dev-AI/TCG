const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const screenshotsDir = 'C:/Users/Luis/.gemini/antigravity/brain/7753ee19-7e56-46fd-9c35-4a7eeedc39e5';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching browser in 1920x1080...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigating to landing page & logging in
    console.log('Navigating to http://localhost:4000 ...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=POKÉ', { timeout: 15000 });

    console.log('Logging in as admin via backdoor...');
    await page.click('button[title="Iniciar Sesión"]');
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', 'admin@pokevault.com');
    await page.click('form button[type="submit"]');

    await page.waitForSelector('input[placeholder="------"]', { state: 'visible' });
    await page.fill('input[placeholder="------"]', '2101');
    await page.click('form button[type="submit"]');

    // Wait for Admin Panel
    await page.waitForSelector('text=Panel de Administración', { state: 'visible' });
    await page.click('button:has-text("Inventario")');
    await delay(1000);

    // Open add product modal
    console.log('Opening "Agregar Producto" modal...');
    await page.click('button:has-text("Agregar Producto")');
    await page.waitForSelector('input[placeholder*="Elite Trainer Box"]', { state: 'visible' });
    await delay(1000);

    // Screenshot 1: Empty modal
    console.log('Taking Screenshot 1: Empty Modal');
    await page.screenshot({ path: path.join(screenshotsDir, '01_add_modal_empty.png') });

    // Step 2: Change category to Singles and search "Lucario" in API
    console.log('Selecting Singles category and searching Lucario...');
    await page.selectOption('select:has-text("Booster Box")', 'single');
    await page.waitForSelector('input[placeholder*="Buscar por nombre de carta"]', { state: 'visible' });
    await page.fill('input[placeholder*="Buscar por nombre de carta"]', 'Lucario');
    
    // Click the API search button
    await page.click('button:has-text("Buscar") >> nth=0'); 
    
    // Wait for search results
    await page.waitForSelector('div[style*="max-height: 480px"] img', { state: 'visible', timeout: 15000 });
    await delay(1500);

    // Screenshot 2: API Search Results
    console.log('Taking Screenshot 2: API Search Results');
    await page.screenshot({ path: path.join(screenshotsDir, '02_api_search_results.png') });

    // Step 3: Select a card to auto-fill the form and fill physical attributes
    console.log('Selecting a Lucario card and filling physical attributes...');
    await page.click('div[style*="max-height: 480px"] img >> nth=0'); // Click first result
    await delay(1000);

    // Fill physical attributes
    await page.fill('input[type="number"] >> nth=1', '3'); // Stock = 3
    await page.selectOption('select:has-text("Inglés (USA)")', 'Japonés'); // Region = Japonés
    await page.selectOption('select:has-text("Near Mint")', 'LP'); // Condition = LP
    await page.fill('input[placeholder="e.g. Scarlet & Violet: 151"]', 'Star Birth'); // Pulled from
    await delay(1000);

    // Screenshot 3: Filled form
    console.log('Taking Screenshot 3: Filled Form');
    await page.screenshot({ path: path.join(screenshotsDir, '03_filled_form.png') });

    // Step 4: Click Save and view in admin inventory
    console.log('Saving product...');
    await page.click('button:has-text("Guardar Producto")');
    await delay(3000);

    // Screenshot 4: Admin Inventory
    console.log('Taking Screenshot 4: Admin Inventory');
    await page.screenshot({ path: path.join(screenshotsDir, '04_admin_inventory.png') });

    // Step 5: Logout and navigate to public catalog
    console.log('Logging out...');
    await page.click('button[title="Cerrar Sesión"]');
    await delay(1500);

    console.log('Navigating to public shop catalogue...');
    await page.click('button:has-text("Tienda")');
    await delay(1500);

    // Screenshot 5: Public Catalog
    console.log('Taking Screenshot 5: Public Catalog');
    await page.screenshot({ path: path.join(screenshotsDir, '05_public_catalog.png') });

    // Step 6: Filter by Singles and search Lucario
    console.log('Filtering by Cartas Sueltas and searching Lucario...');
    await page.click('button:has-text("Cartas Sueltas")');
    await page.fill('input[placeholder="Buscar cartas..."]', 'Lucario');
    await delay(2000);

    // Screenshot 6: Filtered Catalog showing Lucario
    console.log('Taking Screenshot 6: Filtered Catalog');
    await page.screenshot({ path: path.join(screenshotsDir, '06_public_catalog_lucario.png') });

    // Step 7: Open detailed modal
    console.log('Opening product detailed modal...');
    await page.click('button[title="Ver Detalles"]');
    await delay(2000);

    // Screenshot 7: Lucario Modal Details
    console.log('Taking Screenshot 7: Lucario Modal Details');
    await page.screenshot({ path: path.join(screenshotsDir, '07_lucario_modal_details.png') });

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot generation:', err);
  } finally {
    await browser.close();
  }
}

run();
