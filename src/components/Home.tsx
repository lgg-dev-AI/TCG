import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Truck, CreditCard, ChevronRight, ShoppingCart, Eye, Award, 
  Flame, ChevronLeft, Swords, Ship, Wand2, Gamepad2, ShieldCheck, Tag 
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
  activeGame,
  onGameChange
}: HomeProps) {
  // Encontrar el producto recomendado en el catálogo (ETB 151 o el primero disponible)
  const recommendedProduct = inventory.find(p => p.id === 'sealed_2') || inventory[0] || {
    id: 'sealed_2',
    name: 'Elite Trainer Box (ETB) Pokémon 151',
    price: 1499,
    category: 'etb',
    image: 'https://images.pokemoncenter.com/images/products/P9411/712-98442/712-98442_1.jpg',
    description: 'Edición especial de colección. Incluye 9 sobres de Pokémon 151, 1 carta promo foil de Snorlax, micas de cartas de 151, dados y accesorios de juego.',
    stock: 5,
    expansion: 'Pokémon 151',
    isPromo: true
  };

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

  const singleCards = inventory.filter(p => p.category === 'single');
  const backupSingles: Product[] = [
    {
      id: 'mock_s1',
      name: 'Charizard ex (199/165) SIR',
      price: 2450,
      category: 'single',
      image: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
      description: 'Carta holográfica de la expansión Pokémon 151. Rarity: Special Illustration Rare. Condición NM.',
      stock: 2,
      expansion: '151',
      region: 'Inglés (USA)',
      cardCondition: 'NM'
    },
    {
      id: 'mock_s2',
      name: 'Mew ex (205/165) SIR',
      price: 1890,
      category: 'single',
      image: 'https://images.pokemontcg.io/sv3pt5/205_hires.png',
      description: 'Carta holográfica de la expansión Pokémon 151. Rarity: Special Illustration Rare. Condición NM.',
      stock: 1,
      expansion: '151',
      region: 'Inglés (USA)',
      cardCondition: 'NM'
    },
    {
      id: 'mock_s3',
      name: 'Pikachu (173/165) IR',
      price: 950,
      category: 'single',
      image: 'https://images.pokemontcg.io/sv3pt5/173_hires.png',
      description: 'Carta holográfica de la expansión Pokémon 151. Rarity: Illustration Rare. Condición NM.',
      stock: 4,
      expansion: '151',
      region: 'Inglés (USA)',
      cardCondition: 'NM'
    },
    {
      id: 'mock_s4',
      name: 'Gengar VMAX (271/264) Alt Art',
      price: 4899,
      category: 'single',
      image: 'https://images.pokemontcg.io/swsh8/271_hires.png',
      description: 'Carta ultra rara holográfica de la expansión Fusion Strike. Rarity: Secret Rare. Condición NM.',
      stock: 1,
      expansion: 'Fusion Strike',
      region: 'Inglés (USA)',
      cardCondition: 'NM'
    },
    {
      id: 'mock_s5',
      name: 'Giratina V (186/196) Alt Art',
      price: 6899,
      category: 'single',
      image: 'https://images.pokemontcg.io/swsh11/186_hires.png',
      description: 'Carta ultra rara de la expansión Lost Origin. Ilustración espectacular de Shinji Kanda.',
      stock: 1,
      expansion: 'Lost Origin',
      region: 'Inglés (USA)',
      cardCondition: 'NM'
    }
  ];
  const carouselCards = singleCards.length > 0 ? singleCards : backupSingles;
  const carouselRef = useRef<HTMLDivElement>(null);

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
  }, [carouselCards]);

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
              src="https://images.pokemoncenter.com/images/products/P9832/712-98696/712-98696_1.jpg" 
              alt="Holographic Charizard ex" 
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

      {/* 2. EXPLORA POR TCG & CATEGORÍA (TCGplayer Game Showcase) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#ffcb05', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Directorio de Coleccionismo
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: '4px 0 0 0', fontFamily: 'var(--font-heading)' }}>
              Explora por TCG & Categoría
            </h2>
          </div>
          <button
            onClick={onExploreClick}
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
            Ver catálogo completo <ChevronRight size={14} />
          </button>
        </div>

        {/* Grid de Juegos y Categorías */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {[
            { id: 'pokemon', name: 'Pokémon TCG', type: 'POKEMON', icon: Sparkles, color: '#ffcb05', desc: 'Singles, Booster Boxes, ETBs 151 y Prismatic' },
            { id: 'magic', name: 'Magic: The Gathering', type: 'MAGIC', icon: Flame, color: '#f97316', desc: 'Commander, Modern Horizons, Collector Boosters' },
            { id: 'yugioh', name: 'Yu-Gi-Oh!', type: 'YUGIOH', icon: Swords, color: '#ef4444', desc: 'Quarter Century Rares, Core Sets, Barajas' },
            { id: 'onepiece', name: 'One Piece Card Game', type: 'ONE_PIECE', icon: Ship, color: '#06b6d4', desc: 'Romance Dawn, Wings of Captain, OP-05', badge: 'POPULAR' },
            { id: 'lorcana', name: 'Disney Lorcana', type: 'LORCANA', icon: Wand2, color: '#a855f7', desc: 'The First Chapter, Inklands, Illumineer Troves' },
            { id: 'videogames', name: 'Videojuegos & Consolas', category: 'videogame', icon: Gamepad2, color: '#10b981', desc: 'Nintendo Switch, PS5, Xbox Series & Retro' },
            { id: 'accessories', name: 'Accesorios & Protección', category: 'accessory', icon: ShieldCheck, color: '#6366f1', desc: 'Sleeves Dragon Shield, Toploaders, Carpetas' },
            { id: 'deals', name: 'Liquidaciones & Ofertas', category: 'deals', icon: Tag, color: '#ec4899', desc: 'Garantía de precio por debajo de mercado', badge: 'OFERTAS' }
          ].map(hub => {
            const Icon = hub.icon;
            const isCurrent = (hub.type && hub.type === activeGame) || (hub.id === 'pokemon' && activeGame === 'POKEMON');
            return (
              <div
                key={hub.id}
                onClick={() => {
                  if (hub.type) {
                    onGameChange?.(hub.type);
                    onExploreClick();
                  } else if (hub.category) {
                    onExploreCategory(hub.category);
                  }
                }}
                className="glass"
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  border: isCurrent ? `1.5px solid ${hub.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.06)' : 'rgba(18, 22, 34, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isCurrent ? `0 8px 24px ${hub.color}25` : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = hub.color;
                  e.currentTarget.style.boxShadow = `0 10px 28px ${hub.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isCurrent ? hub.color : 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = isCurrent ? `0 8px 24px ${hub.color}25` : 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: `${hub.color}18`,
                    border: `1.5px solid ${hub.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: hub.color
                  }}>
                    <Icon size={20} />
                  </div>
                  {hub.badge && (
                    <span style={{
                      fontSize: '9.5px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: `${hub.color}25`,
                      color: hub.color,
                      fontWeight: 800,
                      letterSpacing: '0.05em'
                    }}>
                      {hub.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
                    {hub.name}
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {hub.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700, color: hub.color, marginTop: 'auto' }}>
                  <span>Explorar</span>
                  <ChevronRight size={13} />
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

      {/* 2.5 CARRUSEL DE CARTAS SUELTAS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Colección de Singles</span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '4px 0 0 0', fontFamily: 'var(--font-heading)' }}>
              Cartas Sueltas Destacadas
            </h2>
          </div>
          
          {/* Botones del Carrusel */}
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
            >
              <ChevronRight size={18} />
            </button>
          </div>
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
          {carouselCards.map((product) => (
            <div 
              key={product.id}
              className="glass"
              style={{
                minWidth: '220px',
                maxWidth: '220px',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(22, 27, 38, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(255, 62, 62, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
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
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>
                  {product.expansion || 'Carta Suelta'}
                </span>
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
          ))}
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
