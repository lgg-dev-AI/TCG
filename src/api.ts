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
  const isAdmin = email.toLowerCase().includes('admin');
  const code = isAdmin ? '2101' : (100000 + Math.floor(Math.random() * 900000)).toString();

  // Guardar en sessionStorage de forma segura con expiración de 1 hora
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(`pv_otp_${email.toLowerCase().trim()}`, JSON.stringify({
      code,
      expiresAt: Date.now() + 60 * 60 * 1000
    }));
  }

  return {
    message: 'Código generado exitosamente',
    emailSent: false,
    simulatedEmail: {
      to: email,
      from: 'no-reply@pokevault.mx',
      subject: `Código de acceso PokéVault [${code}]`,
      code,
      html: `<div style="padding: 20px; color: white;">Tu código de acceso es: <b style="font-size: 26px; color: #ffcb05; letter-spacing: 3px;">${code}</b><p style="font-size: 11px; color: #aaa;">Válido por 1 hora.</p></div>`
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
  const cleanCode = code.trim();

  // 1. Acceso de administrador con PIN maestro 2101
  const isMasterAdmin = cleanCode === '2101' || cleanCode === '6cf713e83ca48f8a190b07af39303ea10884872d491f8d0c2056907fc2a26bad';

  // 2. Verificar si coincide con el OTP dinámico emitido para este correo
  let isValid = false;
  if (typeof sessionStorage !== 'undefined') {
    const raw = sessionStorage.getItem(`pv_otp_${cleanEmail}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.code === cleanCode && Date.now() <= parsed.expiresAt) {
          isValid = true;
        }
      } catch {}
    }
  }

  // 3. Fallback código demo general
  if (cleanCode === '123456') {
    isValid = true;
  }

  if (!isValid && !isMasterAdmin) {
    throw new Error('Código incorrecto o expirado.');
  }

  const isAdmin = cleanEmail.includes('admin') || isMasterAdmin;
  return {
    token: 'jwt_secure_' + Date.now(),
    user: {
      id: isAdmin ? 'admin_001' : 'usr_' + Date.now(),
      email: email,
      role: isAdmin ? 'ADMIN' : 'CUSTOMER',
      name: isAdmin ? 'Administrador' : 'Usuario PokéVault',
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
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('API /products no disponible, usando localStorage', e);
  }
  const local = localStorage.getItem('pokevault_standalone_products');
  return local ? JSON.parse(local) : [];
};

export const apiGetAllProductsAdmin = async () => {
  try {
    const res = await fetch(`${API_BASE}/products/all`, { headers: getAuthHeaders() });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('API /products/all no disponible, usando localStorage', e);
  }
  const local = localStorage.getItem('pokevault_standalone_products');
  return local ? JSON.parse(local) : [];
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
export const apiCheckout = async (
  cartItems: {productId: string, quantity: number}[],
  paymentMethod?: string,
  paymentReceipt?: string
) => {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cartItems, paymentMethod, paymentReceipt })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al procesar el pago');
  }
  return res.json();
};

export const apiGetMyOrders = async () => {
  const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const apiGetAllOrdersAdmin = async () => {
  const res = await fetch(`${API_BASE}/orders/all`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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

