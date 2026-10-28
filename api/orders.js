import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      cartItems = [],
      paymentMethod = 'Stripe', // 'Stripe' | 'Efectivo' (Recoger en Tienda) | 'PayPal' | 'Transferencia'
      customerName = 'Cliente PokéVault',
      customerEmail = 'luis.gongarza@gmail.com',
      customerPhone = '',
      shippingAddress = {},
      bankDetails = {},
      total = 0
    } = req.body || {};

    const orderId = `PV-${Math.floor(100000 + Math.random() * 900000)}`;
    const isPaidOnline = paymentMethod === 'Stripe' || paymentMethod === 'PayPal';
    const status = isPaidOnline ? 'PAGADO' : 'PENDIENTE';

    // Configuración SMTP de Gmail con las credenciales verificadas
    const smtpUser = process.env.SMTP_USER || 'luis.gongarza@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'wtrq tfqj grxi dcyx';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const bankName = bankDetails.bankName || 'BBVA';
    const clabe = bankDetails.clabe || '012180012345678901';
    const beneficiary = bankDetails.beneficiary || 'PokéVault México';

    const calculatedTotal = total > 0 ? total : cartItems.reduce((acc, it) => acc + ((it.price || 0) * (it.quantity || 1)), 0);

    // Desglose de productos para la tabla HTML
    const itemsHtml = cartItems.map(item => `
      <tr style="border-bottom: 1px solid #1a2233; font-size: 13px; color: #e2e8f0;">
        <td style="padding: 10px 0;"><strong>${item.name || item.productName || item.productId}</strong></td>
        <td style="padding: 10px 0; text-align: center; color: #ffcb05;">${item.quantity || 1}</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">$${(item.price || 0).toLocaleString('es-MX')} MXN</td>
      </tr>
    `).join('');

    // Encabezado y Asunto según Método
    let emailSubject = `Confirmación de Pedido #${orderId} - PokéVault México`;
    let adminSubject = `🔔 [PEDIDO] #${orderId} (${customerName})`;
    let headerBadge = isPaidOnline ? 'COMPRA PAGADA CON ÉXITO' : 'PEDIDO APARTADO PARA RECOGER EN TIENDA';
    let headerSubtitle = isPaidOnline ? 'Pago Verificado vía Pasarela Segura' : 'Reserva Oficial de Artículos (48 hrs)';

    if (paymentMethod === 'Stripe') {
      emailSubject = `💳 ¡Pago Confirmado! Pedido #${orderId} - PokéVault México`;
      adminSubject = `🔔 [VENTA PAGADA STRIPE] Pedido #${orderId} de ${customerName} ($${calculatedTotal.toLocaleString('es-MX')} MXN)`;
    } else if (paymentMethod === 'Efectivo') {
      emailSubject = `🎒 Pedido #${orderId} Apartado para Recoger en Tienda - PokéVault México`;
      adminSubject = `🔔 [NUEVO APARTADO EN TIENDA] Pedido #${orderId} de ${customerName} ($${calculatedTotal.toLocaleString('es-MX')} MXN)`;
    }

    // Contenido dinámico según método de pago
    let paymentInstructionsHtml = '';

    if (paymentMethod === 'Stripe') {
      paymentInstructionsHtml = `
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.35); padding: 18px 20px; border-radius: 12px; margin-bottom: 22px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <h4 style="margin: 0; color: #818cf8; font-size: 14px; font-weight: 700;">💳 Pago Aprobado con Tarjeta</h4>
            <span style="font-size: 10px; background: #6366f1; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">STRIPE VERIFIED</span>
          </div>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;">
            Estado de la orden: <strong style="color: #4ade80;">PAGADO Y CONFIRMADO</strong>. Tus cartas ya han sido descontadas del inventario y nuestro equipo está preparando tu paquete.
          </p>
          <p style="margin: 0; font-size: 11.5px; color: #94a3b8;">
            ID de Transacción: <strong>${orderId}</strong> · Cifrado bancario SSL 256-bit
          </p>
        </div>
      `;
    } else if (paymentMethod === 'Efectivo') {
      paymentInstructionsHtml = `
        <!-- Bloque Efectivo / Tienda -->
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); padding: 18px 20px; border-radius: 12px; margin-bottom: 18px;">
          <h4 style="margin: 0 0 8px 0; color: #34d399; font-size: 14px; font-weight: 700;">
            💵 ¿Planeas pagar en efectivo o tarjeta física al llegar a la tienda?
          </h4>
          <p style="margin: 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;">
            <strong>¡Haz caso omiso a los datos bancarios!</strong> Te esperamos con mucho gusto en nuestro local físico. Únicamente menciona este correo o tu número de pedido: <strong style="color: #ffcb05;">#${orderId}</strong> al llegar para liquidar y recibir tus cartas.
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
            <div>Banco: <strong style="color: #ffffff;">${bankName}</strong></div>
            <div>CLABE Interbancaria: <strong style="color: #ffcb05; font-family: monospace; letter-spacing: 1px; font-size: 13.5px;">${clabe}</strong></div>
            <div>Titular / Beneficiario: <strong style="color: #ffffff;">${beneficiary}</strong></div>
            <div>Concepto / Referencia: <strong style="color: #38bdf8; font-weight: 700;">${orderId}</strong></div>
            <div>Monto exacto: <strong style="color: #ff3e3e; font-weight: 700;">$${calculatedTotal.toLocaleString('es-MX')} MXN</strong></div>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8; font-style: italic;">
            *Al acudir a la tienda, solo muestra la confirmación de tu banco en tu celular y te entregamos tu paquete al instante.
          </p>
        </div>
      `;
    } else {
      // Transferencia directa clásica
      paymentInstructionsHtml = `
        <div style="background: rgba(255, 203, 5, 0.08); border: 1px solid rgba(255, 203, 5, 0.3); padding: 18px; border-radius: 10px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #ffcb05; font-size: 14px;">⚡ Datos para Transferencia SPEI:</h4>
          <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">Banco: <strong>${bankName}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">CLABE Interbancaria: <strong style="color: #ffcb05; letter-spacing: 1px;">${clabe}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">Beneficiario: <strong>${beneficiary}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">Concepto / Referencia: <strong>${orderId}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #ff3e3e;">Monto: <strong>$${calculatedTotal.toLocaleString('es-MX')} MXN</strong></p>
        </div>
      `;
    }

    const emailHtmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
        <div style="background-color: #ff3e3e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ffcb05;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase;">PokéVault</h1>
          <span style="font-size: 11px; color: #ffcb05; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">${headerSubtitle}</span>
        </div>
        <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 18px; color: #ffffff; margin-top: 0; font-weight: 700; text-align: center;">${headerBadge}</h2>
          <p style="font-size: 14px; color: #a0aec0; line-height: 1.6; text-align: center; margin-bottom: 24px;">
            Hola <strong>${customerName}</strong>, gracias por tu preferencia en <strong>PokéVault</strong>. Hemos registrado tu pedido número <strong style="color: #ffcb05;">${orderId}</strong>.
          </p>

          ${itemsHtml ? `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 2px solid #2d3748; font-size: 11px; text-transform: uppercase; color: #718096; text-align: left;">
                <th style="padding-bottom: 8px;">Producto</th>
                <th style="padding-bottom: 8px; text-align: center;">Cant.</th>
                <th style="padding-bottom: 8px; text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #2d3748;">
                <td colspan="2" style="padding-top: 12px; font-size: 14px; font-weight: 700; color: #ffffff;">Total:</td>
                <td style="padding-top: 12px; font-size: 15px; font-weight: 800; color: #ffcb05; text-align: right;">$${calculatedTotal.toLocaleString('es-MX')} MXN</td>
              </tr>
            </tfoot>
          </table>
          ` : ''}

          ${paymentInstructionsHtml}

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1a2233; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; color: #a0aec0;">
            <strong style="color: white; display: block; margin-bottom: 4px;">Detalles de Entrega / Contacto:</strong>
            ${paymentMethod === 'Efectivo' ? '📍 Recoger en Tienda Física / Sucursal PokéVault' : `Dirección: ${shippingAddress.street || 'Dirección registrada'}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} CP ${shippingAddress.zipCode || ''}`}<br />
            Teléfono: ${customerPhone || 'N/A'}
          </div>

          <p style="font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
            Este correo es una confirmación oficial de PokéVault México.<br />
            Si tienes cualquier duda contáctanos a soporte@pokevault.mx
          </p>
        </div>
      </div>
    `;

    let emailSentToClient = false;
    let emailSentToAdmin = false;

    // 1. Enviar correo real al cliente vía Gmail SMTP
    try {
      await transporter.sendMail({
        from: `"PokéVault México" <${smtpUser}>`,
        to: customerEmail,
        subject: emailSubject,
        html: emailHtmlBody
      });
      emailSentToClient = true;
      console.log(`✉️ Correo enviado a cliente: ${customerEmail}`);
    } catch (clientMailErr) {
      console.error('Error enviando correo al cliente:', clientMailErr);
    }

    // 2. Enviar copia / notificación al administrador
    if (customerEmail.toLowerCase() !== smtpUser.toLowerCase()) {
      try {
        await transporter.sendMail({
          from: `"PokéVault Sistema" <${smtpUser}>`,
          to: smtpUser,
          subject: adminSubject,
          html: emailHtmlBody
        });
        emailSentToAdmin = true;
      } catch (adminMailErr) {
        console.error('Error enviando notificación al admin:', adminMailErr);
      }
    } else {
      emailSentToAdmin = true;
    }

    return res.status(200).json({
      success: true,
      orderId,
      status,
      emailSentToClient,
      emailSentToAdmin,
      simulatedEmail: {
        to: customerEmail,
        from: 'orders@pokevault.mx',
        subject: emailSubject,
        html: emailHtmlBody
      }
    });

  } catch (error) {
    console.error('Error en /api/orders handler:', error);
    return res.status(500).json({
      error: error.message || 'Error interno al procesar el pedido'
    });
  }
}
