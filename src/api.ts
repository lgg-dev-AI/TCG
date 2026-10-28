import { INITIAL_PRODUCTS, STANDALONE_ORDERS } from './data/initialProducts';

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// ========================
// AUTHENTICATION
// ========================
export const apiLogin = async (email: string) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('API /auth/login no disponible, activando modo autónomo (Vercel)', e);
  }

  // Fallback para modo en la nube / Vercel sin servidor independiente
  const cleanEmail = email.toLowerCase().trim();
  const isAdmin = cleanEmail.includes('admin') || 
                  cleanEmail.includes('cliente') || 
                  cleanEmail === 'cliente@pokevault.com' ||
                  cleanEmail === 'demo@pokevault.com';
  
  // Clave maestra predeterminada para cliente / admin
  const code = isAdmin ? '2026' : (100000 + Math.floor(Math.random() * 900000)).toString();

  // Guardar en sessionStorage de forma segura con expiración de 1 hora
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(`pv_otp_${cleanEmail}`, JSON.stringify({
      code,
      expiresAt: Date.now() + 60 * 60 * 1000
    }));
  }

  return {
    message: 'Código generado exitosamente',
    emailSent: false,
    simulatedEmail: {
      to: email,
      from: 'admin@pokevault.mx',
      subject: `Código de acceso Administrador PokéVault [${code}]`,
      code,
      html: `<div style="padding: 20px; color: white;">Tu contraseña / código de acceso es: <b style="font-size: 26px; color: #ffcb05; letter-spacing: 3px;">${code}</b><p style="font-size: 11px; color: #aaa;">Acceso completo al Panel de Administrador de PokéVault.</p></div>`
    }
  };
};

