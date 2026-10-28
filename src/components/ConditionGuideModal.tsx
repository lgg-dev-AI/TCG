import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface ConditionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConditionGuideModal({ isOpen, onClose }: ConditionGuideModalProps) {
  const [selectedTab, setSelectedTab] = useState<'NM' | 'LP' | 'MP' | 'HP' | 'DMG'>('NM');

  if (!isOpen) return null;

  const conditions = [
    {
      code: 'NM',
      name: 'Near Mint',
      sub: 'Casi Nueva / Impecable',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      valueMultiplier: '100% - 110%',
      summary: 'Cartas en estado casi perfecto, ideales para coleccionistas exigentes o graduación profesional.',
      allowed: [
        'Bordes limpios sin desgaste perceptible',
        'Superficie y foil brillantes sin rayones evidentes',
        'Esquinas nítidas y cuadradas',
        'Máximo 1 a 2 micro-puntos blancos casi invisibles en el borde trasero'
      ],
      notAllowed: [
        'Cero dobleces o arrugas (creases)',
        'Cero raspaduras en el foil o arte frontal',
        'Cero marcas de uña o marcas de barajado'
      ]
    },
    {
      code: 'LP',
      name: 'Lightly Played',
      sub: 'Ligero Desgaste',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      valueMultiplier: '80% - 90%',
      summary: 'Cartas con muy leve uso por juego o manejo en micas. Muy atractivas visualmente a un mejor precio.',
      allowed: [
        'Ligero blanqueo (whitening) en 1 o 2 esquinas o bordes traseros',
        'Micro-rayones superficiales solo visibles a contraluz',
        'Pequeño desgaste leve de manipulación normal'
      ],
      notAllowed: [
        'Sin dobleces marcados ni arrugas estructurales',
        'Sin manchas de agua o suciedad',
        'Sin esquinas redondeadas por impacto'
      ]
    },
    {
      code: 'MP',
      name: 'Moderately Played',
      sub: 'Desgaste Moderado',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      valueMultiplier: '60% - 75%',
      summary: 'Cartas con desgaste evidente por haber sido jugadas en torneos sin doble mica. Excelente opción económica para decks competitivos.',
      allowed: [
        'Desgaste de bordes blanco visible (border wear)',
        'Rayones moderados en la superficie foil o reverso',
        'Pérdida ligera del brillo original'
      ],
      notAllowed: [
        'Sin rasgaduras ni roturas de papel',
        'Sin dobleces mayores que impidan jugar con mica'
      ]
    },
    {
      code: 'HP',
      name: 'Heavily Played',
      sub: 'Desgaste Intenso',
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.3)',
      valueMultiplier: '40% - 55%',
      summary: 'Cartas muy jugadas con desgaste severo, recomendadas para binder fillers o jugadores que buscan el precio más bajo posible.',
      allowed: [
        'Blanqueo extenso en los cuatro bordes',
        'Marcas visibles de barajado o dobleces ligeros',
        'Rayones y pérdida de textura'
      ],
      notAllowed: [
        'Estructura aún completa (no faltan pedazos ni hay tinta borrada)'
      ]
    },
    {
      code: 'DMG',
      name: 'Damaged',
      sub: 'Dañada',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      valueMultiplier: '20% - 35%',
      summary: 'Cartas con daño físico severo (pliegues profundos, agua, tinta o roturas). Ideales solo como piezas de nostalgia.',
      allowed: [
        'Dobleces profundos o arrugas completas',
        'Daño por agua o manchas',
        'Pequeñas rasgaduras o escrituras'
      ],
      notAllowed: [
        'No apta para juego oficial sin autorización de juez de torneo'
      ]
    }
  ];

  const current = conditions.find(c => c.code === selectedTab) || conditions[0];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '88vh',
          backgroundColor: '#121622',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '28px',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar Guía"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #ffcb05 0%, #d97706 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Sparkles size={22} color="#000" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>
              Guía Oficial de Estados de Cartas (TCGplayer Standard)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Criterios estandarizados de graduación física para máxima transparencia entre comprador y vendedor.
            </p>
          </div>
        </div>

        {/* Tabs de Selección */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '20px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {conditions.map(c => {
            const isSelected = selectedTab === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setSelectedTab(c.code as any)}
                style={{
                  flex: '1 0 auto',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isSelected ? `2px solid ${c.color}` : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: isSelected ? c.bg : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ color: c.color, fontSize: '14px', fontWeight: 800 }}>{c.code}</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>{c.name}</div>
              </button>
            );
          })}
        </div>

        {/* Tarjeta de Detalle del Estado Seleccionado */}
        <div style={{
          backgroundColor: current.bg,
          border: `1.5px solid ${current.border}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: current.color,
                color: '#000',
                fontWeight: 900,
                fontSize: '12px',
                marginBottom: '6px'
              }}>
                {current.code} • {current.name}
              </span>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 800 }}>
                {current.sub}
              </h3>
            </div>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'right'
            }}>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Valoración vs NM
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: current.color }}>
                {current.valueMultiplier}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            {current.summary}
          </p>

          {/* Permitido vs No Permitido */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>
                <CheckCircle size={15} /> ¿Qué es aceptable en {current.code}?
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {current.allowed.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>
                <AlertTriangle size={15} /> Límites estrictos (No permitido)
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {current.notAllowed.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Garantía PokéVault */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(255, 203, 5, 0.08)',
          border: '1px solid rgba(255, 203, 5, 0.25)',
          borderRadius: '10px',
          padding: '14px 16px'
        }}>
          <ShieldCheck size={24} color="#ffcb05" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.45 }}>
            <strong style={{ color: '#ffcb05' }}>Inspección Verificada:</strong> En nuestra tienda cada carta cuenta con fotos reales tomadas en alta resolución. Lo que ves en las fotos de la carta es exactamente la copia física que recibes en tus manos.
          </div>
        </div>
      </div>
    </div>
  );
}
