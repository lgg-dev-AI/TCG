import { useState, useEffect } from 'react';
import { 
  Filter, HelpCircle, TrendingUp, 
  Sparkles, Gamepad2, ShieldCheck, RotateCcw, ChevronRight, X
} from 'lucide-react';
import ProductItem from './ProductItem';
import type { Product } from './ProductItem';
import ConditionGuideModal from './ConditionGuideModal';
import { apiGetCategories, type CategoryItem } from '../api';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  searchQuery: string;
  inventory: Product[];
  favorites: string[];
  onToggleFavorite: (productId: string, product?: Product) => void;
  initialCategory?: string;
  activeGame: string;
  initialPlatform?: string;
  initialAccessory?: string;
  onNavigate?: (path: string, options?: { game?: string; category?: string; platform?: string; accessory?: string }) => void;
}

export const MOCK_PRODUCTS = INITIAL_PRODUCTS;

export default function ProductCatalog({
  onAddToCart,
  onViewDetails,
  searchQuery,
  inventory,
  favorites,
  onToggleFavorite,
  initialCategory,
  activeGame,
  initialPlatform,
  initialAccessory,
  onNavigate,
}: ProductCatalogProps) {
  // Estados de navegación por Pilares: 'tcg' | 'videogames' | 'accessories'
  const [mainPillar, setMainPillar] = useState<'tcg' | 'videogames' | 'accessories'>('tcg');

  // Subfiltros TCG
  const [tcgFormat, setTcgFormat] = useState<'all' | 'sealed' | 'single'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedEdition, setSelectedEdition] = useState<string>('all');
  const [expansionFilter, setExpansionFilter] = useState<string>('');

  // Subfiltros Videojuegos
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedGameCondition, setSelectedGameCondition] = useState<string>('all'); // 'all', 'cib', 'sealed', 'loose'

  // Subfiltros Accesorios ("Otros")
  const [selectedAccessoryType, setSelectedAccessoryType] = useState<string>('all'); // 'all', 'sleeves', 'binders', 'toploaders', 'playmats', 'deckbox'

  // Filtros Comunes
  const [sortBy, setSortBy] = useState<string>('default');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [onlyDealsFilter, setOnlyDealsFilter] = useState<boolean>(false);
  const [isConditionGuideOpen, setIsConditionGuideOpen] = useState<boolean>(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [, setCategoriesList] = useState<CategoryItem[]>([]);

  useEffect(() => {
    apiGetCategories().then(setCategoriesList).catch(console.error);
  }, []);

  // Sincronizar pilar inicial si viene de navegación externa
  useEffect(() => {
    if (initialCategory) {
      if (initialCategory === 'deals') {
        setMainPillar('tcg');
        setTcgFormat('all');
        setOnlyDealsFilter(true);
      } else if (initialCategory === 'videogame' || initialCategory === 'videogames') {
        setMainPillar('videogames');
        setSelectedPlatform('all');
        setOnlyDealsFilter(false);
      } else if (initialCategory === 'accessory' || initialCategory === 'accessories') {
        setMainPillar('accessories');
        setSelectedAccessoryType('all');
        setOnlyDealsFilter(false);
      } else if (initialCategory === 'sealed') {
        setMainPillar('tcg');
        setTcgFormat('sealed');
        setOnlyDealsFilter(false);
      } else if (initialCategory === 'single') {
        setMainPillar('tcg');
        setTcgFormat('single');
        setOnlyDealsFilter(false);
      } else {
        setMainPillar('tcg');
        setTcgFormat('all');
        setOnlyDealsFilter(false);
      }
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialPlatform) {
      setSelectedPlatform(initialPlatform);
      if (initialPlatform !== 'all') {
        setMainPillar('videogames');
      }
    }
  }, [initialPlatform]);

  useEffect(() => {
    if (initialAccessory) {
      setSelectedAccessoryType(initialAccessory);
      if (initialAccessory !== 'all') {
        setMainPillar('accessories');
      }
    }
  }, [initialAccessory]);

  // Combinar productos locales mockeados con productos de la API
  const getCombinedProducts = (): Product[] => {
    const sourceProducts = inventory.length > 0 ? inventory : MOCK_PRODUCTS;

    let list = sourceProducts.filter(p => {
      // 1. Filtrado por Pilar Principal
      if (mainPillar === 'tcg') {
        // En TCG, excluir videojuegos y accesorios
        if (p.category === 'videogame' || p.category === 'accessory') return false;

        // Filtrar por juego TCG activo
        if (activeGame && activeGame !== 'ALL') {
          const g = (p.gameType || '').toUpperCase();
          const targetG = activeGame.toUpperCase();
          if (targetG === 'POKEMON') {
            if (g !== 'POKEMON' && g !== '') return false;
          } else if (targetG === 'ONE_PIECE' || targetG === 'ONEPIECE') {
            if (g !== 'ONE_PIECE' && g !== 'ONEPIECE' && p.subCategory !== 'onepiece') return false;
          } else if (targetG === 'YUGIOH') {
            if (g !== 'YUGIOH' && p.subCategory !== 'yugioh') return false;
          } else if (targetG === 'MAGIC') {
            if (g !== 'MAGIC' && p.subCategory !== 'magic') return false;
          } else if (targetG === 'LORCANA') {
            if (g !== 'LORCANA' && p.subCategory !== 'lorcana') return false;
          } else if (targetG === 'DIGIMON') {
            if (g !== 'DIGIMON' && p.subCategory !== 'digimon') return false;
          } else if (targetG === 'DRAGON_BALL' || targetG === 'DRAGONBALL') {
            if (g !== 'DRAGON_BALL' && g !== 'DRAGONBALL') return false;
          } else {
            if (g !== targetG && p.subCategory !== targetG.toLowerCase()) return false;
          }
        }

        // Subfiltro TCG: Sellado vs Sueltas
        if (tcgFormat === 'sealed') {
          if (p.category !== 'booster_box' && p.category !== 'etb' && p.category !== 'blister') return false;
        } else if (tcgFormat === 'single') {
          if (p.category !== 'single') return false;
        }

        return true;
      }

      if (mainPillar === 'videogames') {
        if (p.category !== 'videogame') return false;

        // Subfiltro por plataforma
        if (selectedPlatform !== 'all') {
          const plat = (p.platform || '').toLowerCase();
          const target = selectedPlatform.toLowerCase();
          if (target === 'switch' && !plat.includes('switch')) return false;
          if (target === 'playstation' && !plat.includes('playstation') && !plat.includes('ps5') && !plat.includes('ps4')) return false;
          if (target === 'xbox' && !plat.includes('xbox')) return false;
          if (target === 'retro' && !plat.includes('retro') && !plat.includes('gb') && !plat.includes('gba') && !plat.includes('n64') && !plat.includes('snes') && !plat.includes('ds')) return false;
          if (target === 'consolas' && !plat.includes('consola') && !plat.includes('hardware')) return false;
        }

        // Subfiltro por completitud
        if (selectedGameCondition !== 'all') {
          const comp = (p.completeness || '').toLowerCase();
          if (selectedGameCondition === 'sealed' && !comp.includes('sellado') && !comp.includes('nuevo')) return false;
          if (selectedGameCondition === 'cib' && !comp.includes('cib') && !comp.includes('completo')) return false;
          if (selectedGameCondition === 'loose' && !comp.includes('loose') && !comp.includes('suelto')) return false;
        }

        return true;
      }

      if (mainPillar === 'accessories') {
        if (p.category !== 'accessory') return false;

        if (selectedAccessoryType !== 'all') {
          const nameLower = (p.name || '').toLowerCase();
          const descLower = (p.description || '').toLowerCase();
          const subLower = (p.subCategory || '').toLowerCase();

          if (selectedAccessoryType === 'sleeves') {
            const isMatch = subLower === 'sleeves' || nameLower.includes('mica') || nameLower.includes('sleeve') || descLower.includes('sleeve');
            if (!isMatch) return false;
          } else if (selectedAccessoryType === 'binders') {
            const isMatch = subLower === 'binders' || nameLower.includes('carpeta') || nameLower.includes('binder') || descLower.includes('binder');
            if (!isMatch) return false;
          } else if (selectedAccessoryType === 'toploaders') {
            const isMatch = subLower === 'toploaders' || nameLower.includes('toploader') || nameLower.includes('acrílic') || nameLower.includes('caja protectora');
            if (!isMatch) return false;
          } else if (selectedAccessoryType === 'playmats') {
            const isMatch = subLower === 'playmats' || nameLower.includes('playmat') || nameLower.includes('tapete') || descLower.includes('tapete');
            if (!isMatch) return false;
          } else if (selectedAccessoryType === 'deckbox') {
            const isMatch = subLower === 'deckbox' || nameLower.includes('deck') || nameLower.includes('dado') || nameLower.includes('contador') || descLower.includes('deck box');
            if (!isMatch) return false;
          }
        }

        return true;
      }

      return true;
    });

    // 2. Filtro de búsqueda textual
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.expansion && p.expansion.toLowerCase().includes(q))
      );
    }

    // 3. Filtro por Expansión
    if (expansionFilter) {
      const ef = expansionFilter.toLowerCase();
      list = list.filter(p => p.expansion && p.expansion.toLowerCase().includes(ef));
    }

    // 4. Filtro por Ofertas
    if (onlyDealsFilter) {
      list = list.filter(p => p.marketPrice && p.price < p.marketPrice);
    }

    // 5. Filtros específicos de TCG
    if (mainPillar === 'tcg') {
      if (selectedType !== 'all') {
        list = list.filter(p => {
          if (p.category !== 'single') return true;
          const card = p.pokemonCardData;
          return card?.types?.includes(selectedType) || false;
        });
      }

      if (selectedRarity !== 'all') {
        list = list.filter(p => {
          if (p.category !== 'single') return true;
          const rar = (p.pokemonCardData?.rarity || '').toLowerCase();
          if (selectedRarity === 'rare') return rar.includes('rare') || rar.includes('holo') || rar.includes('secret') || rar.includes('ultra');
          if (selectedRarity === 'uncommon') return rar.includes('uncommon');
          if (selectedRarity === 'common') return rar.includes('common');
          return true;
        });
      }

      if (selectedRegion !== 'all') {
        list = list.filter(p => {
          if (p.category !== 'single') return true;
          const reg = p.region || 'Inglés (USA)';
          return reg.toLowerCase().includes(selectedRegion.toLowerCase());
        });
      }

      if (selectedCondition !== 'all') {
        list = list.filter(p => {
          if (p.category !== 'single') return true;
          const cond = p.cardCondition || 'NM';
          return cond.toLowerCase() === selectedCondition.toLowerCase();
        });
      }

      if (selectedEdition !== 'all') {
        list = list.filter(p => {
          if (p.category !== 'single') return true;
          if (selectedEdition === 'first_edition') return !!p.isFirstEdition;
          if (selectedEdition === 'unlimited') return !p.isFirstEdition;
          return true;
        });
      }
    }

    // 6. Filtro de Precio Máximo
    if (maxPrice < 100000) {
      list = list.filter(p => p.price <= maxPrice);
    }

    // 7. Ordenamiento
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  };

  const filteredProducts = getCombinedProducts();

  const pokemonTypes = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless'];
  const magicColors = ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless'];
  const yugiohAttributes = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
  
  const currentTypes = activeGame === 'MAGIC' ? magicColors : activeGame === 'YUGIOH' ? yugiohAttributes : pokemonTypes;
  const currentTypeLabel = activeGame === 'MAGIC' ? 'Color de Maná' : activeGame === 'YUGIOH' ? 'Atributo' : 'Tipo de Pokémon';

  const resetAllFilters = () => {
    setMainPillar('tcg');
    setTcgFormat('all');
    setSelectedPlatform('all');
    setSelectedAccessoryType('all');
    setSelectedType('all');
    setSelectedRarity('all');
    setSelectedRegion('all');
    setSelectedCondition('all');
    setSelectedEdition('all');
    setMaxPrice(100000);
    setExpansionFilter('');
    setOnlyDealsFilter(false);
  };

  const activeFilterCount = (
    (selectedType !== 'all' ? 1 : 0) +
    (selectedRarity !== 'all' ? 1 : 0) +
    (selectedRegion !== 'all' ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0) +
    (selectedEdition !== 'all' ? 1 : 0) +
    (expansionFilter ? 1 : 0) +
    (onlyDealsFilter ? 1 : 0) +
    (maxPrice < 100000 ? 1 : 0) +
    (selectedPlatform !== 'all' ? 1 : 0) +
    (selectedAccessoryType !== 'all' ? 1 : 0)
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Migas de Pan (Breadcrumbs) para Vistas Dedicadas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => onNavigate?.('/')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 600 }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Inicio
        </button>
        <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
        <button
          onClick={() => {
            if (mainPillar === 'videogames') onNavigate?.('/videojuegos', { category: 'videogame' });
            else if (mainPillar === 'accessories') onNavigate?.('/accesorios', { category: 'accessory' });
            else onNavigate?.('/tcg', { category: 'all', game: 'ALL' });
          }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 600 }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {mainPillar === 'videogames' ? 'Videojuegos & Consolas' : mainPillar === 'accessories' ? 'Accesorios & Protección' : 'Cartas & TCG'}
        </button>
        <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
        <span style={{ color: '#ffcb05', fontWeight: 700 }}>
          {mainPillar === 'videogames'
            ? selectedPlatform !== 'all' ? selectedPlatform.toUpperCase() : 'Todos los Videojuegos'
            : mainPillar === 'accessories'
              ? selectedAccessoryType !== 'all' ? selectedAccessoryType.toUpperCase() : 'Todos los Accesorios'
              : activeGame && activeGame !== 'ALL' ? activeGame : 'Todo TCG'}
        </span>
      </div>

      {/* ============================================================== */}
      {/* 3 GRANDES PILARES: TCG vs VIDEOJUEGOS vs ACCESORIOS */}
      {/* ============================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <button
          onClick={() => {
            setMainPillar('tcg');
            setTcgFormat('all');
          }}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: mainPillar === 'tcg' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
            color: '#ffffff',
            border: mainPillar === 'tcg' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            padding: '10px 8px',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxShadow: mainPillar === 'tcg' ? '0 4px 14px rgba(255, 62, 62, 0.35)' : 'none'
          }}
        >
          <Sparkles size={15} color={mainPillar === 'tcg' ? '#fff' : '#ffcb05'} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Cartas TCG</span>
        </button>

        <button
          onClick={() => {
            setMainPillar('videogames');
            setSelectedPlatform('all');
          }}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: mainPillar === 'videogames' ? '#2563eb' : 'rgba(255, 255, 255, 0.04)',
            color: '#ffffff',
            border: mainPillar === 'videogames' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
            padding: '10px 8px',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxShadow: mainPillar === 'videogames' ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'
          }}
        >
          <Gamepad2 size={15} color={mainPillar === 'videogames' ? '#fff' : '#60a5fa'} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Videojuegos</span>
        </button>

        <button
          onClick={() => {
            setMainPillar('accessories');
            setSelectedAccessoryType('all');
          }}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: mainPillar === 'accessories' ? '#059669' : 'rgba(255, 255, 255, 0.04)',
            color: '#ffffff',
            border: mainPillar === 'accessories' ? '1px solid #10b981' : '1px solid var(--border-color)',
            padding: '10px 8px',
            borderRadius: '10px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxShadow: mainPillar === 'accessories' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          <ShieldCheck size={15} color={mainPillar === 'accessories' ? '#fff' : '#34d399'} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Accesorios</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-PILLS ESPECÍFICOS SEGÚN EL PILAR ACTIVO */}
      {/* ============================================================== */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '16px',
        borderBottom: '1px solid var(--border-color)',
        scrollbarWidth: 'none'
      }}>
        {/* SUB-PILLS PILAR 1: TCG */}
        {mainPillar === 'tcg' && (
          <>
            <button
              onClick={() => setTcgFormat('all')}
              style={{
                backgroundColor: tcgFormat === 'all' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: tcgFormat === 'all' ? 'none' : '1px solid var(--border-color)',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: tcgFormat === 'all' ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Todo TCG
            </button>
            <button
              onClick={() => setTcgFormat('sealed')}
              style={{
                backgroundColor: tcgFormat === 'sealed' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: tcgFormat === 'sealed' ? 'none' : '1px solid var(--border-color)',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: tcgFormat === 'sealed' ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              📦 Producto Sellado
            </button>
            <button
              onClick={() => setTcgFormat('single')}
              style={{
                backgroundColor: tcgFormat === 'single' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: tcgFormat === 'single' ? 'none' : '1px solid var(--border-color)',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: tcgFormat === 'single' ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              🃏 Cartas Sueltas
            </button>
          </>
        )}

        {/* SUB-PILLS PILAR 2: VIDEOJUEGOS */}
        {mainPillar === 'videogames' && (
          [
            { id: 'all', label: '🎮 Todos los Videojuegos' },
            { id: 'switch', label: '🔴 Nintendo Switch' },
            { id: 'playstation', label: '🔵 PlayStation (PS5 / PS4)' },
            { id: 'xbox', label: '🟢 Xbox Series & One' },
            { id: 'retro', label: '🕹️ Retro Gaming (GB / N64 / SNES)' },
            { id: 'consolas', label: '⚡ Consolas & Hardware' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              style={{
                backgroundColor: selectedPlatform === p.id ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: selectedPlatform === p.id ? 'none' : '1px solid var(--border-color)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: selectedPlatform === p.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {p.label}
            </button>
          ))
        )}

        {/* SUB-PILLS PILAR 3: ACCESORIOS */}
        {mainPillar === 'accessories' && (
          [
            { id: 'all', label: '🛡️ Todos los Accesorios' },
            { id: 'sleeves', label: '✨ Micas & Protectores (Sleeves)' },
            { id: 'binders', label: '📁 Carpetas & Portafolios (Binders)' },
            { id: 'toploaders', label: '📦 Toploaders & Cajas Acrílicas' },
            { id: 'playmats', label: '🎯 Playmats & Tapetes Oficiales' },
            { id: 'deckbox', label: '🎲 Deck Boxes & Dados' }
          ].map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAccessoryType(a.id)}
              style={{
                backgroundColor: selectedAccessoryType === a.id ? '#059669' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: selectedAccessoryType === a.id ? 'none' : '1px solid var(--border-color)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: selectedAccessoryType === a.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {a.label}
            </button>
          ))
        )}
      </div>

      {/* Barra de Filtro Móvil Táctil */}
      <div 
        className="catalog-filters-mobile-trigger"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          marginBottom: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px'
        }}
      >
        <button
          onClick={() => setMobileFiltersOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: activeFilterCount > 0 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            border: activeFilterCount > 0 ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Filter size={15} />
          <span>Filtrar y Ordenar {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
        </button>

        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Backdrop oscuro cuando el Bottom Sheet de filtros está abierto en móvil */}
      {mobileFiltersOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1040
          }}
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '24px',
      }} className="catalog-layout">
        {/* ============================================================== */}
        {/* FILTROS SIDEBAR / TOPBAR CONTEXTUALES */}
        {/* ============================================================== */}
        <div 
          className={`glass ${mobileFiltersOpen ? 'mobile-filters-active-sheet' : 'catalog-filters-desktop'}`}
          style={mobileFiltersOpen ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1050,
            backgroundColor: '#0c1017',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '20px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.85)',
            animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            paddingBottom: 'env(safe-area-inset-bottom, 20px)'
          } : {
            padding: '20px',
            borderRadius: '12px',
            height: 'fit-content',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0 }}>
                {mainPillar === 'videogames' 
                  ? 'Filtros Videojuegos' 
                  : mainPillar === 'accessories' 
                    ? 'Filtros Protección' 
                    : 'Filtros TCG'}
              </h3>
            </div>

            {/* Si está abierto en móvil, botón para cerrar */}
            {mobileFiltersOpen && (
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}

            {/* Acciones Rápidas */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setOnlyDealsFilter(!onlyDealsFilter)}
                className="btn"
                style={{
                  backgroundColor: onlyDealsFilter ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: onlyDealsFilter ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  color: onlyDealsFilter ? '#34d399' : '#fff',
                  fontSize: '12px',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  borderRadius: '8px'
                }}
              >
                <TrendingUp size={14} color={onlyDealsFilter ? '#34d399' : '#ffcb05'} />
                {onlyDealsFilter ? '🔥 Ofertas Activas' : '🔥 Ver Ofertas'}
              </button>

              {mainPillar === 'tcg' && (
                <button
                  type="button"
                  onClick={() => setIsConditionGuideOpen(true)}
                  className="btn"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '6px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                >
                  <HelpCircle size={14} color="#ffcb05" /> Guía (NM, LP...)
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {/* Ordenar por precio */}
            <div style={{ minWidth: '180px', flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Ordenar por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-body)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="default">Recomendados</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="name">Nombre: A - Z</option>
              </select>
            </div>

            {/* FILTROS ESPECÍFICOS DE TCG */}
            {mainPillar === 'tcg' && (
              <>
                {(tcgFormat === 'all' || tcgFormat === 'single') && (
                  <>
                    <div style={{ minWidth: '180px', flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        {currentTypeLabel}:
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-body)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '8px 12px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      >
                        <option value="all">Todos los {activeGame === 'MAGIC' ? 'Colores' : 'Tipos'}</option>
                        {currentTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ minWidth: '180px', flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        Rareza:
                      </label>
                      <select
                        value={selectedRarity}
                        onChange={(e) => setSelectedRarity(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-body)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '8px 12px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      >
                        <option value="all">Todas las Rarezas</option>
                        <option value="rare">Rara / Holo / Secret</option>
                        <option value="uncommon">Infrecuente (Uncommon)</option>
                        <option value="common">Común (Common)</option>
                      </select>
                    </div>

                    <div style={{ minWidth: '180px', flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        Idioma / Región:
                      </label>
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-body)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '8px 12px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      >
                        <option value="all">Todos los Idiomas</option>
                        <option value="inglés">Inglés</option>
                        <option value="japonés">Japonés</option>
                        <option value="español">Español</option>
                      </select>
                    </div>

                    <div style={{ minWidth: '180px', flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        Condición:
                      </label>
                      <select
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-body)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '8px 12px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      >
                        <option value="all">Todas las Condiciones</option>
                        <option value="NM">Near Mint (NM)</option>
                        <option value="LP">Lightly Played (LP)</option>
                        <option value="MP">Moderately Played (MP)</option>
                        <option value="HP">Heavily Played (HP)</option>
                      </select>
                    </div>

                    <div style={{ minWidth: '180px', flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        Edición de Carta:
                      </label>
                      <select
                        value={selectedEdition}
                        onChange={(e) => setSelectedEdition(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-body)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '8px 12px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      >
                        <option value="all">Todas las Ediciones</option>
                        <option value="first_edition">⭐ Solo 1ª Edición (1st Edition)</option>
                        <option value="unlimited">Ilimitada / Regular (Unlimited)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Filtro de Expansión TCG */}
                <div style={{ minWidth: '180px', flexGrow: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Expansión / Set:
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 151, Paldea, OP-05..."
                    value={expansionFilter}
                    onChange={(e) => setExpansionFilter(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'white',
                      padding: '8px 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  {expansionFilter && (
                    <button onClick={() => setExpansionFilter('')}
                      style={{ fontSize: '11px', marginTop: '4px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                    >× Limpiar
                    </button>
                  )}
                </div>
              </>
            )}

            {/* FILTROS ESPECÍFICOS DE VIDEOJUEGOS */}
            {mainPillar === 'videogames' && (
              <>
                <div style={{ minWidth: '180px', flexGrow: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Plataforma / Consola:
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'white',
                      padding: '8px 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="all">Todas las Plataformas</option>
                    <option value="switch">Nintendo Switch</option>
                    <option value="playstation">PlayStation (PS5 / PS4)</option>
                    <option value="xbox">Xbox Series & One</option>
                    <option value="retro">Retro Gaming (GB / N64 / SNES)</option>
                    <option value="consolas">Consolas & Hardware</option>
                  </select>
                </div>

                <div style={{ minWidth: '180px', flexGrow: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Estado / Completitud:
                  </label>
                  <select
                    value={selectedGameCondition}
                    onChange={(e) => setSelectedGameCondition(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'white',
                      padding: '8px 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="sealed">Nuevo Sellado de Fábrica</option>
                    <option value="cib">Completo en Caja Original (CIB)</option>
                    <option value="loose">Solo Cartucho / Disco (Loose)</option>
                  </select>
                </div>
              </>
            )}

            {/* FILTROS ESPECÍFICOS DE ACCESORIOS */}
            {mainPillar === 'accessories' && (
              <div style={{ minWidth: '180px', flexGrow: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Tipo de Accesorio:
                </label>
                <select
                  value={selectedAccessoryType}
                  onChange={(e) => setSelectedAccessoryType(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-body)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="all">Todos los Accesorios</option>
                  <option value="sleeves">Micas & Protectores (Sleeves)</option>
                  <option value="binders">Carpetas & Portafolios (Binders)</option>
                  <option value="toploaders">Toploaders & Cajas Acrílicas</option>
                  <option value="playmats">Playmats & Tapetes Oficiales</option>
                  <option value="deckbox">Deck Boxes, Cajas & Dados</option>
                </select>
              </div>
            )}

            {/* Filtro de Precio Máximo Común */}
            <div style={{ minWidth: '200px', flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Precio Máximo: <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>{maxPrice >= 100000 ? 'Sin Límite ($100k+ MXN)' : `$${maxPrice.toLocaleString('es-MX')} MXN`}</span>
              </label>
              <input
                type="range"
                min={100}
                max={100000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>$100</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1000, 5000, 15000, 50000, 100000].map(p => (
                    <button key={p} onClick={() => setMaxPrice(p)}
                      style={{
                        fontSize: '9px', padding: '1px 5px', borderRadius: '4px', cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        background: maxPrice === p ? 'var(--primary)' : 'transparent',
                        color: maxPrice === p ? 'white' : 'var(--text-muted)'
                      }}>{p >= 100000 ? 'Todos' : `$${(p/1000).toFixed(0)}k`}</button>
                  ))}
                </div>
                <span>$100k+</span>
              </div>
            </div>
          </div>

          {/* Botón Aplicar Filtros en Móvil */}
          {mobileFiltersOpen && (
            <div style={{
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              margin: '20px -20px -20px -20px',
              padding: '14px 20px',
              backgroundColor: '#0a0d14',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              zIndex: 10
            }}>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 800,
                  minHeight: '46px'
                }}
                onClick={() => setMobileFiltersOpen(false)}
              >
                Ver {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* LISTADO DE PRODUCTOS O ESTADO VACÍO ELEGANTE */}
        {/* ============================================================== */}
        <div style={{ minWidth: 0 }}>
          {filteredProducts.length === 0 ? (
            /* Resultados Vacíos Amigables y Claros */
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              margin: '20px 0'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#ffcb05'
              }}>
                {mainPillar === 'videogames' ? (
                  <Gamepad2 size={32} />
                ) : mainPillar === 'accessories' ? (
                  <ShieldCheck size={32} />
                ) : (
                  <Sparkles size={32} />
                )}
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                {mainPillar === 'videogames'
                  ? selectedPlatform !== 'all'
                    ? `No hay videojuegos de ${selectedPlatform.toUpperCase()} actualmente`
                    : 'No hay videojuegos en inventario actualmente'
                  : mainPillar === 'accessories'
                    ? selectedAccessoryType !== 'all'
                      ? `No hay existencias de ${selectedAccessoryType} actualmente`
                      : 'No hay accesorios en inventario actualmente'
                    : activeGame && activeGame !== 'POKEMON'
                      ? `No hay cartas registradas de ${activeGame} actualmente`
                      : 'No se encontraron productos con los filtros aplicados'}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                Estamos actualizando nuestro catálogo constantemente con piezas certificadas e inventario físico. ¡Vuelve pronto o explora otras secciones!
              </p>

              <button
                onClick={resetAllFilters}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '10px 20px', borderRadius: '8px' }}
              >
                <RotateCcw size={16} />
                Ver Catálogo General
              </button>
            </div>
          ) : (
            /* Grilla de productos */
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="animate-fade-in-up" style={{ minWidth: 0 }}>
                  <ProductItem
                    product={product}
                    onAddToCart={onAddToCart}
                    onViewDetails={onViewDetails}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 992px) {
          .catalog-layout {
            grid-template-columns: 260px minmax(0, 1fr) !important;
          }
        }
      `}</style>

      {/* Modal Interactivo de Guía de Estados TCGplayer */}
      <ConditionGuideModal
        isOpen={isConditionGuideOpen}
        onClose={() => setIsConditionGuideOpen(false)}
      />
    </div>
  );
}
