import express from 'express';
import { query, run, get } from '../db.js';
import { authenticate, requireAdmin } from './auth.js';
import nodemailer from 'nodemailer';

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

// Tasas de pago por estado físico
const CONDITION_RATES = {
  NM: { credit: 0.70, cash: 0.60, label: 'Near Mint (Como Nueva)' },
  LP: { credit: 0.58, cash: 0.48, label: 'Lightly Played (Poco Uso)' },
  MP: { credit: 0.45, cash: 0.35, label: 'Moderately Played (Desgaste Medio)' },
  HP: { credit: 0.30, cash: 0.20, label: 'Heavily Played / Damaged (Dañada)' }
};

// POST /api/buyback - Crear solicitud de Recompra
router.post('/', authenticate, async (req, res) => {
  const { name, phone, payoutMethod, items } = req.body;
  const userId = req.user.id;
  const email = req.user.email;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La lista de cartas está vacía.' });
  }

  try {
    await run('BEGIN TRANSACTION');

    // Calcular montos de la recompra
    let totalMarket = 0;
    let totalCredit = 0;
    let totalCash = 0;

    const itemsToInsert = [];

    for (const item of items) {
      const price = parseFloat(item.marketPrice);
      if (isNaN(price) || price <= 0) {
        throw new Error(`Precio de mercado inválido para la carta ${item.name}`);
      }

      const rates = CONDITION_RATES[item.condition] || CONDITION_RATES.NM;
      totalMarket += price;
      totalCredit += price * rates.credit;
      totalCash += price * rates.cash;

      itemsToInsert.push({
        name: item.name,
        expansion: item.expansion,
        condition: item.condition,
        game_type: item.game_type || 'POKEMON',
        marketPrice: price,
        estimatedValue: payoutMethod === 'credit' ? (price * rates.credit) : (price * rates.cash)
      });
    }

    const finalValue = payoutMethod === 'credit' ? Math.round(totalCredit) : Math.round(totalCash);
    const folio = 'BB-' + Math.floor(100000 + Math.random() * 900000);

    // Guardar la solicitud
    await run(
      `INSERT INTO buyback_requests (id, user_id, customer_name, customer_email, customer_phone, payout_method, total_value, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [folio, userId, name, email, phone, payoutMethod, finalValue, 'PENDIENTE']
    );

    // Guardar los items
    for (const item of itemsToInsert) {
      await run(
        `INSERT INTO buyback_items (buyback_id, name, expansion, condition, game_type, market_price, estimated_value)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [folio, item.name, item.expansion, item.condition, item.game_type, item.marketPrice, item.estimatedValue]
      );
    }

    await run('COMMIT');

    // Enviar correo de alerta al admin (luis.gongarza@gmail.com)
    if ((process.env.SMTP_HOST || process.env.SMTP_SERVICE) && process.env.SMTP_USER) {
      try {
        const itemsHtml = itemsToInsert.map(item => `
          <tr style="border-bottom: 1px solid #1a2233; font-size: 13px; color: #e2e8f0;">
            <td style="padding: 10px 0;"><strong>${item.name}</strong> <br /><span style="font-size: 11px; color: #718096;">${item.expansion}</span></td>
            <td style="padding: 10px 0; text-align: center; color: #ffcb05;">${item.condition}</td>
            <td style="padding: 10px 0; text-align: right;">$${item.marketPrice.toLocaleString('es-MX')} MXN</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1ba24c;">$${Math.round(item.estimatedValue).toLocaleString('es-MX')} MXN</td>
          </tr>
        `).join('');

        const buybackEmailBody = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
            <div style="background-color: #ffcb05; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ff3e3e; color: #0c0e12;">
              <h1 style="font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase;">Nueva Solicitud Buyback</h1>
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Recompra de Cartas PokéVault</span>
            </div>
            <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
              <h3 style="font-size: 16px; color: #ffffff; font-weight: 700; margin-top: 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #1a2233; padding-bottom: 8px;">Datos del Entrenador:</h3>
              <p style="font-size: 13.5px; color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">
                <strong>Nombre:</strong> ${name} <br />
                <strong>Email:</strong> ${email} <br />
                <strong>Teléfono:</strong> ${phone} <br />
                <strong>Folio:</strong> <span style="font-family: monospace; color: #ffcb05; font-weight: 700;">${folio}</span> <br />
                <strong>Método de Payout:</strong> <span style="text-transform: uppercase; font-weight: 700; color: #ff3e3e;">${payoutMethod === 'credit' ? 'Crédito de Tienda (+70%)' : 'Efectivo / Transferencia'}</span>
              </p>

              <h3 style="font-size: 16px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #1a2233; padding-bottom: 8px; margin-bottom: 12px;">Desglose de Cartas:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 1px solid #1a2233; text-align: left; font-size: 11px; color: #718096;">
                    <th style="padding: 8px 0; font-weight: 600;">Carta</th>
                    <th style="padding: 8px 0; font-weight: 600; text-align: center;">Condición</th>
                    <th style="padding: 8px 0; font-weight: 600; text-align: right;">Val. Mercado</th>
                    <th style="padding: 8px 0; font-weight: 600; text-align: right;">Pago Ofrecido</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid #1a2233;">
                    <td colspan="3" style="padding: 12px 0 0 0; font-size: 14px; color: #ffffff; font-weight: 700;">Total Ofrecido Estimado:</td>
                    <td style="padding: 12px 0 0 0; font-size: 16px; color: #ffcb05; font-weight: 800; text-align: right;">$${finalValue.toLocaleString('es-MX')} MXN</td>
                  </tr>
                </tfoot>
              </table>

              <p style="font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
                Puedes revisar y aceptar esta solicitud de recompra en el Panel Admin.
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"PokéVault Buybacks" <${process.env.SMTP_USER}>`,
          to: 'luis.gongarza@gmail.com',
          subject: `🚨 [NUEVA RECOMPRA] ${folio} - $${finalValue.toLocaleString('es-MX')} MXN de ${name}`,
          html: buybackEmailBody
        });
        console.log(`✉️ Alerta de buyback enviada de forma real al administrador.`);

        // 2. Enviar correo de confirmación al cliente
        const customerEmailBody = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
            <div style="background-color: #ffcb05; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ff3e3e; color: #0c0e12;">
              <div style="width: 55px; height: 55px; background: white; border-radius: 50%; border: 4px solid #000; margin: 0 auto; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                <div style="width: 47px; height: 23px; background: #ff3e3e; border-radius: 24px 24px 0 0; border-bottom: 2px solid #000; box-sizing: border-box;"></div>
                <div style="width: 16px; height: 16px; background: white; border-radius: 50%; border: 3px solid #000; position: absolute; top: 15px; left: 15px; box-sizing: border-box; z-index: 10;"></div>
              </div>
              <h1 style="font-size: 22px; font-weight: 800; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 0.05em;">Propuesta de Recompra Recibida</h1>
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Folio: ${folio}</span>
            </div>
            <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
              <h2 style="font-size: 16px; color: #ffffff; margin-top: 0; font-weight: 700; text-align: center;">¡Tu propuesta ha sido registrada!</h2>
              <p style="font-size: 13px; color: #a0aec0; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                Hola <strong>${name}</strong>, gracias por interesarte en vender tus cartas con nosotros. Hemos registrado tu solicitud de recompra con el folio <strong style="color: #ffffff;">${folio}</strong>. Nuestro equipo evaluará tu propuesta a la brevedad.
              </p>

              <h3 style="font-size: 14px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #1a2233; padding-bottom: 8px; margin-bottom: 12px;">Resumen de tu Propuesta:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 1px solid #1a2233; text-align: left; font-size: 11px; color: #718096;">
                    <th style="padding: 8px 0; font-weight: 600;">Carta</th>
                    <th style="padding: 8px 0; font-weight: 600; text-align: center;">Condición</th>
                    <th style="padding: 8px 0; font-weight: 600; text-align: right;">Pago Ofrecido</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsToInsert.map(item => `
                    <tr style="border-bottom: 1px solid #1a2233; font-size: 13px; color: #e2e8f0;">
                      <td style="padding: 10px 0;"><strong>${item.name}</strong> <br /><span style="font-size: 11px; color: #718096;">${item.expansion}</span></td>
                      <td style="padding: 10px 0; text-align: center; color: #ffcb05;">${item.condition}</td>
                      <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1ba24c;">$${Math.round(item.estimatedValue).toLocaleString('es-MX')} MXN</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid #1a2233;">
                    <td colspan="2" style="padding: 12px 0 0 0; font-size: 14px; color: #ffffff; font-weight: 700;">Pago Estimado (${payoutMethod === 'credit' ? 'Crédito de Tienda' : 'Efectivo'}):</td>
                    <td style="padding: 12px 0 0 0; font-size: 16px; color: #ffcb05; font-weight: 800; text-align: right;">$${finalValue.toLocaleString('es-MX')} MXN</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Instrucciones de Envío -->
              <div style="background-color: rgba(255, 203, 5, 0.03); border: 1px solid rgba(255, 203, 5, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h4 style="font-size: 13px; color: #ffcb05; font-weight: 800; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Pasos Siguientes para Completar la Recompra:</h4>
                <ol style="font-size: 12px; color: #ffffff; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Espera a que un administrador revise y <strong>Acepte</strong> tu propuesta en nuestro sistema. Recibirás una notificación por correo.</li>
                  <li>Prepara tus cartas de forma segura usando protectores (sleeves) y cargadores superiores (toploaders) o cajas rígidas para evitar daños en el envío.</li>
                  <li>Envía o entrega tus cartas a nuestra sucursal PokéVault México.</li>
                  <li>Una vez verificado físicamente el estado de las cartas por nuestro equipo, se te liberará tu saldo en tienda o tu transferencia según el método elegido.</li>
                </ol>
              </div>

              <p style="font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
                Este es un correo automático de confirmación de PokéVault. <br />
                ¡Gracias por confiar en nosotros para valorar tu colección!
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"PokéVault Buybacks" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Confirmación de Solicitud de Recompra ${folio} - PokéVault`,
          html: customerEmailBody
        });
        console.log(`✉️ Correo real de buyback enviado al cliente: ${email}`);
      } catch (mailErr) {
        console.error('Error al enviar alerta de buyback por correo:', mailErr);
      }
    }

    res.json({ success: true, folioNumber: folio, totalValue: finalValue });
  } catch (error) {
    await run('ROLLBACK');
    console.error('Buyback submission error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/buyback - Obtener solicitudes del usuario logueado
router.get('/', authenticate, async (req, res) => {
  try {
    const requests = await query(
      'SELECT * FROM buyback_requests WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    for (let reqObj of requests) {
      reqObj.items = await query('SELECT * FROM buyback_items WHERE buyback_id = ?', [reqObj.id]);
    }

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener solicitudes de recompra' });
  }
});

// GET /api/buyback/all - Obtener todas las solicitudes (Admin)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const requests = await query(
      `SELECT br.*, u.email as user_email
       FROM buyback_requests br
       JOIN users u ON u.id = br.user_id
       ORDER BY br.created_at DESC`
    );

    for (let reqObj of requests) {
      reqObj.items = await query('SELECT * FROM buyback_items WHERE buyback_id = ?', [reqObj.id]);
    }

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener todas las solicitudes de recompra' });
  }
});

// PUT /api/buyback/:id/status - Actualizar estado de solicitud de recompra (Admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'PAGADO'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado de recompra inválido' });
  }

  try {
    const request = await get('SELECT * FROM buyback_requests WHERE id = ?', [id]);
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });

    await run('UPDATE buyback_requests SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, newStatus: status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado de recompra' });
  }
});

export default router;
