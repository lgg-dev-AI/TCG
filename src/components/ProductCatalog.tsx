import { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, HelpCircle, TrendingUp } from 'lucide-react';
import ProductItem from './ProductItem';
import type { Product } from './ProductItem';
import ConditionGuideModal from './ConditionGuideModal';
import { apiGetCategories, type CategoryItem } from '../api';

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  searchQuery: string;
  inventory: Product[];
  favorites: string[];
  onToggleFavorite: (productId: string, product?: Product) => void;
  initialCategory?: string;
  activeGame: string;
}

// Productos Sellados y Accesorios Mockeados con imágenes oficiales estables
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'sealed_1',
    name: 'Caja de Sobres (Booster Box) Scarlet & Violet: Twilight Masquerade',
    price: 2899,
    category: 'booster_box',
    image: 'https://images.pokemoncenter.com/images/products/P9832/712-98696/712-98696_1.jpg',
    description: 'Contiene 36 sobres de la expansión Scarlet & Violet: Twilight Masquerade. ¡Busca las cartas de Ogerpon y Greninja ex con arte alternativo!',
    stock: 12,
    expansion: 'Twilight Masquerade',
    isPromo: true
  },
  {
    id: 'sealed_2',
    name: 'Elite Trainer Box (ETB) Pokémon 151',
    price: 1499,
    category: 'etb',
    image: 'https://images.pokemoncenter.com/images/products/P9411/712-98442/712-98442_1.jpg',
    description: 'Edición especial de colección. Incluye 9 sobres de Pokémon 151, 1 carta promo foil de Snorlax, micas de cartas de 151, dados y accesorios de juego.',
    stock: 5,
    expansion: 'Pokémon 151',
    isPromo: true
  },
  {
    id: 'sealed_3',
    name: 'Caja de Sobres (Booster Box) Scarlet & Violet: Temporal Forces',
    price: 2799,
    category: 'booster_box',
    image: 'https://images.pokemoncenter.com/images/products/P9642/712-98606/712-98606_1.jpg',
    description: 'Contiene 36 sobres de la expansión Temporal Forces. Presentando nuevos Pokémon del Pasado y del Futuro como Walking Wake ex y Iron Leaves ex.',
    stock: 8,
    expansion: 'Temporal Forces'
  },
  {
    id: 'sealed_4',
    name: 'Elite Trainer Box Scarlet & Violet: Paldean Fates',
    price: 1299,
    category: 'etb',
    image: 'https://images.pokemoncenter.com/images/products/P9642/712-98604/712-98604_1.jpg',
    description: 'Incluye 9 sobres de Paldean Fates, 1 carta promo foil de Mimikyu Shiny, dados y accesorios. ¡Colecciona Pokémon Shiny e increíbles cartas Full Art!',
    stock: 15,
    expansion: 'Paldean Fates'
  },
  {
    id: 'sealed_5',
    name: 'Caja de Sobres (Booster Box) Pokémon 151 (Japonesa)',
    price: 3499,
    category: 'booster_box',
    image: 'https://images.pokemoncenter.com/images/products/P9411/712-98441/712-98441_1.jpg',
    description: 'Importada directamente de Japón. Contiene 20 sobres de la aclamada expansión Pokémon 151 en su idioma original. ¡Un artículo de colección imprescindible!',
    stock: 3,
    expansion: 'Pokémon 151'
  },
  {
    id: 'sealed_6',
    name: 'Blister Pack de 3 Sobres Scarlet & Violet: Paradox Rift',
    price: 299,
    category: 'blister',
    image: 'https://images.pokemoncenter.com/images/products/P9532/712-98567/712-98567_1.jpg',
    description: 'Incluye 3 sobres de Paradox Rift y una carta promocional holográfica exclusiva. Ideal para potenciar tu baraja de manera rápida.',
    stock: 24,
    expansion: 'Paradox Rift'
  },
  {
    id: 'acc_1',
    name: 'Micas Protectoras PokéVault Standard (65 piezas)',
    price: 149,
    category: 'accessory',
    image: 'https://images.pokemoncenter.com/images/products/P9159/712-97066/712-97066_1.jpg',
    description: 'Micas protectoras de calidad de torneo para cartas de tamaño estándar. Diseño exclusivo de Pokebola PokéVault.',
    stock: 50,
  },
  {
    id: 'acc_2',
    name: 'Carpeta de Colección PokéVault (9 Bolsillos, 360 Cartas)',
    price: 399,
    category: 'accessory',
    image: 'https://images.pokemoncenter.com/images/products/P9159/712-97069/712-97069_1.jpg',
    description: 'Carpeta con bolsillos de carga lateral y cierre elástico. Ideal para mantener protegidas tus cartas más valiosas contra el polvo y rayones.',
    stock: 20,
  },
  {
    id: 'acc_3',
    name: 'Playmat de Neopreno Premium: PokéVault Battle Arena',
    price: 499,
    category: 'accessory',
    image: 'https://images.pokemoncenter.com/images/products/P9159/712-97062/712-97062_1.jpg',
    description: 'Tapete de juego de hule natural con superficie de tela suave. Bordes cosidos de alta resistencia para evitar deshilachado. Tamaño estándar de juego.',
    stock: 10,
  },
  {
    id: 'vg_1',
    name: 'Pokémon Escarlata (Nintendo Switch)',
    price: 1199,
    category: 'videogame',
    image: 'https://images.pokemoncenter.com/images/products/P8895/710-95880/710-95880_1.jpg',
    description: 'Juego físico original para Nintendo Switch. Explora la región de Paldea en un mundo abierto sin límites. Caja y cartucho en perfecto estado garantizado.',
    stock: 3,
    platform: 'Nintendo Switch',
    completeness: 'CIB (Completo en Caja)'
  },
  {
    id: 'vg_2',
    name: 'Super Smash Bros. Ultimate (Nintendo Switch)',
    price: 1099,
    category: 'videogame',
    image: 'https://images.pokemoncenter.com/images/products/P9159/712-97066/712-97066_1.jpg',
    description: 'El clásico juego de peleas competitivo de Nintendo con Pikachu, Charizard, Greninja, Lucario y Mewtwo. Cartucho probado y funcionando al 100%.',
    stock: 2,
    platform: 'Nintendo Switch',
    completeness: 'CIB (Completo en Caja)'
  },
  {
    id: 'vg_3',
    name: 'Consola Nintendo Switch OLED - Edición Especial Pokémon',
    price: 6499,
    category: 'videogame',
    image: 'https://images.pokemoncenter.com/images/products/P9411/712-98442/712-98442_1.jpg',
    description: 'Consola Nintendo Switch OLED con pantalla de 7 pulgadas en perfecto estado. Incluye Joy-Con edición temática, dock, cables originales y garantía de funcionamiento en tienda.',
    stock: 1,
    platform: 'Consolas / Hardware',
    completeness: 'Completo con Accesorios'
  },
  {
    id: 'single_fe_1',
    name: 'Charizard Holo (1ª Edición Stamp Vintage)',
    price: 18500,
    category: 'single',
    image: 'https://images.pokemontcg.io/base1/4_hires.png',
    description: 'Auténtica carta vintage de Charizard con sello oficial de 1ª Edición (First Edition Stamp). En estado de conservación excepcional Near Mint.',
    stock: 1,
    expansion: 'Base Set',
    region: 'Inglés (USA)',
    cardCondition: 'NM',
    isFirstEdition: true,
    isPromo: true
  },
  {
    id: 'single_fe_2',
    name: 'Lugia ex (1ª Edición Golden Border)',
    price: 4999,
    category: 'single',
    image: 'https://images.pokemontcg.io/ex10/105_hires.png',
    description: 'Carta icónica de Lugia con sello de 1ª Edición y borde holográfico de colección. Probada e inspeccionada bajo luz ultravioleta.',
    stock: 2,
    expansion: 'Unseen Forces',
    region: 'Inglés (USA)',
    cardCondition: 'NM',
    isFirstEdition: true
  }
];

