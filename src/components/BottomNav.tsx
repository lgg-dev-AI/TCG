import { Home, Layers, Search, ShoppingCart, User, Shield } from 'lucide-react';

interface BottomNavProps {
  currentSection: string;
  onNavigateSection: (section: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenCategories: () => void;
  onOpenSearch: () => void;
  currentUser: string | null;
  isAdmin: boolean;
  onUserClick: () => void;
}

export default function BottomNav({
  currentSection,
  onNavigateSection,
  cartCount,
  onOpenCart,
  onOpenCategories,
  onOpenSearch,
  currentUser,
  isAdmin,
  onUserClick,
}: BottomNavProps) {
  return (
    <nav 
      className="bottom-nav-mobile"
      aria-label="Navegación Móvil Inferior"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        height: '62px',
        backgroundColor: 'rgba(10, 13, 20, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'none', // Se activa con @media (max-width: 768px) en index.css
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 990,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* 1. Inicio */}
      <button
        onClick={() => onNavigateSection('home')}
        style={{
          background: 'none',
          border: 'none',
          color: currentSection === 'home' ? 'var(--primary)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          cursor: 'pointer',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px'
        }}
      >
        <Home size={20} strokeWidth={currentSection === 'home' ? 2.5 : 2} />
        <span style={{ fontSize: '10px', fontWeight: currentSection === 'home' ? 700 : 500, fontFamily: 'var(--font-heading)' }}>
          Inicio
        </span>
      </button>

      {/* 2. Categorías / Explorar (Abre Bottom Sheet) */}
      <button
        onClick={onOpenCategories}
        style={{
          background: 'none',
          border: 'none',
          color: currentSection === 'catalog' ? '#ffcb05' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          cursor: 'pointer',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px'
        }}
      >
        <Layers size={20} strokeWidth={currentSection === 'catalog' ? 2.5 : 2} />
        <span style={{ fontSize: '10px', fontWeight: currentSection === 'catalog' ? 700 : 500, fontFamily: 'var(--font-heading)' }}>
          Explorar
        </span>
      </button>

      {/* 3. Buscar */}
      <button
        onClick={onOpenSearch}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          cursor: 'pointer',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px'
        }}
      >
        <Search size={20} strokeWidth={2} />
        <span style={{ fontSize: '10px', fontWeight: 500, fontFamily: 'var(--font-heading)' }}>
          Buscar
        </span>
      </button>

      {/* 4. Carrito con Badge */}
      <button
        onClick={onOpenCart}
        style={{
          background: 'none',
          border: 'none',
          color: cartCount > 0 ? 'var(--text-main)' : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          cursor: 'pointer',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px',
          position: 'relative'
        }}
      >
        <div style={{ position: 'relative' }}>
          <ShoppingCart size={20} strokeWidth={2} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              background: 'var(--primary)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
            }}>
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </div>
        <span style={{ fontSize: '10px', fontWeight: cartCount > 0 ? 700 : 500, fontFamily: 'var(--font-heading)' }}>
          Carrito
        </span>
      </button>

      {/* 5. Perfil / Admin */}
      <button
        onClick={onUserClick}
        style={{
          background: 'none',
          border: 'none',
          color: currentSection === 'account' || currentSection === 'admin' ? (isAdmin ? '#ff6b6b' : '#34d399') : 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          cursor: 'pointer',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px'
        }}
      >
        {isAdmin ? <Shield size={20} strokeWidth={2} /> : <User size={20} strokeWidth={2} />}
        <span style={{ fontSize: '10px', fontWeight: 500, fontFamily: 'var(--font-heading)' }}>
          {currentUser ? (isAdmin ? 'Admin' : 'Perfil') : 'Entrar'}
        </span>
      </button>
    </nav>
  );
}
