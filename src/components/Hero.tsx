import { Sparkles, Shield, Truck, CreditCard } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
}

export default function Hero({ onExploreClick }: HeroProps) {
  return (
    <div style={{ padding: '40px 0 20px 0' }}>
      {/* Banner Principal */}
      <div 
        className="glass animate-fade-in-up" 
        style={{
          borderRadius: '16px',
          padding: '60px 40px',
          background: 'linear-gradient(135deg, rgba(17, 21, 32, 0.85) 0%, rgba(26, 12, 12, 0.9) 100%)',
          border: '1px solid rgba(255, 62, 62, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '40px'
        }}
      >
        {/* Adorno de fondo brillante */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 62, 62, 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 203, 5, 0.1) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Insignia / Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 203, 5, 0.1)',
          border: '1px solid rgba(255, 203, 5, 0.3)',
          padding: '6px 14px',
          borderRadius: '20px',
          color: 'var(--secondary)',
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '20px'
        }}>
          <Sparkles size={14} /> Nueva Colección Pokémon TCG: Masquerade Twilight disponible
        </div>

        {/* Título Principal */}
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: '20px',
          maxWidth: '800px',
        }}>
          La Bóveda de Cartas Pokémon <br />
          <span style={{
            background: 'linear-gradient(90deg, #ff3e3e 0%, #ffcb05 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Más Grande de México
          </span>
        </h2>

        {/* Descripción */}
        <p style={{
          fontSize: 'clamp(14px, 2vw, 17px)',
          color: 'var(--text-secondary)',
          maxWidth: '650px',
          marginBottom: '32px',
          lineHeight: 1.6
        }}>
          Consigue Booster Boxes, Elite Trainer Boxes (ETB), cartas sueltas exclusivas y accesorios con los mejores precios del mercado de Pokémon TCG.
        </p>

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
          zIndex: 5
        }}>
          <button onClick={onExploreClick} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
            Explorar Tienda
          </button>
        </div>
      </div>

      {/* Grid de Beneficios / Características del Servicio */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {benefits.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <div 
              key={i} 
              className="glass" 
              style={{
                padding: '24px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(255, 62, 62, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{
                background: 'rgba(255, 62, 62, 0.1)',
                color: 'var(--primary)',
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                  {benefit.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {benefit.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const benefits = [
  {
    icon: Shield,
    title: "100% Autenticidad",
    desc: "Garantizamos que todos nuestros productos y cartas sueltas son 100% originales."
  },
  {
    icon: Truck,
    title: "Envíos Seguros a Todo México",
    desc: "Embalaje profesional reforzado con plástico de burbujas. Llega en perfecto estado."
  },
  {
    icon: CreditCard,
    title: "Transferencias SPEI y Efectivo",
    desc: "Paga de manera segura mediante transferencia SPEI o en efectivo en nuestra sucursal al recoger tu pedido."
  }
];
