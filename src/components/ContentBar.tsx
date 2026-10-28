import React from 'react';
import { 
  Sparkles, Flame, Swords, Ship, Wand2, Gamepad2, ShieldCheck, 
  Tag, Layers, Compass
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
  // Combinar predeterminados con categorías dinámicas del admin si existen
  const items: ContentBarItem[] = React.useMemo(() => {
    if (!customCategories || customCategories.length === 0) {
      return DEFAULT_CONTENT_BAR_ITEMS;
    }

    // Si el admin configuró categorías marcadas para la barra de contenido
    const dynamicItems = customCategories
      .filter(c => c.is_content_bar !== false)
      .map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        gameType: c.slug.toUpperCase(),
        categoryFilter: c.slug === 'videogames' ? 'videogame' : c.slug === 'accessories' ? 'accessory' : undefined,
        iconName: c.icon,
        color: c.color,
      }));

    return dynamicItems.length > 0 ? dynamicItems : DEFAULT_CONTENT_BAR_ITEMS;
  }, [customCategories]);

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
      backgroundColor: '#0d111a',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      position: 'relative',
      zIndex: 40
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        gap: '6px'
      }} className="content-bar-scroll">
        
        {/* Strip de Navegación Rápida Estilo TCGplayer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 0',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
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
