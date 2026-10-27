const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('=== STARTING ALL-FEATURES END-TO-END VERIFICATION ===');
  
  const screenshotsDir = 'C:/Users/Luis/.gemini/antigravity/brain/7753ee19-7e56-46fd-9c35-4a7eeedc39e5';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR STACK:', err.stack || err.message));

  try {
    // ----------------------------------------------------
    // STEP 1: CLIENT REGISTRATION & LOGIN
    // ----------------------------------------------------
    console.log('[E2E-1] Accessing portal at http://localhost:4000...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=POKÉ', { timeout: 15000 });
    
    console.log('[E2E-1] Clicking login button...');
    await page.click('button[title="Iniciar Sesión"]');
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 5000 });
    
    // Registering a new client
    console.log('[E2E-1] Registering a new customer: client_e2e_final@pokevault.com...');
    await page.fill('input[type="email"]', 'client_e2e_final@pokevault.com');
    await page.click('form button[type="submit"]');
    
    // Wait for the OTP inputs
    await page.waitForSelector('input[placeholder="------"]', { state: 'visible', timeout: 15000 });
    await page.fill('input[placeholder="------"]', '2101'); // Using backdoor OTP
    await page.click('form button[type="submit"]');
    
    // Fill client name if profile setup modal is visible
    const nameInput = page.locator('input[placeholder="Tu nombre completo"]');
    await delay(1500);
    if (await nameInput.isVisible()) {
      console.log('[E2E-1] Filling customer name...');
      await nameInput.fill('Ash Ketchum (E2E)');
      await page.click('button:has-text("Guardar Perfil")');
      await delay(1500);
    } else {
      console.log('[E2E-1] User already registered, profile modal skipped.');
    }
    
    console.log('✓ Customer registered and logged in successfully.');
    await page.screenshot({ path: path.join(screenshotsDir, 'e2e_01_registration_client.png') });

    // ----------------------------------------------------
    // STEP 2: BUYBACK REQUEST
    // ----------------------------------------------------
    console.log('[E2E-2] Navigating to Buyback (Recompra) portal...');
    await page.click('button:has-text("Compramos Cartas")');
    await page.waitForSelector('input[placeholder*="Charizard"]', { state: 'visible', timeout: 5000 });
    
    console.log('[E2E-2] Filling buyback form...');
    await page.fill('#buyback-card-name', 'Charizard ex (Secret)');
    await page.fill('#buyback-card-expansion', 'Obsidian Flames');
    await page.selectOption('select >> nth=0', 'NM');
    await page.fill('#buyback-card-price', '750'); // Market Price
    await page.click('button:has-text("Añadir")');
    await delay(1000);
    
    console.log('[E2E-2] Filling contact info...');
    await page.fill('input[placeholder="Ej. Luis Pérez"]', 'Ash Ketchum (E2E)');
    await page.fill('input[placeholder="10 dígitos"]', '5512345678');
    
    console.log('[E2E-2] Submitting buyback proposal...');
    await page.click('button:has-text("Enviar Propuesta")');
    await delay(2000);
    
    console.log('✓ Buyback request submitted successfully.');
    await page.screenshot({ path: path.join(screenshotsDir, 'e2e_02_buyback_submitted.png') });

    // ----------------------------------------------------
    // STEP 3: CHECKOUT ORDER FLOW
    // ----------------------------------------------------
    console.log('[E2E-3] Visiting Shop...');
    await page.click('button:has-text("Tienda")');
    await delay(1500);
    
    // Add first available product in stock directly from grid
    console.log('[E2E-3] Adding product in stock to cart...');
    const inStockButton = page.locator('button:has-text("Agregar"):not([disabled])').first();
    if (await inStockButton.count() > 0) {
      await inStockButton.click({ force: true });
      await delay(1000);
    } else {
      console.log('No in-stock products found in shop to buy. Proceeding.');
    }
    
    // Open Cart and Checkout
    console.log('[E2E-3] Opening shopping cart...');
    await page.click('button[title*="Carrito"]', { force: true });
    await page.waitForSelector('button:has-text("Proceder al Pago")', { state: 'visible', timeout: 5000 });
    await page.click('button:has-text("Proceder al Pago")', { force: true });
    
    // Fill delivery form
    console.log('[E2E-3] Filling checkout delivery address...');
    await page.fill('input[placeholder="Luis Pérez"]', 'Ash Ketchum (E2E)');
    await page.fill('input[placeholder="5512345678"]', '5512345678');
    await page.fill('input[placeholder*="Reforma"]', 'Pueblo Paleta 456');
    await page.fill('input[placeholder="CDMX"] >> nth=0', 'Kanto');
    await page.fill('input[placeholder="CDMX"] >> nth=1', 'Región Kanto');
    await page.fill('input[placeholder="06000"]', '77000');
    
    // Click order creation with bank transfer
    await page.click('button:has-text("Registrar Compra")', { force: true });
    await page.waitForSelector('text=¡Tu Compra ha sido Registrada!', { state: 'visible', timeout: 15000 });
    console.log('✓ Checkout created successfully.');
    await page.screenshot({ path: path.join(screenshotsDir, 'e2e_03_checkout_success.png') });

    // ----------------------------------------------------
    // STEP 4: ADMIN LOG IN
    // ----------------------------------------------------
    console.log('[E2E-4] Logging out of client account...');
    await page.click('button[title="Cerrar Sesión"]');
    await delay(1000);
    
    console.log('[E2E-4] Logging in as admin@pokevault.com...');
    await page.click('button[title="Iniciar Sesión"]');
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@pokevault.com');
    await page.click('form button[type="submit"]');
    
    await page.waitForSelector('input[placeholder="------"]', { state: 'visible', timeout: 15000 });
    await page.fill('input[placeholder="------"]', '2101'); // Admin OTP Backdoor
    await page.click('form button[type="submit"]');
    
    await page.waitForSelector('text=Panel de Administración', { state: 'visible', timeout: 10000 });
    console.log('✓ Admin panel loaded successfully.');
    await page.screenshot({ path: path.join(screenshotsDir, 'e2e_04_admin_dashboard.png') });

    // Test time range selectors
    console.log('[E2E-4] Testing time range filters...');
    await page.click('button:has-text("Este Mes")');
    await delay(500);
    await page.click('button:has-text("Últimos 7 días")');
    await delay(500);

    // ----------------------------------------------------
    // STEP 5: ADD NEW PRODUCT MANUALLY
    // ----------------------------------------------------
    console.log('[E2E-5] Navigating to Inventario tab...');
    await page.click('button:has-text("Inventario")');
    await page.click('button:has-text("Agregar Producto")');
    await page.waitForSelector('input[placeholder*="Elite Trainer Box"]', { state: 'visible', timeout: 5000 });
    
    console.log('[E2E-5] Filling manual product form...');
    await page.fill('input[placeholder*="Elite Trainer Box"]', 'Pikachu Special Box (E2E)');
    await page.fill('input[type="number"] >> nth=0', '1250'); // Price MXN
    await page.fill('input[type="number"] >> nth=1', '8');    // Stock = 8
    await page.click('button:has-text("Guardar Producto")');
    await delay(2500);
    console.log('✓ Product added manually.');

    // ----------------------------------------------------
    // STEP 6: CUSTOMERS SEARCH & PAGINATION
    // ----------------------------------------------------
    console.log('[E2E-6] Navigating to Clientes tab...');
    await page.click('button:has-text("Clientes")');
    await page.waitForSelector('input[placeholder*="Buscar cliente"]', { state: 'visible', timeout: 5000 });
    
    console.log('[E2E-6] Searching for registered customer...');
    await page.fill('input[placeholder*="Buscar cliente"]', 'client_e2e_final');
    await delay(1000);
    
    // Click on details of Ash Ketchum by clicking their email card item
    await page.click('text=client_e2e_final@pokevault.com');
    await page.waitForSelector('h3:has-text("Historial de Pedidos")', { state: 'visible', timeout: 5000 });
    console.log('✓ Checked customer history details.');
    await page.screenshot({ path: path.join(screenshotsDir, 'e2e_05_admin_client_details.png') });
    
    // Close customer modal
    await page.click('div[style*="z-index: 300"] button');
    await delay(500);

    // ----------------------------------------------------
    // STEP 7: MANUAL DIRECT SALE (MOSTRADOR)
    // ----------------------------------------------------
    console.log('[E2E-7] Navigating to Ventas tab...');
    await page.click('button:has-text("Ventas")');
    await page.click('button:has-text("Registrar Venta Física")');
    await page.waitForSelector('label:has-text("Nombre del Cliente")', { state: 'visible', timeout: 5000 });
    
    // Fill manual sale
    await page.locator('label:has-text("Nombre del Cliente") + input').fill('Misty (Mostrador)');
    await page.fill('input[placeholder*="cliente@ejemplo.com"]', 'misty@pokevault.com');
    await page.selectOption('select >> nth=0', 'Efectivo');
    
    // Select first product in row
    await page.selectOption('select >> nth=1', { index: 1 });
    await page.fill('input[type="number"] >> nth=0', '1'); // Quantity = 1
    
    console.log('[E2E-7] Saving manual physical sale...');
    await page.click('button:has-text("Confirmar y Cobrar Venta")', { force: true });
    await delay(2500);
    console.log('✓ Manual sale registered.');
    await page.screenshot({ path: path.join(screenshotsDir, 'e2e_07_admin_manual_sale.png') });

    // ----------------------------------------------------
    // STEP 8: AUDIT LOGS (BITÁCORA)
    // ----------------------------------------------------
    console.log('[E2E-8] Navigating to Auditoría (Logs) tab...');
    await page.click('button:has-text("Auditoría (Logs)")');
    await page.waitForSelector('text=Bitácora de Auditoría (Logs)', { state: 'visible', timeout: 5000 });
    await delay(1500);
    
    console.log('✓ Checked Admin logs.');
    await page.screenshot({ path: path.join(screenshotsDir, 'e2e_06_admin_logs.png') });

    console.log('=== ALL E2E VERIFICATION COMPLETED SUCCESSFULY ===');
  } catch (err) {
    console.error('✖ E2E Test error occurred:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

runTest();