export const apiVerifyOTP = async (email: string, code: string) => {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    console.warn('API /auth/verify no disponible, activando modo autónomo (Vercel)', e);
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().toLowerCase().trim();

  // Contraseñas y PINs maestros para administradores y cliente
  const ADMIN_PASSWORDS = [
    '2026',
    '2101',
    'admin2026',
    'vault2026',
    '123456',
    '6cf713e83ca48f8a190b07af39303ea10884872d491f8d0c2056907fc2a26bad'
  ];

  const isMasterAdmin = ADMIN_PASSWORDS.includes(cleanCode);

  // 2. Verificar si coincide con el OTP dinámico emitido para este correo
  let isValid = false;
  if (typeof sessionStorage !== 'undefined') {
    const raw = sessionStorage.getItem(`pv_otp_${cleanEmail}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.code.toString().toLowerCase() === cleanCode && Date.now() <= parsed.expiresAt) {
          isValid = true;
        }
      } catch {}
    }
  }

  // 3. Fallback código demo general
  if (cleanCode === '123456' || isMasterAdmin) {
    isValid = true;
  }

  if (!isValid && !isMasterAdmin) {
    throw new Error('Código o contraseña incorrecta.');
  }

  const isAdmin = cleanEmail.includes('admin') || 
                  cleanEmail.includes('cliente') || 
                  cleanEmail === 'cliente@pokevault.com' ||
                  isMasterAdmin;

  return {
    token: 'jwt_secure_' + Date.now(),
    user: {
      id: isAdmin ? 'admin_client_001' : 'usr_' + Date.now(),
      email: email,
      role: isAdmin ? 'ADMIN' : 'CUSTOMER',
      name: cleanEmail.includes('cliente') ? 'Cliente Revisor' : (isAdmin ? 'Administrador PokéVault' : 'Usuario PokéVault'),
      lastName: 'PokéVault',
      phone: '555-123-4567',
      address: {
        street: 'Av. Insurgentes 123',
        city: 'CDMX',
        state: 'CDMX',
        zipCode: '01000'
      },
      favorites: []
    }
  };
};

// ========================
// PRODUCTS
// ========================
export const apiGetProducts = async () => {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('API /products no disponible, usando modo autónomo Vercel / local:', e);
  }

  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('pokevault_standalone_products');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Fusionar con INITIAL_PRODUCTS para garantizar que todos los nuevos productos (ej. One Piece)
          // y URLs de imágenes actualizadas se reflejen de inmediato sin borrar productos creados por el admin
          const initialMap = new Map(INITIAL_PRODUCTS.map(p => [p.id, p]));
          const updated = parsed.map((p: any) => {
            const fresh = initialMap.get(p.id);
            if (fresh) {
              return { 
                ...fresh, 
                ...p, 
                image: fresh.image, 
                gameType: fresh.gameType || p.gameType, 
                subCategory: fresh.subCategory || p.subCategory,
                price: p.price ?? fresh.price
              };
            }
            return p;
          });
          const existingIds = new Set(updated.map((p: any) => p.id));
          const missing = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id));
          const fullList = [...updated, ...missing];
          localStorage.setItem('pokevault_standalone_products', JSON.stringify(fullList));
          return fullList;
        }
      } catch {}
    }
    // Guardar catálogo inicial completo en localStorage para persistencia y modificaciones
    localStorage.setItem('pokevault_standalone_products', JSON.stringify(INITIAL_PRODUCTS));
  }
  return INITIAL_PRODUCTS;
};

export const apiGetAllProductsAdmin = async () => {
  try {
    const res = await fetch(`${API_BASE}/products/all`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('API /products/all no disponible, usando modo autónomo Vercel / local:', e);
  }

  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('pokevault_standalone_products');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initialMap = new Map(INITIAL_PRODUCTS.map(p => [p.id, p]));
          const updated = parsed.map((p: any) => {
            const fresh = initialMap.get(p.id);
            if (fresh) {
              return { 
                ...fresh, 
                ...p, 
                image: fresh.image, 
                gameType: fresh.gameType || p.gameType, 
                subCategory: fresh.subCategory || p.subCategory,
                price: p.price ?? fresh.price
              };
            }
            return p;
          });
          const existingIds = new Set(updated.map((p: any) => p.id));
          const missing = INITIAL_PRODUCTS.filter(p => !existingIds.has(p.id));
          const fullList = [...updated, ...missing];
          localStorage.setItem('pokevault_standalone_products', JSON.stringify(fullList));
          return fullList;
        }
      } catch {}
    }
    localStorage.setItem('pokevault_standalone_products', JSON.stringify(INITIAL_PRODUCTS));
  }
  return INITIAL_PRODUCTS;
};

export const apiCreateProduct = async (productData: any) => {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('API /products (POST) no disponible, guardando en localStorage', e);
  }

  // Standalone fallback: persist to localStorage
  const local = localStorage.getItem('pokevault_standalone_products');
  const products = local ? JSON.parse(local) : [];
  const created = {
    ...productData,
    id: 'prod_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    is_active: 1
  };
  products.unshift(created);
  localStorage.setItem('pokevault_standalone_products', JSON.stringify(products));
  return created;
};

export const apiUpdateProduct = async (id: string, productData: any) => {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('API /products (PUT) no disponible, actualizando en localStorage', e);
  }

  const local = localStorage.getItem('pokevault_standalone_products');
  if (local) {
    const products = JSON.parse(local);
    const updated = products.map((p: any) => p.id === id ? { ...p, ...productData } : p);
    localStorage.setItem('pokevault_standalone_products', JSON.stringify(updated));
  }
  return { id, ...productData };
};

export const apiDeleteProduct = async (id: string) => {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('API /products (DELETE) no disponible, eliminando de localStorage', e);
  }

  const local = localStorage.getItem('pokevault_standalone_products');
  if (local) {
    const products = JSON.parse(local);
    const filtered = products.filter((p: any) => p.id !== id);
    localStorage.setItem('pokevault_standalone_products', JSON.stringify(filtered));
  }
  return { success: true };
};

// ========================
// ORDERS
// ========================
export interface CustomerCheckoutData {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  total?: number;
  discountApplied?: number;
}

export const apiCheckout = async (
  cartItems: {productId: string, quantity: number, name?: string, price?: number}[],
  paymentMethod: string = 'Transferencia',
  paymentReceipt?: string,
  customerData?: CustomerCheckoutData
) => {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        cartItems,
        paymentMethod,
        paymentReceipt,
        customerName: customerData?.name,
        customerEmail: customerData?.email,
        customerPhone: customerData?.phone,
        shippingAddress: customerData?.address
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.orderId) return data;
    }
  } catch (apiErr) {
    console.warn('API /orders no disponible, procesando orden en modo autónomo PokéVault (Vercel/Local):', apiErr);
  }

  // Fallback autónomo / Vercel: Generar orden exitosamente y guardar en localStorage
  const orderId = `PV-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanEmail = customerData?.email?.trim() || 'cliente@pokevault.mx';
  const cleanName = customerData?.name?.trim() || 'Cliente PokéVault';
  const totalAmount = customerData?.total || cartItems.reduce((acc, it) => acc + (it.quantity * 100), 0);
  const status = paymentMethod === 'PayPal' ? 'PAGADO' : 'Pendiente';

  // Buscar datos bancarios en localStorage si existen
  let bankName = 'BBVA';
  let clabe = '012180012345678901';
  let beneficiary = 'PokéVault México';
  if (typeof localStorage !== 'undefined') {
    const savedBank = localStorage.getItem('pokevault_bank_settings');
    if (savedBank) {
      try {
        const parsed = JSON.parse(savedBank);
        if (parsed.bankName) bankName = parsed.bankName;
        if (parsed.clabe) clabe = parsed.clabe;
        if (parsed.beneficiary) beneficiary = parsed.beneficiary;
      } catch {}
    }
  }

  // Generar HTML de correo de confirmación de PokéVault
  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0e1118; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #1a2233;">
      <div style="background-color: #ff3e3e; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 5px solid #ffcb05;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase;">PokéVault</h1>
        <span style="font-size: 11px; color: #ffcb05; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Confirmación de Pedido</span>
      </div>
      <div style="padding: 30px 24px; background-color: #161b26; border-radius: 0 0 12px 12px;">
        <h2 style="font-size: 18px; color: #ffffff; margin-top: 0; font-weight: 700; text-align: center;">¡Pedido Registrado con Éxito!</h2>
        <p style="font-size: 13px; color: #a0aec0; line-height: 1.6; text-align: center; margin-bottom: 24px;">
          Hola <strong>${cleanName}</strong>, gracias por comprar en <strong>PokéVault</strong>. Hemos registrado tu pedido número <strong style="color: #ffcb05;">${orderId}</strong> por un total de <strong>$${totalAmount.toLocaleString('es-MX')} MXN</strong>.
        </p>
        ${paymentMethod === 'Transferencia' ? `
        <div style="background: rgba(255, 203, 5, 0.08); border: 1px solid rgba(255, 203, 5, 0.3); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #ffcb05; font-size: 13px;">Datos para Transferencia SPEI:</h4>
          <p style="margin: 4px 0; font-size: 12px; color: #e2e8f0;">Banco: <strong>${bankName}</strong></p>
          <p style="margin: 4px 0; font-size: 12px; color: #e2e8f0;">CLABE: <strong>${clabe}</strong></p>
          <p style="margin: 4px 0; font-size: 12px; color: #e2e8f0;">Beneficiario: <strong>${beneficiary}</strong></p>
          <p style="margin: 4px 0; font-size: 12px; color: #e2e8f0;">Concepto / Referencia: <strong>${orderId}</strong></p>
        </div>` : ''}
        <p style="font-size: 11px; color: #718096; text-align: center; border-top: 1px solid #1a2233; padding-top: 16px; margin: 0;">
          Gracias por confiar en PokéVault. Validaremos tu pedido de inmediato.
        </p>
      </div>
    </div>
  `;

  // Guardar en la lista de órdenes autónomas / admin en localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('pokevault_standalone_orders');
      let ordersList = stored ? JSON.parse(stored) : [...STANDALONE_ORDERS];
      if (!Array.isArray(ordersList)) ordersList = [...STANDALONE_ORDERS];

      const newOrderEntry = {
        id: orderId,
        user_email: cleanEmail,
        customer_name: cleanName,
        total: totalAmount,
        status: status,
        tracking_number: paymentMethod === 'Transferencia' ? 'SPEI-PENDIENTE' : paymentMethod === 'PayPal' ? 'PAYPAL-CONFIRMADO' : 'PAGO-EN-SUCURSAL',
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        items: cartItems.map(ci => ({
          product_id: ci.productId,
          quantity: ci.quantity,
          price_at_purchase: Math.round(totalAmount / (cartItems.length || 1))
        }))
      };

      ordersList.unshift(newOrderEntry);
      localStorage.setItem('pokevault_standalone_orders', JSON.stringify(ordersList));
    } catch (saveErr) {
      console.warn('No se pudo guardar la orden en localStorage:', saveErr);
    }
  }

  return {
    success: true,
    orderId,
    totalAmount,
    status,
    emailSentToClient: false,
    emailSentToAdmin: false,
    simulatedEmail: {
      to: cleanEmail,
      from: 'orders@pokevault.mx',
      subject: `Confirmación de pedido ${orderId} en PokéVault`,
      html: emailHtml
    }
  };
};

export const apiGetMyOrders = async () => {
  const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiGetAllOrdersAdmin = async () => {
  try {
    const res = await fetch(`${API_BASE}/orders/all`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('API /orders/all no disponible, usando modo autónomo Vercel / local:', e);
  }

  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('pokevault_standalone_orders');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    localStorage.setItem('pokevault_standalone_orders', JSON.stringify(STANDALONE_ORDERS));
  }
  return STANDALONE_ORDERS;
};

export const apiUpdateOrderStatus = async (id: string, status: string, trackingNumber?: string) => {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, trackingNumber })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ========================
// PROFILE & FAVORITES
// ========================
export const apiGetProfile = async () => {
  const res = await fetch(`${API_BASE}/auth/profile`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiUpdateProfile = async (profileData: { name: string; lastName: string; phone: string; address: any }) => {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiAddFavorite = async (productId: string) => {
  const res = await fetch(`${API_BASE}/auth/favorites`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiRemoveFavorite = async (productId: string) => {
  const res = await fetch(`${API_BASE}/auth/favorites/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiGetAllUsersAdmin = async () => {
  const res = await fetch(`${API_BASE}/auth/users`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ========================
// BANK SETTINGS
// ========================
export const apiGetBankSettings = async () => {
  const res = await fetch(`${API_BASE}/orders/settings`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiUpdateBankSettings = async (settings: any) => {
  const res = await fetch(`${API_BASE}/orders/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ========================
// BUYBACK
// ========================
export const apiSubmitBuyback = async (buybackData: any) => {
  const res = await fetch(`${API_BASE}/buyback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(buybackData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al enviar la solicitud de recompra');
  }
  return res.json();
};

export const apiGetMyBuybacks = async () => {
  const res = await fetch(`${API_BASE}/buyback`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiGetAllBuybacksAdmin = async () => {
  const res = await fetch(`${API_BASE}/buyback/all`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiUpdateBuybackStatus = async (id: string, status: string) => {
  const res = await fetch(`${API_BASE}/buyback/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiRegisterManualSale = async (saleData: {
  customerName: string;
  customerEmail?: string;
  paymentMethod: string;
  items: { productId: string; quantity: number }[];
}) => {
  const res = await fetch(`${API_BASE}/orders/manual`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(saleData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al registrar la venta física');
  }
  return res.json();
};

export const apiGetAdminLogs = async () => {
  const res = await fetch(`${API_BASE}/auth/admin/logs`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ========================
// CATEGORÍAS & SUBCATEGORÍAS DINÁMICAS
// ========================
export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  icon?: string;
  color?: string;
  order_index?: number;
  is_content_bar?: boolean | number;
}

export const DEFAULT_FALLBACK_CATEGORIES: CategoryItem[] = [
  { id: 'cat_tcg', name: 'Cartas & TCGs', slug: 'tcg', parent_id: null, icon: 'Sparkles', color: '#ffcb05', order_index: 1 },
  { id: 'cat_videogames', name: 'Videojuegos & Consolas', slug: 'videogames', parent_id: null, icon: 'Gamepad2', color: '#a855f7', order_index: 2 },
  { id: 'cat_accessories', name: 'Accesorios & Protección', slug: 'accessories', parent_id: null, icon: 'ShieldCheck', color: '#3b82f6', order_index: 3 },
  { id: 'cat_collectibles', name: 'Coleccionables & Figuras', slug: 'collectibles', parent_id: null, icon: 'Package', color: '#10b981', order_index: 4 },
  // Subcategorías TCG
  { id: 'sub_pokemon', name: 'Pokémon TCG', slug: 'pokemon', parent_id: 'cat_tcg', icon: 'Sparkles', color: '#ffcb05', order_index: 1 },
  { id: 'sub_magic', name: 'Magic: The Gathering', slug: 'magic', parent_id: 'cat_tcg', icon: 'Flame', color: '#f97316', order_index: 2 },
  { id: 'sub_yugioh', name: 'Yu-Gi-Oh!', slug: 'yugioh', parent_id: 'cat_tcg', icon: 'Swords', color: '#ef4444', order_index: 3 },
  { id: 'sub_onepiece', name: 'One Piece Card Game', slug: 'onepiece', parent_id: 'cat_tcg', icon: 'Ship', color: '#06b6d4', order_index: 4 },
  { id: 'sub_lorcana', name: 'Disney Lorcana', slug: 'lorcana', parent_id: 'cat_tcg', icon: 'Wand2', color: '#8b5cf6', order_index: 5 },
  // Subcategorías Videojuegos
  { id: 'sub_switch', name: 'Nintendo Switch', slug: 'switch', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#ef4444', order_index: 1 },
  { id: 'sub_playstation', name: 'PlayStation (PS5 / PS4)', slug: 'playstation', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#2563eb', order_index: 2 },
  { id: 'sub_xbox', name: 'Xbox Series & One', slug: 'xbox', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#16a34a', order_index: 3 },
  { id: 'sub_retro', name: 'Retro Gaming (N64, GBA, SNES)', slug: 'retro', parent_id: 'cat_videogames', icon: 'Gamepad2', color: '#f59e0b', order_index: 4 },
  // Subcategorías Accesorios
  { id: 'sub_sleeves', name: 'Micas Protectoras (Sleeves)', slug: 'sleeves', parent_id: 'cat_accessories', icon: 'ShieldCheck', color: '#3b82f6', order_index: 1 },
  { id: 'sub_binders', name: 'Carpetas & Portafolios (Binders)', slug: 'binders', parent_id: 'cat_accessories', icon: 'BookOpen', color: '#6366f1', order_index: 2 },
  { id: 'sub_toploaders', name: 'Toploaders & Cajas Acrílicas', slug: 'toploaders', parent_id: 'cat_accessories', icon: 'Box', color: '#14b8a6', order_index: 3 },
  { id: 'sub_playmats', name: 'Playmats & Tapetes Oficiales', slug: 'playmats', parent_id: 'cat_accessories', icon: 'Layers', color: '#ec4899', order_index: 4 }
];

export const apiGetCategories = async (): Promise<CategoryItem[]> => {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('API /categories no disponible, usando respaldo local en memoria/storage:', e);
  }

  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('pv_custom_categories');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
  }
  return DEFAULT_FALLBACK_CATEGORIES;
};

export const apiCreateCategory = async (catData: Partial<CategoryItem>): Promise<CategoryItem> => {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(catData)
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('Error en API /categories, guardando localmente:', e);
  }

  // Fallback local
  const current = await apiGetCategories();
  const newCat: CategoryItem = {
    id: 'cat_' + Date.now().toString(36),
    name: catData.name || 'Nueva Categoría',
    slug: (catData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parent_id: catData.parent_id || null,
    icon: catData.icon || 'Package',
    color: catData.color || '#3b82f6',
    order_index: (catData.order_index ?? current.length) + 1
  };
  const updated = [...current, newCat];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pv_custom_categories', JSON.stringify(updated));
  }
  return newCat;
};

export const apiUpdateCategory = async (id: string, catData: Partial<CategoryItem>): Promise<CategoryItem> => {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(catData)
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('Error en API /categories PUT, actualizando localmente:', e);
  }

  const current = await apiGetCategories();
  const updated = current.map(c => c.id === id ? { ...c, ...catData } : c);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pv_custom_categories', JSON.stringify(updated));
  }
  return updated.find(c => c.id === id) as CategoryItem;
};

export const apiDeleteCategory = async (id: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) return;
  } catch (e) {
    console.warn('Error en API /categories DELETE, eliminando localmente:', e);
  }

  const current = await apiGetCategories();
  const updated = current.filter(c => c.id !== id && c.parent_id !== id);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pv_custom_categories', JSON.stringify(updated));
  }
};

