import React, { useState, useEffect } from 'react';
import { User, MapPin, Heart, Save, Trash2, Eye, ShoppingCart, Check, AlertCircle, Package, Calendar, RefreshCw } from 'lucide-react';
import type { Product } from './ProductItem';
import { apiGetMyOrders, apiUpdateProfile, apiRemoveFavorite } from '../api';

export interface UserData {
  email: string;
  name: string;
  lastName: string;
  role?: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  favorites: string[]; // List of product IDs
}

interface AccountPanelProps {
  currentUser: string;
  userData: UserData;
  onUpdateUserData: (data: UserData) => void;
  onViewProductDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  allProducts: Product[]; // Combined list of inventory + cached products to display favorites
  onRemoveFavorite: (productId: string) => void;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  name: string;
  image_url: string;
}

interface DBOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  tracking_number?: string;
  items: OrderItem[];
}

export default function AccountPanel({
  currentUser,
  userData,
  onUpdateUserData,
  onViewProductDetails,
  onAddToCart,
  allProducts,
  onRemoveFavorite
}: AccountPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'favorites' | 'orders'>('profile');
  
  // Local form states
  const [name, setName] = useState(userData.name || '');
  const [lastName, setLastName] = useState(userData.lastName || '');
  const [phone, setPhone] = useState(userData.phone || '');
  
  const [street, setStreet] = useState(userData.address?.street || '');
  const [city, setCity] = useState(userData.address?.city || '');
  const [state, setState] = useState(userData.address?.state || '');
  const [zipCode, setZipCode] = useState(userData.address?.zipCode || '');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sincronizar estados locales cuando cambian las props externas de userData
  useEffect(() => {
    setName(userData.name || '');
    setLastName(userData.lastName || '');
    setPhone(userData.phone || '');
    setStreet(userData.address?.street || '');
    setCity(userData.address?.city || '');
    setState(userData.address?.state || '');
    setZipCode(userData.address?.zipCode || '');
  }, [userData]);

  // Cargar pedidos cuando se entra a la pestaña de órdenes
  useEffect(() => {
    if (activeTab === 'orders' && currentUser) {
      setLoadingOrders(true);
      apiGetMyOrders()
        .then((res) => {
          setOrders(res);
        })
        .catch((err) => {
          console.error('Error cargando pedidos:', err);
        })
        .finally(() => {
          setLoadingOrders(false);
        });
    }
  }, [activeTab, currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setValidationError(null);
    
    const trimmedName = name.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.trim();
    
    if (trimmedName.length < 3) {
      setValidationError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    if (trimmedLastName.length < 2) {
      setValidationError('Los apellidos deben tener al menos 2 caracteres.');
      return;
    }
    
    if (trimmedPhone.length < 10) {
      setValidationError('El teléfono debe tener al menos 10 dígitos.');
      return;
    }
    
    try {
      await apiUpdateProfile({
        name: trimmedName,
        lastName: trimmedLastName,
        phone: trimmedPhone,
        address: userData.address
      });

      const updatedData: UserData = {
        ...userData,
        name: trimmedName,
        lastName: trimmedLastName,
        phone: trimmedPhone
      };
      
      onUpdateUserData(updatedData);
      triggerSuccess();
    } catch (err: any) {
      setValidationError(err.message || 'Error al guardar los cambios en el servidor.');
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setValidationError(null);
    
    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedZip = zipCode.trim();
    
    if (!trimmedStreet) {
      setValidationError('La calle y el número son obligatorios.');
      return;
    }
    if (!trimmedCity) {
      setValidationError('La ciudad es obligatoria.');
      return;
    }
    if (!trimmedState) {
      setValidationError('El estado es obligatorio.');
      return;
    }
    if (!trimmedZip) {
      setValidationError('El código postal es obligatorio.');
      return;
    }
    if (trimmedZip.length < 5) {
      setValidationError('El código postal debe tener al menos 5 dígitos.');
      return;
    }
    
    try {
      const newAddress = {
        street: trimmedStreet,
        city: trimmedCity,
        state: trimmedState,
        zipCode: trimmedZip
      };

      await apiUpdateProfile({
        name: userData.name,
        lastName: userData.lastName || '',
        phone: userData.phone,
        address: newAddress
      });

      const updatedData: UserData = {
        ...userData,
        address: newAddress
      };
      
      onUpdateUserData(updatedData);
      triggerSuccess();
    } catch (err: any) {
      setValidationError(err.message || 'Error al guardar la dirección en el servidor.');
    }
  };

  const handleRemoveFavoriteLocal = async (productId: string) => {
    try {
      await apiRemoveFavorite(productId);
      onRemoveFavorite(productId);
    } catch (err) {
      console.error('Error al eliminar favorito en backend:', err);
    }
  };

  const triggerSuccess = () => {
    setSaveSuccess(true);
    setValidationError(null);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Map favorite IDs to actual Product details
  const favoriteProducts = userData.favorites
    .map(favId => allProducts.find(p => p.id === favId))
    .filter((p): p is Product => p !== undefined);

  // Helper para pintar badges de estado con los colores específicos solicitados
  const renderStatusBadge = (status: string) => {
    const isPending = status.toUpperCase() === 'PENDIENTE';
    
    // PENDIENTE -> Amarillo
    // COMPLETADO (PAGADO, ENVIADO, ENTREGADO) -> Rojo
    const badgeBg = isPending ? 'rgba(255, 203, 5, 0.08)' : 'rgba(255, 62, 62, 0.08)';
    const badgeBorder = isPending ? '1px solid rgba(255, 203, 5, 0.3)' : '1px solid rgba(255, 62, 62, 0.3)';
    const badgeColor = isPending ? '#ffcb05' : '#ff3e3e';

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 800,
        backgroundColor: badgeBg,
        border: badgeBorder,
        color: badgeColor,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: badgeColor,
          display: 'inline-block',
          boxShadow: `0 0 6px ${badgeColor}`
        }}></span>
        {isPending ? 'Pendiente de Pago' : status}
      </span>
    );
  };

  return (
    <div style={{ paddingBlock: '30px', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Banner de Bienvenida */}
      <div className="glass" style={{
        padding: '30px 24px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        background: 'linear-gradient(135deg, rgba(22, 27, 38, 0.9), rgba(14, 17, 24, 0.9))',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: '24px',
          boxShadow: '0 0 15px rgba(255, 62, 62, 0.3)'
        }}>
          {name ? name.charAt(0).toUpperCase() : currentUser.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>
            {name ? `¡Hola, ${name}!` : '¡Bienvenido a PokéVault!'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {name
              ? 'Gestiona tus datos, consulta el estado de tus pedidos y revisa tus cartas favoritas.'
              : `Sesión iniciada como ${currentUser}`}
          </p>
        </div>
      </div>

      {/* Banner de Onboarding — solo para usuarios nuevos sin nombre o apellidos */}
      {(!name || !lastName) && (
        <div style={{
          backgroundColor: 'rgba(255, 203, 5, 0.07)',
          border: '1px solid rgba(255, 203, 5, 0.3)',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          animation: 'fadeIn 0.4s'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 203, 5, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0
          }}>
            👋
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffcb05', margin: '0 0 6px 0' }}>
              ¡Completa tu perfil para empezar a comprar!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Ingresa tus <strong style={{ color: 'white' }}>nombres, apellidos</strong>, <strong style={{ color: 'white' }}>teléfono</strong> y <strong style={{ color: 'white' }}>dirección de envío</strong> para poder procesar tus pedidos.
              Usa el menú de la izquierda para completar cada sección.
            </p>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '30px',
      }} className="account-grid-layout">
        
        {/* Navegación Lateral */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => { setActiveTab('profile'); setSaveSuccess(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'profile' ? 'rgba(255, 62, 62, 0.1)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              borderLeft: activeTab === 'profile' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            <User size={16} />
            Mis Datos Personales
          </button>
          
          <button
            onClick={() => { setActiveTab('address'); setSaveSuccess(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'address' ? 'rgba(255, 62, 62, 0.1)' : 'transparent',
              color: activeTab === 'address' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: activeTab === 'address' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              borderLeft: activeTab === 'address' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            <MapPin size={16} />
            Dirección de Envío
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setSaveSuccess(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'orders' ? 'rgba(255, 62, 62, 0.1)' : 'transparent',
              color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: activeTab === 'orders' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              borderLeft: activeTab === 'orders' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            <Package size={16} />
            Historial de Pedidos
          </button>

          <button
            onClick={() => { setActiveTab('favorites'); setSaveSuccess(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'favorites' ? 'rgba(255, 62, 62, 0.1)' : 'transparent',
              color: activeTab === 'favorites' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: activeTab === 'favorites' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              borderLeft: activeTab === 'favorites' ? '3px solid var(--primary)' : '3px solid transparent'
            }}
          >
            <Heart size={16} />
            Mis Favoritos
            {userData.favorites.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                backgroundColor: 'var(--primary)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {userData.favorites.length}
              </span>
            )}
          </button>
        </aside>

        {/* Panel de Contenido */}
        <section className="glass" style={{
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'rgba(22, 27, 38, 0.4)',
        }}>
          {validationError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#f87171',
              fontSize: '14px',
              animation: 'fadeIn 0.2s'
            }}>
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          {saveSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(27, 162, 76, 0.1)',
              border: '1px solid rgba(27, 162, 76, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#34d399',
              fontSize: '14px',
              animation: 'fadeIn 0.2s'
            }}>
              <Check size={16} />
              <span>¡Cambios guardados con éxito! Los datos han sido actualizados y persistidos.</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
                <User size={18} style={{ color: 'var(--primary)' }} /> Datos Personales
              </h3>
              
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Correo Electrónico (No modificable)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(6, 8, 12, 0.3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Nombres
                  </label>
                  <input
                    type="text"
                    placeholder="Tus nombres"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(6, 8, 12, 0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Apellidos
                  </label>
                  <input
                    type="text"
                    placeholder="Tus apellidos"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(6, 8, 12, 0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 5512345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(6, 8, 12, 0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    alignSelf: 'flex-start',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  <Save size={16} /> Guardar Cambios
                </button>
              </form>
            </div>
          )}

          {activeTab === 'address' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
                <MapPin size={18} style={{ color: 'var(--primary)' }} /> Dirección de Envío
              </h3>
              
              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Calle y Número
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Paseo de la Reforma 123, Int 4B"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(6, 8, 12, 0.5)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      placeholder="Ciudad de México"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(6, 8, 12, 0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Estado
                    </label>
                    <input
                      type="text"
                      placeholder="CDMX"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(6, 8, 12, 0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Código Postal
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="06700"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(6, 8, 12, 0.5)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    alignSelf: 'flex-start',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  <Save size={16} /> Guardar Dirección
                </button>
              </form>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
                <Package size={18} style={{ color: 'var(--primary)' }} /> Historial de Pedidos
              </h3>

              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--primary)' }} />
                  <p style={{ fontSize: '14px' }}>Cargando tus pedidos...</p>
                </div>
              ) : orders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  color: 'var(--text-secondary)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '12px'
                }}>
                  <Package size={48} style={{ color: 'rgba(255,255,255,0.06)', marginBottom: '16px' }} />
                  <p style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: 'white' }}>No has realizado ningún pedido</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Explora nuestra tienda y añade cartas a tu carrito para realizar tu primer pedido por transferencia bancaria.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {orders.map((order) => (
                    <div 
                      key={order.id}
                      className="glass animate-fade-in-up"
                      style={{
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'rgba(10, 13, 20, 0.4)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Cabecera del Pedido */}
                      <div style={{
                        padding: '16px 20px',
                        backgroundColor: 'rgba(14, 17, 24, 0.7)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>N° Pedido</span>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{order.id}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Fecha</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              {new Date(order.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total</span>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--secondary)' }}>
                              ${order.total.toLocaleString('es-MX')} MXN
                            </span>
                          </div>
                        </div>

                        {/* Estado coloreado según pedido */}
                        {renderStatusBadge(order.status)}
                      </div>

                      {/* Items del Pedido */}
                      <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {order.items && order.items.map((item, idx) => (
                            <div 
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                paddingBottom: idx < order.items.length - 1 ? '12px' : '0',
                                borderBottom: idx < order.items.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none'
                              }}
                            >
                              {/* Imagen Miniatura */}
                              <div style={{
                                width: '45px',
                                height: '60px',
                                backgroundColor: 'rgba(255,255,255,0.01)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255,255,255,0.05)',
                                flexShrink: 0
                              }}>
                                <img 
                                  src={item.image_url} 
                                  alt={item.name} 
                                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                                />
                              </div>

                              {/* Info Artículo */}
                              <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'white', margin: '0 0 4px 0' }}>{item.name}</h4>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Precio compra: ${item.price_at_purchase.toLocaleString('es-MX')} MXN
                                </span>
                              </div>

                              {/* Cantidad y Subtotal */}
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Cant: {item.quantity}</span>
                                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'white' }}>
                                  ${(item.price_at_purchase * item.quantity).toLocaleString('es-MX')} MXN
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {order.tracking_number && (
                          <div style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                            fontSize: '12.5px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ fontWeight: 600, color: 'white' }}>🚚 Número de Guía:</span>
                            <span style={{ fontFamily: 'monospace', backgroundColor: 'rgba(255, 62, 62, 0.1)', border: '1px solid rgba(255, 62, 62, 0.2)', padding: '3px 8px', borderRadius: '4px', color: '#ff6b6b' }}>
                              {order.tracking_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
                <Heart size={18} style={{ color: 'var(--primary)' }} /> Mi Lista de Favoritos
              </h3>

              {favoriteProducts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)'
                }}>
                  <Heart size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
                  <p style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0' }}>No tienes productos en favoritos</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Explora nuestra tienda y haz clic en el ícono de corazón para guardar las cartas y cajas que más te gusten.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '20px'
                }}>
                  {favoriteProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="glass"
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      {/* Botón para remover de favoritos */}
                      <button
                        onClick={() => handleRemoveFavoriteLocal(product.id)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(255, 62, 62, 0.1)',
                          border: 'none',
                          color: '#ff6b6b',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 62, 62, 0.25)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 62, 62, 0.1)'}
                        title="Eliminar de favoritos"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Imagen */}
                      <div 
                        onClick={() => onViewProductDetails(product)}
                        style={{
                          width: '100%',
                          height: '140px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255,255,255,0.01)',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          style={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {product.category}
                        </span>
                        <h4 style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'white',
                          margin: '4px 0 8px 0',
                          lineHeight: 1.3,
                          height: '34px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {product.name}
                        </h4>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--secondary)' }}>
                          ${product.price.toLocaleString('es-MX')} MXN
                        </span>
                      </div>

                      {/* Acciones */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => onViewProductDetails(product)}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '6px', fontSize: '11px' }}
                        >
                          <Eye size={12} /> Ver
                        </button>
                        <button
                          onClick={() => onAddToCart(product)}
                          disabled={product.stock === 0}
                          className="btn btn-primary"
                          style={{
                            flex: 1.5,
                            padding: '6px',
                            fontSize: '11px',
                            opacity: product.stock === 0 ? 0.5 : 1,
                            cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <ShoppingCart size={12} /> {product.stock > 0 ? 'Comprar' : 'Agotado'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .account-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
