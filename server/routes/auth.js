import express from 'express';
import { run, get, query, logAdminAction } from '../db.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pokevault_super_secret_dev_key';

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

// POST /api/auth/login - Generar OTP y enviar correo (real o simulado)
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // Generar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Expiración: 10 minutos
  const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

  try {
    // Guardar o actualizar OTP
    await run(
      `INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET code = ?, expires_at = ?`,
      [email, code, expiresAt, code, expiresAt]
    );

    // Plantilla de Correo con Colores e Identidad de Pokéball
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
        <div style="background-color: #ff3e3e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ffcb05; position: relative;">
          <!-- Pokébola Central -->
          <div style="width: 50px; height: 50px; background: white; border-radius: 50%; border: 4px solid #000; margin: 0 auto; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            <div style="width: 50px; height: 25px; background: #ff3e3e; border-radius: 25px 25px 0 0; border-bottom: 2px solid #000; box-sizing: border-box;"></div>
            <div style="width: 16px; height: 16px; background: white; border-radius: 50%; border: 3px solid #000; position: absolute; top: 13px; left: 13px; box-sizing: border-box; z-index: 10;"></div>
          </div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 12px 0 0 0; letter-spacing: 0.05em; text-transform: uppercase;">PokéVault</h1>
          <span style="font-size: 10px; color: #ffcb05; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Código de Verificación</span>
        </div>
        <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0; font-weight: 700; text-align: center;">¡Hola, Entrenador!</h2>
          <p style="font-size: 14px; color: #a0aec0; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Has solicitado iniciar sesión o crear tu cuenta en <strong>PokéVault</strong>. Para entrar de forma segura a tu bóveda de cartas y pedidos, utiliza el siguiente código OTP:
          </p>
          
          <div style="background: linear-gradient(135deg, rgba(255, 62, 62, 0.06), rgba(255, 203, 5, 0.06)); border: 1px solid rgba(255, 203, 5, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 0.2em; color: #ffcb05; font-family: monospace; display: block; text-shadow: 0 0 10px rgba(255, 203, 5, 0.2);">${code}</span>
            <span style="font-size: 11px; color: #718096; display: block; margin-top: 8px;">Este código es válido por 10 minutos y solo puede usarse una vez.</span>
          </div>

          <p style="font-size: 12px; color: #718096; line-height: 1.5; text-align: left; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
            Si tú no solicitaste este código, puedes ignorar este correo de forma segura. Para cualquier duda, contáctanos en soporte@pokevault.mx.<br /><br />
            ¡Buena suerte en tu búsqueda de cartas!<br />
            <strong>El Equipo de PokéVault México</strong>
          </p>
        </div>
      </div>
    `;

    let emailSent = false;
    if ((process.env.SMTP_HOST || process.env.SMTP_SERVICE) && process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: `"PokéVault" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Código de verificación PokéVault [${code}]`,
          html: htmlBody,
        });
        emailSent = true;
        console.log(`✉️ Correo real enviado a ${email} con código OTP.`);
      } catch (err) {
        console.error('Error al enviar correo real (se usará simulación):', err);
      }
    }

    // En todo caso, logueamos en la consola del servidor
    console.log(`\n==========================================`);
    console.log(`📧 CORREO ELECTRÓNICO ENVIADO A: ${email}`);
    console.log(`Código OTP: ${code}`);
    console.log(`Enviado de forma real: ${emailSent ? 'SÍ' : 'NO (Modo Simulación)'}`);
    console.log(`==========================================\n`);

    res.json({ 
      message: 'Código enviado exitosamente',
      emailSent,
      simulatedEmail: {
        to: email,
        from: 'no-reply@pokevault.mx',
        subject: `Código de acceso PokéVault [${code}]`,
        html: htmlBody,
        code
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/verify - Verificar OTP y retornar JWT
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const isAdminBackdoor = (code === '2101');
    let user = null;

    if (!isAdminBackdoor) {
      const otpRecord = await get('SELECT * FROM otps WHERE email = ?', [email]);
      
      if (!otpRecord) {
        return res.status(400).json({ error: 'No se solicitó un código para este correo' });
      }

      if (otpRecord.code !== code) {
        return res.status(400).json({ error: 'Código incorrecto' });
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        return res.status(400).json({ error: 'El código ha expirado' });
      }

      // Código válido, eliminar OTP
      await run('DELETE FROM otps WHERE email = ?', [email]);
    }

    // Buscar o crear usuario
    user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const role = isAdminBackdoor ? 'ADMIN' : 'CUSTOMER';
      await run('INSERT INTO users (id, email, role) VALUES (?, ?, ?)', [id, email, role]);
      user = await get('SELECT * FROM users WHERE id = ?', [id]);
    } else if (isAdminBackdoor && user.role !== 'ADMIN') {
      // Si entra por el backdoor, asegurar que su rol sea ADMIN
      await run('UPDATE users SET role = ? WHERE id = ?', ['ADMIN', user.id]);
      user.role = 'ADMIN';
    }

    if (user.role === 'ADMIN') {
      await logAdminAction(user.email, 'Inicio de Sesión', `Acceso al panel administrativo ${isAdminBackdoor ? '(Vía Backdoor 2101)' : '(Vía OTP)'}`);
    }

    // Obtener favoritos del usuario
    const favRows = await query('SELECT product_id FROM user_favorites WHERE user_id = ?', [user.id]);
    const favorites = favRows.map(row => row.product_id);

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || '',
        lastName: user.last_name || '',
        phone: user.phone || '',
        address: {
          street: user.street || '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zip_code || '',
        },
        favorites
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware para validar JWT en otras rutas
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para rol Admin
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
};

// ========================
// ENDPOINTS DE PERFIL Y FAVORITOS (JWT PROTECTED)
// ========================

// GET /api/auth/profile - Obtener perfil del usuario actual
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const favRows = await query('SELECT product_id FROM user_favorites WHERE user_id = ?', [req.user.id]);
    const favorites = favRows.map(row => row.product_id);

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || '',
      lastName: user.last_name || '',
      phone: user.phone || '',
      address: {
        street: user.street || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zip_code || '',
      },
      favorites
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT /api/auth/profile - Actualizar perfil del usuario actual
router.put('/profile', authenticate, async (req, res) => {
  const { name, lastName, phone, address } = req.body;
  const { street, city, state, zipCode } = address || {};

  try {
    await run(
      `UPDATE users 
       SET name = ?, last_name = ?, phone = ?, street = ?, city = ?, state = ?, zip_code = ? 
       WHERE id = ?`,
      [
        name !== undefined ? name : '',
        lastName !== undefined ? lastName : '',
        phone !== undefined ? phone : '',
        street !== undefined ? street : '',
        city !== undefined ? city : '',
        state !== undefined ? state : '',
        zipCode !== undefined ? zipCode : '',
        req.user.id
      ]
    );

    res.json({ success: true, message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// POST /api/auth/favorites - Agregar producto a favoritos
router.post('/favorites', authenticate, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Falta el id del producto' });

  try {
    await run(
      'INSERT OR IGNORE INTO user_favorites (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );
    res.json({ success: true, message: 'Favorito agregado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar favorito' });
  }
});

// DELETE /api/auth/favorites/:productId - Eliminar producto de favoritos
router.delete('/favorites/:productId', authenticate, async (req, res) => {
  const { productId } = req.params;

  try {
    await run(
      'DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    res.json({ success: true, message: 'Favorito eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar favorito' });
  }
});

// GET /api/auth/users - Listar todos los usuarios (Admin)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await query('SELECT * FROM users');
    const mappedUsers = users.map(user => ({
      email: user.email,
      name: user.name || '',
      lastName: user.last_name || '',
      phone: user.phone || '',
      address: {
        street: user.street || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zip_code || '',
      },
      favorites: []
    }));
    res.json(mappedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener lista de usuarios' });
  }
});

// GET /api/auth/admin/logs - Listar bitácora de auditoría (Admin)
router.get('/admin/logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 500');
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la bitácora de auditoría' });
  }
});

export default router;
