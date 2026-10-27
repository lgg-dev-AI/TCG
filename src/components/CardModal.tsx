import React, { useRef, useState } from 'react';
import { X, ShoppingCart, Info, ZoomIn, ShieldCheck } from 'lucide-react';
import type { Product } from './ProductItem';

interface CardModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function CardModal({ product, onClose, onAddToCart }: CardModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomCoords, setZoomCoords] = useState<{ x: number; y: number; show: boolean }>({ x: 50, y: 50, show: false });
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [foilStyle, setFoilStyle] = useState<React.CSSProperties>({});

  if (!product) return null;

  const allImages = product.galleryImages && product.galleryImages.length > 0 
    ? product.galleryImages 
    : [product.pokemonCardData?.images.large || product.image];
  const currentImage = allImages[activeImageIndex] || product.image;

  const isSingle = product.category === 'single';
  const cardData = product.pokemonCardData;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSingle || !cardRef.current) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const rotateX = ((y / h) - 0.5) * -25;
    const rotateY = ((x / w) - 0.5) * 25;
    const foilX = (x / w) * 100;
    const foilY = (y / h) * 100;

    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`,
      transition: 'transform 0.05s ease-out',
    });

    setFoilStyle({
      opacity: 0.7,
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 5, 8, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px',
    }}>
      {/* Modal Card Box */}
      <div 
        className="glass animate-fade-in-up" 
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          borderRadius: '16px',
          backgroundColor: '#121622',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'var(--shadow-lg)',
          overflowY: 'auto',
          position: 'relative',
          padding: '30px'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Cerrar detalles"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        >
          <X size={18} />
        </button>

        {/* Contenido Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '30px',
          alignItems: 'center',
        }} className="modal-content-grid">
          
          {/* Lado Izquierdo: Visual (Carta en 3D o producto sellado) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              perspective: '1000px',
              width: '100%',
              position: 'relative'
            }}>
              {isSingle ? (
                <div 
                  className="card-3d-wrapper"
                  onMouseMove={(e) => {
                    handleMouseMove(e);
                    if (zoomActive) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                      setZoomCoords({ x: xPercent, y: yPercent, show: true });
                    }
                  }}
                  onMouseLeave={() => {
                    handleMouseLeave();
                    setZoomCoords(prev => ({ ...prev, show: false }));
                  }}
                  style={{
                    maxWidth: '300px',
                    width: '100%',
                    aspectRatio: '2.5 / 3.5',
                    position: 'relative',
                    cursor: zoomActive ? 'crosshair' : 'default'
                  }}
                >
                  <div 
                    className="card-3d rare-glow"
                    ref={cardRef}
                    style={{
                      ...tiltStyle,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                    }}
                  >
                    <img src={currentImage} alt={product.name} />
                    <div className="card-foil-overlay" style={foilStyle} />
                  </div>

                  {/* Lupa Magnificadora de Inspección (2.8x) */}
                  {zoomActive && zoomCoords.show && (
                    <div style={{
                      position: 'absolute',
                      top: `${zoomCoords.y}%`,
                      left: `${zoomCoords.x}%`,
                      width: '130px',
                      height: '130px',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      border: '3px solid var(--secondary)',
                      boxShadow: '0 0 25px rgba(0,0,0,0.9), 0 0 10px rgba(255, 203, 5, 0.5)',
                      pointerEvents: 'none',
                      backgroundImage: `url(${currentImage})`,
                      backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`,
                      backgroundSize: '280%',
                      zIndex: 60,
                      backgroundColor: '#000'
                    }} />
                  )}
                </div>
              ) : (
                <div 
                  onMouseMove={(e) => {
                    if (zoomActive) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                      setZoomCoords({ x: xPercent, y: yPercent, show: true });
                    }
                  }}
                  onMouseLeave={() => setZoomCoords(prev => ({ ...prev, show: false }))}
                  style={{
                    maxWidth: '320px',
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: zoomActive ? 'crosshair' : 'default'
                  }}
                >
                  <img 
                    src={currentImage} 
                    alt={product.name} 
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain'
                    }}
                  />
                  {zoomActive && zoomCoords.show && (
                    <div style={{
                      position: 'absolute',
                      top: `${zoomCoords.y}%`,
                      left: `${zoomCoords.x}%`,
                      width: '130px',
                      height: '130px',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      border: '3px solid var(--secondary)',
                      boxShadow: '0 0 25px rgba(0,0,0,0.9), 0 0 10px rgba(255, 203, 5, 0.5)',
                      pointerEvents: 'none',
                      backgroundImage: `url(${currentImage})`,
                      backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`,
                      backgroundSize: '260%',
                      zIndex: 60,
                      backgroundColor: '#000'
                    }} />
                  )}
                </div>
              )}
            </div>

            {/* Botón Lupa de Inspección y Estado de Foto */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
              <button
                type="button"
                onClick={() => setZoomActive(!zoomActive)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: zoomActive ? 'rgba(255, 203, 5, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  border: zoomActive ? '1px solid var(--secondary)' : '1px solid var(--border-color)',
                  color: zoomActive ? 'var(--secondary)' : 'var(--text-secondary)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <ZoomIn size={13} />
                {zoomActive ? 'Lupa Activa (2.8x Zoom)' : '🔍 Activar Lupa de Inspección'}
              </button>

              {activeImageIndex > 0 ? (
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                  ✓ Foto real #{activeImageIndex} (Esquinas / Superficie)
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {allImages.length > 1 ? 'Portada oficial (Selecciona fotos abajo para ver estado real)' : 'Foto de catálogo'}
                </span>
              )}
            </div>

            {/* Selector de Galería de Fotos (Fotos Reales de Integridad) */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '320px', padding: '4px' }}>
                {allImages.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    style={{
                      width: '46px',
                      height: '60px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: activeImageIndex === i ? '2px solid var(--secondary)' : '1px solid rgba(255,255,255,0.15)',
                      padding: 0,
                      background: 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: activeImageIndex === i ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={imgUrl} alt={`Vista ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lado Derecho: Información */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              {/* Categoría / Set */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--secondary)',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  background: 'rgba(255, 203, 5, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '20px'
                }}>
                  {product.category === 'single' ? 'Carta Suelta' : product.category === 'videogame' ? '🎮 Videojuego / Consola' : product.category === 'accessory' ? 'Accesorio' : 'Producto Sellado'}
                </span>
                {isSingle && cardData?.types && cardData.types.map(t => (
                  <span key={t} className={`type-badge type-${t.toLowerCase()}`}>
                    {t}
                  </span>
                ))}
              </div>

              {/* Título */}
              <h2 style={{
                fontSize: '24px',
                fontWeight: 800,
                lineHeight: 1.2,
                color: '#ffffff',
                marginBottom: '10px',
                fontFamily: 'var(--font-heading)'
              }}>
                {product.name}
              </h2>

              {/* Atributos de Videojuegos */}
              {product.category === 'videogame' && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  {product.platform && (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: product.platform.toLowerCase().includes('switch') ? 'rgba(230, 0, 18, 0.2)' : product.platform.toLowerCase().includes('playstation') ? 'rgba(0, 55, 145, 0.25)' : product.platform.toLowerCase().includes('xbox') ? 'rgba(16, 124, 65, 0.25)' : 'rgba(147, 51, 234, 0.2)',
                      color: product.platform.toLowerCase().includes('switch') ? '#ff5252' : product.platform.toLowerCase().includes('playstation') ? '#60a5fa' : product.platform.toLowerCase().includes('xbox') ? '#4ade80' : '#c084fc',
                      border: '1px solid rgba(255,255,255,0.2)',
                      fontWeight: 800
                    }}>
                      🎮 Plataforma: {product.platform}
                    </span>
                  )}
                  {(product.completeness || product.cardCondition) && (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(52, 211, 153, 0.12)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      fontWeight: 700
                    }}>
                      📦 Estado: {product.completeness || product.cardCondition}
                    </span>
                  )}
                  <span style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    fontWeight: 600
                  }}>
                    ⚡ Probado y Funcionando 100%
                  </span>
                </div>
              )}

              {/* Expansión / Rarity / Artista */}
              {isSingle && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px'
                }}>
                  <span><strong>Set:</strong> {cardData?.id.split('-')[0].toUpperCase()}</span>
                  <span><strong>Rareza:</strong> {cardData?.rarity || 'Común'}</span>
                  {cardData?.artist && <span><strong>Artista:</strong> {cardData.artist}</span>}
                </div>
              )}

              {/* Atributos Físicos de Carta Suelta */}
              {isSingle && (product.region || product.cardCondition || product.pulledFrom) && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  {product.region && (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(96, 165, 250, 0.12)',
                      color: '#60a5fa',
                      border: '1px solid rgba(96, 165, 250, 0.25)',
                      fontWeight: 700
                    }}>
                      🌐 Idioma: {product.region}
                    </span>
                  )}
                  {product.cardCondition && (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontWeight: 700
                    }}>
                      ✨ Condición: {product.cardCondition === 'NM' ? 'Near Mint (NM)' : product.cardCondition === 'LP' ? 'Lightly Played (LP)' : product.cardCondition === 'MP' ? 'Moderately Played (MP)' : 'Heavily Played (HP)'}
                    </span>
                  )}
                  {product.pulledFrom && (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      fontWeight: 600
                    }}>
                      📦 Sobre: {product.pulledFrom}
                    </span>
                  )}
                </div>
              )}

              {/* Descripción */}
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '24px'
              }}>
                {product.description}
              </p>

              {/* Estadísticas de TCG (Si es una carta) */}
              {isSingle && cardData?.attacks && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#fff', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 700 }}>
                    Ataques y Habilidades
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cardData.attacks.map((attack, index) => (
                      <div key={index} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>{attack.name}</span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--secondary)' }}>{attack.damage || ''}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{attack.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Precios de Referencia Mercado (TCGPlayer) */}
              {isSingle && cardData?.tcgplayer?.prices && (
                <div style={{
                  backgroundColor: 'rgba(42, 117, 211, 0.08)',
                  border: '1px solid rgba(42, 117, 211, 0.25)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', marginBottom: '8px' }}>
                    <Info size={16} style={{ color: 'var(--accent-blue)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Precios de Referencia del Mercado (USD / TCGPlayer)
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bajo</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                        ${(cardData.tcgplayer.prices.holofoil?.low || cardData.tcgplayer.prices.normal?.low || 1).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mercado</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>
                        ${(cardData.tcgplayer.prices.holofoil?.market || cardData.tcgplayer.prices.normal?.market || 2).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Alto</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                        ${(cardData.tcgplayer.prices.holofoil?.high || cardData.tcgplayer.prices.normal?.high || 3).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fila de Compra */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '20px',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Precio PokéVault:</span>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1 }}>
                  ${product.price.toLocaleString('es-MX')} MXN
                </span>
              </div>

              {/* Selector de cantidad y agregar */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ background: 'none', border: 'none', color: '#fff', width: '32px', height: '36px', cursor: 'pointer', fontSize: '16px' }}
                  >
                    -
                  </button>
                  <span style={{ color: '#fff', padding: '0 12px', fontSize: '14px', fontWeight: 700 }}>
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    style={{ background: 'none', border: 'none', color: '#fff', width: '32px', height: '36px', cursor: 'pointer', fontSize: '16px' }}
                  >
                    +
                  </button>
                </div>

                <button 
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  disabled={product.stock === 0}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 24px',
                    opacity: product.stock === 0 ? 0.5 : 1,
                    cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ShoppingCart size={16} /> Agregar al Carrito
                </button>
              </div>
            </div>

            {/* Sello de Garantía de Coleccionista y Empaque Seguro */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(52, 211, 153, 0.05)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginTop: '16px'
            }}>
              <ShieldCheck size={22} color="#34d399" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <strong style={{ color: '#34d399' }}>Garantía de Coleccionista PokéVault:</strong> Cada carta se envía protegida con <b>Sleeve Ultra-Pro + Toploader rígido</b> dentro de sobre burbuja blindado contra dobleces.
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .modal-content-grid {
            grid-template-columns: 320px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
