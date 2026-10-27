import React, { useRef, useState } from 'react';
import { ShoppingCart, Eye, Sparkles, Heart } from 'lucide-react';
import type { PokemonCard } from '../services/api';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'booster_box' | 'etb' | 'blister' | 'single' | 'accessory';
  image: string;
  description: string;
  stock: number;
  expansion?: string;
  isPromo?: boolean;
  pokemonCardData?: PokemonCard; // Si es una carta suelta real de la API
  region?: string;
  pulledFrom?: string;
  cardCondition?: string;
  gameType?: string;
}

interface ProductItemProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: string, product?: Product) => void;
}

export default function ProductItem({ 
  product, 
  onAddToCart, 
  onViewDetails,
  isFavorite,
  onToggleFavorite
}: ProductItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [foilStyle, setFoilStyle] = useState<React.CSSProperties>({});

  const isSingle = product.category === 'single';

  // Efecto 3D interactivo holográfico para cartas sueltas
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSingle || !cardRef.current) return;

    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // posición x del ratón en la carta
    const y = e.clientY - rect.top;  // posición y del ratón en la carta
    const w = rect.width;
    const h = rect.height;

    // Calcular rotaciones (máximo 15 grados)
    const rotateX = ((y / h) - 0.5) * -30;
    const rotateY = ((x / w) - 0.5) * 30;

    // Calcular posición del reflejo holográfico
    const foilX = (x / w) * 100;
    const foilY = (y / h) * 100;

    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
      transition: 'transform 0.05s ease-out',
    });

    setFoilStyle({
      opacity: 0.65,
      backgroundPosition: `${foilX}% ${foilY}%`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.3s ease',
    });
    setFoilStyle({
      opacity: 0,
      transition: 'all 0.3s ease',
    });
  };

  // Obtener clase de rareza para el brillo dorado de fondo
  const isRare = isSingle && 
    (product.pokemonCardData?.rarity?.toLowerCase().includes('rare') || 
     product.pokemonCardData?.rarity?.toLowerCase().includes('promo'));

  return (
    <div 
      className="glass" 
      style={{
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        border: product.isPromo ? '1px solid var(--secondary)' : '1px solid var(--border-color)',
        height: '100%',
        justifyContent: 'space-between',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isSingle) {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.borderColor = 'rgba(255, 62, 62, 0.3)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSingle) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Botón de Favorito */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(product.id, product);
        }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(14, 17, 24, 0.75)',
          border: '1px solid var(--border-color)',
          color: isFavorite ? 'var(--primary)' : 'var(--text-secondary)',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          transition: 'all 0.2s',
          backdropFilter: 'blur(4px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title={isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
      >
        <Heart size={14} fill={isFavorite ? 'var(--primary)' : 'none'} style={{ transition: 'fill 0.2s' }} />
      </button>

      {/* Insignia Promo o Raro */}
      {product.isPromo && (
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'linear-gradient(135deg, #ffcb05, #c79e00)',
          color: '#0c0e12',
          fontSize: '9px',
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: '10px',
          zIndex: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: 'var(--font-heading)',
          display: 'flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          <Sparkles size={10} /> Destacado
        </span>
      )}

      {/* Badge de Stock Bajo — Urgencia de compra */}
      {product.stock > 0 && product.stock <= 3 && (
        <span style={{
          position: 'absolute',
          top: product.isPromo ? '34px' : '12px',
          left: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #b45309)',
          color: 'white',
          fontSize: '9px',
          fontWeight: 800,
          padding: '3px 8px',
          borderRadius: '10px',
          zIndex: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontFamily: 'var(--font-heading)',
          boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          ⚡ ¡Solo {product.stock} {product.stock === 1 ? 'queda' : 'quedan'}!
        </span>
      )}

      {/* Badge Agotado */}
      {product.stock === 0 && (
        <span style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(30, 30, 30, 0.9)',
          border: '1px solid rgba(255,62,62,0.4)',
          color: '#ff6b6b',
          fontSize: '9px',
          fontWeight: 800,
          padding: '3px 8px',
          borderRadius: '10px',
          zIndex: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: 'var(--font-heading)'
        }}>
          🚫 Agotado
        </span>
      )}

      {/* Contenedor de la Imagen */}
      <div 
        onClick={() => onViewDetails(product)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          aspectRatio: isSingle ? '2.5 / 3.5' : '1 / 1',
          overflow: 'visible',
        }}
      >
        {isSingle ? (
          /* Contenedor 3D para la carta Pokémon */
          <div 
            className="card-3d-wrapper"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className={`card-3d ${isRare ? 'rare-glow' : ''}`}
              ref={cardRef}
              style={tiltStyle}
            >
              <img 
                src={product.image} 
                alt={product.name} 
                loading="lazy" 
                style={{
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              />
              <div 
                className="card-foil-overlay" 
                style={foilStyle}
              />
            </div>
          </div>
        ) : (
          /* Imagen estándar para producto sellado */
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <img 
              src={product.image} 
              alt={product.name} 
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                transition: 'transform 0.5s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
        )}
      </div>

      {/* Información del Producto */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'between' }}>
        <div>
          {/* Categoría / Expansión */}
          <span style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 600,
            marginBottom: '4px',
            display: 'block'
          }}>
            {product.category === 'booster_box' && 'Booster Box'}
            {product.category === 'etb' && 'Elite Trainer Box'}
            {product.category === 'blister' && 'Blister Pack'}
            {product.category === 'accessory' && 'Accesorio'}
            {product.category === 'single' && (product.expansion || 'Carta Suelta')}
          </span>

          {/* Nombre del Producto */}
          <h3 
            onClick={() => onViewDetails(product)}
            style={{
              fontSize: '15px',
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: '6px',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              height: '40px',
              color: '#ffffff'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
          >
            {product.name}
          </h3>

          {/* Atributos de carta suelta (Idioma y Condición) */}
          {isSingle && (product.region || product.cardCondition) && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {product.region && (
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(96, 165, 250, 0.12)',
                  color: '#60a5fa',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  fontWeight: 700
                }}>
                  🌐 {product.region.split(' ')[0]}
                </span>
              )}
              {product.cardCondition && (
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  fontWeight: 700
                }}>
                  ✨ {product.cardCondition}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Precio e Interacciones */}
        <div style={{ marginTop: '12px' }}>
          {/* Fila de precio e inventario */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)' }}>
                  ${product.price.toLocaleString('es-MX')} MXN
                </span>
              </div>
              <div>
                {product.stock === 0 ? (
                  <span style={{ fontSize: '11px', color: '#ff6b6b', fontWeight: 700 }}>Agotado</span>
                ) : product.stock <= 3 ? (
                  <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>
                    ⚡ {product.stock} {product.stock === 1 ? 'última pieza' : 'últimas piezas'}
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#1ba24c', fontWeight: 600 }}>
                    {product.stock} disponibles
                  </span>
                )}
              </div>
            </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onViewDetails(product)}
              className="btn btn-secondary"
              style={{
                flexGrow: 1,
                padding: '8px 10px',
                fontSize: '12px'
              }}
              title="Ver Detalles"
            >
              <Eye size={14} /> Detalles
            </button>
            <button 
              onClick={() => onAddToCart(product)}
              disabled={product.stock === 0}
              className="btn btn-primary"
              style={{
                flexGrow: 2,
                padding: '8px 12px',
                fontSize: '12px',
                opacity: product.stock === 0 ? 0.5 : 1,
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ShoppingCart size={14} /> Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
