import { useState } from 'react';
import { ShoppingCart, Eye, Sparkles, Heart } from 'lucide-react';
import type { PokemonCard } from '../services/api';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'booster_box' | 'etb' | 'blister' | 'single' | 'accessory' | 'videogame';
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
  galleryImages?: string[];
  platform?: string; // Nintendo Switch, PS5, PS4, Xbox, Retro, etc.
  completeness?: string; // CIB (Completo en Caja), Solo Cartucho/Disco, Sellado
  isTournamentStaple?: boolean; // Carta clave para torneos competitivos
  isFirstEdition?: boolean; // 1ª Edición (1st Edition Stamp)
  subCategory?: string; // Subcategoría dinámica (ej: pokemon, switch, etc.)
  marketPrice?: number; // Precio de mercado TCGplayer en MXN
  marketPriceLow?: number;
  marketPriceHigh?: number;
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
  const [isHovered, setIsHovered] = useState(false);

  const isSingle = product.category === 'single';

  // Obtener clase de rareza para el brillo dorado de fondo
  const isRare = isSingle && 
    (product.pokemonCardData?.rarity?.toLowerCase().includes('rare') || 
     product.pokemonCardData?.rarity?.toLowerCase().includes('promo'));

  return (
    <div 
      className="glass product-card-hover" 
      style={{
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        border: product.isPromo 
          ? '1px solid var(--secondary)' 
          : isHovered 
            ? '1px solid rgba(255, 203, 5, 0.45)' 
            : '1px solid var(--border-color)',
        height: '100%',
        justifyContent: 'space-between',
        position: 'relative',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? (isRare || product.isPromo 
              ? '0 12px 28px rgba(0,0,0,0.6), 0 0 16px rgba(255, 203, 5, 0.22)' 
              : '0 12px 26px rgba(0,0,0,0.55), 0 0 12px rgba(255, 62, 62, 0.15)')
          : 'var(--shadow-sm)',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(product)}
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

      {/* Badge 1ª Edición (1st Edition Stamp) */}
      {product.isFirstEdition && (
        <span style={{
          position: 'absolute',
          top: product.isPromo ? '34px' : '12px',
          left: '12px',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          border: '1.5px solid #ffcb05',
          color: '#ffcb05',
          fontSize: '9px',
          fontWeight: 900,
          padding: '2px 7px',
          borderRadius: '6px',
          zIndex: 11,
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
        }}>
          ⭐ 1ª EDICIÓN
        </span>
      )}

      {/* Badge de Stock Bajo — Urgencia de compra */}
      {product.stock > 0 && product.stock <= 3 && (
        <span style={{
          position: 'absolute',
          top: (product.isPromo && product.isFirstEdition) ? '56px' : (product.isPromo || product.isFirstEdition) ? '34px' : '12px',
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

      {/* Badge de Fotos Reales de Integridad */}
      {product.galleryImages && product.galleryImages.length > 1 && (
        <span style={{
          position: 'absolute',
          top: '12px',
          right: '50px',
          background: 'rgba(6, 8, 12, 0.85)',
          border: '1px solid rgba(52, 211, 153, 0.5)',
          color: '#34d399',
          fontSize: '9px',
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: '10px',
          zIndex: 10,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          📸 {product.galleryImages.length} fotos
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
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '10px'
        }}
      >
        {isSingle ? (
          /* Presentación elegante y uniforme para carta coleccionable */
          <div 
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: '10px',
            }}
          >
            <img 
              src={product.image} 
              alt={product.name} 
              loading="lazy" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s ease',
                transform: isHovered ? 'scale(1.035)' : 'scale(1)',
                filter: isHovered 
                  ? (isRare ? 'drop-shadow(0 4px 12px rgba(255,203,5,0.35))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))') 
                  : 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
              }}
            />
            {/* Destello holográfico sutil en hover */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '8px',
                pointerEvents: 'none',
                opacity: isHovered ? 0.35 : 0,
                transition: 'opacity 0.3s ease',
                background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.4) 48%, rgba(255,203,5,0.3) 55%, transparent 70%)',
                backgroundSize: '200% 200%'
              }}
            />
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
            {product.category === 'videogame' && (product.platform ? `🎮 ${product.platform}` : '🎮 Videojuego')}
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

          {/* Atributos de Videojuego (Plataforma y Estado) */}
          {product.category === 'videogame' && (product.platform || product.completeness || product.cardCondition) && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {product.platform && (
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: product.platform.toLowerCase().includes('switch') ? 'rgba(230, 0, 18, 0.2)' : product.platform.toLowerCase().includes('playstation') ? 'rgba(0, 55, 145, 0.2)' : product.platform.toLowerCase().includes('xbox') ? 'rgba(16, 124, 65, 0.2)' : 'rgba(147, 51, 234, 0.2)',
                  color: product.platform.toLowerCase().includes('switch') ? '#ff5252' : product.platform.toLowerCase().includes('playstation') ? '#60a5fa' : product.platform.toLowerCase().includes('xbox') ? '#4ade80' : '#c084fc',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontWeight: 800
                }}>
                  🎮 {product.platform}
                </span>
              )}
              {(product.completeness || product.cardCondition) && (
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(52, 211, 153, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  fontWeight: 700
                }}>
                  📦 {product.completeness || product.cardCondition}
                </span>
              )}
            </div>
          )}

          {/* Atributos de carta suelta (Idioma, Condición y Edición) */}
          {isSingle && (product.region || product.cardCondition || product.isFirstEdition) && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {product.isFirstEdition && (
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 203, 5, 0.15)',
                  color: '#ffcb05',
                  border: '1px solid rgba(255, 203, 5, 0.4)',
                  fontWeight: 800
                }}>
                  ⭐ 1ª Edición
                </span>
              )}
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
          {(() => {
            const tcgMarketUsd = product.pokemonCardData?.tcgplayer?.prices?.holofoil?.market || product.pokemonCardData?.tcgplayer?.prices?.normal?.market;
            const effectiveMarketMxn = product.marketPrice || (tcgMarketUsd ? Math.round(tcgMarketUsd * 20) : null);
            const savingsPercent = effectiveMarketMxn && effectiveMarketMxn > product.price 
              ? Math.round(((effectiveMarketMxn - product.price) / effectiveMarketMxn) * 100) 
              : null;

            return (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)' }}>
                      ${product.price.toLocaleString('es-MX')} MXN
                    </span>
                    {savingsPercent && savingsPercent >= 5 && (
                      <span style={{
                        fontSize: '9.5px',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontWeight: 800
                      }}>
                        🔥 -{savingsPercent}%
                      </span>
                    )}
                  </div>
                  {effectiveMarketMxn && (
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                      Mkt: ${effectiveMarketMxn.toLocaleString('es-MX')} MXN
                    </span>
                  )}
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
            );
          })()}

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
