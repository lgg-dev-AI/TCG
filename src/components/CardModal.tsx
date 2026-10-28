import React, { useRef, useState } from 'react';
import { 
  X, ShoppingCart, ZoomIn, ShieldCheck, HelpCircle, 
  TrendingUp, FileText, Award, Plus, Minus, PackageCheck
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
  const [activeTab, setActiveTab] = useState<'prices_trends' | 'attacks_tech' | 'condition_guarantee'>('prices_trends');
  
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

    const rotateX = ((y / h) - 0.5) * -22;
    const rotateY = ((x / w) - 0.5) * 22;
    const foilX = (x / w) * 100;
    const foilY = (y / h) * 100;

    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
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
      {/* Modal Card Box Widescreen */}
      <div 
        className="glass animate-fade-in-up" 
        style={{
          width: '96vw',
          maxWidth: '1240px',
          maxHeight: '92vh',
          borderRadius: '18px',
          backgroundColor: '#0c1017',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
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

        {/* Layout en 3 Columnas Horizontal en Computadora */}
        <div className="card-modal-three-columns">
          
          {/* ========================================================= */}
          {/* COLUMNA 1 (IZQUIERDA): La Carta Centrada Vertical & Horizontal */}
          {/* ========================================================= */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '14px',
            height: '100%',
            padding: '10px'
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
                    maxWidth: '280px',
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
                      width: '135px',
                      height: '135px',
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
                    maxWidth: '280px',
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    padding: '16px',
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
                      maxHeight: '270px',
                      objectFit: 'contain'
                    }}
                  />
                  {zoomActive && zoomCoords.show && (
                    <div style={{
                      position: 'absolute',
                      top: `${zoomCoords.y}%`,
                      left: `${zoomCoords.x}%`,
                      width: '135px',
                      height: '135px',
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
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setZoomActive(!zoomActive)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: zoomActive ? 'rgba(255, 203, 5, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: zoomActive ? '1px solid #ffcb05' : '1px solid var(--border-color)',
                  color: zoomActive ? '#ffcb05' : 'var(--text-secondary)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                <ZoomIn size={13} />
                {zoomActive ? 'Lupa Activa (2.8x)' : 'Inspeccionar Carta'}
              </button>

              {product.cardCondition && (
                <button
                  type="button"
                  onClick={() => setIsConditionGuideOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <HelpCircle size={12} />
                  Estado: {product.cardCondition}
                </button>
              )}
            </div>

            {/* Miniaturas de Galería */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '270px', padding: '2px' }}>
                {allImages.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    style={{
                      width: '42px',
                      height: '56px',
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

            {/* Sello de Autenticidad */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '10.5px',
              color: '#34d399',
              fontWeight: 700
            }}>
              <ShieldCheck size={14} />
              <span>Auténtico Verificado PokéVault</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMNA 2 (EN MEDIO): Información de la Tarjeta & Compra  */}
          {/* ========================================================= */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 20px',
            height: '100%'
          }} className="card-modal-center-col">
            <div>
              {/* Badges de Categoría, 1ª Edición, Idioma */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '10px',
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
                    fontSize: '10px',
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
                    fontSize: '10px',
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
                    fontSize: '10px',
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

              {/* Nombre de la Carta */}
              <h2 style={{
                fontSize: '21px',
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#ffffff',
                margin: '0 0 10px 0',
                fontFamily: 'var(--font-heading)'
              }}>
                {product.name}
              </h2>

              {/* Ficha rápida de Set, Rareza y Artista */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                marginBottom: '14px',
                padding: '8px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {product.expansion && <span><strong>Expansión:</strong> {product.expansion}</span>}
                {cardData?.rarity && <span><strong>Rareza:</strong> {cardData.rarity}</span>}
                {cardData?.artist && <span><strong>Arte:</strong> {cardData.artist}</span>}
                {product.platform && <span><strong>Plataforma:</strong> {product.platform}</span>}
              </div>

              {/* Descripción */}
              <p style={{
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: '16px'
              }}>
                {product.description || 'Carta y artículo original de colección verificado y en resguardo.'}
              </p>
            </div>

            {/* BLOQUE DE PRECIO POKÉVAULT & BOTÓN DE COMPRA */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '12px'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Precio PokéVault:
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#ffcb05', lineHeight: 1 }}>
                    ${product.price.toLocaleString('es-MX')} MXN
                  </span>
                  {discountPercent > 0 && (
                    <span style={{
                      fontSize: '10.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      fontWeight: 800
                    }}>
                      -{discountPercent}% vs Mercado
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Valor de Mercado Ref: <span style={{ color: '#93c5fd', fontWeight: 700 }}>${marketMxn.toLocaleString('es-MX')} MXN</span>
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
                    <Minus size={13} />
                  </button>
                  <span style={{ padding: '0 8px', fontWeight: 700, fontSize: '13px', color: '#fff' }}>
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
                    <Plus size={13} />
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
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 800,
                    borderRadius: '8px'
                  }}
                >
                  <ShoppingCart size={15} />
                  {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                </button>
              </div>

              {/* Mensaje de envío seguro para coleccionistas */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginTop: '10px'
              }}>
                <PackageCheck size={13} color="#ffcb05" />
                <span>Envío protegido en mica suave + toploader rígido.</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMNA 3 (DERECHA): Precios y Tendencias, Ficha Técnica, Garantía */}
          {/* ========================================================= */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minWidth: 0
          }}>
            {/* PESTAÑAS (Exact Wording: Precios y Tendencias) */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '4px',
              marginBottom: '14px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}>
              <button
                onClick={() => setActiveTab('prices_trends')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'prices_trends' ? '2px solid #ffcb05' : '2px solid transparent',
                  color: activeTab === 'prices_trends' ? '#ffcb05' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'prices_trends' ? 800 : 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <TrendingUp size={14} />
                <span>Precios y Tendencias</span>
              </button>

              <button
                onClick={() => setActiveTab('attacks_tech')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'attacks_tech' ? '2px solid #ffcb05' : '2px solid transparent',
                  color: activeTab === 'attacks_tech' ? '#ffcb05' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'attacks_tech' ? 800 : 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <FileText size={14} />
                <span>Ficha Técnica y Ataques</span>
              </button>

              <button
                onClick={() => setActiveTab('condition_guarantee')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'condition_guarantee' ? '2px solid #ffcb05' : '2px solid transparent',
                  color: activeTab === 'condition_guarantee' ? '#ffcb05' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'condition_guarantee' ? 800 : 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <ShieldCheck size={14} />
                <span>Estado y Garantía</span>
              </button>
            </div>

            {/* CONTENEDOR DE PESTAÑAS CON SCROLL INDEPENDIENTE */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: 'calc(92vh - 120px)',
              paddingRight: '4px'
            }}>
              {/* TAB 1: PRECIOS Y TENDENCIAS */}
              {activeTab === 'prices_trends' && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <MarketPriceHistory 
                    product={product} 
                    onOpenConditionGuide={() => setIsConditionGuideOpen(true)} 
                  />
                </div>
              )}

              {/* TAB 2: FICHA TÉCNICA Y ATAQUES */}
              {activeTab === 'attacks_tech' && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  {isSingle && cardData?.attacks && cardData.attacks.length > 0 ? (
                    <div>
                      <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#fff', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontWeight: 800 }}>
                        Ataques y Habilidades Oficiales
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cardData.attacks.map((attack, index) => (
                          <div key={index} style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffffff' }}>{attack.name}</span>
                              <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffcb05' }}>{attack.damage || ''}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{attack.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <FileText size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '12.5px' }}>
                        {product.category === 'videogame' 
                          ? `Videojuego probado para plataforma ${product.platform || 'N/A'}. Funcionando al 100%.` 
                          : 'Este producto no cuenta con ataques o habilidades de juego de cartas.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ESTADO Y GARANTÍA */}
              {activeTab === 'condition_guarantee' && (
                <div style={{
                  animation: 'fadeIn 0.2s ease-out',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Award size={18} color="#ffcb05" />
                    <strong style={{ fontSize: '13.5px', color: '#fff' }}>Políticas de Calidad & Protección PokéVault</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                    Cada artículo pasa por una estricta inspección óptica de bordes, esquinas, superficie y centrado para garantizar autenticidad total sin sorpresas.
                  </p>
                  <button
                    onClick={() => setIsConditionGuideOpen(true)}
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', padding: '7px 12px' }}
                  >
                    <HelpCircle size={13} /> Abrir Guía Visual de Estados (NM / LP / MP / HP)
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Guía de Condiciones */}
      <ConditionGuideModal 
        isOpen={isConditionGuideOpen} 
        onClose={() => setIsConditionGuideOpen(false)} 
      />

      {/* Estilos Responsivos para 3 Columnas Horizontales en Computadora */}
      <style>{`
        .card-modal-three-columns {
          display: grid;
          grid-template-columns: 290px 330px 1fr;
          gap: 20px;
          align-items: stretch;
        }

        @media (max-width: 1024px) {
          .card-modal-three-columns {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .card-modal-center-col {
            border-left: none !important;
            border-right: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
