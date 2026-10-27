import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ProductCatalog from './components/ProductCatalog';
import CardModal from './components/CardModal';
import CartDrawer from './components/CartDrawer';
import type { CartItem } from './components/CartDrawer';
import CheckoutForm from './components/CheckoutForm';
import BuybackPortal from './components/BuybackPortal';
import type { Product } from './components/ProductItem';

import LoginModal from './components/LoginModal';
import AccountPanel from './components/AccountPanel';
import type { UserData } from './components/AccountPanel';
import AdminPanel from './components/AdminPanel';
import type { Order, Coupon, BuybackRequest } from './components/AdminPanel';

import {
  apiGetProducts,
  apiGetProfile,
  apiAddFavorite,
  apiRemoveFavorite,
  apiGetAllOrdersAdmin,
  apiUpdateOrderStatus,
  apiUpdateProduct,
  apiCreateProduct,
  apiDeleteProduct,
  apiGetAllUsersAdmin,
  apiGetBankSettings,
  apiUpdateBankSettings,
  apiGetMyBuybacks,
  apiGetAllBuybacksAdmin,
  apiUpdateBuybackStatus,
  apiRegisterManualSale
} from './api';

// Helper to map product data from backend structure to legacy frontend structure
const mapProductFromDB = (p: any): Product => ({
  id: p.id,
  name: p.name,
  price: p.price,
  category: p.category,
  image: p.image_url,
  description: p.description,
  stock: p.stock,
  expansion: p.expansion || '',
  isPromo: !!p.is_promo,
  region: p.region || '',
  pulledFrom: p.pulled_from || '',
  cardCondition: p.card_condition || '',
  gameType: p.game_type || 'POKEMON',
  platform: p.platform || '',
  completeness: p.completeness || '',
  isTournamentStaple: !!p.is_tournament_staple,
  isFirstEdition: !!p.is_first_edition || !!p.isFirstEdition,
  galleryImages: p.gallery_images ? (typeof p.gallery_images === 'string' ? JSON.parse(p.gallery_images) : p.gallery_images) : (p.galleryImages || [])
});

// Helper for localStorage with fallback (retained for minor UI settings)
const getStorage = <T,>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  return defaultValue;
};

