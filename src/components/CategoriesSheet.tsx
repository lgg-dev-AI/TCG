import { useState } from 'react';
import { 
  X, Sparkles, Gamepad2, ShieldCheck, Tag, 
  Flame, Swords, Ship, Wand2, Compass, ChevronRight, Layers, Box
} from 'lucide-react';

interface CategoriesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string, options?: { game?: string; category?: string; platform?: string; accessory?: string }) => void;
}

export default function CategoriesSheet({
  isOpen,
  onClose,
  onNavigate
}: CategoriesSheetProps) {
  const [activeTab, setActiveTab] = useState<'tcg' | 'videogames' | 'accessories'>('tcg');

  if (!isOpen) return null;

  const tcgItems = [
    { id: 'pokemon', name: 'Pokémon TCG', path: '/pokemon', game: 'POKEMON', icon: Sparkles, color: '#ffcb05', badge: 'PRINCIPAL', desc: 'Cartas singles, sobres y cajas selladas' },
    { id: 'onepiece', name: 'One Piece Card Game', path: '/onepiece', game: 'ONE_PIECE', icon: Ship, color: '#06b6d4', badge: 'POPULAR', desc: 'Luffy, Romance Dawn, OP-05 y más' },
    { id: 'magic', name: 'Magic: The Gathering', path: '/magic', game: 'MAGIC', icon: Flame, color: '#f97316', desc: 'Modern, Commander y colecciones MTG' },
    { id: 'yugioh', name: 'Yu-Gi-Oh!', path: '/yugioh', game: 'YUGIOH', icon: Swords, color: '#ef4444', desc: 'Cartas icónicas y expansiones clásicas' },
    { id: 'lorcana', name: 'Disney Lorcana', path: '/lorcana', game: 'LORCANA', icon: Wand2, color: '#a855f7', badge: 'NUEVO', desc: 'Illumineer troves, boosters y singles' },
    { id: 'dragonball', name: 'Dragon Ball Super', path: '/dragonball', game: 'DRAGON_BALL', icon: Flame, color: '#f59e0b', desc: 'Goku, Vegeta y cartas coleccionables' },
    { id: 'digimon', name: 'Digimon Card Game', path: '/digimon', game: 'DIGIMON', icon: Compass, color: '#3b82f6', desc: 'Cartas oficiales Bandai' },
  ];

  const videogameItems = [
    { id: 'switch', name: 'Nintendo Switch', path: '/switch', category: 'videogame', platform: 'switch', icon: Gamepad2, color: '#ef4444', badge: 'POPULAR', desc: 'Juegos físicos, consolas y accesorios' },
    { id: 'playstation', name: 'PlayStation (PS5 / PS4)', path: '/playstation', category: 'videogame', platform: 'playstation', icon: Gamepad2, color: '#2563eb', desc: 'Ediciones exclusivas y lanzamientos' },
    { id: 'xbox', name: 'Xbox Series & One', path: '/xbox', category: 'videogame', platform: 'xbox', icon: Gamepad2, color: '#16a34a', desc: 'Juegos físicos en disco y consolas' },
    { id: 'retro', name: 'Retro Gaming', path: '/retro', category: 'videogame', platform: 'retro', icon: Gamepad2, color: '#f59e0b', badge: 'COLECCIÓN', desc: 'Game Boy, N64, SNES, GBA y 3DS' },
    { id: 'consolas', name: 'Consolas & Hardware', path: '/consolas', category: 'videogame', platform: 'consolas', icon: Layers, color: '#a855f7', desc: 'Consolas portátiles y de sobremesa' },
  ];

  const accessoryItems = [
    { id: 'sleeves', name: 'Micas Protectoras (Sleeves)', path: '/micas', category: 'accessory', accessory: 'sleeves', icon: ShieldCheck, color: '#3b82f6', badge: 'TOP', desc: 'Standard, Japanese size y micas interiores' },
    { id: 'binders', name: 'Carpetas & Portafolios (Binders)', path: '/carpetas', category: 'accessory', accessory: 'binders', icon: Layers, color: '#6366f1', desc: 'Álbumes con cierre de 4, 9 y 12 bolsillos' },
    { id: 'toploaders', name: 'Toploaders & Cajas Acrílicas', path: '/toploaders', category: 'accessory', accessory: 'toploaders', icon: Box, color: '#14b8a6', desc: 'Protectores rígidos y One-Touch magnet' },
    { id: 'playmats', name: 'Playmats & Tapetes Oficiales', path: '/playmats', category: 'accessory', accessory: 'playmats', icon: Sparkles, color: '#ec4899', desc: 'Superficie suave para jugar y exhibir' },
    { id: 'deckboxes', name: 'Deck Boxes & Dados', path: '/deckboxes', category: 'accessory', accessory: 'deckbox', icon: Gamepad2, color: '#f59e0b', desc: 'Cajas de almacenamiento y contadores' },
  ];

  const handleItemClick = (item: any) => {
    onClose();
    onNavigate(item.path, {
      game: item.game,
      category: item.category,
      platform: item.platform,
      accessory: item.accessory
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#0c1017',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
          animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Manija de arrastre táctil */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px 0' }}>
          <div style={{ width: '42px', height: '4px', borderRadius: '3px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />
        </div>

        {/* Encabezado del Bottom Sheet */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
              Explorar Catálogo
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Selecciona tu categoría favorita
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar menú de categorías"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs de los 3 Pilares en Móvil */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <button
            onClick={() => setActiveTab('tcg')}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: activeTab === 'tcg' ? '1px solid #ffcb05' : '1px solid transparent',
              backgroundColor: activeTab === 'tcg' ? 'rgba(255, 203, 5, 0.15)' : 'transparent',
              color: activeTab === 'tcg' ? '#ffcb05' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <Sparkles size={16} />
            <span>Cartas TCG</span>
          </button>

          <button
            onClick={() => setActiveTab('videogames')}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: activeTab === 'videogames' ? '1px solid #3b82f6' : '1px solid transparent',
              backgroundColor: activeTab === 'videogames' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'videogames' ? '#60a5fa' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <Gamepad2 size={16} />
            <span>Videojuegos</span>
          </button>

          <button
            onClick={() => setActiveTab('accessories')}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: activeTab === 'accessories' ? '1px solid #10b981' : '1px solid transparent',
              backgroundColor: activeTab === 'accessories' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'accessories' ? '#34d399' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <ShieldCheck size={16} />
            <span>Accesorios</span>
          </button>
        </div>

        {/* Lista de Items con Scroll Suave */}
        <div style={{
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '48vh'
        }}>
          {activeTab === 'tcg' && tcgItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minHeight: '48px',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${item.color}30`,
                          color: item.color
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </button>
            );
          })}

          {activeTab === 'videogames' && videogameItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minHeight: '48px',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${item.color}30`,
                          color: item.color
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </button>
            );
          })}

          {activeTab === 'accessories' && accessoryItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minHeight: '48px',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${item.color}30`,
                          color: item.color
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </button>
            );
          })}
        </div>

        {/* Botón de Ofertas Destacadas al fondo */}
        <div style={{ padding: '8px 16px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => {
              onClose();
              onNavigate('/ofertas', { category: 'deals' });
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 203, 5, 0.12)',
              border: '1.5px solid #ffcb05',
              color: '#ffcb05',
              fontWeight: 800,
              fontSize: '13px',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <Tag size={16} />
            <span>🔥 Ver Todas las Ofertas y Liquidaciones</span>
          </button>
        </div>
      </div>
    </div>
  );
}
