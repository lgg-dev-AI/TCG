import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Helper delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('Starting Playwright script to record the PokéVault demo...');

  const browser = await chromium.launch({
    headless: true,
  });

  const videosDir = path.resolve('./videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir);
  }

  // Create context with video recording enabled
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: './videos',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  // Helper for clicking with logging
  async function clickElement(selector, description, waitAfter = 2000) {
    console.log(`[ACTION] Click: ${description}`);
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    // Highlight element slightly to make it visual
    await locator.evaluate((el) => {
      el.style.outline = '3px solid #ffcb05';
      el.style.outlineOffset = '2px';
    });
    await delay(500); // Small pause to show the highlight
    await locator.click();
    await delay(waitAfter);
  }

  // Helper for typing with logging
  async function typeElement(selector, text, description, typeDelay = 100, waitAfter = 1500) {
    console.log(`[ACTION] Type into ${description}: "${text}"`);
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    await locator.evaluate((el) => {
      el.style.outline = '3px solid #ffcb05';
      el.style.outlineOffset = '2px';
    });
    await delay(500);
    await locator.click();
    await locator.fill(''); // Clear field
    await locator.type(text, { delay: typeDelay });
    await locator.evaluate((el) => {
      el.style.outline = '';
    });
    await delay(waitAfter);
  }

  try {
    // 1. Navigate to homepage
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');
    // Wait for the main content to load
    await page.waitForSelector('h1:has-text("POKÉ")', { timeout: 15000 });
    console.log('Homepage loaded successfully.');
    await delay(3000);

    // 2. Click User Profile Icon to log in
    await clickElement('button[title="Iniciar Sesión"]', 'Boton Iniciar Sesion en Navbar', 2500);

    // 3. Fill Email Input
    await typeElement('input[type="email"]', 'luis.demo@pokevault.mx', 'Campo de Correo Electronico', 100, 1500);

    // 4. Click Send Code Button
    await clickElement('form button[type="submit"]', 'Boton Enviar Codigo de Acceso (submit)', 3000);

    // 5. Extract OTP from Toast Notification on screen
    console.log('Waiting for OTP toast notification to appear...');
    const otpSelector = 'span[style*="monospace"]';
    await page.waitForSelector(otpSelector, { timeout: 10000 });
    const otpCode = await page.locator(otpSelector).first().innerText();
    console.log(`Successfully extracted simulated OTP code: ${otpCode}`);
    await delay(1500);

    // 6. Enter OTP
    await typeElement('input[placeholder="123456"]', otpCode, 'Campo de Codigo OTP', 150, 1500);

    // 7. Click Verify Button
    await clickElement('form button[type="submit"]', 'Boton Verificar y Entrar (submit)', 3500);

    // 8. Open Account Panel
    await clickElement('button[title="Mi Cuenta"]', 'Boton Mi Cuenta en Navbar', 3000);

    // 9. Fill Personal Details
    // Clear and type full name
    console.log('Clearing and typing name...');
    const nameLocator = page.locator('input[placeholder="Tu nombre completo"]').first();
    await nameLocator.click();
    await nameLocator.press('Control+A');
    await nameLocator.press('Backspace');
    await delay(500);
    await nameLocator.type('Luis Fernando López', { delay: 100 });
    await delay(1000);

    // Clear and type phone
    console.log('Clearing and typing phone...');
    const phoneLocator = page.locator('input[placeholder="e.g. 5512345678"]').first();
    await phoneLocator.click();
    await phoneLocator.press('Control+A');
    await phoneLocator.press('Backspace');
    await delay(500);
    await phoneLocator.type('5587654321', { delay: 100 });
    await delay(1500);

    // Click Save changes button
    await clickElement('form button[type="submit"]', 'Boton Guardar Cambios (submit)', 3000);

    // 10. Click Shipping Address tab (using partial match without accents)
    await clickElement('button:has-text("Direcc")', 'Pestaña Direccion de Envio', 2500);

    // 11. Fill address details
    await typeElement('input[placeholder="Av. Paseo de la Reforma 123, Int 4B"]', 'Av. Juárez 456, Col. Centro', 'Campo Calle y Numero', 80, 1200);
    await typeElement('input[placeholder="Ciudad de México"]', 'Ciudad de México', 'Campo Ciudad', 80, 1200);
    await typeElement('input[placeholder="CDMX"]', 'CDMX', 'Campo Estado', 80, 1200);
    await typeElement('input[placeholder="06700"]', '06000', 'Campo Codigo Postal', 120, 1500);
    
    // Save Address
    await clickElement('form button[type="submit"]', 'Boton Guardar Direccion (submit)', 3500);

    // 12. Return to Store
    await clickElement('.nav-desktop button:has-text("Tienda")', 'Boton Tienda en Navbar', 3000);

    // 13. Filter by single cards ("Cartas Sueltas")
    await clickElement('button:has-text("Cartas Sueltas")', 'Boton de Categoria Cartas Sueltas', 3500);

    // Wait for the single cards to load and render
    console.log('Waiting for single cards to render...');
    await page.waitForSelector('.animate-fade-in-up', { timeout: 15000 });
    await delay(2000);

    // 14. Add products to favorites (click heart icons)
    // First card heart
    await clickElement('button[title="Agregar a Favoritos"] >> nth=0', 'Icono de Corazon del Primer Producto', 2000);
    // Second card heart
    await clickElement('button[title="Agregar a Favoritos"] >> nth=1', 'Icono de Corazon del Segundo Producto', 2500);

    // 15. Add products to cart
    // First card buy button
    await clickElement('button:has-text("Agregar") >> nth=0', 'Boton Agregar al Carrito del Primer Producto', 2500);

    // Close the cart drawer by clicking outside on the left side of the screen
    console.log('[ACTION] Click outside (left side) to close Cart Drawer');
    await page.mouse.click(100, 360);
    await delay(2000);

    // Second card buy button
    await clickElement('button:has-text("Agregar") >> nth=1', 'Boton Agregar al Carrito del Segundo Producto', 3500);

    // Close the cart drawer again to return to navbar actions
    console.log('[ACTION] Click outside (left side) to close Cart Drawer');
    await page.mouse.click(100, 360);
    await delay(2000);

    // 17. Go to Account Panel to show favorites
    await clickElement('button[title="Mi Cuenta"]', 'Boton Mi Cuenta en Navbar', 3000);

    // 18. Go to favorites tab
    await clickElement('button:has-text("Favoritos")', 'Pestaña Mis Favoritos', 4000);

    console.log('Script execution finished successfully.');
  } catch (error) {
    console.error('An error occurred during Playwright execution:', error);
  } finally {
    // Gracefully close the context and browser to save the video file
    await context.close();
    await browser.close();
    console.log('Browser closed. Video recording has been finalized.');
  }
}

run().catch(console.error);