export default function App() {
  // Estados de navegación
  const [currentSection, setCurrentSection] = useState<string>('home'); // 'home' | 'catalog' | 'grading' | 'buyback' | 'simulator' | 'checkout' | 'account' | 'admin'
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGame, setActiveGame] = useState<string>('POKEMON'); // 'POKEMON' | 'MAGIC' | 'YUGIOH' | 'ONE_PIECE'

  // Estados del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Estados de modales
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Estados de API y Autenticación
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [dbUserData, setDbUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [productCache, setProductCache] = useState<Product[]>(() => getStorage('kt_productCache', []));
  const [usersList, setUsersList] = useState<UserData[]>([]);

  // Cupones y otros estados estáticos temporales (retained in localStorage for mock-based configs)
  const [coupons, setCoupons] = useState<Coupon[]>(() => getStorage('kt_coupons', [
    { code: 'POKEMON2026', discountPercent: 15, isActive: true },
    { code: 'POKE50', discountPercent: 50, isActive: true }
  ]));
  const [buybackRequests, setBuybackRequests] = useState<BuybackRequest[]>(() => getStorage('kt_buybackRequests', [
    {
      id: 'buyback_1',
      customerEmail: 'cliente@ejemplo.com',
      customerName: 'Cliente Ejemplo',
      date: new Date().toLocaleDateString('es-MX'),
      cards: [
        { name: 'Charizard ex', expansion: 'Pokémon 151', rarity: 'Single', condition: 'NM', isGraded: false, estimatedValue: 2100 }
      ],
      totalValue: 1470,
      status: 'Pendiente'
    }
  ]));
  const [bankSettings, setBankSettings] = useState(() => getStorage('kt_bankSettings', {
    bankName: 'BBVA',
    clabe: '012180012345678901',
    accountNumber: '1234567890',
    beneficiary: 'PokéVault México',
    whatsapp: ''
  }));

  // Modal Login
  const [loginOpen, setLoginOpen] = useState<boolean>(false);
  const [pendingCheckout, setPendingCheckout] = useState<boolean>(false);

  // Carga inicial de datos desde la API
  useEffect(() => {
    // 1. Cargar productos desde base de datos filtrados por juego actual
    apiGetProducts()
      .then((prods) => {
        setInventory(prods.map(mapProductFromDB));
      })
      .catch((err) => console.error('Error al cargar catálogo de productos:', err));

    // 2. Cargar configuraciones de banco desde la API
    apiGetBankSettings()
      .then((settings) => {
        setBankSettings(settings);
      })
      .catch((err) => console.error('Error al cargar configuraciones de banco:', err));

    // 3. Recuperar sesión con JWT token si existe
    const token = localStorage.getItem('jwt_token');
    if (token) {
      apiGetProfile()
        .then((profile) => {
          setCurrentUser(profile.email);
          setDbUserData(profile);

          // Si es administrador, cargar órdenes históricas, usuarios y recompras
          if (profile.role === 'ADMIN' || profile.email.toLowerCase() === 'admin@pokevault.com') {
            apiGetAllOrdersAdmin()
              .then((allOrders) => setOrders(allOrders))
              .catch((err) => console.error('Error al cargar órdenes (Admin):', err));
            apiGetAllUsersAdmin()
              .then((allUsers) => setUsersList(allUsers))
              .catch((err) => console.error('Error al cargar usuarios (Admin):', err));
            apiGetAllBuybacksAdmin()
              .then((allBuybacks) => setBuybackRequests(allBuybacks))
              .catch((err) => console.error('Error al cargar solicitudes de recompra (Admin):', err));
          } else {
            apiGetMyBuybacks()
              .then((myBuybacks) => setBuybackRequests(myBuybacks))
              .catch((err) => console.error('Error al cargar mis solicitudes de recompra:', err));
          }
        })
        .catch((err) => {
          console.error('La sesión expiró o es inválida:', err);
          localStorage.removeItem('jwt_token');
          setCurrentUser(null);
          setDbUserData(null);
        });
    }
  }, []);

  // Sync caches to localStorage
  useEffect(() => {
    localStorage.setItem('kt_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('kt_productCache', JSON.stringify(productCache));
  }, [productCache]);

  // Handlers Login/Logout
  const handleLogin = (email: string, user: any) => {
    setCurrentUser(email);
    setDbUserData(user);
    setLoginOpen(false);
    
    // Admin → panel admin; Client → redirige automáticamente a su panel de cuenta para no dejar en blanco
    if (email.toLowerCase() === 'admin@pokevault.com' || user.role === 'ADMIN') {
      apiGetAllOrdersAdmin()
        .then((allOrders) => setOrders(allOrders))
        .catch((err) => console.error('Error al cargar órdenes de admin:', err));
      apiGetAllUsersAdmin()
        .then((allUsers) => setUsersList(allUsers))
        .catch((err) => console.error('Error al cargar usuarios de admin:', err));
      apiGetAllBuybacksAdmin()
        .then((allBuybacks) => setBuybackRequests(allBuybacks))
        .catch((err) => console.error('Error al cargar solicitudes de recompra de admin:', err));
      setCurrentSection('admin');
      setPendingCheckout(false);
    } else {
      apiGetMyBuybacks()
        .then((myBuybacks) => setBuybackRequests(myBuybacks))
        .catch((err) => console.error('Error al cargar mis solicitudes de recompra:', err));
      if (pendingCheckout) {
        setCurrentSection('checkout');
        setPendingCheckout(false);
      } else {
        // Redirección inmediata a pantalla de cuenta
        setCurrentSection('account');
        setPendingCheckout(false);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setCurrentUser(null);
    setDbUserData(null);
    setCurrentSection('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUserData = (updatedData: UserData) => {
    setDbUserData(updatedData);
  };

  // Handlers Favoritos con sincronización real en base de datos
  const handleToggleFavorite = async (productId: string, product?: Product) => {
    if (!currentUser) {
      setLoginOpen(true);
      return;
    }

    if (!dbUserData) return;

    const isFav = dbUserData.favorites.includes(productId);
    try {
      if (isFav) {
        await apiRemoveFavorite(productId);
        setDbUserData({
          ...dbUserData,
          favorites: dbUserData.favorites.filter((id) => id !== productId)
        });
      } else {
        await apiAddFavorite(productId);
        if (product && !inventory.some((p) => p.id === product.id) && !productCache.some((p) => p.id === product.id)) {
          setProductCache((prev) => [...prev, product]);
        }
        setDbUserData({
          ...dbUserData,
          favorites: [...dbUserData.favorites, productId]
        });
      }
    } catch (err) {
      console.error('Error al guardar/eliminar favorito:', err);
    }
  };

  // Handlers Carrito
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        const newQty = Math.min(product.stock, existingItem.quantity + quantity);
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevItems, { product, quantity: Math.min(product.stock, quantity) }];
    });

    setCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setDiscountPercent(0);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Handlers de Pedidos y Compras (Sincronizados)
  const handlePlaceOrder = (order: Order) => {
    // 1. Agregar pedido a la lista local para admin panel temporal
    setOrders((prev) => [order, ...prev]);

    // 2. Descontar del inventario stock localmente
    setInventory((prevInv) => {
      return prevInv.map((p) => {
        const orderItem = order.items.find((item) => item.productId === p.id);
        if (orderItem) {
          return { ...p, stock: Math.max(0, p.stock - orderItem.quantity) };
        }
        return p;
      });
    });
  };

  // Handlers de Administración (Llamadas API Backend reales)
  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const currentOrder = orders.find((o) => o.id === orderId);
      const newStatus = (updates.status || (currentOrder ? currentOrder.status : 'PENDIENTE')).toUpperCase();
      const newTracking = updates.tracking_number !== undefined ? updates.tracking_number : (currentOrder ? currentOrder.tracking_number || '' : '');

      await apiUpdateOrderStatus(orderId, newStatus, newTracking);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
    } catch (err) {
      console.error('Error al actualizar pedido (Admin):', err);
    }
  };

  const handleUpdateInventoryItem = async (productId: string, updates: Partial<Product>) => {
    try {
      const payload = {
        name: updates.name,
        price: updates.price,
        category: updates.category,
        image_url: updates.image,
        description: updates.description,
        stock: updates.stock,
        expansion: updates.expansion,
        is_promo: updates.isPromo,
        region: updates.region,
        pulled_from: updates.pulledFrom,
        card_condition: updates.cardCondition,
        game_type: updates.gameType,
        platform: updates.platform,
        completeness: updates.completeness,
        is_tournament_staple: updates.isTournamentStaple,
        is_first_edition: updates.isFirstEdition,
        gallery_images: updates.galleryImages ? JSON.stringify(updates.galleryImages) : undefined
      };
      await apiUpdateProduct(productId, payload);
      setInventory((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
    } catch (err) {
      console.error('Error al guardar cambios de inventario:', err);
    }
  };

  const handleAddInventoryItem = async (newProduct: Product) => {
    try {
      const payload = {
        name: newProduct.name,
        price: newProduct.price,
        category: newProduct.category,
        image_url: newProduct.image,
        description: newProduct.description,
        stock: newProduct.stock,
        expansion: newProduct.expansion,
        is_promo: newProduct.isPromo,
        region: newProduct.region,
        pulled_from: newProduct.pulledFrom,
        card_condition: newProduct.cardCondition,
        game_type: newProduct.gameType,
        platform: newProduct.platform,
        completeness: newProduct.completeness,
        is_tournament_staple: newProduct.isTournamentStaple,
        is_first_edition: newProduct.isFirstEdition,
        gallery_images: newProduct.galleryImages ? JSON.stringify(newProduct.galleryImages) : undefined
      };
      const res = await apiCreateProduct(payload);
      setInventory((prev) => [mapProductFromDB(res), ...prev]);
    } catch (err) {
      console.error('Error al crear producto en catálogo:', err);
    }
  };

  const handleDeleteInventoryItem = async (productId: string) => {
    try {
      await apiDeleteProduct(productId);
      setInventory((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error('Error al eliminar producto del catálogo:', err);
    }
  };

  const handleUpdateBuybackStatus = async (requestId: string, status: BuybackRequest['status']) => {
    try {
      await apiUpdateBuybackStatus(requestId, status);
      setBuybackRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
    } catch (err) {
      console.error('Error al actualizar estado de recompra (Admin):', err);
    }
  };

  const handleUpdateBankSettings = async (newSettings: any) => {
    try {
      await apiUpdateBankSettings(newSettings);
      setBankSettings(newSettings);
    } catch (err) {
      console.error('Error al guardar configuraciones bancarias (Admin):', err);
    }
  };

  const handleRegisterManualSale = async (saleData: any) => {
    await apiRegisterManualSale(saleData);
    
    // Recargar órdenes
    const allOrders = await apiGetAllOrdersAdmin();
    setOrders(allOrders);

    // Recargar catálogo
    const prods = await apiGetProducts();
    setInventory(prods.map(mapProductFromDB));
  };

  const handleAddCoupon = (newCoupon: Coupon) => {
    setCoupons((prev) => {
      if (prev.some((c) => c.code === newCoupon.code)) return prev;
      return [...prev, newCoupon];
    });
  };

  const handleToggleCoupon = (code: string) => {
    setCoupons((prev) => prev.map((c) => (c.code === code ? { ...c, isActive: !c.isActive } : c)));
  };

  const handleSendBuybackRequest = (request: BuybackRequest) => {
    setBuybackRequests((prev) => [request, ...prev]);
  };

  const currentUserData = dbUserData;

  return (
    <>
      {/* Navbar Global */}
      <Navbar
        cartCount={cartCount}
        onCartToggle={() => setCartOpen(!cartOpen)}
        onSectionChange={(section) => {
          setCurrentSection(section);
          setSearchQuery(''); // Limpiar búsquedas al cambiar de sección
          if (section === 'catalog') {
            setCatalogCategory('all');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentSection={currentSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        isAdmin={dbUserData?.role === 'ADMIN'}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
        activeGame={activeGame}
        onGameChange={(game) => {
          setActiveGame(game);
          setCurrentSection('catalog');
          setCatalogCategory('all');
        }}
      />

      {/* Contenido Principal */}
      <main className="container" style={{ flexGrow: 1, minHeight: 'calc(100vh - 350px)', paddingInline: '24px' }}>
        
        {/* Renderizado de Sección de Inicio */}
        {currentSection === 'home' && (
          <Home
            onExploreClick={() => {
              setCatalogCategory('all');
              setCurrentSection('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreCategory={(cat) => {
              setCatalogCategory(cat);
              setCurrentSection('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewProductDetails={setSelectedProduct}
            onAddToCart={handleAddToCart}
            inventory={inventory.filter(p => p.gameType === activeGame || !p.gameType || (p.gameType === 'POKEMON' && activeGame === 'POKEMON'))}
            activeGame={activeGame}
          />
        )}

        {/* Renderizado de Sección Tienda */}
        {currentSection === 'catalog' && (
          <div id="catalog-catalog" style={{ paddingTop: '20px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
              {searchQuery ? `Resultados para: "${searchQuery}"` : `Catálogo ${activeGame}`}
            </h2>
            <ProductCatalog
              onAddToCart={handleAddToCart}
              onViewDetails={setSelectedProduct}
              searchQuery={searchQuery}
              inventory={inventory.filter(p => p.gameType === activeGame || (!p.gameType && activeGame === 'POKEMON'))}
              favorites={currentUserData?.favorites || []}
              onToggleFavorite={handleToggleFavorite}
              initialCategory={catalogCategory}
              activeGame={activeGame}
            />
          </div>
        )}

        {/* Renderizado de Sección Recompra */}
        {currentSection === 'buyback' && (
        <BuybackPortal
            currentUser={currentUser}
            userData={currentUserData}
            onSendBuybackRequest={handleSendBuybackRequest}
            onLoginRequest={() => setLoginOpen(true)}
            initialGame={activeGame}
          />
        )}

        {/* Renderizado de Sección Checkout */}
        {currentSection === 'checkout' && (
          <CheckoutForm
            cartItems={cartItems}
            discountPercent={discountPercent}
            onClose={() => {
              setCurrentSection('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSuccess={handleClearCart}
            currentUser={currentUser}
            userData={currentUserData}
            onPlaceOrder={handlePlaceOrder}
            bankSettings={bankSettings}
            inventory={inventory}
          />
        )}

        {/* Renderizado de Panel de Cuenta de Cliente */}
        {currentSection === 'account' && currentUser && (
          <AccountPanel
            currentUser={currentUser}
            userData={currentUserData || {
              email: currentUser,
              name: '',
              lastName: '',
              role: 'CUSTOMER',
              phone: '',
              address: { street: '', city: '', state: '', zipCode: '' },
              favorites: []
            }}
            onUpdateUserData={handleUpdateUserData}
            onViewProductDetails={setSelectedProduct}
            onAddToCart={handleAddToCart}
            allProducts={[...inventory, ...productCache]}
            onRemoveFavorite={(prodId) => handleToggleFavorite(prodId)}
          />
        )}

        {/* Renderizado de Panel de Administrador */}
        {currentSection === 'admin' && dbUserData?.role === 'ADMIN' && (
          <AdminPanel
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
            inventory={inventory}
            onUpdateInventoryItem={handleUpdateInventoryItem}
            onAddInventoryItem={handleAddInventoryItem}
            onDeleteInventoryItem={handleDeleteInventoryItem}
            buybackRequests={buybackRequests}
            onUpdateBuybackStatus={handleUpdateBuybackStatus}
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onToggleCoupon={handleToggleCoupon}
            users={usersList}
            bankSettings={bankSettings}
            onUpdateBankSettings={handleUpdateBankSettings}
            onRegisterManualSale={handleRegisterManualSale}
          />
        )}
      </main>

      {/* Cajón del Carrito Deslizable */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        discountPercent={discountPercent}
        onApplyDiscount={setDiscountPercent}
        onCheckout={() => {
          setCartOpen(false);
          if (!currentUser) {
            // Guardar intención y mostrar login
            setPendingCheckout(true);
            setLoginOpen(true);
          } else {
            setCurrentSection('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        coupons={coupons}
      />

      {/* Modal de Detalles del Producto */}
      {selectedProduct && (
        <CardModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        />
      )}

      {/* Modal de Login OTP */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLogin}
      />

      {/* Pie de Página Premium */}
      <footer className="glass" style={{
        marginTop: '60px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: '#0a0d14',
        padding: '50px 24px 20px 24px'
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          paddingBottom: '40px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '20px'
        }}>
          {/* Logo y Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '15px'
              }}>
                P
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
                POKÉVAULT
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Tu tienda de cartas coleccionables favorita en México. Especialistas en Pokémon TCG, productos sellados, accesorios y servicios oficiales de graduación.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nuestros Servicios
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li>
                <button 
                  onClick={() => { setCurrentSection('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  Tienda en Línea
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setCurrentSection('buyback'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  Compramos Tus Cartas
                </button>
              </li>
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Políticas de Tienda
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li><a href="#" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Políticas de Envíos y Retornos</a></li>
              <li><a href="#" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Garantía de Autenticidad</a></li>
              <li><a href="#" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Términos del Servicio</a></li>
              <li><a href="#" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Aviso de Privacidad</a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contacto
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li>📍 Ciudad de México, México</li>
              <li>✉️ soporte@pokevault.mx</li>
              <li>📞 +52 (55) 1234-5678</li>
              <li style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <a href="https://github.com" target="_blank" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copy */}
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <span>&copy; {new Date().getFullYear()} PokéVault. Todos los derechos reservados.</span>
          <span>Desarrollado para demostración premium. Pokemon y Pokémon TCG son marcas registradas de Nintendo / The Pokémon Company.</span>
        </div>
      </footer>
    </>
  );
}
