import React, { useRef, useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Swords, Ship, Wand2, Gamepad2, ShieldCheck, 
  Tag, Layers, Compass, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { CategoryItem } from '../api';

export interface ContentBarItem {
  id: string;
  name: string;
  slug: string;
  gameType?: string;
  categoryFilter?: string;
  iconName?: string;
  color?: string;
  badge?: string;
  isActive?: boolean;
}

interface ContentBarProps {
  activeGame: string;
  onGameChange: (game: string) => void;
  onSelectCategory?: (cat: string) => void;
  onSelectDeals?: () => void;
  customCategories?: CategoryItem[];
  isAdmin?: boolean;
  onConfigureBar?: () => void;
}

export const DEFAULT_CONTENT_BAR_ITEMS: ContentBarItem[] = [
  { id: 'cb_pokemon', name: 'Pokémon TCG', slug: 'pokemon', gameType: 'POKEMON', iconName: 'Sparkles', color: '#ffcb05' },
  { id: 'cb_magic', name: 'Magic: The Gathering', slug: 'magic', gameType: 'MAGIC', iconName: 'Flame', color: '#f97316' },
  { id: 'cb_yugioh', name: 'Yu-Gi-Oh!', slug: 'yugioh', gameType: 'YUGIOH', iconName: 'Swords', color: '#ef4444' },
  { id: 'cb_onepiece', name: 'One Piece Card Game', slug: 'onepiece', gameType: 'ONE_PIECE', iconName: 'Ship', color: '#06b6d4', badge: 'POPULAR' },
  { id: 'cb_lorcana', name: 'Disney Lorcana', slug: 'lorcana', gameType: 'LORCANA', iconName: 'Wand2', color: '#a855f7' },
  { id: 'cb_digimon', name: 'Digimon Card Game', slug: 'digimon', gameType: 'DIGIMON', iconName: 'Compass', color: '#3b82f6' },
  { id: 'cb_videogames', name: 'Videojuegos & Consolas', slug: 'videogames', categoryFilter: 'videogame', iconName: 'Gamepad2', color: '#10b981' },
  { id: 'cb_accessories', name: 'Accesorios & Micas', slug: 'accessories', categoryFilter: 'accessory', iconName: 'ShieldCheck', color: '#6366f1' },
  { id: 'cb_deals', name: 'Ofertas & Precios Bajos', slug: 'deals', iconName: 'Tag', color: '#ec4899', badge: 'OFERTAS' }
];

export default function ContentBar({
  activeGame,
  onGameChange,
  onSelectCategory,
  onSelectDeals,
  customCategories,
  isAdmin,
  onConfigureBar
}: ContentBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Combinar predeterminados con categorías dinámicas del admin si existen
  const items: ContentBarItem[] = React.useMemo(() => {
    if (!customCategories || customCategories.length === 0) {
      return DEFAULT_CONTENT_BAR_ITEMS;
    }

    // Si el admin configuró categorías marcadas para la barra de contenido
    const filtered = customCategories
      .filter(c => c.is_content_bar !== false && (c.parent_id === null || c.parent_id === 'cat_tcg'));

    const dynamicItems: ContentBarItem[] = filtered.map(c => {
      const isVideogame = c.slug === 'videogames' || c.parent_id === 'cat_videogames';
      const isAccessory = c.slug === 'accessories' || c.parent_id === 'cat_accessories';
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        gameType: isVideogame || isAccessory ? undefined : (c.slug === 'onepiece' ? 'ONE_PIECE' : c.slug.toUpperCase()),
        categoryFilter: isVideogame ? 'videogame' : isAccessory ? 'accessory' : undefined,
        iconName: c.icon,
        color: c.color,
      };
    });

    if (!dynamicItems.some(it => it.categoryFilter === 'videogame')) {
      dynamicItems.push({ id: 'cb_videogames', name: 'Videojuegos & Consolas', slug: 'videogames', categoryFilter: 'videogame', iconName: 'Gamepad2', color: '#10b981' });
    }
    if (!dynamicItems.some(it => it.categoryFilter === 'accessory')) {
      dynamicItems.push({ id: 'cb_accessories', name: 'Accesorios & Protección', slug: 'accessories', categoryFilter: 'accessory', iconName: 'ShieldCheck', color: '#6366f1' });
    }
    if (!dynamicItems.some(it => it.slug === 'deals')) {
      dynamicItems.push({ id: 'cb_deals', name: 'Ofertas & Precios Bajos', slug: 'deals', iconName: 'Tag', color: '#ec4899', badge: 'OFERTAS' });
    }

    return dynamicItems.length > 0 ? dynamicItems : DEFAULT_CONTENT_BAR_ITEMS;
  }, [customCategories]);

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
      return () => {
        el.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const renderIcon = (iconName?: string, color = '#ffcb05') => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles size={15} color={color} />;
      case 'Flame': return <Flame size={15} color={color} />;
      case 'Swords': return <Swords size={15} color={color} />;
      case 'Ship': return <Ship size={15} color={color} />;
      case 'Wand2': return <Wand2 size={15} color={color} />;
      case 'Gamepad2': return <Gamepad2 size={15} color={color} />;
      case 'ShieldCheck': return <ShieldCheck size={15} color={color} />;
      case 'Tag': return <Tag size={15} color={color} />;
      default: return <Compass size={15} color={color} />;
    }
  };

  const handleItemClick = (item: ContentBarItem) => {
    if (item.slug === 'deals') {
      onSelectDeals?.();
      return;
    }
    if (item.categoryFilter) {
      onSelectCategory?.(item.categoryFilter);
      return;
    }
    if (item.gameType) {
      onGameChange(item.gameType);
    }
  };

  return (
    <div style={{
      backgroundColor: '#0a0d14',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
      position: 'relative',
      zIndex: 40
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Botón Scroll Izquierda */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            aria-label="Desplazar a la izquierda"
            style={{
              position: 'absolute',
              left: '6px',
              zIndex: 50,
              backgroundColor: 'rgba(13, 17, 26, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Strip de Navegación Rápida Scrolleable */}
        <div
          ref={scrollRef}
          onWheel={(e) => {
            if (e.deltaY !== 0 && scrollRef.current) {
              scrollRef.current.scrollLeft += e.deltaY;
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 4px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            whiteSpace: 'nowrap',
            flex: 1,
            scrollBehavior: 'smooth'
          }}
          className="content-bar-scroll"
        >
          {items.map(item => {
            const isCurrent = 
              (item.gameType && item.gameType === activeGame) ||
              (item.slug === 'pokemon' && activeGame === 'POKEMON');

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: isCurrent 
                    ? `1px solid ${item.color || '#ffcb05'}` 
                    : '1px solid transparent',
                  backgroundColor: isCurrent 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'transparent',
                  color: isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                  fontSize: '12.5px',
                  fontWeight: isCurrent ? 800 : 600,
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  }
                }}
              >
                {renderIcon(item.iconName, item.color)}
                <span>{item.name}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '9px',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    backgroundColor: item.slug === 'deals' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(6, 182, 212, 0.25)',
                    color: item.slug === 'deals' ? '#f472b6' : '#67e8f9',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Botón Scroll Derecha */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            aria-label="Desplazar a la derecha"
            style={{
              position: 'absolute',
              right: (isAdmin && onConfigureBar) ? '135px' : '6px',
              zIndex: 50,
              backgroundColor: 'rgba(13, 17, 26, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Acceso para Admin a Configurar Barra */}
        {isAdmin && onConfigureBar && (
          <button
            onClick={onConfigureBar}
            title="Configurar Barra de Contenido"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px dashed rgba(59, 130, 246, 0.4)',
              color: '#93c5fd',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: '8px'
            }}
          >
            <Layers size={13} />
            <span>Configurar Barra</span>
          </button>
        )}
      </div>
    </div>
  );
}
