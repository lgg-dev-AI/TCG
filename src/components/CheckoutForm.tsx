import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, ChevronLeft, Loader2, AlertCircle, Store, Lock } from 'lucide-react';
import type { CartItem } from './CartDrawer';
import type { Order } from './AdminPanel';
import type { UserData } from './AccountPanel';
import type { Product } from './ProductItem';
import { apiCheckout, apiUpdateProfile } from '../api';

interface CheckoutFormProps {
  cartItems: CartItem[];
  discountPercent: number;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: string | null;
  userData: UserData | null;
  onPlaceOrder: (order: Order) => void;
  bankSettings: {
    bankName: string;
    clabe: string;
    accountNumber: string;
    beneficiary: string;
    whatsapp?: string;
    stripeActive?: string;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    paypalClientId?: string;
    paypalActive?: string;
  };
  inventory: Product[];
}

export default function CheckoutForm({
  cartItems,
  discountPercent,
  onClose,
  onSuccess,
  currentUser,
  userData,
  onPlaceOrder,
  bankSettings,
  inventory,
}: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [simulatedEmail, setSimulatedEmail] = useState<any>(null);

  // Estados Formulario Envío
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(currentUser || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [address, setAddress] = useState(userData?.address?.street || '');
  const [city, setCity] = useState(userData?.address?.city || '');
  const [state, setState] = useState(userData?.address?.state || '');
  const [zip, setZip] = useState(userData?.address?.zipCode || '');
  
  // Métodos de Pago
  const [paymentMethod, setPaymentMethod] = useState<'Stripe' | 'Efectivo' | 'PayPal'>('Stripe');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [orderNumber, setOrderNumber] = useState('');

  // Auto-completar datos si el usuario inicia sesión o ya estaba logueado
  useEffect(() => {
    if (currentUser) setEmail(currentUser);
    if (userData) {
      if (userData.name) setName(userData.name);
      if (userData.phone) setPhone(userData.phone);
      if (userData.address?.street) setAddress(userData.address.street);
      if (userData.address?.city) setCity(userData.address.city);
      if (userData.address?.state) setState(userData.address.state);
      if (userData.address?.zipCode) setZip(userData.address.zipCode);
    }
  }, [currentUser, userData]);

  // Totales
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const isFreeShipping = subtotal >= 1499;
  const shippingCost = subtotal > 0 && !isFreeShipping ? 199 : 0;
  const total = subtotal - discountAmount + shippingCost;

  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const isFormValid = name.trim().length > 0 &&
                      email.trim().length > 0 &&
                      phone.trim().length >= 10 &&
                      address.trim().length > 0 &&
                      city.trim().length > 0 &&
                      state.trim().length > 0 &&
                      zip.trim().length === 5;

  useEffect(() => {
    if (paymentMethod !== 'PayPal') return;
    
    // Check if script is already loaded
    if ((window as any).paypal) {
      setPaypalLoaded(true);
      return;
    }

    const clientId = bankSettings.paypalClientId?.trim() || 'test'; // Use sandbox by default
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=MXN&disable-funding=card,credit,paylater`;
    script.async = true;
    script.onload = () => {
      setPaypalLoaded(true);
    };
    script.onerror = () => {
      setErrorMessage('Error al cargar la pasarela de PayPal. Intente más tarde.');
    };
    document.body.appendChild(script);
  }, [paymentMethod, bankSettings]);

  useEffect(() => {
    if (paymentMethod === 'PayPal' && paypalLoaded && (window as any).paypal) {
      // Clear container first in case of re-renders
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
      }
      
      (window as any).paypal.Buttons({
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'MXN',
                value: total.toString()
              },
              description: `Pedido en PokéVault por $${total} MXN`
            }]
          });
        },
        onApprove: async (_data: any, actions: any) => {
          setLoading(true);
          try {
            const details = await actions.order.capture();
            const transactionId = details.id;
            
            // Execute checkout
            const items = cartItems.map(item => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity
            }));
            
            const res = await apiCheckout(items, 'PayPal', transactionId, {
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              address: {
                street: address.trim(),
                city: city.trim(),
                state: state.trim(),
                zipCode: zip.trim()
              },
              total: total,
              discountApplied: discountPercent
            });
            setOrderNumber(res.orderId);
            setSimulatedEmail(res.simulatedEmail);

            // Update user shipping details locally/on database
            if (currentUser) {
              try {
                const nameParts = name.trim().split(/\s+/);
                const first = nameParts[0] || '';
                const last = nameParts.slice(1).join(' ') || '';
                await apiUpdateProfile({
                  name: first,
                  lastName: last,
                  phone: phone.trim(),
                  address: {
                    street: address.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    zipCode: zip.trim()
                  }
                });
              } catch (profileErr) {
                console.error('Error syncing profile details on checkout:', profileErr);
              }
            }

            // Sync with admin dashboard
            const legacyOrder: Order = {
              id: res.orderId,
              customerEmail: email.trim(),
              customerName: name.trim(),
              items: cartItems.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                image: item.product.image
              })),
              total: total,
              discountApplied: discountPercent,
              status: 'PAGADO', // Set as paid immediately!
              date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
              address: {
                street: address.trim(),
                city: city.trim(),
                state: state.trim(),
                zipCode: zip.trim()
              },
              paymentMethod: 'PayPal',
              tracking_number: `PAYPAL - ID: ${transactionId}`
            };
            onPlaceOrder(legacyOrder);
            onSuccess();
            setCompleted(true);
          } catch (err: any) {
            setErrorMessage(err.message || 'Error al procesar el pago con PayPal');
          } finally {
            setLoading(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal Smart Buttons Error:', err);
          setErrorMessage('Hubo un error con la transacción de PayPal. Por favor intente de nuevo.');
        }
      }).render('#paypal-button-container');
    }
  }, [paymentMethod, paypalLoaded, total]);

  // Manejadores de formateo para tarjeta Stripe
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  const handleCardCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setErrorMessage('Por favor, rellena todos los campos de contacto y envío.');
      return;
    }

    // Validación de tarjeta Stripe
    if (paymentMethod === 'Stripe') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Por favor introduce un número de tarjeta válido (16 dígitos).');
        return;
      }
      if (!cardName.trim()) {
        setErrorMessage('Por favor introduce el nombre del titular como aparece en la tarjeta.');
        return;
      }
      if (cardExpiry.length !== 5) {
        setErrorMessage('Por favor introduce una fecha de expiración válida (MM/AA).');
        return;
      }
      if (cardCvc.length < 3) {
        setErrorMessage('Por favor introduce el código de seguridad (CVC).');
        return;
      }
    }

    // Validación de stock final
    let hasStockError = false;
    for (const item of cartItems) {
      const currentProduct = inventory.find(p => p.id === item.product.id);
      if (!currentProduct) continue;
      if (currentProduct.stock < item.quantity) {
        setErrorMessage(`Lo sentimos, el producto "${item.product.name}" solo tiene ${currentProduct.stock} pzas disponibles.`);
        hasStockError = true;
        break;
      }
    }
    if (hasStockError) return;

    setLoading(true);

    const items = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    apiCheckout(items, paymentMethod, undefined, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: {
        street: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zip.trim()
      },
      total: total,
      discountApplied: discountPercent,
      bankDetails: bankSettings
    })
      .then(async (res) => {
        setOrderNumber(res.orderId);
        setSimulatedEmail(res.simulatedEmail);
        
        // Actualizar perfil de envío en el backend automáticamente
        if (currentUser) {
          try {
            const nameParts = name.trim().split(/\s+/);
            const first = nameParts[0] || '';
            const last = nameParts.slice(1).join(' ') || '';
            await apiUpdateProfile({
              name: first,
              lastName: last,
              phone: phone.trim(),
              address: {
                street: address.trim(),
                city: city.trim(),
                state: state.trim(),
                zipCode: zip.trim()
              }
            });
          } catch (profileErr) {
            console.error('Error syncing profile details on checkout:', profileErr);
          }
        }

        // Crear objeto orden sincronizado con el admin panel frontal
        const legacyOrder: Order = {
          id: res.orderId,
          customerEmail: email.trim(),
          customerName: name.trim(),
          items: cartItems.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image
          })),
          total: total,
          discountApplied: discountPercent,
          status: paymentMethod === 'Stripe' ? 'PAGADO' : 'Pendiente',
          date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
          address: {
            street: address.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zip.trim()
          },
          paymentMethod: paymentMethod,
          paymentReceipt: undefined,
          paymentReceiptName: undefined,
        };
        onPlaceOrder(legacyOrder);
        onSuccess(); // Limpiar el carrito de compras
        setCompleted(true);
      })
      .catch((err: any) => {
        setErrorMessage(err.message || 'Error al procesar el checkout');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: '20px 0 60px 0', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Botón Volver */}
      {!completed && (
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '24px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ChevronLeft size={16} /> Volver a la Tienda
        </button>
      )}

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(255, 62, 62, 0.1)',
          border: '1px solid rgba(255, 62, 62, 0.3)',
          color: '#ff6b6b',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      )}

      {completed ? (
        /* Pantalla de Éxito */
        <div className="glass" style={{
          padding: '40px 30px',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid rgba(27, 162, 76, 0.3)',
          background: 'linear-gradient(135deg, rgba(17, 21, 32, 0.95) 0%, rgba(13, 28, 20, 0.95) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div>
            <CheckCircle2 size={64} style={{ color: '#1ba24c', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
              ¡Tu Compra ha sido Registrada!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', marginInline: 'auto', lineHeight: 1.6 }}>
              Gracias por tu compra, <strong>{name}</strong>. Hemos registrado tu pedido con el número de orden <strong>{orderNumber}</strong> y se ha enviado una confirmación a tu correo <strong style={{ color: '#ffcb05' }}>{email}</strong>.
            </p>
          </div>

          {/* Simulador de Correo Webmail */}
          {simulatedEmail && (
            <div style={{ 
              width: '100%', 
              maxWidth: '650px', 
              textAlign: 'left',
              marginInline: 'auto',
              marginTop: '10px'
            }}>
              <span style={{ fontSize: '11px', color: '#ffcb05', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
                ✉️ Correo de Confirmación Recibido (Simulado)
              </span>
              
              <div style={{
                border: '1px solid #1a2233',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#111522',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                {/* Cabecera Navegador */}
                <div style={{
                  backgroundColor: '#161b2c',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid #1a2233'
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff5f56', display: 'inline-block' }}></span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffbd2e', display: 'inline-block' }}></span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#27c93f', display: 'inline-block' }}></span>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(6, 8, 12, 0.4)',
                    color: 'var(--text-secondary)',
                    fontSize: '10px',
                    padding: '3px 12px',
                    borderRadius: '6px',
                    marginLeft: '20px',
                    flex: '1',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                  }}>
                    mail.pokevault.mx/orders/{orderNumber}
                  </div>
                </div>

                {/* Cabecera Correo */}
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #1a2233',
                  backgroundColor: '#131828',
                  fontSize: '12.5px'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>De:</span> <span style={{ color: 'white' }}>PokéVault Pedidos &lt;{simulatedEmail.from}&gt;</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Asunto:</span> <span style={{ color: 'white', fontWeight: 700 }}>{simulatedEmail.subject}</span>
                  </div>
                </div>

                {/* Cuerpo del Correo */}
                <div style={{
                  padding: '24px 20px',
                  backgroundColor: '#0e1118',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: simulatedEmail.html }} />
                </div>
              </div>
            </div>
          )}

          {/* Resumen e información complementaria según método */}
          {paymentMethod === 'Stripe' && (
            <div style={{
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              padding: '20px 24px',
              textAlign: 'left',
              width: '100%',
              maxWidth: '500px',
              marginInline: 'auto'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💳</span> Pago Confirmado con Tarjeta (Stripe)
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Tu cobro de <strong>${total.toLocaleString('es-MX')} MXN</strong> fue procesado y validado de forma instantánea con Stripe. Tu pedido ya está marcado como <strong style={{ color: '#4ade80' }}>PAGADO</strong> y tus artículos han sido descontados del inventario.
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'white', marginBottom: '4px' }}>
                Dirección de Envío:
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                {address} <br />
                Col. {city}, {state}, CP {zip} <br />
                México
              </p>
            </div>
          )}

          {paymentMethod === 'Efectivo' && (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px 24px',
              textAlign: 'left',
              width: '100%',
              maxWidth: '500px',
              marginInline: 'auto'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'white', marginBottom: '8px' }}>
                Dirección de Entrega / Sucursal:
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {address} <br />
                Col. {city}, {state}, CP {zip} <br />
                México
              </p>

              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'white', marginBottom: '8px' }}>
                Total a pagar al recoger:
              </h4>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)' }}>
                ${total.toLocaleString('es-MX')} MXN
              </span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                * Tu pedido estará reservado por un lapso de 48 horas en sucursal.
              </p>
            </div>
          )}

          {paymentMethod === 'PayPal' && (
            <div style={{
              backgroundColor: 'rgba(0,112,186,0.05)',
              border: '1px solid rgba(0,112,186,0.25)',
              borderRadius: '12px',
              padding: '20px 24px',
              textAlign: 'left',
              width: '100%',
              maxWidth: '500px',
              marginInline: 'auto'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💳</span> Pago Confirmado vía PayPal
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Tu pago ha sido capturado de forma automática y el pedido ya se encuentra marcado como <strong>PAGADO</strong>. Estamos preparando tus artículos para el envío.
              </p>
              
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'white', marginBottom: '4px' }}>
                Dirección de Envío:
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                {address} <br />
                Col. {city}, {state}, CP {zip} <br />
                México
              </p>
            </div>
          )}

          <button onClick={onClose} className="btn btn-primary" style={{ padding: '12px 40px', fontWeight: 700, fontSize: '14px' }}>
            Volver a la Tienda
          </button>
        </div>
      ) : (
        /* Formulario de Checkout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '30px',
        }} className="checkout-layout">
          
          {/* Lado Izquierdo: Formularios de Envío y Pago */}
          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Datos Personales y de Envío */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                1. Datos de Contacto y Envío
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Luis Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-mobile-1col">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Teléfono de Contacto (10 dígitos)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="5512345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Dirección (Calle, Número, Colonia)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Paseo de la Reforma #123, Col. Centro"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }} className="grid-mobile-1col">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="CDMX"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Estado
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="CDMX"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Código Postal (5 dígitos)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="06000"
                      value={zip}
                      onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Método de Pago */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                  2. Selecciona tu Método de Pago
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} style={{ color: '#1ba24c' }} /> Pago Seguro
                </span>
              </div>

              {/* Selectores de Método */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: bankSettings.paypalActive === 'true' ? '1fr 1fr 1fr' : '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }} className="grid-mobile-1col">
                <div 
                  onClick={() => setPaymentMethod('Stripe')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: paymentMethod === 'Stripe' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'Stripe' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}>
                    <CreditCard size={16} style={{ color: '#818cf8' }} /> Tarjeta (Stripe)
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Débito / Crédito · Inmediato</span>
                </div>

                <div 
                  onClick={() => setPaymentMethod('Efectivo')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: paymentMethod === 'Efectivo' ? '2px solid #10b981' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'Efectivo' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}>
                    <Store size={16} style={{ color: '#34d399' }} /> Recoger en Tienda
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Aparta y paga en local / SPEI</span>
                </div>

                {bankSettings.paypalActive === 'true' && (
                  <div 
                    onClick={() => setPaymentMethod('PayPal')}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: paymentMethod === 'PayPal' ? '2px solid #0070ba' : '1px solid var(--border-color)',
                      backgroundColor: paymentMethod === 'PayPal' ? 'rgba(0, 112, 186, 0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <strong style={{ color: '#fff', display: 'block', fontSize: '14px' }}>PayPal</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Saldo o Tarjetas</span>
                  </div>
                )}
              </div>

              {/* Contenido Condicional del Método */}
              {paymentMethod === 'Stripe' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Tarjeta de Crédito con diseño elegante */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={12} /> Pago Protegido vía Stripe
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0', fontWeight: 600 }}>VISA</span>
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0', fontWeight: 600 }}>MC</span>
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0', fontWeight: 600 }}>AMEX</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                          Número de Tarjeta
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            color: 'white',
                            fontSize: '15px',
                            fontFamily: 'monospace',
                            letterSpacing: '0.08em',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                          Nombre del Titular (como aparece en la tarjeta)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="LUIS GONZALEZ"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            color: 'white',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                            Vencimiento (MM/AA)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="12/28"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={handleCardExpiryChange}
                            style={{
                              width: '100%',
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              color: 'white',
                              fontSize: '14px',
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                            CVC / CVV
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="123"
                            maxLength={4}
                            value={cardCvc}
                            onChange={handleCardCvcChange}
                            style={{
                              width: '100%',
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              color: 'white',
                              fontSize: '14px',
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>El cobro se valida de inmediato al 100%. Tus cartas se apartan y descuentan de inventario al instante.</span>
                  </div>
                </div>
              ) : paymentMethod === 'Efectivo' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Banner Apartado */}
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, marginBottom: '6px', fontSize: '14px' }}>
                      <Store size={18} /> Apartado Oficial para Recoger en Tienda
                    </div>
                    <span>
                      Tus cartas quedarán <strong>reservadas a tu nombre durante 48 horas</strong> en nuestra sucursal física.
                    </span>
                  </div>

                  {/* Instrucciones Claras */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    color: '#e2e8f0',
                    lineHeight: 1.6
                  }}>
                    <p style={{ margin: '0 0 10px 0' }}>
                      💵 <strong>Pago al acudir al local:</strong> Puedes liquidar en efectivo o con tarjeta física al llegar a la tienda.
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                      ⚡ <strong>¿Prefieres adelantar por SPEI para recoger sin esperas?</strong> Al confirmar tu pedido te enviaremos por correo nuestra CLABE interbancaria oficial y tu número de referencia para que transfieras si lo deseas.
                    </p>
                  </div>

                  {bankSettings.whatsapp && (
                    <a
                      href={`https://wa.me/${bankSettings.whatsapp}?text=${encodeURIComponent(`Hola PokéVault, quiero coordinar la entrega de mi apartado. Total: $${total.toLocaleString('es-MX')} MXN`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        backgroundColor: '#1ba24c', color: 'white',
                        padding: '12px 20px', borderRadius: '8px',
                        fontWeight: 700, fontSize: '13.5px', textDecoration: 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#17a84a')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1ba24c')}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.11 1.523 5.836L0 24l6.335-1.48A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.36-.214-3.726.871.93-3.62-.234-.373A9.818 9.818 0 1112 21.818z"/>
                      </svg>
                      Coordinar Entrega por WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    backgroundColor: 'rgba(0, 112, 186, 0.05)',
                    border: '1px solid rgba(0, 112, 186, 0.2)',
                    padding: '16px', borderRadius: '8px',
                    fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6
                  }}>
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>💳</span>
                    <strong style={{ color: 'white' }}>Pago Seguro con PayPal / Tarjeta:</strong>
                    <span> Haz clic en el botón de abajo para liquidar de forma segura con PayPal.</span>
                  </div>
                  {/* PayPal buttons container */}
                  <div style={{ marginTop: '10px' }}>
                    {!isFormValid ? (
                      <div style={{
                        padding: '16px',
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#f59e0b',
                        textAlign: 'center',
                        lineHeight: 1.5
                      }}>
                        ⚠️ Completa todos los datos de contacto y envío arriba para poder pagar con PayPal.
                      </div>
                    ) : (
                      <div id="paypal-button-container" style={{ minHeight: '150px' }}></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botón Registrar / Pagar Pedido */}
            {paymentMethod !== 'PayPal' && (
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary" 
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: paymentMethod === 'Stripe' ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' : undefined,
                  boxShadow: paymentMethod === 'Stripe' ? '0 0 25px rgba(99, 102, 241, 0.45)' : '0 0 20px var(--primary-glow)'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                    {paymentMethod === 'Stripe' ? 'Procesando Pago con Stripe...' : 'Apartando tus Artículos...'}
                  </>
                ) : (
                  paymentMethod === 'Stripe'
                    ? `💳 Pagar $${total.toLocaleString('es-MX')} MXN con Tarjeta (Stripe)`
                    : `🏪 Confirmar Apartado en Tienda ($${total.toLocaleString('es-MX')} MXN)`
                )}
              </button>
            )}
          </form>

          {/* Lado Derecho: Resumen del Pedido */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Resumen del Pedido
              </h3>

              {/* Listado resumido de items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '350px', overflowY: 'auto' }}>
                {cartItems.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      style={{
                        width: '35px',
                        height: item.product.category === 'single' ? '49px' : '35px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.02)'
                      }}
                    />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product.name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {item.quantity} x ${item.product.price.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      ${(item.product.price * item.quantity).toLocaleString('es-MX')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
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
                  <span>Envío:</span>
                  <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost} MXN`}</span>
                </div>
                <div style={{
                  borderTop: '1px dashed var(--border-color)',
                  paddingTop: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'white'
                }}>
                  <span>Total a Pagar:</span>
                  <span style={{ color: 'var(--secondary)' }}>${total.toLocaleString('es-MX')} MXN</span>
                </div>
              </div>
            </div>

            {/* Garantías de Envío y Coleccionismo PokéVault */}
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.25)', backgroundColor: 'rgba(52, 211, 153, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShieldCheck size={20} color="#34d399" />
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'white', margin: 0 }}>
                  Garantía PokéVault en cada Pedido
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>🛡️</span>
                  <div>
                    <strong style={{ color: 'white', display: 'block' }}>Empaque Blindado para Coleccionistas</strong>
                    <span>Cartas en Sleeves Ultra-Pro + Toploaders rígidos para evitar dobleces o marcas de presión.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>📦</span>
                  <div>
                    <strong style={{ color: 'white', display: 'block' }}>Sobre Burbuja Impermeable</strong>
                    <span>Protección multicapa contra humedad e impactos durante el trayecto de paquetería.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>🔍</span>
                  <div>
                    <strong style={{ color: 'white', display: 'block' }}>Autenticidad e Integridad 100%</strong>
                    <span>Piezas 100% oficiales inspeccionadas a detalle previo al despacho.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr 340px !important;
          }
        }
        @media (max-width: 768px) {
          .grid-mobile-1col {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
