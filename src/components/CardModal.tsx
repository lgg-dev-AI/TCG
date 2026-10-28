import React, { useRef, useState } from 'react';
import { 
  X, ShoppingCart, ZoomIn, ShieldCheck, HelpCircle, 
  TrendingUp, FileText, Award, Plus, Minus
} from 'lucide-react';
import type { Product } from './ProductItem';
import MarketPriceHistory from './MarketPriceHistory';
import ConditionGuideModal from './ConditionGuideModal';

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
  const [isConditionGuideOpen, setIsConditionGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'details' | 'guarantee'>('market');
  
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

  const USD_TO_MXN = 20;
  const tcgPrices = cardData?.tcgplayer?.prices;
  const holo = tcgPrices?.holofoil || tcgPrices?.reverseHolofoil || tcgPrices?.normal;
  const marketMxn = product.marketPrice || (holo?.market ? Math.round(holo.market * USD_TO_MXN) : Math.round(product.price * 1.15));
  const priceDiffMxn = marketMxn - product.price;
  const discountPercent = marketMxn > 0 ? Math.round((priceDiffMxn / marketMxn) * 100) : 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 5, 8, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px',
    }}>
      {/* Modal Card Box */}
      <div 
        className="glass animate-fade-in-up" 
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          borderRadius: '18px',
          backgroundColor: '#0f141f',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
          overflowY: 'auto',
          position: 'relative',
          padding: '24px'
        }}
      >
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          aria-label="Cerrar detalles"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
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
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
        >
          <X size={18} />
        </button>

        {/* Layout en 2 Columnas Estilo TCGplayer Pro */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px',
          alignItems: 'start'
        }}>
          
          {/* COLUMNA IZQUIERDA: Visor de Carta 3D, Lupa y Galería */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            position: 'sticky',
            top: 0
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
                    maxWidth: '290px',
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
                      boxShadow: '0 20px 45px rgba(0,0,0,0.7)'
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
                      width: '140px',
                      height: '140px',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      border: '3px solid #ffcb05',
                      boxShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 12px rgba(255, 203, 5, 0.6)',
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
                    maxWidth: '300px',
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
                      maxHeight: '290px',
                      objectFit: 'contain'
                    }}
                  />
                  {zoomActive && zoomCoords.show && (
                    <div style={{
                      position: 'absolute',
                      top: `${zoomCoords.y}%`,
                      left: `${zoomCoords.x}%`,
                      width: '140px',
                      height: '140px',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      border: '3px solid #ffcb05',
                      boxShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 12px rgba(255, 203, 5, 0.6)',
                      pointerEvents: 'none',
                      backgroundImage: `url(${currentImage})`,
                      backgroundPosition: `${zoomCoords.x}% ${zoomCoords.y}%`,
                      backgroundSize: '280%',
                      zIndex: 60,
                      backgroundColor: '#000'
                    }} />
                  )}
                </div>
              )}
            </div>

            {/* Selector de Lupa y Verificación */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setZoomActive(!zoomActive)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: zoomActive ? 'rgba(255, 203, 5, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: zoomActive ? '1px solid #ffcb05' : '1px solid var(--border-color)',
                  color: zoomActive ? '#ffcb05' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                <ZoomIn size={14} />
                {zoomActive ? 'Lupa Activa (2.8x)' : 'Inspeccionar Detalles'}
              </button>

              {product.cardCondition && (
                <button
                  type="button"
                  onClick={() => setIsConditionGuideOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <HelpCircle size={13} />
                  Guía {product.cardCondition}
                </button>
              )}
            </div>

            {/* Miniaturas de Galería */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '300px', padding: '4px' }}>
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
                      border: activeImageIndex === i ? '2px solid #ffcb05' : '1px solid rgba(255,255,255,0.15)',
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

            {/* Badge de Garantía de Autenticidad */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '11px',
              color: '#34d399',
              fontWeight: 700
            }}>
              <ShieldCheck size={15} />
              <span>100% Auténtico Verificado PokéVault</span>
            </div>
          </div>

          {/* COLUMNA DERECHA: Datos del Producto, Compra y Pestañas */}
          <div>
            {/* Header: Badges y Título */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{
                fontSize: '10.5px',
                color: '#ffcb05',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.05em',
                background: 'rgba(255, 203, 5, 0.1)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                {product.category === 'single' ? 'Carta Suelta' : product.category === 'videogame' ? '🎮 Videojuego' : product.category === 'accessory' ? 'Accesorio' : 'Producto Sellado'}
              </span>

              {product.isFirstEdition && (
                <span style={{
                  fontSize: '10.5px',
                  color: '#ffcb05',
                  background: 'linear-gradient(135deg, rgba(255, 203, 5, 0.2), rgba(0, 0, 0, 0.4))',
                  border: '1.5px solid #ffcb05',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 900,
                  boxShadow: '0 0 8px rgba(255, 203, 5, 0.3)'
                }}>
                  ⭐ 1ª EDICIÓN
                </span>
              )}

              {product.region && (
                <span style={{
                  fontSize: '10.5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(96, 165, 250, 0.12)',
                  color: '#60a5fa',
                  border: '1px solid rgba(96, 165, 250, 0.25)',
                  fontWeight: 700
                }}>
                  🌐 {product.region}
                </span>
              )}

              {product.cardCondition && (
                <span style={{
                  fontSize: '10.5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(52, 211, 153, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  fontWeight: 700
                }}>
                  ✨ {product.cardCondition === 'NM' ? 'Near Mint (NM)' : product.cardCondition === 'LP' ? 'Lightly Played (LP)' : product.cardCondition}
                </span>
              )}
            </div>

            {/* Nombre del Producto */}
            <h2 style={{
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#ffffff',
              margin: '0 0 12px 0',
              fontFamily: 'var(--font-heading)'
            }}>
              {product.name}
            </h2>

            {/* Set y Rareza */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginBottom: '16px'
            }}>
              {product.expansion && <span><strong>Expansión:</strong> {product.expansion}</span>}
              {cardData?.rarity && <span><strong>Rareza:</strong> {cardData.rarity}</span>}
              {cardData?.artist && <span><strong>Arte:</strong> {cardData.artist}</span>}
              {product.platform && <span><strong>Plataforma:</strong> {product.platform}</span>}
            </div>

            {/* HERO PURCHASE BAR: Precio, Comparativa TCGplayer y Botón de Compra Directo */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Precio PokéVault:
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#ffcb05', lineHeight: 1 }}>
                    ${product.price.toLocaleString('es-MX')} MXN
                  </span>
                  {discountPercent > 0 && (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      fontWeight: 800
                    }}>
                      -{discountPercent}% vs TCGplayer
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  TCGplayer Market: <span style={{ color: '#93c5fd' }}>${marketMxn.toLocaleString('es-MX')} MXN</span>
                </div>
              </div>

              {/* Controles de Compra */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 10px',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      opacity: quantity <= 1 ? 0.3 : 1
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ padding: '0 8px', fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 10px',
                      cursor: quantity >= product.stock ? 'not-allowed' : 'pointer',
                      opacity: quantity >= product.stock ? 0.3 : 1
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  disabled={product.stock <= 0}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '8px'
                  }}
                >
                  <ShoppingCart size={16} />
                  {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                </button>
              </div>
            </div>

            {/* PESTAÑAS ESTILO TCGPLAYER PRO */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '4px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => setActiveTab('market')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'market' ? '2px solid #ffcb05' : '2px solid transparent',
                  color: activeTab === 'market' ? '#ffcb05' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'market' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <TrendingUp size={15} />
                <span>📈 Tendencias & Precios TCGplayer</span>
              </button>

              <button
                onClick={() => setActiveTab('details')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'details' ? '2px solid #ffcb05' : '2px solid transparent',
                  color: activeTab === 'details' ? '#ffcb05' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'details' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={15} />
                <span>🃏 Ficha Técnica & Ataques</span>
              </button>

              <button
                onClick={() => setActiveTab('guarantee')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'guarantee' ? '2px solid #ffcb05' : '2px solid transparent',
                  color: activeTab === 'guarantee' ? '#ffcb05' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'guarantee' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShieldCheck size={15} />
                <span>🛡️ Estado & Garantía</span>
              </button>
            </div>

            {/* CONTENIDO DE PESTAÑAS */}

            {/* TAB 1: GRÁFICA Y TENDENCIAS TCGPLAYER (FRONT AND CENTER) */}
            {activeTab === 'market' && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <MarketPriceHistory 
                  product={product} 
                  onOpenConditionGuide={() => setIsConditionGuideOpen(true)} 
                />
              </div>
            )}

            {/* TAB 2: DETALLES, ATAQUES Y REGLAS */}
            {activeTab === 'details' && (
              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                {/* Descripción general */}
                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '18px'
                }}>
                  {product.description || 'Sin descripción adicional para este producto.'}
                </p>

                {/* Ataques y Habilidades */}
                {isSingle && cardData?.attacks && cardData.attacks.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#fff', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 800 }}>
                      Ataques y Habilidades Oficiales
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cardData.attacks.map((attack, index) => (
                        <div key={index} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffffff' }}>{attack.name}</span>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffcb05' }}>{attack.damage || ''}</span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{attack.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ESTADO Y GARANTÍA */}
            {activeTab === 'guarantee' && (
              <div style={{
                animation: 'fadeIn 0.2s ease-out',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '10px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Award size={18} color="#ffcb05" />
                  <strong style={{ fontSize: '14px', color: '#fff' }}>Políticas de Calidad & Protección al Coleccionista</strong>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  En PokéVault cada carta o producto pasa por un riguroso proceso de autenticación visual y física para garantizar que recibes un artículo 100% original con envío protegido (micas sleeves + toploader rígido + sobre burbuja).
                </p>
                <button
                  onClick={() => setIsConditionGuideOpen(true)}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                >
                  <HelpCircle size={14} /> Abrir Guía Completa de Estados (NM, LP, MP, HP, DMG)
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal de Guía de Condiciones */}
      <ConditionGuideModal 
        isOpen={isConditionGuideOpen} 
        onClose={() => setIsConditionGuideOpen(false)} 
      />
    </div>
  );
}
