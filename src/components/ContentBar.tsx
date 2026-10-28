import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Gamepad2, ShieldCheck, ChevronDown, 
  Tag, Flame, Swords, Ship, Wand2, Compass, Layers, Box
} from 'lucide-react';

interface ContentBarProps {
  activeGame: string;
  catalogCategory?: string;
  selectedPlatform?: string;
  selectedAccessory?: string;
  onNavigate: (path: string, options?: { game?: string; category?: string; platform?: string; accessory?: string }) => void;
  isAdmin?: boolean;
  onConfigureBar?: () => void;
}

interface DropdownItem {
  id: string;
  name: string;
  path: string;
  game?: string;
  category?: string;
  platform?: string;
  accessory?: string;
  icon: any;
  color: string;
  badge?: string;
  description?: string;
}

export default function ContentBar({
  activeGame,
  catalogCategory,
  selectedPlatform,
  selectedAccessory,
  onNavigate,
}: ContentBarProps) {
  const [openDropdown, setOpenDropdown] = useState<'tcg' | 'videogames' | 'accessories' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Items de Cartas & TCG
  const tcgItems: DropdownItem[] = [
    { id: 'pokemon', name: 'Pokémon TCG', path: '/pokemon', game: 'POKEMON', icon: Sparkles, color: '#ffcb05', badge: 'PRINCIPAL', description: 'Cartas singles, sobres y cajas selladas' },
    { id: 'onepiece', name: 'One Piece Card Game', path: '/onepiece', game: 'ONE_PIECE', icon: Ship, color: '#06b6d4', badge: 'POPULAR', description: 'Luffy, Romance Dawn, OP-05 y más' },
    { id: 'magic', name: 'Magic: The Gathering', path: '/magic', game: 'MAGIC', icon: Flame, color: '#f97316', description: 'Modern, Commander y colecciones MTG' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!', path: '/yugioh', game: 'YUGIOH', icon: Swords, color: '#ef4444', description: 'Cartas icónicas y expansiones clásicas' },
    { id: 'lorcana', name: 'Disney Lorcana', path: '/lorcana', game: 'LORCANA', icon: Wand2, color: '#a855f7', badge: 'NUEVO', description: 'Illumineer troves, boosters y singles' },
    { id: 'dragonball', name: 'Dragon Ball Super', path: '/dragonball', game: 'DRAGON_BALL', icon: Flame, color: '#f59e0b', description: 'Goku, Vegeta y cartas coleccionables' },
    { id: 'digimon', name: 'Digimon Card Game', path: '/digimon', game: 'DIGIMON', icon: Compass, color: '#3b82f6', description: 'Cartas oficiales Bandai' },
  ];

  // 2. Items de Videojuegos & Consolas
  const videogameItems: DropdownItem[] = [
    { id: 'switch', name: 'Nintendo Switch', path: '/switch', category: 'videogame', platform: 'switch', icon: Gamepad2, color: '#ef4444', badge: 'POPULAR', description: 'Juegos físicos, consolas y accesorios' },
    { id: 'playstation', name: 'PlayStation (PS5 / PS4)', path: '/playstation', category: 'videogame', platform: 'playstation', icon: Gamepad2, color: '#2563eb', description: 'Ediciones exclusivas y lanzamientos' },
    { id: 'xbox', name: 'Xbox Series & One', path: '/xbox', category: 'videogame', platform: 'xbox', icon: Gamepad2, color: '#16a34a', description: 'Juegos físicos en disco y hardware' },
    { id: 'retro', name: 'Retro Gaming', path: '/retro', category: 'videogame', platform: 'retro', icon: Gamepad2, color: '#f59e0b', badge: 'COLECCIÓN', description: 'Game Boy, N64, SNES, GBA y 3DS' },
    { id: 'consolas', name: 'Consolas & Hardware', path: '/consolas', category: 'videogame', platform: 'consolas', icon: Layers, color: '#a855f7', description: 'Consolas portátiles y de sobremesa' },
  ];

  // 3. Items de Accesorios & Protección
  const accessoryItems: DropdownItem[] = [
    { id: 'sleeves', name: 'Micas Protectoras (Sleeves)', path: '/micas', category: 'accessory', accessory: 'sleeves', icon: ShieldCheck, color: '#3b82f6', badge: 'TOP', description: 'Standard, Japanese size y inner sleeves' },
    { id: 'binders', name: 'Carpetas & Portafolios (Binders)', path: '/carpetas', category: 'accessory', accessory: 'binders', icon: Layers, color: '#6366f1', description: 'Álbumes con cierre de 4, 9 y 12 bolsillos' },
    { id: 'toploaders', name: 'Toploaders & Cajas Acrílicas', path: '/toploaders', category: 'accessory', accessory: 'toploaders', icon: Box, color: '#14b8a6', description: 'Protectores rígidos y One-Touch magnet' },
    { id: 'playmats', name: 'Playmats & Tapetes Oficiales', path: '/playmats', category: 'accessory', accessory: 'playmats', icon: Sparkles, color: '#ec4899', description: 'Superficie suave para jugar y exhibir' },
    { id: 'deckboxes', name: 'Deck Boxes & Dados', path: '/deckboxes', category: 'accessory', accessory: 'deckbox', icon: Gamepad2, color: '#f59e0b', description: 'Cajas de almacenamiento y contadores' },
  ];

  const handleSelect = (item: DropdownItem) => {
    setOpenDropdown(null);
    onNavigate(item.path, {
      game: item.game,
      category: item.category,
      platform: item.platform,
      accessory: item.accessory
    });
  };

  // Determinar qué pilar está activo actualmente
  const isTcgActive = (!catalogCategory || catalogCategory === 'all' || catalogCategory === 'single' || catalogCategory === 'sealed');
  const isVideogamesActive = catalogCategory === 'videogame';
  const isAccessoriesActive = catalogCategory === 'accessory';

  return (
    <div 
      ref={containerRef}
      style={{
        backgroundColor: '#0a0d14',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 90
      }}
    >
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        minHeight: '46px',
        gap: '8px'
      }}>
        {/* Secciones Principales Desplegables */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {/* ============================================================== */}
          {/* 1. CARTAS & TCG */}
          {/* ============================================================== */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'tcg' ? null : 'tcg')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: openDropdown === 'tcg' 
                  ? 'rgba(255, 203, 5, 0.15)' 
                  : isTcgActive 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'transparent',
                border: openDropdown === 'tcg' 
                  ? '1px solid #ffcb05' 
                  : isTcgActive 
                    ? '1px solid rgba(255, 203, 5, 0.4)' 
                    : '1px solid transparent',
                color: openDropdown === 'tcg' || isTcgActive ? '#ffcb05' : '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={15} color="#ffcb05" />
              <span>Cartas & TCG</span>
              <ChevronDown 
                size={14} 
                style={{
                  transition: 'transform 0.2s ease',
                  transform: openDropdown === 'tcg' ? 'rotate(180deg)' : 'rotate(0deg)'
                }} 
              />
            </button>

            {/* Menú Desplegable TCG */}
            {openDropdown === 'tcg' && (
              <div 
                className="animate-fade-in-up"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '320px',
                  backgroundColor: '#0d111a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.75)',
                  padding: '8px',
                  zIndex: 150
                }}
              >
                <div style={{ padding: '6px 10px 8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Juegos de Cartas Coleccionables
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '380px', overflowY: 'auto' }}>
                  {tcgItems.map(item => {
                    const Icon = item.icon;
                    const isCurrent = activeGame === item.game;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isCurrent ? '1px solid rgba(255,203,5,0.4)' : '1px solid transparent',
                          backgroundColor: isCurrent ? 'rgba(255, 203, 5, 0.1)' : 'transparent',
                          color: '#ffffff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isCurrent ? 'rgba(255, 203, 5, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCurrent ? 'rgba(255, 203, 5, 0.1)' : 'transparent'}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={15} color={item.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#ffcb05' : '#fff' }}>
                              {item.name}
                            </span>
                            {item.badge && (
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#ffcb05', color: '#000' }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '6px', paddingTop: '6px' }}>
                  <button
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate('/tcg', { category: 'all', game: 'ALL' });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Ver Todo el Catálogo TCG →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 2. VIDEOJUEGOS & CONSOLAS */}
          {/* ============================================================== */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'videogames' ? null : 'videogames')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: openDropdown === 'videogames' 
                  ? 'rgba(37, 99, 235, 0.2)' 
                  : isVideogamesActive 
                    ? 'rgba(37, 99, 235, 0.15)' 
                    : 'transparent',
                border: openDropdown === 'videogames' 
                  ? '1px solid #3b82f6' 
                  : isVideogamesActive 
                    ? '1px solid rgba(59, 130, 246, 0.4)' 
                    : '1px solid transparent',
                color: openDropdown === 'videogames' || isVideogamesActive ? '#60a5fa' : '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Gamepad2 size={15} color="#60a5fa" />
              <span>Videojuegos & Consolas</span>
              <ChevronDown 
                size={14} 
                style={{
                  transition: 'transform 0.2s ease',
                  transform: openDropdown === 'videogames' ? 'rotate(180deg)' : 'rotate(0deg)'
                }} 
              />
            </button>

            {/* Menú Desplegable Videojuegos */}
            {openDropdown === 'videogames' && (
              <div 
                className="animate-fade-in-up"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '320px',
                  backgroundColor: '#0d111a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.75)',
                  padding: '8px',
                  zIndex: 150
                }}
              >
                <div style={{ padding: '6px 10px 8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Plataformas & Consolas
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {videogameItems.map(item => {
                    const Icon = item.icon;
                    const isCurrent = isVideogamesActive && selectedPlatform === item.platform;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isCurrent ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                          backgroundColor: isCurrent ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                          color: '#ffffff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isCurrent ? 'rgba(37, 99, 235, 0.18)' : 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCurrent ? 'rgba(37, 99, 235, 0.12)' : 'transparent'}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={15} color={item.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#60a5fa' : '#fff' }}>
                              {item.name}
                            </span>
                            {item.badge && (
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#3b82f6', color: '#fff' }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '6px', paddingTop: '6px' }}>
                  <button
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate('/videojuegos', { category: 'videogame', platform: 'all' });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Ver Todos los Videojuegos →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 3. ACCESORIOS & PROTECCIÓN ("OTROS") */}
          {/* ============================================================== */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'accessories' ? null : 'accessories')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: openDropdown === 'accessories' 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : isAccessoriesActive 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : 'transparent',
                border: openDropdown === 'accessories' 
                  ? '1px solid #10b981' 
                  : isAccessoriesActive 
                    ? '1px solid rgba(16, 185, 129, 0.4)' 
                    : '1px solid transparent',
                color: openDropdown === 'accessories' || isAccessoriesActive ? '#34d399' : '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <ShieldCheck size={15} color="#34d399" />
              <span>Accesorios & Protección</span>
              <ChevronDown 
                size={14} 
                style={{
                  transition: 'transform 0.2s ease',
                  transform: openDropdown === 'accessories' ? 'rotate(180deg)' : 'rotate(0deg)'
                }} 
              />
            </button>

            {/* Menú Desplegable Accesorios */}
            {openDropdown === 'accessories' && (
              <div 
                className="animate-fade-in-up"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '320px',
                  backgroundColor: '#0d111a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.75)',
                  padding: '8px',
                  zIndex: 150
                }}
              >
                <div style={{ padding: '6px 10px 8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Protección & Cuidado de Coleccionismo
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {accessoryItems.map(item => {
                    const Icon = item.icon;
                    const isCurrent = isAccessoriesActive && selectedAccessory === item.accessory;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isCurrent ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                          backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                          color: '#ffffff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isCurrent ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCurrent ? 'rgba(16, 185, 129, 0.12)' : 'transparent'}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={15} color={item.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#34d399' : '#fff' }}>
                              {item.name}
                            </span>
                            {item.badge && (
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#10b981', color: '#fff' }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '6px', paddingTop: '6px' }}>
                  <button
                    onClick={() => {
                      setOpenDropdown(null);
                      onNavigate('/accesorios', { category: 'accessory', accessory: 'all' });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Ver Todos los Accesorios →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acceso Directo: Ofertas Especiales */}
        <div>
          <button
            onClick={() => onNavigate('/ofertas', { category: 'deals' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: catalogCategory === 'deals' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: catalogCategory === 'deals' ? '1px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.3)',
              color: '#f472b6',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Tag size={13} color="#f472b6" />
            <span>🔥 Ofertas & Precios Bajos</span>
          </button>
        </div>
      </div>
    </div>
  );
}
