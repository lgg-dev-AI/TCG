import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Truck, CreditCard, ChevronRight, ShoppingCart, Eye, Award, 
  Flame, ChevronLeft, Package
} from 'lucide-react';
import type { Product } from './ProductItem';

interface HomeProps {
  onExploreClick: () => void;
  onExploreCategory: (category: string) => void;
  onViewProductDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  inventory: Product[];
  activeGame: string;
  onGameChange?: (game: string) => void;
}

export default function Home({
  onExploreClick,
  onExploreCategory,
  onViewProductDetails,
  onAddToCart,
  inventory,
  activeGame
}: HomeProps) {
  // Encontrar el producto recomendado en el catálogo (ETB 151 o el primero disponible)
  const recommendedProduct = inventory.find(p => p.id === 'sealed_2') || inventory[0] || {
    id: 'sealed_2',
    name: 'Elite Trainer Box (ETB) Pokémon 151',
    price: 1499,
    category: 'etb',
    image: '/official_etb.png',
    description: 'Edición especial de colección. Incluye 9 sobres de Pokémon 151, 1 carta promo foil de Snorlax, micas de cartas de 151, dados y accesorios de juego.',
    stock: 5,
    expansion: 'Pokémon 151',
    isPromo: true
  };

  // Cajas Selladas, Booster Boxes & ETBs más buscadas de la tienda (Multi-TCG)
  const featuredSealedProducts = React.useMemo(() => {
    const sealed = inventory.filter(p => p.category === 'booster_box' || p.category === 'etb');
    if (sealed.length === 0) return inventory.slice(0, 8);

    const tcgTypes = ['ONE_PIECE', 'POKEMON', 'LORCANA', 'MAGIC', 'YUGIOH'];
    const selected: Product[] = [];
    const usedIds = new Set<string>();

    tcgTypes.forEach(t => {
      const match = sealed.filter(s => {
        if (t === 'ONE_PIECE') return s.gameType === 'ONE_PIECE' || s.gameType === 'ONEPIECE';
        if (t === 'POKEMON') return s.gameType === 'POKEMON' || !s.gameType;
        return s.gameType === t;
      });
      match.slice(0, 2).forEach(box => {
        if (!usedIds.has(box.id)) {
          selected.push(box);
          usedIds.add(box.id);
        }
      });
    });

    if (selected.length < 6) {
      const remaining = sealed.filter(b => !usedIds.has(b.id));
      selected.push(...remaining.slice(0, 6 - selected.length));
    }

    return selected;
  }, [inventory]);

  // Referencia para el efecto 3D Holográfico
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    transition: 'transform 0.5s ease'
  });
  const [shineStyle, setShineStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: 'radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)',
    transition: 'opacity 0.5s ease'
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // posición x del mouse dentro del elemento
    const y = e.clientY - rect.top;  // posición y del mouse dentro del elemento
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    // Rotación máxima de 15 grados
    const rotateX = -((y - yc) / yc) * 15;
    const rotateY = ((x - xc) / xc) * 15;

    // Calcular porcentajes para la iluminación del gradiente
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'none'
    });

    setShineStyle({
      opacity: 0.7,
      background: `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.2) 0%, rgba(255,203,5,0.15) 30%, rgba(255,62,62,0.15) 60%, rgba(0,0,0,0) 80%)`,
      transition: 'none'
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.5s ease'
    });
    setShineStyle({
      opacity: 0,
      background: 'radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)',
      transition: 'opacity 0.5s ease'
    });
  };

  const backupSingles: Product[] = [
    {
      id: 'mock_op1',
      name: 'Monkey D. Luffy Manga Alt #OP05-119',
      price: 36000,
      category: 'single',
      image: 'https://optcgapi.com/media/static/Card_Images/OP05-119.jpg',
      description: 'Manga secreta Luffy Gear 5 en Awakening of the New Era. Condición NM.',
      stock: 1,
      expansion: 'Awakening of the New Era (OP-05)',
      region: 'Japón / USA',
      cardCondition: 'NM',
      gameType: 'ONE_PIECE'
    },
    {
      id: 'mock_lor1',
      name: 'Elsa - Spirit of Winter Enchanted #207/204',
      price: 18500,
      category: 'single',
      image: 'https://cards.lorcast.io/card/digital/large/crd_cbc18e77d7ec4d50bf19650a9a559686.png',
      description: 'Elsa Enchanted Foil de The First Chapter de Disney Lorcana. Condición NM.',
      stock: 1,
      expansion: 'The First Chapter',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'LORCANA'
    },
    {
      id: 'mock_mtg1',
      name: 'The One Ring Borderless Foil #0451',
      price: 8900,
      category: 'single',
      image: 'https://cards.scryfall.io/large/front/d/e/de225645-1988-4217-a065-27a31b64cf27.jpg',
      description: 'El Anillo Único Borderless Foil de The Lord of the Rings. Condición NM.',
      stock: 2,
      expansion: 'Tales of Middle-earth',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'MAGIC'
    },
    {
      id: 'mock_ygo1',
      name: 'Blue-Eyes White Dragon 1st Ed #LOB-001',
      price: 24500,
      category: 'single',
      image: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
      description: 'Dragón Blanco de Ojos Azules vintage 1st Edition del 2002. Condición NM.',
      stock: 1,
      expansion: 'Legend of Blue Eyes',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'YUGIOH'
    },
    {
      id: 'mock_s1',
      name: 'Charizard ex SIR #199/165',
      price: 2850,
      category: 'single',
      image: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
      description: 'Carta holográfica de la expansión Pokémon 151. Rarity: Special Illustration Rare. Condición NM.',
      stock: 2,
      expansion: 'Pokémon 151',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'POKEMON'
    },
    {
      id: 'mock_lor2',
      name: 'Stitch - Carefree Surfer Enchanted #206/204',
      price: 5200,
      category: 'single',
      image: 'https://cards.lorcast.io/card/digital/large/crd_35c968e4b25945e897940860221f9d51.png',
      description: 'Stitch Surfero Enchanted arte alternativo. Condición NM.',
      stock: 2,
      expansion: 'The First Chapter',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'LORCANA'
    },
    {
      id: 'mock_op2',
      name: 'Roronoa Zoro Manga Alt #OP06-118',
      price: 21500,
      category: 'single',
      image: 'https://optcgapi.com/media/static/Card_Images/OP06-118_p2.jpg',
      description: 'Zoro Manga Alternate Art en Wings of the Captain. Condición NM.',
      stock: 1,
      expansion: 'Wings of the Captain',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'ONE_PIECE'
    },
    {
      id: 'mock_ygo2',
      name: 'Dark Magician Girl Ghost Rare #GFP2-EN177',
      price: 7800,
      category: 'single',
      image: 'https://images.ygoprodeck.com/images/cards/38033121.jpg',
      description: 'Chica Maga Oscura Ghost Rare 3D. Condición NM.',
      stock: 2,
      expansion: 'Ghosts From the Past 2',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'YUGIOH'
    },
    {
      id: 'mock_s5',
      name: 'Giratina V Alt Art #186/196',
      price: 6899,
      category: 'single',
      image: 'https://images.pokemontcg.io/swsh11/186_hires.png',
      description: 'Carta ultra rara de Lost Origin. Ilustración espectacular de Shinji Kanda. Condición NM.',
      stock: 1,
      expansion: 'Lost Origin',
      region: 'Inglés (USA)',
      cardCondition: 'NM',
      gameType: 'POKEMON'
    }
  ];

  // Intercalar cartas de todos los TCGs para que el carrusel sea dinámico y diverso (One Piece, Lorcana, Magic, Yu-Gi-Oh, Pokémon)
  const carouselCards = React.useMemo(() => {
    const singles = inventory.filter(p => p.category === 'single');
    if (singles.length === 0) return backupSingles;

    const tcgOrder = ['ONE_PIECE', 'LORCANA', 'MAGIC', 'YUGIOH', 'POKEMON'];
    const buckets: Record<string, Product[]> = {
      ONE_PIECE: [],
      LORCANA: [],
      MAGIC: [],
      YUGIOH: [],
      POKEMON: []
    };

    singles.forEach(s => {
      let key = 'POKEMON';
      if (s.gameType === 'ONE_PIECE' || s.gameType === 'ONEPIECE') key = 'ONE_PIECE';
      else if (s.gameType === 'LORCANA') key = 'LORCANA';
      else if (s.gameType === 'MAGIC') key = 'MAGIC';
      else if (s.gameType === 'YUGIOH') key = 'YUGIOH';
      buckets[key].push(s);
    });

    // Ordenar cada bucket por precio para que lo mejor de cada TCG salga primero
    Object.keys(buckets).forEach(k => {
      buckets[k].sort((a, b) => b.price - a.price);
    });

    // Intercalar ronda por ronda (round-robin)
    const result: Product[] = [];
    let round = 0;
    let addedInRound = true;

    while (addedInRound) {
      addedInRound = false;
      for (const tcg of tcgOrder) {
        if (buckets[tcg][round]) {
          result.push(buckets[tcg][round]);
          addedInRound = true;
        }
      }
      round++;
    }

    return result.length > 0 ? result : singles;
  }, [inventory]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselFilter, setCarouselFilter] = useState<string>('ALL');

  const carouselFilterOptions = [
    { id: 'ALL', label: '✨ Todos los TCG' },
    { id: 'POKEMON', label: '⚡ Pokémon' },
    { id: 'ONE_PIECE', label: '🏴‍☠️ One Piece' },
    { id: 'MAGIC', label: '🔮 Magic' },
    { id: 'YUGIOH', label: '🐉 Yu-Gi-Oh!' },
    { id: 'LORCANA', label: '🏰 Disney Lorcana' },
  ];

  const displayCarouselCards = React.useMemo(() => {
    if (carouselFilter === 'ALL') return carouselCards;
    return carouselCards.filter(c => {
      if (carouselFilter === 'ONE_PIECE') return c.gameType === 'ONE_PIECE' || c.gameType === 'ONEPIECE';
      if (carouselFilter === 'POKEMON') return c.gameType === 'POKEMON' || !c.gameType;
      return c.gameType === carouselFilter;
    });
  }, [carouselCards, carouselFilter]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Desplazamiento automático cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        // Si ya llegó al final (con un margen de tolerancia de 10px), reinicia al inicio
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [displayCarouselCards]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', paddingBottom: '60px' }}>
      
      {/* 1. SECCIÓN HERO */}
      <section style={{ padding: '20px 0 0 0' }}>
        <div 
          className="glass animate-fade-in-up" 
          style={{
            borderRadius: '24px',
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(14, 17, 24, 0.9) 0%, rgba(30, 10, 10, 0.95) 100%)',
            border: '1px solid rgba(255, 62, 62, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '40px',
            flexWrap: 'wrap'
          }}
        >
          {/* Adorno de fondo brillante */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 62, 62, 0.15) 0%, rgba(0,0,0,0) 75%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 203, 5, 0.12) 0%, rgba(0,0,0,0) 75%)',
            pointerEvents: 'none'
          }} />

          {/* Información del Hero */}
          <div style={{ flex: '1 1 450px', zIndex: 10 }}>
            {/* Insignia / Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 203, 5, 0.08)',
              border: '1px solid rgba(255, 203, 5, 0.25)',
              padding: '6px 14px',
              borderRadius: '20px',
              color: 'var(--secondary)',
              fontSize: '11.5px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '20px'
            }}>
              <Sparkles size={13} /> Preventa Especial: Twilight Masquerade
            </div>

            {/* Título Principal */}
            <h1 style={{
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '20px',
              color: 'white'
            }}>
              La Bóveda de Cartas <br />
              <span style={{
                background: activeGame === 'MAGIC' ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' :
                            activeGame === 'YUGIOH' ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)' :
                            'linear-gradient(90deg, #ff3e3e 0%, #ffcb05 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {activeGame === 'MAGIC' ? 'Magic: The Gathering' : activeGame === 'YUGIOH' ? 'Yu-Gi-Oh! Exclusiva' : 'Pokémon Más Exclusiva'}
              </span>
            </h1>

            {/* Descripción */}
            <p style={{
              fontSize: 'clamp(14px, 1.8vw, 16px)',
              color: 'var(--text-secondary)',
              maxWidth: '580px',
              marginBottom: '32px',
              lineHeight: 1.6
            }}>
              Colecciona cartas sueltas oficiales de las mejores expansiones, booster boxes importadas y productos sellados exclusivos. Garantizamos autenticidad absoluta y envíos impecables.
            </p>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <button 
                onClick={onExploreClick} 
                className="btn btn-primary" 
                style={{ padding: '14px 30px', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Explorar Catálogo
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => onExploreCategory('single')} 
                className="btn btn-secondary" 
                style={{ padding: '14px 24px', fontSize: '15px', border: '1px solid var(--border-color)' }}
              >
                Ver Cartas Sueltas (Singles)
              </button>
            </div>
          </div>

          {/* Imagen de fondo / Mascota */}
          <div style={{
            flex: '1 1 350px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            zIndex: 5
          }} className="hero-banner-image-container">
            <div style={{
              position: 'absolute',
              width: '260px',
              height: '260px',
              background: 'radial-gradient(circle, rgba(255,62,62,0.2) 0%, rgba(255,203,5,0.05) 50%, rgba(0,0,0,0) 70%)',
              filter: 'blur(20px)',
              zIndex: 1
            }} />
            <img 
              src="https://images.pokemontcg.io/sv3pt5/199_hires.png" 
              alt="Holographic Charizard ex" 
              onError={(e) => {
                e.currentTarget.src = '/generic_card.png';
              }}
              style={{
                width: '320px',
                maxHeight: '340px',
                objectFit: 'contain',
                zIndex: 2,
                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.65))',
                animation: 'float 5s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. BÓVEDA DE SINGLES: CARRUSEL MULTI-TCG CON AUTO-SCROLL */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#ffcb05', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              🃏 Bóveda de Singles Multi-TCG
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: '4px 0 0 0', fontFamily: 'var(--font-heading)' }}>
              Cartas Sueltas Destacadas & Más Cotizadas
            </h2>
          </div>
          
          {/* Botones del Carrusel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => onExploreCategory('single')}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px'
              }}
            >
              Ver todos los singles <ChevronRight size={14} />
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => scrollCarousel('left')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 62, 62, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                title="Desplazar a la izquierda"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => scrollCarousel('right')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 62, 62, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                title="Desplazar a la derecha"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Píldoras de Filtro Rápido por Franquicia TCG */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }} className="carousel-scrollbar-hide">
          {carouselFilterOptions.map(opt => {
            const isActive = carouselFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setCarouselFilter(opt.id);
                  if (carouselRef.current) {
                    carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 600,
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'rgba(255, 62, 62, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 12px rgba(255, 62, 62, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Contenedor del Scroll Carrusel */}
        <div 
          ref={carouselRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          className="carousel-scrollbar-hide"
        >
          {displayCarouselCards.map((product) => {
            const gameColor = 
              product.gameType === 'LORCANA' ? '#a855f7' :
              product.gameType === 'ONE_PIECE' || product.gameType === 'ONEPIECE' ? '#06b6d4' :
              product.gameType === 'YUGIOH' ? '#ef4444' :
              product.gameType === 'MAGIC' ? '#f97316' : '#ffcb05';

            const gameLabel = 
              product.gameType === 'LORCANA' ? 'Lorcana' :
              product.gameType === 'ONE_PIECE' || product.gameType === 'ONEPIECE' ? 'One Piece' :
              product.gameType === 'YUGIOH' ? 'Yu-Gi-Oh!' :
              product.gameType === 'MAGIC' ? 'Magic' : 'Pokémon';

            return (
              <div 
                key={product.id}
                className="glass"
                style={{
                  minWidth: '220px',
                  maxWidth: '220px',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'rgba(22, 27, 38, 0.5)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = gameColor;
                  e.currentTarget.style.boxShadow = `0 12px 24px ${gameColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => onViewProductDetails(product)}
              >
                {/* Imagen de la carta */}
                <div style={{
                  width: '100%',
                  aspectRatio: '2.5 / 3.5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  overflow: 'hidden',
                  borderRadius: '6px'
                }}>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    onError={(e) => { e.currentTarget.src = '/generic_card.png'; }}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                    }}
                  />
                </div>

                {/* Información */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '8px',
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      backgroundColor: `${gameColor}20`,
                      color: gameColor,
                      border: `1px solid ${gameColor}40`,
                      textTransform: 'uppercase'
                    }}>
                      {gameLabel}
                    </span>
                    <span style={{ fontSize: '8.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                      {product.expansion || 'Carta Suelta'}
                    </span>
                  </div>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'white',
                    margin: '0 0 6px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={product.name}>
                    {product.name}
                  </h4>

                  {/* Badges de Idioma y Condición */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {product.region && (
                      <span style={{
                        fontSize: '8.5px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(96, 165, 250, 0.12)',
                        color: '#60a5fa',
                        fontWeight: 700
                      }}>
                        🌐 {product.region.split(' ')[0]}
                      </span>
                    )}
                    {product.cardCondition && (
                      <span style={{
                        fontSize: '8.5px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                        fontWeight: 700
                      }}>
                        ✨ {product.cardCondition}
                      </span>
                    )}
                  </div>

                  {/* Precio e Interacciones */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>
                      ${product.price.toLocaleString('es-MX')} MXN
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      disabled={product.stock === 0}
                      className="btn btn-primary"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        opacity: product.stock === 0 ? 0.5 : 1,
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PRODUCTO RECOMENDADO DESTACADO (Holographic tilt card) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Recomendación de la Semana</span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', margin: '4px 0 0 0', fontFamily: 'var(--font-heading)' }}>
            Producto Recomendado
          </h2>
          <div style={{ width: '50px', height: '4px', backgroundColor: 'var(--primary)', borderRadius: '2px', marginTop: '10px' }} />
        </div>

        {/* Bloque Premium Dividido */}
        <div className="glass" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          borderRadius: '20px',
          border: '1px solid rgba(255, 62, 62, 0.2)',
          background: 'linear-gradient(135deg, rgba(22, 27, 38, 0.7) 0%, rgba(14, 17, 24, 0.9) 100%)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
        }}>
          {/* Lado Izquierdo: Tarjeta 3D interactiva */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '50px 30px',
            backgroundColor: 'rgba(6, 8, 12, 0.4)',
            borderRight: '1px solid var(--border-color)',
            overflow: 'hidden'
          }} className="home-tilt-pane">
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                ...style,
                width: '300px',
                height: '400px',
                borderRadius: '16px',
                border: '1px solid rgba(255,203,5,0.3)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.8), 0 0 20px rgba(255,203,5,0.1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0c0f17'
              }}
              onClick={() => onViewProductDetails(recommendedProduct as Product)}
            >
              {/* Imagen del producto */}
              <img 
                src={recommendedProduct.image} 
                alt={recommendedProduct.name} 
                style={{
                  width: '90%',
                  height: '90%',
                  objectFit: 'contain',
                  zIndex: 2,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
                }}
              />

              {/* Efecto de Brillo/Luz Holográfica */}
              <div style={{
                ...shineStyle,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 3,
                pointerEvents: 'none'
              }} />

              {/* Insignia Promo */}
              {recommendedProduct.isPromo && (
                <span style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  zIndex: 4,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Destacado
                </span>
              )}
            </div>
          </div>

          {/* Lado Derecho: Detalles del Producto */}
          <div style={{
            padding: '40px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} style={{ color: 'var(--secondary)' }} />
              <span style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {recommendedProduct.expansion || 'Expansión Especial'}
              </span>
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
              {recommendedProduct.name}
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {recommendedProduct.description}
            </p>

            {/* Ficha de Detalles Rápidos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              backgroundColor: 'rgba(6, 8, 12, 0.3)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Categoría</span>
                <strong style={{ fontSize: '13px', color: 'white' }}>{recommendedProduct.category.toUpperCase().replace('_', ' ')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Disponibilidad</span>
                <strong style={{ fontSize: '13px', color: recommendedProduct.stock > 0 ? '#34d399' : '#ff6b6b' }}>
                  {recommendedProduct.stock > 0 ? `${recommendedProduct.stock} Unidades` : 'Agotado'}
                </strong>
              </div>
            </div>

            {/* Precio y Compra */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Precio Exclusivo</span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: 'white' }}>
                  ${recommendedProduct.price.toLocaleString('es-MX')} MXN
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => onViewProductDetails(recommendedProduct as Product)}
                  className="btn btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-color)', padding: '10px 16px' }}
                >
                  <Eye size={15} /> Ver Ficha
                </button>
                <button 
                  onClick={() => onAddToCart(recommendedProduct as Product)}
                  className="btn btn-primary"
                  disabled={recommendedProduct.stock === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
                >
                  <ShoppingCart size={15} /> Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CAJAS SELLADAS & BOOSTER BOXES DESTACADAS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#38bdf8',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '4px'
            }}>
              <Package size={13} /> Stock Oficial de Fábrica
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Cajas Selladas & Booster Boxes Más Buscadas
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Material precintado de fábrica con garantía de autenticidad absoluta PokéVault.
            </p>
          </div>

          <button
            onClick={() => onExploreCategory('booster_box')}
            style={{
              background: 'none',
              border: 'none',
              color: '#60a5fa',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Ver todas las cajas selladas <ChevronRight size={14} />
          </button>
        </div>

        {/* Grid de Cajas Selladas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {featuredSealedProducts.map(product => {
            const gameColor = 
              product.gameType === 'LORCANA' ? '#a855f7' :
              product.gameType === 'ONE_PIECE' || product.gameType === 'ONEPIECE' ? '#06b6d4' :
              product.gameType === 'YUGIOH' ? '#ef4444' :
              product.gameType === 'MAGIC' ? '#f97316' : '#ffcb05';

            const gameLabel = 
              product.gameType === 'LORCANA' ? 'Disney Lorcana' :
              product.gameType === 'ONE_PIECE' || product.gameType === 'ONEPIECE' ? 'One Piece' :
              product.gameType === 'YUGIOH' ? 'Yu-Gi-Oh!' :
              product.gameType === 'MAGIC' ? 'Magic' : 'Pokémon';

            const categoryLabel = product.category === 'etb' ? '⚔️ Elite Trainer Box' : '📦 Booster Box';

            return (
              <div
                key={product.id}
                className="glass"
                style={{
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  backgroundColor: 'rgba(14, 18, 28, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = gameColor;
                  e.currentTarget.style.boxShadow = `0 16px 36px ${gameColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Badges superiores */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: `${gameColor}20`,
                    color: gameColor,
                    border: `1px solid ${gameColor}40`,
                    textTransform: 'uppercase'
                  }}>
                    {gameLabel}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    {categoryLabel}
                  </span>
                </div>

                {/* Imagen del Producto Sellado */}
                <div 
                  onClick={() => onViewProductDetails(product)}
                  style={{
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px 0',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => { e.currentTarget.src = product.category === 'etb' ? '/official_etb.png' : '/official_booster_box.png'; }}
                    style={{
                      maxHeight: '90%',
                      maxWidth: '90%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                      transition: 'transform 0.4s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                </div>

                {/* Info */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {product.expansion || 'Edición Oficial Sellada'}
                  </span>
                  <h3 
                    onClick={() => onViewProductDetails(product)}
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'white',
                      margin: 0,
                      lineHeight: 1.3,
                      cursor: 'pointer',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '38px'
                    }}
                  >
                    {product.name}
                  </h3>

                  {product.description && (
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Disponibilidad y Precio */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                      {product.stock > 0 ? (
                        <span style={{ color: product.stock <= 3 ? '#f59e0b' : '#34d399', fontWeight: 700 }}>
                          {product.stock <= 3 ? `⚡ ¡Solo quedan ${product.stock}!` : `✓ Stock: ${product.stock} uds`}
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>Agotado</span>
                      )}
                    </span>
                    <span style={{ fontSize: '19px', fontWeight: 800, color: '#ffcb05', fontFamily: 'var(--font-heading)' }}>
                      ${product.price.toLocaleString('es-MX')} <span style={{ fontSize: '11px', fontWeight: 600 }}>MXN</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onViewProductDetails(product)}
                      title="Ver Detalles"
                      className="btn"
                      style={{
                        padding: '9px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-color)',
                        color: '#ffffff',
                        borderRadius: '8px'
                      }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={product.stock === 0}
                      title={product.stock === 0 ? 'Sin stock' : 'Agregar al Carrito'}
                      className="btn btn-primary"
                      style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: product.stock === 0 ? 0.5 : 1,
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ShoppingCart size={15} /> Añadir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. GRID DE CATEGORÍAS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
            Navegar por Categorías
          </h2>
          <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--primary)', borderRadius: '1.5px', marginTop: '8px' }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px'
        }}>
          {categoryCards.map((cat, i) => (
            <div 
              key={i} 
              className="glass" 
              style={{
                borderRadius: '16px',
                padding: '24px 16px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(22, 27, 38, 0.4)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
              onClick={() => onExploreCategory(cat.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(255, 62, 62, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 62, 62, 0.08)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {cat.emoji}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'white', margin: 0 }}>{cat.label}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  {cat.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. BENEFICIOS */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '40px',
        marginTop: '10px'
      }}>
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(255, 62, 62, 0.08)',
                border: '1px solid rgba(255, 62, 62, 0.2)',
                color: 'var(--primary)',
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'white', margin: '0 0 4px 0' }}>{b.title}</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{b.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ESTILOS CSS INYECTADOS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 6px rgba(255,62,62,0.4); }
          50% { box-shadow: 0 0 14px rgba(255,62,62,0.8); }
        }
        .carousel-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

const categoryCards = [
  { id: 'booster_box', label: 'Booster Boxes', desc: 'Cajas cerradas de 36 sobres', emoji: '📦' },
  { id: 'etb', label: 'Elite Trainer Boxes', desc: 'Sets de colección con micas y dados', emoji: '⚔️' },
  { id: 'single', label: 'Cartas Sueltas', desc: 'Singles cotizados en mercado real', emoji: '🃏' },
  { id: 'accessory', label: 'Accesorios', desc: 'Micas, tapetes de neopreno y carpetas', emoji: '🛡️' }
];

const benefits = [
  {
    icon: Award,
    title: "Garantía de Autenticidad",
    desc: "Todas nuestras cartas y productos sellados pasan por un estricto control de originalidad."
  },
  {
    icon: Truck,
    title: "Envíos Protegidos a Todo México",
    desc: "Utilizamos cajas de doble corrugado y plástico de burbujas para proteger el stock."
  },
  {
    icon: CreditCard,
    title: "Pago por Transferencia SPEI",
    desc: "Método seguro y transparente. Validamos comprobantes de pago de forma oportuna."
  }
];
