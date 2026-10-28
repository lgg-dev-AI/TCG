import { useState } from 'react';
import { ShoppingCart, Search, Menu, X, RefreshCw, Store, User, LogOut, Shield, Home as HomeIcon } from 'lucide-react';
import ContentBar from './ContentBar';
import type { CategoryItem } from '../api';

interface NavbarProps {
  cartCount: number;
  onCartToggle: () => void;
  onSectionChange: (section: string) => void;
  currentSection: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: string | null;
  isAdmin: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  activeGame: string;
  onGameChange: (game: string) => void;
  categories?: CategoryItem[];
  onSelectCategory?: (category: string) => void;
  onSelectDeals?: () => void;
  onConfigureBar?: () => void;
}

export default function Navbar({
  cartCount,
  onCartToggle,
  onSectionChange,
  currentSection,
  searchQuery,
  onSearchChange,
  currentUser,
  isAdmin,
  onLoginClick,
  onLogout,
  activeGame,
  onGameChange,
  categories,
  onSelectCategory,
  onSelectDeals,
  onConfigureBar,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Inicio', icon: HomeIcon },
    { id: 'catalog', label: 'Tienda', icon: Store },
    { id: 'buyback', label: 'Compramos Cartas', icon: RefreshCw },
    ...(isAdmin ? [{ id: 'admin', label: 'Panel Admin', icon: Shield }] : [])
  ];

  const handleUserIconClick = () => {
    if (!currentUser) {
      onLoginClick();
    } else if (isAdmin) {
      onSectionChange('admin');
    } else {
      onSectionChange('account');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#0a0d14', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }}>
      {/* Barra de Anuncios */}
      <div style={{
        background: 'linear-gradient(90deg, #ff3e3e, #b01a1a)',
        color: '#ffffff',
        textAlign: 'center',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        🔥 Envíos gratis a todo México en compras mayores a $1,499 MXN | Preventas Disponibles 🔥
      </div>

      {/* Menú Principal Opaque Premium */}
      <div style={{
        backgroundColor: '#0d111a',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
      }}>
        {/* Logo */}
        <div 
          onClick={() => onSectionChange('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px var(--primary-glow)',
            fontWeight: 800,
            fontSize: '18px',
            color: 'white',
            fontFamily: 'var(--font-heading)'
          }}>
            P
          </div>
          <div>
            <h1 style={{
              fontSize: '20px',
              margin: 0,
              lineHeight: 1.1,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 60%, #ffcb05 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              POKÉ <span style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>VAULT</span>
            </h1>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Pokémon TCG & Hobby Store
            </span>
          </div>
        </div>

        {/* Buscador de Cartas (Solo visible en Tienda) */}
        {currentSection === 'catalog' && (
          <div style={{
            position: 'relative',
            maxWidth: '320px',
            width: '100%',
            display: 'none', // Oculto en móviles
          }} className="search-bar-desktop">
            <input
              type="text"
              placeholder="Buscar cartas..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '24px',
                padding: '8px 16px 8px 40px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <Search size={16} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
          </div>
        )}

        {/* Navegación de Escritorio */}
        <nav style={{ display: 'none' }} className="nav-desktop">
          <ul style={{ display: 'flex', gap: '24px', listStyle: 'none', margin: 0, padding: 0 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSectionChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      backgroundColor: isActive ? 'rgba(255, 62, 62, 0.08)' : 'transparent',
                    }}
                    className="nav-btn"
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                </li>
              );
            })}
            {/* TCG Selector */}
            <li style={{ display: 'flex', alignItems: 'center', marginLeft: '16px' }}>
              <select
                value={activeGame === 'ONEPIECE' ? 'ONE_PIECE' : activeGame}
                onChange={(e) => onGameChange(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="POKEMON">Pokémon TCG</option>
                <option value="MAGIC">Magic: The Gathering</option>
                <option value="YUGIOH">Yu-Gi-Oh!</option>
                <option value="ONE_PIECE">One Piece</option>
                <option value="DRAGON_BALL">Dragon Ball</option>
              </select>
            </li>
          </ul>
        </nav>

        {/* Acciones del Navbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Botón Carrito */}
          <button
            onClick={onCartToggle}
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'var(--border-color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
            title="Ver Carrito"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--primary)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Botón de Cuenta / Admin */}
          <button
            onClick={handleUserIconClick}
            style={{
              position: 'relative',
              background: isAdmin ? 'rgba(255, 62, 62, 0.1)' : 'rgba(255, 255, 255, 0.06)',
              border: isAdmin ? '1px solid rgba(255, 62, 62, 0.4)' : '1px solid var(--border-color)',
              color: isAdmin ? '#ff6b6b' : 'var(--text-main)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isAdmin ? 'rgba(255, 62, 62, 0.18)' : 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isAdmin ? 'rgba(255, 62, 62, 0.1)' : 'rgba(255, 255, 255, 0.06)';
            }}
            title={currentUser ? (isAdmin ? 'Panel Admin' : 'Mi Cuenta') : 'Iniciar Sesión'}
          >
            {isAdmin ? <Shield size={18} /> : <User size={18} />}
            {currentUser && (
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isAdmin ? '#ff3e3e' : '#1ba24c',
                border: '2px solid #0e1118',
                boxShadow: '0 0 4px rgba(0,0,0,0.5)'
              }} />
            )}
          </button>

          {/* Botón de Cerrar Sesión (Escritorio) */}
          {currentUser && (
            <button
              onClick={() => {
                onLogout();
                onSectionChange('catalog');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              className="logout-btn-desktop"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          )}

          {/* Menú de Hamburguesa para Móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="menu-toggle-mobile"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Barra de Contenido / Juegos Estilo TCGplayer */}
      <ContentBar
        activeGame={activeGame}
        onGameChange={onGameChange}
        onSelectCategory={onSelectCategory}
        onSelectDeals={onSelectDeals}
        customCategories={categories}
        isAdmin={isAdmin}
        onConfigureBar={onConfigureBar}
      />

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#0d111a',
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          borderBottom: '1px solid var(--border-color)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          zIndex: 99,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
        }}>
          {currentSection === 'catalog' && (
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Buscar cartas..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '24px',
                  padding: '10px 16px 10px 40px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <Search size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
            </div>
          )}

          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSectionChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: isActive ? 'rgba(255, 62, 62, 0.1)' : 'none',
                      border: 'none',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                </li>
              );
            })}
            
            {/* Separador */}
            <li style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

            {/* Selector de Juego Móvil */}
            <li style={{ padding: '0 16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Juego Activo:</label>
              <select
                value={activeGame === 'ONEPIECE' ? 'ONE_PIECE' : activeGame}
                onChange={(e) => {
                  onGameChange(e.target.value);
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '1px solid var(--border-color)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="POKEMON">Pokémon TCG</option>
                <option value="MAGIC">Magic: The Gathering</option>
                <option value="YUGIOH">Yu-Gi-Oh!</option>
                <option value="ONE_PIECE">One Piece</option>
                <option value="DRAGON_BALL">Dragon Ball</option>
              </select>
            </li>
            {/* Separador */}
            <li style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

            {/* Menú de cuenta en celular */}
            <li>
              <button
                onClick={handleUserIconClick}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: currentSection === 'account' || currentSection === 'admin' ? 'var(--primary)' : 'var(--text-main)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {isAdmin ? <Shield size={18} /> : <User size={18} />}
                {currentUser ? (isAdmin ? 'Panel de Administrador' : 'Mi Cuenta de Cliente') : 'Iniciar Sesión'}
              </button>
            </li>

            {currentUser && (
              <li>
                <button
                  onClick={() => {
                    onLogout();
                    onSectionChange('catalog');
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(255, 62, 62, 0.05)',
                    border: '1px solid rgba(255, 62, 62, 0.15)',
                    color: '#ff6b6b',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Inyección de estilos responsivos rápidos */}
      <style>{`
        @media (min-width: 768px) {
          .nav-desktop { display: block !important; }
          .search-bar-desktop { display: block !important; }
          .menu-toggle-mobile { display: none !important; }
          .logout-btn-desktop { display: flex !important; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </header>
  );
}
