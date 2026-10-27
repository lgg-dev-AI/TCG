import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, Tag, ChevronRight, AlertCircle, Percent } from 'lucide-react';
import type { Product } from './ProductItem';

import type { Coupon } from './AdminPanel';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  discountPercent: number;
  onApplyDiscount: (percent: number) => void;
  coupons: Coupon[];
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  discountPercent,
  onApplyDiscount,
  coupons,
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isOpen) return null;

  // Cálculos
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const freeShippingThreshold = 1499;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingCost = subtotal > 0 && !isFreeShipping ? 199 : 0;
  const total = subtotal - discountAmount + shippingCost;
  
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    if (couponCode.trim() === '') {
      setCouponError('Por favor ingresa un código.');
      return;
    }

    const cleanCode = couponCode.trim().toUpperCase();
    const foundCoupon = coupons.find(c => c.code === cleanCode);

    if (foundCoupon) {
      if (foundCoupon.isActive) {
        onApplyDiscount(foundCoupon.discountPercent);
        setCouponSuccess(`¡Cupón ${foundCoupon.code} aplicado! ${foundCoupon.discountPercent}% de descuento en tu subtotal.`);
      } else {
        setCouponError('Este cupón ya no está activo.');
      }
    } else {
      setCouponError('Código inválido. Intenta con otro código.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(5, 5, 8, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 150,
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      {/* Clic fuera para cerrar */}
      <div 
        onClick={onClose} 
        style={{ flexGrow: 1, height: '100%', cursor: 'pointer' }} 
      />

      {/* Caja del Carrito */}
      <div 
        className="glass"
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111520',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Cabecera Carrito */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0 }}>Tu Carrito</h2>
            <span style={{
              fontSize: '11px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              padding: '2px 8px',
              borderRadius: '10px',
              color: 'var(--text-secondary)'
            }}>
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)} items
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo Carrito */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* Barra de envío gratis */}
          {subtotal > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {isFreeShipping ? '🎉 ¡Felicidades! Tienes Envío Gratis' : `Faltan $${remainingForFreeShipping.toLocaleString('es-MX')} MXN para envío gratis`}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                  ${subtotal.toLocaleString('es-MX')} / $1,499 MXN
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressToFreeShipping}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )}

          {/* Listado de items */}
          {cartItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '70%',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                Tu carrito está vacío
              </h3>
              <p style={{ fontSize: '13px', maxWidth: '280px', lineHeight: 1.4 }}>
                Explora nuestro catálogo de productos y agrega cajas de sobres o cartas a tu orden.
              </p>
              <button 
                onClick={onClose} 
                className="btn btn-primary"
                style={{ marginTop: '20px', padding: '8px 20px', fontSize: '13px' }}
              >
                Seguir Comprando
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartItems.map((item) => (
                <div 
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center'
                  }}
                >
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    style={{
                      width: '60px',
                      height: item.product.category === 'single' ? '84px' : '60px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      padding: '4px'
                    }}
                  />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'white',
                      margin: '0 0 4px 0',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.product.name}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      ${item.product.price.toLocaleString('es-MX')} MXN c/u
                    </span>
                    
                    {/* Interacciones cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          style={{ background: 'none', border: 'none', color: '#fff', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          -
                        </button>
                        <span style={{ color: '#fff', padding: '0 8px', fontSize: '12px', fontWeight: 700 }}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => onUpdateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                          style={{ background: 'none', border: 'none', color: '#fff', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--secondary)' }}>
                        ${(item.product.price * item.quantity).toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveItem(item.product.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', alignSelf: 'center', padding: '4px' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff3e3e'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie Carrito (Totales y Checkout) */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'rgba(5, 5, 8, 0.4)'
          }}>
            {/* Cupón */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <input
                  type="text"
                  placeholder="Cupón (ej. POKEMON2026)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px 12px 8px 32px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <Tag size={14} style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }} />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                Aplicar
              </button>
            </form>

            {couponError && (
              <p style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '-12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> {couponError}
              </p>
            )}
            {couponSuccess && (
              <p style={{ color: '#2ecc71', fontSize: '11px', marginTop: '-12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Percent size={12} /> {couponSuccess}
              </p>
            )}

            {/* Desglose */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString('es-MX')} MXN</span>
              </div>
              {discountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
                  <span>Descuento ({discountPercent}%):</span>
                  <span>-${discountAmount.toLocaleString('es-MX')} MXN</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Costo de Envío:</span>
                <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost} MXN`}</span>
              </div>
              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 800,
                color: 'white'
              }}>
                <span>Total:</span>
                <span style={{ color: 'var(--secondary)' }}>${total.toLocaleString('es-MX')} MXN</span>
              </div>
            </div>

            {/* Botón de Pago */}
            <button 
              onClick={onCheckout}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Proceder al Pago <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