export default function ProductCatalog({
  onAddToCart,
  onViewDetails,
  searchQuery,
  inventory,
  favorites,
  onToggleFavorite,
  initialCategory,
  activeGame,
}: ProductCatalogProps) {
  // Filtros de navegación
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [expansionFilter, setExpansionFilter] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedEdition, setSelectedEdition] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [onlyDealsFilter, setOnlyDealsFilter] = useState<boolean>(false);
  const [isConditionGuideOpen, setIsConditionGuideOpen] = useState<boolean>(false);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);

  useEffect(() => {
    apiGetCategories().then(setCategoriesList).catch(console.error);
  }, []);

  // Estado para cartas API (Desactivado para catálogo limpio)
  const loading = false;
  const error = null;

  // Cargar cartas sueltas desde la API (Desactivado para catálogo público limpio; solo se usa en Admin para agregar)
  /*
  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchCards(searchQuery);
        setApiCards(result.data);
      } catch (err) {
        setError('Error al conectar con la API de Pokémon TCG. Mostrando productos locales.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCategory === 'all' || selectedCategory === 'single' || searchQuery) {
      loadCards();
    }
  }, [searchQuery, selectedCategory]);
  */

  // Convertir cartas API en productos de la tienda
  /*
  const getApiProducts = (): Product[] => {
    return apiCards.map((card) => {
      // Convertir precio de mercado de USD a MXN (tipo de cambio simulado $17.50 MXN)
      const marketPriceUsd = card.tcgplayer?.prices?.holofoil?.market || 
                             card.tcgplayer?.prices?.normal?.market || 
                             card.tcgplayer?.prices?.reverseHolofoil?.market || 
                             5; // default $5 USD
      
      const priceMxn = Math.round(marketPriceUsd * 17.5);
      
      return {
        id: `card_${card.id}`,
        name: `${card.name} (${card.number}/${card.images.small.split('/').pop()?.split('.')[0] || ''})`,
        price: priceMxn,
        category: 'single',
        image: card.images.small,
        description: card.flavorText || `Carta Pokémon original de la expansión ${card.id.split('-')[0].toUpperCase()}. Rarity: ${card.rarity}. Ilustrado por ${card.artist || 'Artista Desconocido'}.`,
        stock: Math.floor(Math.random() * 4) + 1, // Stock aleatorio entre 1 y 4 para realismo
        expansion: card.id.split('-')[0].toUpperCase(),
        pokemonCardData: card
      };
    });
  };
  */

  // Combinar productos locales mockeados con productos de la API
  const getCombinedProducts = (): Product[] => {
    let list: Product[] = [];

    // Añadir productos de la base de datos (o mocks si aún no hay inventario en DB)
    const sourceProducts = inventory.length > 0 ? inventory : MOCK_PRODUCTS;
    const filteredDB = sourceProducts.filter(p => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'sealed') return p.category === 'booster_box' || p.category === 'etb' || p.category === 'blister';
      return p.category === selectedCategory;
    });
    list = [...list, ...filteredDB];

    // Añadir cartas de la API si la categoría aplica (Desactivado para catálogo público limpio)
    /*
    if (selectedCategory === 'all' || selectedCategory === 'single') {
      list = [...list, ...getApiProducts()];
    }
    */

    // Filtrar localmente por búsqueda si es producto sellado (las cartas ya se filtraron en API)
    if (searchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Filtrar por Tipo de Pokémon (solo aplica para cartas sueltas)
    if (selectedType !== 'all') {
      list = list.filter(p => p.pokemonCardData?.types?.includes(selectedType));
    }

    // Filtrar por Región / Idioma (solo aplica para cartas sueltas)
    if (selectedRegion !== 'all') {
      list = list.filter(p => {
        if (p.category !== 'single') return true;
        const reg = p.region || 'Inglés (USA)';
        return reg.toLowerCase().includes(selectedRegion.toLowerCase());
      });
    }

    // Filtrar por Condición (solo aplica para cartas sueltas)
    if (selectedCondition !== 'all') {
      list = list.filter(p => {
        if (p.category !== 'single') return true;
        const cond = p.cardCondition || 'NM';
        return cond.toLowerCase() === selectedCondition.toLowerCase();
      });
    }

    // Filtrar por Rareza de Pokémon (solo aplica para cartas sueltas)
    if (selectedRarity !== 'all') {
      list = list.filter(p => {
        if (!p.pokemonCardData) return false;
        const rarity = p.pokemonCardData.rarity.toLowerCase();
        if (selectedRarity === 'rare') return rarity.includes('rare') || rarity.includes('holo') || rarity.includes('secret') || rarity.includes('promo');
        if (selectedRarity === 'uncommon') return rarity.includes('uncommon');
        if (selectedRarity === 'common') return rarity.includes('common');
        return true;
      });
    }

    // Filtrar por Edición (1ª Edición vs Ilimitada / Regular)
    if (selectedEdition !== 'all') {
      list = list.filter(p => {
        if (p.category !== 'single') return true;
        if (selectedEdition === 'first_edition') return !!p.isFirstEdition;
        if (selectedEdition === 'unlimited') return !p.isFirstEdition;
        return true;
      });
    }

    // Filtrar por Plataforma (si aplica videojuego o búsqueda)
    if (selectedPlatform !== 'all') {
      list = list.filter(p => {
        if (!p.platform) return false;
        return p.platform.toLowerCase().includes(selectedPlatform.toLowerCase());
      });
    }

    // Filtrar por Ofertas vs Mercado TCGplayer
    if (onlyDealsFilter) {
      list = list.filter(p => {
        const tcgMkt = p.pokemonCardData?.tcgplayer?.prices?.holofoil?.market || p.pokemonCardData?.tcgplayer?.prices?.normal?.market;
        const effectiveMarket = p.marketPrice || (tcgMkt ? Math.round(tcgMkt * 20) : 0);
        return effectiveMarket > p.price;
      });
    }

    // Filtrar por Subcategoría Dinámica
    if (selectedSubCategory !== 'all') {
      list = list.filter(p => p.subCategory === selectedSubCategory);
    }

    // Filtrar por Precio Máximo
    list = list.filter(p => p.price <= maxPrice);

    // Filtrar por Expansión (nombre parcial)
    if (expansionFilter.trim()) {
      list = list.filter(p =>
        p.expansion?.toLowerCase().includes(expansionFilter.toLowerCase()) ||
        p.name.toLowerCase().includes(expansionFilter.toLowerCase())
      );
    }

    // Aplicar ordenamiento
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

  const categories = [
    { id: 'all', label: 'Todo' },
    { id: 'sealed', label: 'Producto Sellado' },
    { id: 'single', label: 'Cartas Sueltas' },
    { id: 'accessory', label: 'Accesorios' },
    { id: 'videogame', label: '🎮 Videojuegos y Consolas' },
  ];

  const pokemonTypes = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless'];
  const magicColors = ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless'];
  const yugiohAttributes = ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
  
  const currentTypes = activeGame === 'MAGIC' ? magicColors : activeGame === 'YUGIOH' ? yugiohAttributes : pokemonTypes;
  const currentTypeLabel = activeGame === 'MAGIC' ? 'Color de Maná' : activeGame === 'YUGIOH' ? 'Atributo' : 'Tipo de Pokémon';

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Selector de Categorías (Botones Rápidos) */}
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)',
        scrollbarWidth: 'none',
      }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              // Resetear filtros específicos si cambia de categoría
              if (cat.id !== 'single' && cat.id !== 'all') {
                setSelectedType('all');
                setSelectedRarity('all');
                setSelectedRegion('all');
                setSelectedCondition('all');
                setSelectedEdition('all');
              }
            }}
            className="btn"
            style={{
              backgroundColor: selectedCategory === cat.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              whiteSpace: 'nowrap',
              border: selectedCategory === cat.id ? 'none' : '1px solid var(--border-color)',
              padding: '8px 16px',
              fontSize: '13px'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '30px',
      }} className="catalog-layout">
        {/* Filtros Sidebar / Topbar */}
        <div className="glass" style={{
          padding: '20px',
          borderRadius: '12px',
          height: 'fit-content',
        }}>
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0 }}>Filtros</h3>
            </div>

            {/* Acciones Rápidas TCGplayer & Ofertas de Mercado */}
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
                {onlyDealsFilter ? '🔥 Mostrando Ofertas vs Mercado' : '🔥 Ver Ofertas vs Mercado'}
              </button>

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
                <HelpCircle size={14} color="#ffcb05" /> Guía de Estados (NM, LP...)
              </button>
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

            {/* Filtrar por tipo (Solo si se muestran cartas) */}
            {(selectedCategory === 'all' || selectedCategory === 'single') && (
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

            {/* Filtrar por Plataforma (Videojuegos y Consolas) */}
            {(selectedCategory === 'all' || selectedCategory === 'videogame') && (
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
                  <option value="Switch">Nintendo Switch</option>
                  <option value="PlayStation">PlayStation (PS5 / PS4)</option>
                  <option value="Xbox">Xbox Series / One</option>
                  <option value="Retro">Retro (GB / GBA / DS / 3DS / N64)</option>
                  <option value="Consolas">Consolas / Hardware</option>
                </select>
              </div>
            )}

            {/* Filtro por Subcategoría Dinámica */}
            {categoriesList.filter(c => c.parent_id).length > 0 && (
              <div style={{ minWidth: '180px', flexGrow: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Subcategoría / Línea:
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
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
                  <option value="all">Todas las Subcategorías</option>
                  {categoriesList.filter(c => c.parent_id).map(sub => (
                    <option key={sub.id} value={sub.slug}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro de Precio Máximo */}
            <div style={{ minWidth: '200px', flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Precio Máximo: <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>${maxPrice.toLocaleString('es-MX')} MXN</span>
              </label>
              <input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>$100</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[500, 1500, 3500].map(p => (
                    <button key={p} onClick={() => setMaxPrice(p)}
                      style={{
                        fontSize: '9px', padding: '1px 5px', borderRadius: '4px', cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        background: maxPrice === p ? 'var(--primary)' : 'transparent',
                        color: maxPrice === p ? 'white' : 'var(--text-muted)'
                      }}>${(p/1000).toFixed(1)}k</button>
                  ))}
                </div>
                <span>$10k</span>
              </div>
            </div>

            {/* Filtro de Expansión */}
            <div style={{ minWidth: '180px', flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Expansión / Set:
              </label>
              <input
                type="text"
                placeholder="ej. Twilight, 151, Paldea..."
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
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              {expansionFilter && (
                <button onClick={() => setExpansionFilter('')}
                  style={{ fontSize: '11px', marginTop: '4px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                >× Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Listado de Productos */}
        <div>
          {/* Mensajes de error API */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255, 62, 62, 0.1)',
              border: '1px solid rgba(255, 62, 62, 0.3)',
              color: '#ff6b6b',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Cargando (Skeletons) */}
          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="glass" 
                  style={{
                    borderRadius: '12px',
                    padding: '16px',
                    height: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{
                    width: '100%',
                    aspectRatio: '2.5/3.5',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    animation: 'pulse 1.5s infinite alternate'
                  }} />
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '40%', height: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', animation: 'pulse 1.5s infinite alternate' }} />
                    <div style={{ width: '80%', height: '15px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', animation: 'pulse 1.5s infinite alternate' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div style={{ width: '30%', height: '18px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', animation: 'pulse 1.5s infinite alternate' }} />
                      <div style={{ width: '25%', height: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', animation: 'pulse 1.5s infinite alternate' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Resultados Vacíos */
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)'
            }}>
              <Search size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No se encontraron productos</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Prueba buscando otros términos o cambiando los filtros seleccionados.
              </p>
            </div>
          ) : (
            /* Grilla de productos */
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="animate-fade-in-up">
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
        @keyframes pulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
        @media (min-width: 992px) {
          .catalog-layout {
            grid-template-columns: 260px 1fr !important;
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
