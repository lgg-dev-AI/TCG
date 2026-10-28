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
      paymentMethod = 'Transferencia',
      customerName = 'Cliente PokéVault',
      customerEmail = 'luis.gongarza@gmail.com',
      customerPhone = '',
      shippingAddress = {}
    } = req.body || {};

    const orderId = `PV-${Math.floor(100000 + Math.random() * 900000)}`;
    const status = paymentMethod === 'PayPal' ? 'PAGADO' : 'PENDIENTE';

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

    const bankName = 'BBVA';
    const clabe = '012180012345678901';
    const beneficiary = 'PokéVault México';

    // Desglose de productos para la tabla HTML
    const itemsHtml = cartItems.map(item => `
      <tr style="border-bottom: 1px solid #1a2233; font-size: 13px; color: #e2e8f0;">
        <td style="padding: 10px 0;"><strong>${item.name || item.productName || item.productId}</strong></td>
        <td style="padding: 10px 0; text-align: center; color: #ffcb05;">${item.quantity || 1}</td>
        <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ffffff;">$${(item.price || 0).toLocaleString('es-MX')} MXN</td>
      </tr>
    `).join('');

    const emailHtmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
        <div style="background-color: #ff3e3e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ffcb05;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase;">PokéVault</h1>
          <span style="font-size: 11px; color: #ffcb05; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Confirmación Oficial de Pedido</span>
        </div>
        <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 18px; color: #ffffff; margin-top: 0; font-weight: 700; text-align: center;">¡Pedido Registrado con Éxito!</h2>
          <p style="font-size: 14px; color: #a0aec0; line-height: 1.6; text-align: center; margin-bottom: 24px;">
            Hola <strong>${customerName}</strong>, gracias por comprar en <strong>PokéVault</strong>. Hemos registrado tu pedido número <strong style="color: #ffcb05;">${orderId}</strong>.
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
          </table>
          ` : ''}

          ${paymentMethod === 'Transferencia' ? `
          <div style="background: rgba(255, 203, 5, 0.08); border: 1px solid rgba(255, 203, 5, 0.3); padding: 18px; border-radius: 10px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #ffcb05; font-size: 14px;">⚡ Datos para Transferencia SPEI:</h4>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">Banco: <strong>${bankName}</strong></p>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">CLABE Interbancaria: <strong style="color: #ffcb05; letter-spacing: 1px;">${clabe}</strong></p>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">Beneficiario: <strong>${beneficiary}</strong></p>
            <p style="margin: 4px 0; font-size: 13px; color: #e2e8f0;">Concepto / Referencia: <strong>${orderId}</strong></p>
          </div>
          ` : `
          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 6px 0; color: #38bdf8; font-size: 13px;">Método: ${paymentMethod}</h4>
            <p style="margin: 0; font-size: 12px; color: #e2e8f0;">Pago registrado con éxito.</p>
          </div>
          `}

          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1a2233; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; color: #a0aec0;">
            <strong style="color: white; display: block; margin-bottom: 4px;">Dirección de Envío:</strong>
            ${shippingAddress.street || 'Dirección registrada'}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} CP ${shippingAddress.zipCode || ''}<br />
            Teléfono: ${customerPhone || 'N/A'}
          </div>

          <p style="font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
            Este correo es una confirmación oficial de PokéVault México.<br />
            Si tienes dudas contáctanos en soporte@pokevault.mx
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
        subject: `Confirmación de Pedido ${orderId} - PokéVault`,
        html: emailHtmlBody
      });
      emailSentToClient = true;
      console.log(`✉️ Correo real enviado a cliente: ${customerEmail}`);
    } catch (clientMailErr) {
      console.error('Error enviando correo al cliente:', clientMailErr);
    }

    // 2. Enviar copia / notificación al administrador
    if (customerEmail.toLowerCase() !== smtpUser.toLowerCase()) {
      try {
        await transporter.sendMail({
          from: `"PokéVault Sistema" <${smtpUser}>`,
          to: smtpUser,
          subject: `🔔 Nuevo Pedido Registrado: ${orderId} (${customerName})`,
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
        subject: `Confirmación de pedido ${orderId} en PokéVault`,
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
