import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldCheck, CheckCircle2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { BuybackRequest } from './AdminPanel';
import type { UserData } from './AccountPanel';
import { apiSubmitBuyback } from '../api';
import { multiTcgSearch } from '../services/multiTcgApi';
import type { CardSearchResult } from '../services/multiTcgApi';

interface BuybackItem {
  id: string;
  name: string;
  expansion: string;
  condition: 'NM' | 'LP' | 'MP' | 'HP';
  marketPrice: number; // en MXN
  imageUrl?: string;
}

interface BuybackPortalProps {
  currentUser: string | null;
  userData: UserData | null;
  onSendBuybackRequest: (request: BuybackRequest) => void;
  onLoginRequest: () => void;
  initialGame?: string;
}

export default function BuybackPortal({
  currentUser,
  userData,
  onSendBuybackRequest,
  onLoginRequest,
  initialGame = 'POKEMON'
}: BuybackPortalProps) {
  const [items, setItems] = useState<BuybackItem[]>([]);

  const [newName, setNewName] = useState('');
  const [newExpansion, setNewExpansion] = useState('');
  const [newCondition, setNewCondition] = useState<'NM' | 'LP' | 'MP' | 'HP'>('NM');
  const [newMarketPrice, setNewMarketPrice] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  // Estados para búsqueda de cartas
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<CardSearchResult[]>([]);
  const [searchingCards, setSearchingCards] = useState(false);
  const [apiSearchError, setApiSearchError] = useState<string | null>(null);

  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(currentUser || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [payoutMethod, setPayoutMethod] = useState<'cash' | 'credit'>('credit');
  const [submitted, setSubmitted] = useState(false);
  const [folioNumber, setFolioNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-completar datos del usuario
  useEffect(() => {
    if (currentUser) setEmail(currentUser);
    if (userData) {
      if (userData.name) setName(userData.name);
      if (userData.phone) setPhone(userData.phone);
    }
  }, [currentUser, userData]);

  // Tasas de pago
  const CONDITION_RATES = {
    NM: { credit: 0.70, cash: 0.60, label: 'Near Mint (Como Nueva)' },
    LP: { credit: 0.58, cash: 0.48, label: 'Lightly Played (Poco Uso)' },
    MP: { credit: 0.45, cash: 0.35, label: 'Moderately Played (Desgaste Medio)' },
    HP: { credit: 0.30, cash: 0.20, label: 'Heavily Played / Damaged (Dañada)' }
  };

  // Lógica de búsqueda de cartas
  const handleCardApiSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiSearchQuery.trim()) return;
    
    setSearchingCards(true);
    setApiSearchError(null);
    try {
      const results = await multiTcgSearch(apiSearchQuery, initialGame);
      setApiSearchResults(results || []);
      if ((results || []).length === 0) {
        setApiSearchError('No se encontraron cartas con ese nombre en este juego.');
      }
    } catch (err) {
      setApiSearchError('Error al buscar cartas. Intenta de nuevo.');
      console.error(err);
    } finally {
      setSearchingCards(false);
    }
  };

  const handleSelectApiCard = (card: CardSearchResult) => {
    setNewName(`${card.name}`);
    setNewExpansion(card.set.name);
    
    // Obtener precio de mercado
    const priceMxn = card.marketPrice || 100; // Por defecto $100 si no hay info
    setNewMarketPrice(priceMxn.toString());
    
    // Limpiar resultados y consulta
    setApiSearchResults([]);
    setApiSearchQuery('');
    setNewImageUrl(card.images.small || card.images.large || '');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newExpansion || !newMarketPrice) return;
    
    const price = parseFloat(newMarketPrice);
    if (isNaN(price) || price <= 0) return;

    const newItem: BuybackItem = {
      id: Date.now().toString(),
      name: newName,
      expansion: newExpansion,
      condition: newCondition,
      marketPrice: price,
      imageUrl: newImageUrl || undefined
    };

    setItems([...items, newItem]);
    setNewName('');
    setNewExpansion('');
    setNewCondition('NM');
    setNewMarketPrice('');
    setNewImageUrl('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calcular totales
  const getPayouts = () => {
    let totalCredit = 0;
    let totalCash = 0;
    let totalMarket = 0;

    items.forEach(item => {
      const rate = CONDITION_RATES[item.condition];
      totalMarket += item.marketPrice;
      totalCredit += item.marketPrice * rate.credit;
      totalCash += item.marketPrice * rate.cash;
    });

    return {
      market: Math.round(totalMarket),
      credit: Math.round(totalCredit),
      cash: Math.round(totalCash)
    };
  };

  const payouts = getPayouts();

  const handleSubmitBuyback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || items.length === 0) return;

    setLoading(true);
    setErrorMessage('');

    const cards = items.map((item) => ({
      name: item.name,
      expansion: item.expansion,
      condition: item.condition,
      marketPrice: item.marketPrice
    }));

    apiSubmitBuyback({
      name,
      phone,
      payoutMethod,
      items: cards
    })
      .then((res) => {
        setFolioNumber(res.folioNumber);
        
        // Sincronizar estado local legado con la respuesta del backend
        const legacyRequest: BuybackRequest = {
          id: res.folioNumber,
          customerEmail: email,
          customerName: name,
          date: new Date().toLocaleDateString('es-MX'),
          cards: items.map(c => ({
            name: c.name,
            expansion: c.expansion,
            rarity: 'Single',
            condition: c.condition,
            isGraded: false,
            estimatedValue: c.marketPrice
          })),
          totalValue: res.totalValue,
          status: 'Pendiente'
        };
        onSendBuybackRequest(legacyRequest);
        setSubmitted(true);
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Error al enviar la solicitud de recompra');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const resetForm = () => {
    setItems([]);
    setName('');
    setEmail('');
    setPhone('');
    setPayoutMethod('credit');
    setSubmitted(false);
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: '20px 0 60px 0' }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: '12px' }}>
          Portal de Recompra <span style={{ color: 'var(--primary)' }}>(Buyback {initialGame})</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '15px' }}>
          ¿Tienes cartas repetidas o quieres vender tu colección? Te las compramos.
          Ofrecemos hasta un <strong style={{ color: 'var(--secondary)' }}>70% del valor de mercado</strong> en crédito de tienda o pago por transferencia bancaria.
        </p>
      </div>

      {/* ── LOGIN GATE: si no hay sesión ── */}
      {!currentUser ? (
        <div className="glass" style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '48px 40px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 203, 5, 0.2)',
          textAlign: 'center',
          backgroundColor: 'rgba(22, 27, 38, 0.6)'
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,203,5,0.15), rgba(255,62,62,0.15))',
            border: '1px solid rgba(255,203,5,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto', fontSize: '32px'
          }}>
            💳
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
            Inicia sesión para continuar
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
            Para enviar una solicitud de recompra necesitamos verificar tu identidad.
            Así nos aseguramos de que podamos contactarte y procesar tu pago correctamente.
          </p>
          <button
            onClick={onLoginRequest}
            className="btn btn-primary"
            style={{ padding: '13px 36px', fontSize: '15px', fontWeight: 700, width: '100%' }}
          >
            Iniciar Sesión / Registrarse
          </button>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '16px' }}>
            No necesitas contraseña. Solo tu correo y un código de verificación.
          </p>
        </div>
      ) : submitted ? (
        /* Éxito */
        <div className="glass" style={{
          maxWidth: '650px',
          margin: '0 auto',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid rgba(27, 162, 76, 0.3)',
          background: 'linear-gradient(135deg, rgba(17, 21, 32, 0.95) 0%, rgba(13, 28, 20, 0.95) 100%)'
        }}>
          <CheckCircle2 size={60} style={{ color: '#1ba24c', marginBottom: '20px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: '#ffffff' }}>
            ¡Cotización de Venta Enviada!
          </h3>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255,203,5,0.08)',
            border: '1px solid rgba(255,203,5,0.25)',
            borderRadius: '8px',
            padding: '8px 20px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número de Folio</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffcb05', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{folioNumber}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
            Hola <strong>{name}</strong>, hemos recibido tu lista de recompra.
            Tu pago estimado en <strong>{payoutMethod === 'credit' ? 'Crédito de Tienda' : 'Transferencia Bancaria'}</strong> es de:
          </p>

          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: 'var(--secondary)',
            marginBottom: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px',
            borderRadius: '10px',
            display: 'inline-block'
          }}>
            ${(payoutMethod === 'credit' ? payouts.credit : payouts.cash).toLocaleString('es-MX')} MXN
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px', textAlign: 'left', lineHeight: 1.5 }}>
            <strong>¿Qué sigue?</strong> <br />
            1. En las próximas 12 horas, revisaremos tu cotización y te enviaremos una guía pre-pagada de FedEx/Estafeta (el costo de la guía se descontará del valor final). <br />
            2. Empaqueta tus cartas con protectores duros (Toploaders) para evitar daños en el correo. <br />
            3. Una vez recibamos tus cartas en nuestras oficinas de PokéVault, verificaremos su estado y realizaremos el depósito o abonaremos tu saldo en un plazo de 24 a 48 horas.
          </p>

          <button onClick={resetForm} className="btn btn-primary">
            Hacer Otra Cotización
          </button>
        </div>
      ) : (
        /* Portal de cotización interactiva */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '30px',
        }} className="buyback-layout">
          
          {/* Lado Izquierdo: Lista de cartas y agregador */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Formulario Agregar Carta */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                Agregar Carta a la Cotización
              </h3>

              {/* Buscador de Cartas API */}
              <div style={{ marginBottom: '20px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  🔍 Buscar en la Base de Datos Oficial ({initialGame} TCG API)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={`Ej. ${initialGame === 'MAGIC' ? 'Black Lotus' : initialGame === 'YUGIOH' ? 'Blue-Eyes White Dragon' : 'Charizard ex'}`}
                    value={apiSearchQuery}
                    onChange={(e) => setApiSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCardApiSearch();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCardApiSearch()}
                    disabled={searchingCards}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {searchingCards ? (
                      <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                    ) : 'Buscar'}
                  </button>
                </div>

                {apiSearchError && (
                  <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px' }}>
                    {apiSearchError}
                  </div>
                )}

                {/* API Search Results Grid */}
                {apiSearchResults.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(6, 8, 12, 0.85)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '12px'
                  }}>
                    {apiSearchResults.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => handleSelectApiCard(card)}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: '1px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                        }}
                      >
                        <img
                          src={card.images.small}
                          alt={card.name}
                          style={{ height: '90px', objectFit: 'contain', marginBottom: '6px', borderRadius: '2px' }}
                        />
                        <div>
                          <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.1', height: '22px' }}>
                            {card.name}
                          </div>
                          <span style={{ fontSize: '8px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                            {card.set.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'end', flexWrap: 'wrap' }}>
                <form onSubmit={handleAddItem} style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  alignItems: 'end'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Nombre de la Carta
                    </label>
                    <input
                      id="buyback-card-name"
                      type="text"
                      required
                      placeholder="Ej. Charizard ex"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Expansión (Set)
                    </label>
                    <input
                      id="buyback-card-expansion"
                      type="text"
                      required
                      placeholder="Ej. Scarlet & Violet 151"
                      value={newExpansion}
                      onChange={(e) => setNewExpansion(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Condición
                    </label>
                    <select
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value as any)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-body)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '8px 12px',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="NM">Near Mint (Impecable)</option>
                      <option value="LP">Lightly Played (Detalles mínimos)</option>
                      <option value="MP">Moderately Played (Desgaste visible)</option>
                      <option value="HP">Heavily Played (Dañada/Rayada)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      Valor de Mercado Aprox (MXN)
                    </label>
                    <input
                      id="buyback-card-price"
                      type="number"
                      required
                      min="1"
                      placeholder="Ej. 1500"
                      value={newMarketPrice}
                      onChange={(e) => setNewMarketPrice(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ minWidth: '100px' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}>
                      <Plus size={14} /> Añadir
                    </button>
                  </div>
                </form>

                {newImageUrl && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    width: '100px',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Seleccionada</span>
                    <img src={newImageUrl} alt="Card Preview" style={{ height: '90px', objectFit: 'contain', borderRadius: '4px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      style={{ fontSize: '10px', color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', fontWeight: 600 }}
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Listado de Cartas Añadidas */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                Tu Lista de Envío ({items.length} {items.length === 1 ? 'carta' : 'cartas'})
              </h3>

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
                  No has agregado ninguna carta a la lista de venta.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px' }}>Carta / Pokémon</th>
                        <th style={{ padding: '10px' }}>Expansión</th>
                        <th style={{ padding: '10px' }}>Condición</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Valor Mercado</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Crédito (70%)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Efectivo (60%)</th>
                        <th style={{ padding: '10px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const rates = CONDITION_RATES[item.condition];
                        const creditVal = Math.round(item.marketPrice * rates.credit);
                        const cashVal = Math.round(item.marketPrice * rates.cash);
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 10px', fontWeight: 600, color: 'white' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.name} style={{ height: '36px', width: '26px', objectFit: 'contain', borderRadius: '2px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                )}
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{item.expansion}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: item.condition === 'NM' ? 'rgba(27, 162, 76, 0.1)' : 'rgba(255, 203, 5, 0.1)',
                                color: item.condition === 'NM' ? '#1ba24c' : 'var(--secondary)'
                              }}>
                                {item.condition}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>${item.marketPrice.toLocaleString('es-MX')}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--secondary)', fontWeight: 600 }}>
                              ${creditVal.toLocaleString('es-MX')}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#fff' }}>
                              ${cashVal.toLocaleString('es-MX')}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                              <button 
                                onClick={() => handleRemoveItem(item.id)}
                                style={{ background: 'none', border: 'none', color: '#ff3e3e', cursor: 'pointer' }}
                                title="Eliminar de la lista"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Lado Derecho: Totales y Formulario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Totales Recompra */}
            <div className="glass" style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 62, 62, 0.15)',
              background: 'linear-gradient(180deg, rgba(17, 21, 32, 0.85) 0%, rgba(28, 12, 12, 0.85) 100%)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Resumen de Recompra
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Opción Crédito */}
                <div 
                  onClick={() => setPayoutMethod('credit')}
                  style={{
                    border: payoutMethod === 'credit' ? '2px solid var(--secondary)' : '1px solid var(--border-color)',
                    backgroundColor: payoutMethod === 'credit' ? 'rgba(255,203,5,0.03)' : 'transparent',
                    padding: '16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '12px',
                    background: 'var(--secondary)',
                    color: '#0c0e12',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase'
                  }}>
                    +10% Extra
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input type="radio" checked={payoutMethod === 'credit'} onChange={() => {}} />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Crédito de Tienda</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Para comprar cualquier producto en nuestra tienda.
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary)', display: 'block' }}>
                    ${payouts.credit.toLocaleString('es-MX')} MXN
                  </span>
                </div>

                {/* Opción Efectivo */}
                <div 
                  onClick={() => setPayoutMethod('cash')}
                  style={{
                    border: payoutMethod === 'cash' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: payoutMethod === 'cash' ? 'rgba(255,62,62,0.03)' : 'transparent',
                    padding: '16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input type="radio" checked={payoutMethod === 'cash'} onChange={() => {}} />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Transferencia / Efectivo</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Pago directo a tu cuenta bancaria en México.
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                    ${payouts.cash.toLocaleString('es-MX')} MXN
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px dashed var(--border-color)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)'
                }}>
                  <ShieldCheck size={16} style={{ color: '#1ba24c', flexShrink: 0 }} />
                  <span>Sujeto a verificación física en nuestras oficinas antes de liberar fondos.</span>
                </div>
              </div>
            </div>

            {/* Formulario de envío */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                Datos de Contacto
              </h3>
              <form onSubmit={handleSubmitBuyback} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Luis Pérez"
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
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10 dígitos"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    fontSize: '13px',
                    marginBottom: '10px'
                  }}>
                    <AlertCircle size={16} />
                    {errorMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={items.length === 0 || loading}
                  className="btn btn-primary" 
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    opacity: (items.length === 0 || loading) ? 0.5 : 1,
                    cursor: (items.length === 0 || loading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                      Enviando Propuesta...
                    </>
                  ) : (
                    <>
                      Enviar Propuesta de Recompra <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 992px) {
          .buyback-layout {
            grid-template-columns: 1fr 380px !important;
          }
        }
      `}</style>
    </div>
  );
}
