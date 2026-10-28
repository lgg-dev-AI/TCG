import express from 'express';
import { query, run, get, logAdminAction } from '../db.js';
import { authenticate, requireAdmin } from './auth.js';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'pokevault_super_secret_dev_key';

const router = express.Router();

// Configurar transportador de correo para envío real
const transporter = process.env.SMTP_SERVICE
  ? nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

// POST /api/orders - Realizar Checkout (Permite usuarios autenticados y compras directas como invitado)
router.post('/', async (req, res) => {
  const { cartItems, paymentMethod, paymentReceipt, customerName, customerEmail, customerPhone, shippingAddress } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  // 1. Obtener ID de usuario: desde token JWT o buscar/crear usuario invitado
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      userId = decoded.id;
    } catch {}
  }

  const emailToUse = (customerEmail || 'cliente@pokevault.mx').toLowerCase().trim();

  if (!userId) {
    try {
      let existing = await get('SELECT id FROM users WHERE email = ?', [emailToUse]);
      if (existing) {
        userId = existing.id;
      } else {
        userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        await run(
          'INSERT INTO users (id, email, name, role, phone, city, state, street, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            emailToUse,
            customerName || 'Cliente PokéVault',
            'CUSTOMER',
            customerPhone || '',
            shippingAddress?.city || '',
            shippingAddress?.state || '',
            shippingAddress?.street || '',
            shippingAddress?.zipCode || ''
          ]
        );
      }
    } catch (userErr) {
      console.warn('Error al verificar/crear usuario en checkout:', userErr);
      userId = 'usr_guest_checkout';
    }
  }

  try {
    // SQLite nativamente usa un solo hilo (serializado), así que las transacciones bloquean toda la BD
    await run('BEGIN TRANSACTION');

    let totalAmount = 0;
    const itemsToInsert = [];
    const itemsForEmail = [];

    // Validar stock y precio para cada item
    for (const item of cartItems) {
      const product = await get('SELECT id, name, price, stock, image_url FROM products WHERE id = ?', [item.productId]);
      
      if (!product) {
        throw new Error(`Producto ${item.productId} no encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      itemsToInsert.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });

      itemsForEmail.push({
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
      
      // Descontar stock
      await run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, product.id]);
    }

    // Generar ID de pedido corto y legible para el cliente (ej. PV-123456)
    const orderIdShort = 'PV-' + Math.floor(100000 + Math.random() * 900000);
    const isPaidOnline = paymentMethod === 'Stripe' || paymentMethod === 'PayPal';
    const status = isPaidOnline ? 'PAGADO' : 'PENDIENTE';
    const trackingNumber = isPaidOnline ? `STRIPE - ID: ${orderIdShort}` : (paymentMethod === 'Efectivo' ? 'RECOGER EN TIENDA' : null);
    
    await run(
      'INSERT INTO orders (id, user_id, total, status, tracking_number) VALUES (?, ?, ?, ?, ?)',
      [orderIdShort, userId, totalAmount, status, trackingNumber]
    );

    // Insertar items de la orden
    for (const item of itemsToInsert) {
      await run(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [orderIdShort, item.productId, item.quantity, item.priceAtPurchase]
      );
    }

    await run('COMMIT');

    // Obtener los datos bancarios desde la tabla settings
    const bankSettingsRows = await query('SELECT key, value FROM settings');
    const dbBankSettings = {
      bankName: 'BBVA',
      clabe: '012180012345678901',
      beneficiary: 'PokéVault México'
    };
    bankSettingsRows.forEach(r => {
      if (r.key === 'bank_name') dbBankSettings.bankName = r.value;
      if (r.key === 'clabe') dbBankSettings.clabe = r.value;
      if (r.key === 'beneficiary') dbBankSettings.beneficiary = r.value;
    });

    // Construir Filas de Tabla de Productos para el HTML del Correo
    const itemsListHtml = itemsForEmail.map(item => `
      <tr style="border-bottom: 1px solid #1a2233; font-size: 13px; color: #e2e8f0;">
        <td style="padding: 10px 0;"><strong>${item.name}</strong> <br /> <span style="font-size: 11px; color: #718096;">$${item.price.toLocaleString('es-MX')} MXN c/u</span></td>
        <td style="padding: 10px 0; text-align: center; color: #ffcb05;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">$${item.total.toLocaleString('es-MX')} MXN</td>
      </tr>
    `).join('');

    // Obtener correo del usuario
    const user = await get('SELECT email FROM users WHERE id = ?', [userId]);
    const userEmail = user ? user.email : emailToUse;

    // Encabezado según método
    const headerTitle = isPaidOnline ? '¡Compra Pagada con Éxito!' : '¡Pedido Apartado para Recoger en Tienda!';
    const subtitle = isPaidOnline ? 'Pago Verificado vía Stripe' : 'Reserva Oficial de Artículos (48 hrs)';

    // Instrucciones dinámicas
    let instructionsHtml = '';
    if (paymentMethod === 'Stripe') {
      instructionsHtml = `
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.35); padding: 18px 20px; border-radius: 12px; margin-bottom: 22px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <h4 style="margin: 0; color: #818cf8; font-size: 14px; font-weight: 700;">💳 Pago Aprobado con Tarjeta</h4>
            <span style="font-size: 10px; background: #6366f1; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">STRIPE VERIFIED</span>
          </div>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;">
            Estado: <strong style="color: #4ade80;">PAGADO Y CONFIRMADO</strong>. Tus cartas han sido descontadas del inventario y están siendo preparadas.
          </p>
          <p style="margin: 0; font-size: 11.5px; color: #94a3b8;">
            ID de Referencia: <strong>${orderIdShort}</strong>
          </p>
        </div>
      `;
    } else {
      instructionsHtml = `
        <!-- Bloque Efectivo / Tienda -->
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); padding: 18px 20px; border-radius: 12px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 8px 0; color: #34d399; font-size: 14px; font-weight: 700;">
            💵 ¿Planeas pagar en efectivo o tarjeta física al llegar a la tienda?
          </h4>
          <p style="margin: 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;">
            <strong>¡Haz caso omiso a los datos bancarios!</strong> Te esperamos con mucho gusto en nuestro local físico. Únicamente menciona este correo o tu número de pedido: <strong style="color: #ffcb05;">#${orderIdShort}</strong> al llegar para liquidar y recibir tus cartas.
          </p>
        </div>

        <!-- Bloque Depósito / Transferencia Opcional para Agilizar -->
        <div style="background: rgba(255, 203, 5, 0.06); border: 1px solid rgba(255, 203, 5, 0.3); padding: 18px 20px; border-radius: 12px; margin-bottom: 22px;">
          <h4 style="margin: 0 0 8px 0; color: #ffcb05; font-size: 14px; font-weight: 700;">
            ⚡ ¿Deseas adelantar tu pago por transferencia SPEI para agilizar tu entrega?
          </h4>
          <p style="margin: 0 0 12px 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.5;">
            Si prefieres pagar antes de venir y recoger tus cartas de inmediato sin filas ni esperas de cobro, puedes transferir a nuestra cuenta oficial:
          </p>
          <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 203, 5, 0.2); border-radius: 8px; padding: 12px 14px; font-size: 12.5px; line-height: 1.8; color: #f1f5f9;">
            <div>Banco: <strong style="color: #ffffff;">${dbBankSettings.bankName}</strong></div>
            <div>CLABE Interbancaria: <strong style="color: #ffcb05; font-family: monospace; letter-spacing: 1px; font-size: 13.5px;">${dbBankSettings.clabe}</strong></div>
            <div>Titular / Beneficiario: <strong style="color: #ffffff;">${dbBankSettings.beneficiary}</strong></div>
            <div>Concepto / Referencia: <strong style="color: #38bdf8; font-weight: 700;">${orderIdShort}</strong></div>
            <div>Monto exacto: <strong style="color: #ff3e3e; font-weight: 700;">$${totalAmount.toLocaleString('es-MX')} MXN</strong></div>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8; font-style: italic;">
            *Al acudir a la tienda, solo muestra la confirmación de tu banco en tu celular y te entregamos tu paquete al instante.
          </p>
        </div>
      `;
    }

    // Generar cuerpo HTML de correo con colores de Pokébola y datos bancarios dinámicos
    const emailHtmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
        <div style="background-color: #ff3e3e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ffcb05; position: relative;">
          <!-- Pokébola Central -->
          <div style="width: 50px; height: 50px; background: white; border-radius: 50%; border: 4px solid #000; margin: 0 auto; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            <div style="width: 50px; height: 25px; background: #ff3e3e; border-radius: 25px 25px 0 0; border-bottom: 2px solid #000; box-sizing: border-box;"></div>
            <div style="width: 16px; height: 16px; background: white; border-radius: 50%; border: 3px solid #000; position: absolute; top: 13px; left: 13px; box-sizing: border-box; z-index: 10;"></div>
          </div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 12px 0 0 0; letter-spacing: 0.05em; text-transform: uppercase;">PokéVault</h1>
          <span style="font-size: 10px; color: #ffcb05; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">${subtitle}</span>
        </div>
        <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 18px; color: #ffffff; margin-top: 0; font-weight: 700; text-align: center;">${headerTitle}</h2>
          <p style="font-size: 13px; color: #a0aec0; line-height: 1.6; text-align: center; margin-bottom: 24px;">
            Hola, gracias por comprar en <strong>PokéVault</strong>. Hemos registrado tu pedido número <strong style="color: #ffcb05;">${orderIdShort}</strong>.
          </p>

          <!-- Resumen de Artículos -->
          <h3 style="font-size: 14px; color: #ffffff; font-weight: 700; border-bottom: 1px solid #1a2233; padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Resumen de tu Pedido:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 1px solid #1a2233; text-align: left;">
                <th style="padding: 8px 0; font-size: 12px; color: #718096; font-weight: 600;">Carta/Producto</th>
                <th style="padding: 8px 0; font-size: 12px; color: #718096; font-weight: 600; text-align: center;">Cant.</th>
                <th style="padding: 8px 0; font-size: 12px; color: #718096; font-weight: 600; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #1a2233;">
                <td colspan="2" style="padding: 12px 0 0 0; font-size: 14px; color: #ffffff; font-weight: 700;">Total del Pedido:</td>
                <td style="padding: 12px 0 0 0; font-size: 16px; color: #ff3e3e; font-weight: 800; text-align: right;">$${totalAmount.toLocaleString('es-MX')} MXN</td>
              </tr>
            </tfoot>
          </table>

          <!-- Instrucciones de Pago / Entrega -->
          ${instructionsHtml}

          <p style="font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
            Confirmación oficial de PokéVault México. <br />
            ¡Gracias por tu compra, Entrenador!
          </p>
        </div>
      </div>
    `;

    let emailSentToClient = false;
    let emailSentToAdmin = false;

    if ((process.env.SMTP_HOST || process.env.SMTP_SERVICE) && process.env.SMTP_USER) {
      try {
        // 1. Enviar correo al cliente
        await transporter.sendMail({
          from: `"PokéVault" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject: `Confirmación de Pedido ${orderIdShort} - PokéVault`,
          html: emailHtmlBody,
        });
        emailSentToClient = true;
        console.log(`✉️ Correo real de confirmación enviado a cliente: ${userEmail}`);

        // 2. Enviar correo al administrador
        const adminEmail = 'luis.gongarza@gmail.com';
        const adminHtmlBody = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
            <div style="background-color: #ff3e3e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ffcb05;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase;">Nuevo Pedido Recibido</h1>
              <span style="font-size: 11px; color: #ffcb05; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Notificación de Admin</span>
            </div>
            <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6;">
                Hola Administrador,<br /><br />
                Se ha registrado un nuevo pedido en <strong>PokéVault</strong>.
              </p>
              <div style="background-color: #0e1118; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #1a2233;">
                <strong>ID de Pedido:</strong> ${orderIdShort}<br />
                <strong>Cliente:</strong> ${userEmail}<br />
                <strong>Total:</strong> $${totalAmount.toLocaleString('es-MX')} MXN<br />
                <strong>Estado:</strong> PENDIENTE (Espera transferencia SPEI)
              </div>
              <p style="font-size: 13px; color: #a0aec0; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
                Puedes revisar y actualizar el estado de este pedido en tu Panel de Administrador.
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"PokéVault Admin" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: `🚨 [NUEVO PEDIDO] ${orderIdShort} - $${totalAmount.toLocaleString('es-MX')} MXN`,
          html: adminHtmlBody,
        });
        emailSentToAdmin = true;
        console.log(`✉️ Correo real de notificación enviado al admin: ${adminEmail}`);
      } catch (err) {
        console.error('Error al enviar correos reales de orden:', err);
      }
    }

    // Imprimir en consola de logs
    console.log(`\n==========================================`);
    console.log(`📧 CORREO DE CONFIRMACIÓN DE PEDIDO ENVIADO A: ${userEmail}`);
    console.log(`Orden: ${orderIdShort}`);
    console.log(`Total: $${totalAmount.toLocaleString('es-MX')} MXN`);
    console.log(`Enviado de forma real a cliente: ${emailSentToClient ? 'SÍ' : 'NO'}`);
    console.log(`Enviado de forma real a admin: ${emailSentToAdmin ? 'SÍ' : 'NO'}`);
    console.log(`==========================================\n`);

    res.status(200).json({ 
      success: true, 
      orderId: orderIdShort, 
      totalAmount, 
      status,
      emailSentToClient,
      emailSentToAdmin,
      simulatedEmail: {
        to: userEmail,
        from: 'orders@pokevault.mx',
        subject: `Confirmación de pedido ${orderIdShort} en PokéVault`,
        html: emailHtmlBody
      }
    });
  } catch (error) {
    await run('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/orders - Historial de órdenes del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    
    // Obtener items por orden (para simplificar hacemos querys N+1, ideal en prod hacer JOIN)
    for (let order of orders) {
      order.items = await query(`
        SELECT oi.*, p.name, p.image_url 
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`, 
        [order.id]
      );
    }
    
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// GET /api/orders/all - Historial de TODAS las órdenes (Admin)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const orders = await query(`
      SELECT o.*, COALESCE(u.email, 'cliente@pokevault.mx') as user_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);
    
    for (let order of orders) {
      order.items = await query(`
        SELECT oi.*, p.name, p.image_url 
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`, 
        [order.id]
      );
    }
    
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// PUT /api/orders/:id/status - Actualizar estado de orden (Admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber } = req.body;

  const validStatuses = ['PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // State Machine lógica simple: no volver de Entregado/Cancelado
    if (['ENTREGADO', 'CANCELADO'].includes(order.status) && order.status !== status) {
      return res.status(400).json({ error: 'No se puede cambiar el estado de una orden finalizada' });
    }

    const finalTrackingNumber = trackingNumber !== undefined ? trackingNumber : (order.tracking_number || '');

    await run(
      'UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?', 
      [status, finalTrackingNumber, id]
    );

    await logAdminAction(req.user.email, 'Actualizar Pedido', `Se cambió el estado del pedido #${id} de "${order.status}" a "${status}"${finalTrackingNumber ? ` (Guía: ${finalTrackingNumber})` : ''}`);

    // Enviar correo de notificación de envío real si el estado cambia a ENVIADO
    if (status === 'ENVIADO' && finalTrackingNumber) {
      const user = await get('SELECT email FROM users WHERE id = ?', [order.user_id]);
      const clientEmail = user ? user.email : '';
      if (clientEmail && (process.env.SMTP_HOST || process.env.SMTP_SERVICE) && process.env.SMTP_USER) {
        try {
          const trackingHtmlBody = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
              <div style="background-color: #ff3e3e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ffcb05; position: relative;">
                <!-- Pokébola Central -->
                <div style="width: 50px; height: 50px; background: white; border-radius: 50%; border: 4px solid #000; margin: 0 auto; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                  <div style="width: 50px; height: 25px; background: #ff3e3e; border-radius: 25px 25px 0 0; border-bottom: 2px solid #000; box-sizing: border-box;"></div>
                  <div style="width: 16px; height: 16px; background: white; border-radius: 50%; border: 3px solid #000; position: absolute; top: 13px; left: 13px; box-sizing: border-box; z-index: 10;"></div>
                </div>
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 12px 0 0 0; letter-spacing: 0.05em; text-transform: uppercase;">PokéVault</h1>
                <span style="font-size: 10px; color: #ffcb05; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Notificación de Envío</span>
              </div>
              <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
                <h2 style="font-size: 18px; color: #ffffff; margin-top: 0; font-weight: 700; text-align: center;">¡Tu paquete está en camino!</h2>
                <p style="font-size: 13px; color: #a0aec0; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                  Hola, nos alegra informarte que tu pedido número <strong style="color: #ffffff;">${id}</strong> ha sido enviado.
                </p>

                <div style="background-color: #0e1118; padding: 20px; border-radius: 12px; border: 1px solid #1a2233; margin-bottom: 24px; text-align: center;">
                  <span style="font-size: 11px; color: #718096; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 6px;">Número de Guía / Rastreo:</span>
                  <strong style="font-size: 20px; color: #ffcb05; font-family: monospace; letter-spacing: 0.05em;">${finalTrackingNumber}</strong>
                  <div style="margin-top: 14px; font-size: 12px; color: #a0aec0;">
                    Puedes rastrear tu envío con esta guía en el portal de la mensajería correspondiente.
                  </div>
                </div>

                <p style="font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
                  Este es un correo de confirmación de envío de PokéVault. <br />
                  ¡Gracias por tu compra, Entrenador!
                </p>
              </div>
            </div>
          `;
          await transporter.sendMail({
            from: `"PokéVault Envíos" <${process.env.SMTP_USER}>`,
            to: clientEmail,
            subject: `🚚 ¡Tu pedido ${id} ha sido enviado! - PokéVault`,
            html: trackingHtmlBody,
          });
          console.log(`✉️ Correo real de guía enviado a cliente: ${clientEmail}`);
        } catch (mailErr) {
          console.error('Error al enviar correo de guía al cliente:', mailErr);
        }
      }
    }

    res.json({ success: true, newStatus: status, trackingNumber: finalTrackingNumber });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

// GET /api/orders/settings - Obtener datos bancarios y de contacto
router.get('/settings', async (req, res) => {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const settings = {
      bankName: 'BBVA',
      clabe: '012180012345678901',
      accountNumber: '1234567890',
      beneficiary: 'PokéVault México',
      whatsapp: '',
      paypalClientId: '',
      paypalActive: 'false'
    };
    rows.forEach(r => {
      if (r.key === 'bank_name') settings.bankName = r.value;
      if (r.key === 'clabe') settings.clabe = r.value;
      if (r.key === 'account_number') settings.accountNumber = r.value;
      if (r.key === 'beneficiary') settings.beneficiary = r.value;
      if (r.key === 'whatsapp') settings.whatsapp = r.value;
      if (r.key === 'paypal_client_id') settings.paypalClientId = r.value;
      if (r.key === 'paypal_active') settings.paypalActive = r.value;
    });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

// PUT /api/orders/settings - Actualizar datos bancarios y de contacto (Admin)
router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  const { bankName, clabe, accountNumber, beneficiary, whatsapp, paypalClientId, paypalActive } = req.body;
  try {
    const updates = [
      { key: 'bank_name', val: bankName },
      { key: 'clabe', val: clabe },
      { key: 'account_number', val: accountNumber },
      { key: 'beneficiary', val: beneficiary },
      { key: 'whatsapp', val: whatsapp },
      { key: 'paypal_client_id', val: paypalClientId },
      { key: 'paypal_active', val: paypalActive }
    ];
    for (const item of updates) {
      if (item.val !== undefined) {
        await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [item.key, item.val]);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar configuraciones' });
  }
});

// POST /api/orders/manual - Registrar Venta Manual (Admin)
router.post('/manual', authenticate, requireAdmin, async (req, res) => {
  const { customerName, customerEmail, paymentMethod, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La venta debe contener al menos un producto' });
  }

  try {
    await run('BEGIN TRANSACTION');

    let totalAmount = 0;
    const itemsToInsert = [];

    // Validar stock y precio para cada item
    for (const item of items) {
      const product = await get('SELECT id, name, price, stock FROM products WHERE id = ?', [item.productId]);
      
      if (!product) {
        throw new Error(`Producto con ID ${item.productId} no encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto: ${product.name} (Disponible: ${product.stock})`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      itemsToInsert.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });
      
      // Descontar stock
      await run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, product.id]);
    }

    // Registrar usuario general o buscar el existente
    let saleUserId = 'customer_physical';
    const emailToUse = (customerEmail || 'mostrador@pokevault.mx').trim().toLowerCase();
    
    // Buscar si existe usuario por email
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [emailToUse]);
    if (existingUser) {
      saleUserId = existingUser.id;
    } else {
      // Crear usuario rápido de mostrador
      saleUserId = 'user_' + Math.floor(100000 + Math.random() * 900000);
      await run(
        `INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, 'CUSTOMER')`,
        [saleUserId, emailToUse, customerName || 'Cliente General']
      );
    }

    const orderIdShort = 'PV-OTC' + Math.floor(100000 + Math.random() * 900000);
    const status = 'PAGADO';
    
    await run(
      'INSERT INTO orders (id, user_id, total, status, tracking_number) VALUES (?, ?, ?, ?, ?)',
      [orderIdShort, saleUserId, totalAmount, status, `VENTA FISICA - ${paymentMethod || 'Efectivo'}`]
    );

    // Insertar items de la orden
    for (const item of itemsToInsert) {
      await run(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [orderIdShort, item.productId, item.quantity, item.priceAtPurchase]
      );
    }

    await run('COMMIT');
    await logAdminAction(req.user.email, 'Registrar Venta Física', `Venta registrada para "${customerName || 'Cliente General'}" - ID Orden: ${orderIdShort}, Total: $${totalAmount} MXN (${paymentMethod})`);
    res.status(200).json({ success: true, orderId: orderIdShort, totalAmount });
  } catch (error) {
    await run('ROLLBACK');
    console.error('Manual order error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
