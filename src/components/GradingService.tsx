import React, { useState } from 'react';
import { Award, Shield, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface GradingServiceCost {
  id: string;
  name: string;
  pricePerCard: number;
  timeframe: string;
  maxValuation: number;
  description: string;
}

const SERVICE_LEVELS: Record<string, GradingServiceCost[]> = {
  psa: [
    { id: 'psa_bulk', name: 'Bulk (Mínimo 10 cartas)', pricePerCard: 450, timeframe: '60-90 días hábiles', maxValuation: 3500, description: 'La opción más económica para cartas de colección de valor moderado.' },
    { id: 'psa_standard', name: 'Standard / Regular', pricePerCard: 750, timeframe: '30-45 días hábiles', maxValuation: 8500, description: 'Ideal para cartas de nivel medio y envíos individuales estándar.' },
    { id: 'psa_express', name: 'Express', pricePerCard: 1600, timeframe: '10-15 días hábiles', maxValuation: 25000, description: 'Procesamiento preferencial para cartas de gran valor.' },
    { id: 'psa_walkthrough', name: 'Walkthrough (Super Express)', pricePerCard: 3800, timeframe: '3-5 días hábiles', maxValuation: 150000, description: 'Máxima prioridad con entrega ultra rápida e incluye seguro premium.' },
  ],
  bgs: [
    { id: 'bgs_bulk', name: 'Beckett Bulk (Mínimo 5 cartas)', pricePerCard: 550, timeframe: '45-60 días hábiles', maxValuation: 5000, description: 'Evaluación rigurosa de Beckett con subgrados a precio económico.' },
    { id: 'bgs_standard', name: 'Beckett Standard', pricePerCard: 950, timeframe: '20-30 días hábiles', maxValuation: 15000, description: 'Servicio estándar con reporte detallado de sub-calificaciones.' },
    { id: 'bgs_express', name: 'Beckett Express', pricePerCard: 2200, timeframe: '7-10 días hábiles', maxValuation: 50000, description: 'Tu carta favorita en su cápsula premium de Beckett en tiempo récord.' },
  ],
  cgc: [
    { id: 'cgc_bulk', name: 'CGC Bulk (Mínimo 20 cartas)', pricePerCard: 350, timeframe: '40-50 días hábiles', maxValuation: 2500, description: 'Excelente relación calidad-precio. Ideal para colecciones grandes.' },
    { id: 'cgc_standard', name: 'CGC Standard', pricePerCard: 600, timeframe: '15-20 días hábiles', maxValuation: 10000, description: 'Especialistas en cartas TCG con cápsulas cristalinas de gran claridad.' },
    { id: 'cgc_express', name: 'CGC Express', pricePerCard: 1200, timeframe: '5-7 días hábiles', maxValuation: 30000, description: 'Envío prioritario y encapsulado de alta seguridad.' },
  ],
};

export default function GradingService() {
  const [selectedCompany, setSelectedCompany] = useState<string>('psa');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('psa_bulk');
  const [cardQuantity, setCardQuantity] = useState<number>(1);
  const [additionalInsurance, setAdditionalInsurance] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cardsListText, setCardsListText] = useState('');

  const currentLevels = SERVICE_LEVELS[selectedCompany] || [];
  const activeLevel = currentLevels.find((level) => level.id === selectedLevelId) || currentLevels[0];

  // Si cambiamos de compañía y el ID activo no pertenece a la nueva, cambiamos al primero de la nueva
  React.useEffect(() => {
    const defaultLevel = SERVICE_LEVELS[selectedCompany][0];
    if (!currentLevels.some((l) => l.id === selectedLevelId)) {
      setSelectedLevelId(defaultLevel.id);
    }
  }, [selectedCompany]);

  const pricePerCard = activeLevel ? activeLevel.pricePerCard : 0;
  const insuranceCost = additionalInsurance ? 120 * cardQuantity : 0;
  const subtotal = pricePerCard * cardQuantity;
  const shippingBackCost = cardQuantity > 0 ? 250 : 0; // Envío de regreso asegurado
  const total = subtotal + insuranceCost + shippingBackCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || cardQuantity < 1) return;
    setSubmitted(true);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCardsListText('');
    setCardQuantity(1);
    setAdditionalInsurance(false);
    setSubmitted(false);
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: '20px 0 60px 0' }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: '12px' }}>
          Servicio Profesional de <span style={{ color: 'var(--primary)' }}>Graduación TCG</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '15px' }}>
          Somos intermediarios oficiales para el envío de cartas a **PSA, Beckett y CGC** desde México. 
          Nos encargamos de la preparación, seguro internacional, envío aduanal y retorno seguro.
        </p>
      </div>

      {submitted ? (
        /* Pantalla de éxito */
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
            ¡Solicitud de Graduación Recibida!
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', lineHeight: 1.6 }}>
            Hola <strong>{name}</strong>, hemos registrado tu cotización de graduación con <strong>{selectedCompany.toUpperCase()}</strong> por un total estimado de <strong>${total.toLocaleString('es-MX')} MXN</strong>.
            Te enviaremos un correo con las instrucciones de empaque y la guía de envío a nuestras oficinas en menos de 24 horas.
          </p>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'left',
            marginBottom: '30px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '10px', textTransform: 'uppercase' }}>
              Resumen del Pedido:
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li><strong>Compañía:</strong> {selectedCompany.toUpperCase()}</li>
              <li><strong>Nivel:</strong> {activeLevel?.name}</li>
              <li><strong>Cantidad de Cartas:</strong> {cardQuantity} unidades</li>
              <li><strong>Tiempo estimado:</strong> {activeLevel?.timeframe}</li>
              <li><strong>Seguro adicional:</strong> {additionalInsurance ? 'Sí' : 'No'}</li>
              <li style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px', color: 'var(--secondary)', fontWeight: 700, fontSize: '15px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Estimado:</span>
                <span>${total.toLocaleString('es-MX')} MXN</span>
              </li>
            </ul>
          </div>

          <button onClick={resetForm} className="btn btn-primary">
            Nueva Cotización
          </button>
        </div>
      ) : (
        /* Cotizador e Interfaz de Registro */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '30px',
        }} className="grading-layout">
          
          {/* Lado Izquierdo: Configuración */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Selección de Compañía */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--primary)' }} />
                1. Selecciona la Agencia Calificadora
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'psa', name: 'PSA', tag: 'La más popular', color: '#ff3e3e' },
                  { id: 'bgs', name: 'Beckett (BGS)', tag: 'Coleccionistas exigentes', color: '#2a75d3' },
                  { id: 'cgc', name: 'CGC TCG', tag: 'Cápsulas premium', color: '#ffcb05' },
                ].map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedCompany(comp.id)}
                    style={{
                      backgroundColor: selectedCompany === comp.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      border: selectedCompany === comp.id ? `2px solid ${comp.color}` : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '16px 12px',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.05em' }}>{comp.name}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{comp.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Niveles de Servicio */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--secondary)' }} />
                2. Elige el Nivel de Servicio
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentLevels.map((level) => (
                  <div
                    key={level.id}
                    onClick={() => setSelectedLevelId(level.id)}
                    style={{
                      backgroundColor: selectedLevelId === level.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: selectedLevelId === level.id ? '1px solid var(--secondary)' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{level.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>• {level.timeframe}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        {level.description}
                      </p>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        Valor máximo de declaración: ${level.maxValuation.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <span style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: 'var(--secondary)' }}>
                        ${level.pricePerCard} MXN
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>por carta</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Opciones de Envío e Insumos */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: 'var(--accent-blue)' }} />
                3. Cantidad y Opciones Adicionales
              </h3>
              
              {/* Selector de cantidad */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '14px', color: 'white' }}>Cantidad de cartas a enviar:</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Puedes cotizar cualquier número de cartas</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => setCardQuantity(Math.max(1, cardQuantity - 1))}
                    style={{ background: 'none', border: 'none', color: '#fff', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}
                  >
                    -
                  </button>
                  <span style={{ color: '#fff', padding: '0 16px', fontSize: '15px', fontWeight: 700 }}>
                    {cardQuantity}
                  </span>
                  <button 
                    onClick={() => setCardQuantity(cardQuantity + 1)}
                    style={{ background: 'none', border: 'none', color: '#fff', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Seguro Adicional */}
              <div 
                onClick={() => setAdditionalInsurance(!additionalInsurance)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={additionalInsurance} 
                  onChange={() => {}} 
                  style={{ marginTop: '4px', cursor: 'pointer' }}
                />
                <div>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: 'white' }}>
                    Añadir Seguro de Cobertura Total contra Extravíos (+$120 MXN por carta)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                    Cubre el 100% de la tasación declarada de tu carta durante todo el viaje internacional y aduana.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Desglose y Formulario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Resumen del Cotizador */}
            <div className="glass" style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255,203,5,0.15)',
              background: 'linear-gradient(180deg, rgba(17, 21, 32, 0.85) 0%, rgba(20, 20, 28, 0.85) 100%)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                Resumen de Cotización
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Servicio ({selectedCompany.toUpperCase()} - {activeLevel?.name.split(' (')[0]}):</span>
                  <span>{cardQuantity} x ${pricePerCard.toLocaleString('es-MX')} MXN</span>
                </div>
                {additionalInsurance && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Seguro Adicional de Tránsito:</span>
                    <span>{cardQuantity} x $120 MXN</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Envío Asegurado Regreso (FedEx/DHL):</span>
                  <span>${shippingBackCost.toLocaleString('es-MX')} MXN</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tiempo Estimado de Entrega:</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{activeLevel?.timeframe}</span>
                </div>

                <div style={{
                  borderTop: '1px dashed var(--border-color)',
                  paddingTop: '16px',
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>Costo Total Estimado:</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--secondary)' }}>
                      ${total.toLocaleString('es-MX')} MXN
                    </span>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>IVA e impuestos incluidos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario de registro */}
            <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                Formulario de Envío
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Lista de Cartas a calificar (Nombre, Expansión, Número)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Ej: Charizard ex - 151 - #199/165 (1 pieza)"
                    value={cardsListText}
                    onChange={(e) => setCardsListText(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                  Confirmar Pre-Registro y Recibir Guía <ChevronRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 992px) {
          .grading-layout {
            grid-template-columns: 1fr 400px !important;
          }
        }
      `}</style>
    </div>
  );
}
