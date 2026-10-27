import { useState, useRef } from 'react';
import { Zap, RefreshCw, Layers, Star } from 'lucide-react';
import { fetchCardsForPack } from '../services/api';
import type { PokemonCard } from '../services/api';

interface PackExpansion {
  id: string;
  name: string;
  apiName: string;
  packImage: string;
  description: string;
  releaseYear: string;
}

const EXPANSIONS: PackExpansion[] = [
  {
    id: '151',
    name: 'Pokémon 151',
    apiName: '151',
    packImage: 'https://images.pokemoncenter.com/images/products/P9411/712-98443/712-98443_1.jpg',
    description: 'Vuelve a los orígenes con los primeros 151 Pokémon clásicos con diseños modernos.',
    releaseYear: '2023'
  },
  {
    id: 'twilight',
    name: 'Twilight Masquerade',
    apiName: 'Twilight Masquerade',
    packImage: 'https://images.pokemoncenter.com/images/products/P9832/712-98698/712-98698_1.jpg',
    description: 'Explora la comarca de Norteo y descubre al misterioso Pokémon Ogerpon con sus máscaras.',
    releaseYear: '2024'
  },
  {
    id: 'temporal',
    name: 'Temporal Forces',
    apiName: 'Temporal Forces',
    packImage: 'https://images.pokemoncenter.com/images/products/P9642/712-98608/712-98608_1.jpg',
    description: 'Desata el poder de los Pokémon del Pasado y Futuro con especificaciones ex.',
    releaseYear: '2024'
  },
  {
    id: 'paldean_fates',
    name: 'Paldean Fates',
    apiName: 'Paldean Fates',
    packImage: 'https://images.pokemoncenter.com/images/products/P9642/712-98605/712-98605_1.jpg',
    description: '¡La locura Shiny ha vuelto! Atrapa a Charizard ex, Mew ex y Gardevoir ex en su versión variocolor.',
    releaseYear: '2024'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Flames',
    apiName: 'Obsidian Flames',
    packImage: 'https://images.pokemoncenter.com/images/products/P9463/712-98516/712-98516_1.jpg',
    description: 'Llamas ardientes de oscuridad con Charizard ex con tipo cambiado (Teracristal).',
    releaseYear: '2023'
  }
];

export default function PackOpenerSimulator() {
  const [selectedExp, setSelectedExp] = useState<PackExpansion>(EXPANSIONS[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [ripping, setRipping] = useState<boolean>(false);
  const [openedCards, setOpenedCards] = useState<PokemonCard[]>([]);
  const [revealedStates, setRevealedStates] = useState<boolean[]>(Array(10).fill(false));
  const [currentRevealIndex, setCurrentRevealIndex] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const [vault, setVault] = useState<PokemonCard[]>([]);

  // Efecto 3D hover en cartas reveladas
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleOpenPack = async () => {
    setLoading(true);
    setRipping(true);
    setOpenedCards([]);
    setShowSummary(false);
    setRevealedStates(Array(10).fill(false));
    setCurrentRevealIndex(0);

    try {
      const cards = await fetchCardsForPack(selectedExp.apiName);
      if (cards.length === 0) {
        throw new Error('No se cargaron cartas de la API');
      }

      // Filtrar cartas por rareza para armar un sobre realista
      // Un sobre real trae: 10 cartas (comunes, infrecuentes, 1 reverse/holo, 1 rara/secreta)
      const commons = cards.filter(c => c.rarity?.toLowerCase().includes('common') && !c.rarity?.toLowerCase().includes('uncommon'));
      const uncommons = cards.filter(c => c.rarity?.toLowerCase().includes('uncommon'));
      const rares = cards.filter(c => 
        c.rarity?.toLowerCase().includes('rare') || 
        c.rarity?.toLowerCase().includes('holo') || 
        c.rarity?.toLowerCase().includes('secret') || 
        c.rarity?.toLowerCase().includes('promo')
      );

      const poolCommons = commons.length > 0 ? commons : cards;
      const poolUncommons = uncommons.length > 0 ? uncommons : cards;
      const poolRares = rares.length > 0 ? rares : cards;

      const pack: PokemonCard[] = [];

      // 1. 5 Comunes
      for (let i = 0; i < 5; i++) {
        const rand = poolCommons[Math.floor(Math.random() * poolCommons.length)];
        pack.push({ ...rand, id: `${rand.id}_c_${i}_${Date.now()}` }); // Asegurar IDs únicos por si se repiten
      }

      // 2. 3 Infrecuentes
      for (let i = 0; i < 3; i++) {
        const rand = poolUncommons[Math.floor(Math.random() * poolUncommons.length)];
        pack.push({ ...rand, id: `${rand.id}_u_${i}_${Date.now()}` });
      }

      // 3. 1 Carta Especial / Holo (de la pool de raras con probabilidad)
      const isSuperRare = Math.random() > 0.65; // 35% de sacar algo ultra raro en el slot 9
      const slot9Pool = isSuperRare ? poolRares : poolUncommons;
      const randSlot9 = slot9Pool[Math.floor(Math.random() * slot9Pool.length)];
      pack.push({ ...randSlot9, id: `${randSlot9.id}_h_9_${Date.now()}` });

      // 4. 1 Rara / Secreta Garantizada en el último slot
      const randRare = poolRares[Math.floor(Math.random() * poolRares.length)];
      pack.push({ ...randRare, id: `${randRare.id}_r_10_${Date.now()}` });

      // Simular tiempo de animación del sobre rompiéndose
      setTimeout(() => {
        setOpenedCards(pack);
        setRipping(false);
        setLoading(false);
      }, 900);

    } catch (e) {
      console.error(e);
      setRipping(false);
      setLoading(false);
      alert('Error de red al conectar con la API de Pokémon TCG. Inténtalo de nuevo.');
    }
  };

  const handleRevealCard = (index: number) => {
    if (index !== currentRevealIndex) return; // Obligar a revelar en orden del mazo

    const nextRevealed = [...revealedStates];
    nextRevealed[index] = true;
    setRevealedStates(nextRevealed);

    if (index < 9) {
      setCurrentRevealIndex(index + 1);
    } else {
      // Si fue la última carta, mostrar resumen
      setTimeout(() => {
        setShowSummary(true);
      }, 1000);
    }
  };

  const handleSaveToVault = () => {
    // Guardar las cartas abiertas en la bóveda virtual del localStorage
    const uniqueVaultCards = [...vault];
    openedCards.forEach(c => {
      if (!uniqueVaultCards.some(v => v.id === c.id)) {
        uniqueVaultCards.push(c);
      }
    });
    setVault(uniqueVaultCards);
    alert('¡Tus cartas se han guardado en tu Bóveda Virtual de esta sesión!');
  };

  // Efecto tilt 3D para el reveal
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const el = cardRefs.current[index];
    if (!el || !revealedStates[index]) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const rotateX = ((y / h) - 0.5) * -20;
    const rotateY = ((x / w) - 0.5) * 20;

    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05) translateY(-10px)`;
    
    const overlay = el.querySelector('.card-foil-overlay') as HTMLDivElement;
    if (overlay) {
      const foilX = (x / w) * 100;
      const foilY = (y / h) * 100;
      overlay.style.opacity = '0.7';
      overlay.style.backgroundPosition = `${foilX}% ${foilY}%`;
    }
  };

  const handleCardMouseLeave = (index: number) => {
    const el = cardRefs.current[index];
    if (!el) return;
    el.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1) translateY(0)';
    
    const overlay = el.querySelector('.card-foil-overlay') as HTMLDivElement;
    if (overlay) {
      overlay.style.opacity = '0';
    }
  };

  // Calcular valor total del sobre en MXN
  const getPackValueMxn = () => {
    let totalUsd = 0;
    openedCards.forEach(c => {
      const price = c.tcgplayer?.prices?.holofoil?.market || 
                    c.tcgplayer?.prices?.normal?.market || 
                    c.tcgplayer?.prices?.reverseHolofoil?.market || 
                    0.15; // default $0.15 usd
      totalUsd += price;
    });
    return Math.round(totalUsd * 17.5);
  };

  return (
    <div className="animate-fade-in-up" style={{ padding: '20px 0 60px 0' }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: '12px' }}>
          Simulador de <span style={{ color: 'var(--primary)' }}>Apertura de Sobres</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '15px' }}>
          ¡Prueba tu suerte! Selecciona una expansión de Pokémon TCG y abre un sobre virtual con cartas reales cargadas de la API oficial. 
          Descubre cartas holográficas e inclinables en 3D.
        </p>
      </div>

      {openedCards.length === 0 ? (
        /* Pantalla de Selección de Pack */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
          alignItems: 'center',
          maxWidth: '1000px',
          margin: '0 auto'
        }} className="simulator-grid">
          
          {/* Lado Izquierdo: Booster Pack renderizado en grande */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="booster-pack-wrapper" onClick={handleOpenPack}>
              <div 
                className={`booster-pack ${ripping ? 'ripping' : ''}`}
                style={{
                  backgroundImage: `url(${selectedExp.packImage})`,
                  backgroundColor: '#111520',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              />
            </div>
            
            <button
              onClick={handleOpenPack}
              disabled={loading}
              className="btn btn-primary"
              style={{
                marginTop: '30px',
                padding: '14px 40px',
                fontSize: '16px',
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(255, 62, 62, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Zap size={18} /> {loading ? 'Cargando cartas...' : 'Abrir Sobre Gratis'}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              *Usa cartas reales y simula las tasas oficiales de Pokémon TCG.
            </span>
          </div>

          {/* Lado Derecho: Selector de Expansiones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>
              Elige tu Expansión
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {EXPANSIONS.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExp(exp)}
                  style={{
                    backgroundColor: selectedExp.id === exp.id ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    border: selectedExp.id === exp.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <img 
                    src={exp.packImage} 
                    alt={exp.name} 
                    style={{
                      width: '50px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>{exp.name}</span>
                      <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                        {exp.releaseYear}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                      {exp.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Pantalla de Revelado de Cartas */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Instrucción */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{
              fontSize: '11px',
              color: 'var(--secondary)',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: '6px'
            }}>
              Mazo de {selectedExp.name}
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800 }}>
              {showSummary ? '¡Sobre Abierto Completamente!' : `Revela las cartas (${currentRevealIndex + 1}/10)`}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {showSummary ? 'Revisa tu botín y guárdalas en tu Bóveda' : 'Haz clic en la carta sombreada para revelarla'}
            </p>
          </div>

          {/* Mazo interactivo en cuadrícula / abanico */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '20px',
            maxWidth: '1050px',
            width: '100%',
            marginBottom: '40px',
            perspective: '1000px'
          }} className="revealed-pack-grid">
            {openedCards.map((card, idx) => {
              const isRevealed = revealedStates[idx];
              const isCurrent = idx === currentRevealIndex;
              const isRare = card.rarity?.toLowerCase().includes('rare') || card.rarity?.toLowerCase().includes('secret') || card.rarity?.toLowerCase().includes('holo');
              
              return (
                <div
                  key={card.id}
                  ref={el => { cardRefs.current[idx] = el; }}
                  onMouseMove={(e) => handleCardMouseMove(e, idx)}
                  onMouseLeave={() => handleCardMouseLeave(idx)}
                  onClick={() => handleRevealCard(idx)}
                  style={{
                    aspectRatio: '2.5 / 3.5',
                    position: 'relative',
                    cursor: (isCurrent && !isRevealed) ? 'pointer' : 'default',
                    transformStyle: 'preserve-3d',
                    transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                    boxShadow: isCurrent ? '0 0 20px var(--primary-glow)' : 'none',
                    borderRadius: '10px',
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid transparent',
                    opacity: (isRevealed || isCurrent) ? 1 : 0.45,
                    transform: isRevealed ? 'rotateY(180deg)' : 'none'
                  }}
                  className="card-revealer"
                >
                  {/* Lado A: Reverso de la carta (Face Down) */}
                  <div style={{
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0, left: 0,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backfaceVisibility: 'hidden',
                    zIndex: 2,
                    transform: 'rotateY(0deg)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: '#111520',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: 'radial-gradient(circle, #1a2233 0%, #0d111a 100%)'
                  }}>
                    {/* Pokebola estilizada de reverso */}
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      border: '5px solid rgba(255,255,255,0.1)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '50%'
                      }} />
                      <div style={{
                        position: 'absolute',
                        left: 0, right: 0, height: '4px',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }} />
                    </div>
                  </div>

                  {/* Lado B: Anverso de la carta (Face Up) */}
                  <div style={{
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0, left: 0,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backfaceVisibility: 'hidden',
                    zIndex: 1,
                    transform: 'rotateY(180deg)',
                    backgroundColor: '#1a1e29',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={card.images.small} 
                      alt={card.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div 
                      className="card-foil-overlay" 
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        pointerEvents: 'none',
                        mixBlendMode: 'color-dodge',
                        opacity: 0,
                        background: 'linear-gradient(105deg, rgba(255,255,255,0) 39%, rgba(255,255,255,0.2) 43%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.2) 47%, rgba(255,255,255,0) 51%)',
                        backgroundSize: '200% 200%'
                      }}
                    />
                    {isRare && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Star size={10} style={{ color: 'var(--secondary)' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel de Resumen Final */}
          {showSummary && (
            <div className="glass" style={{
              maxWidth: '650px',
              width: '100%',
              padding: '30px',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid rgba(255, 203, 5, 0.25)',
              background: 'linear-gradient(180deg, rgba(17, 21, 32, 0.95) 0%, rgba(26, 26, 12, 0.95) 100%)',
              animation: 'scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
                🎉 ¡Apertura de Sobre Exitosa! 🎉
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                Tu sobre de <strong>{selectedExp.name}</strong> tiene un valor de mercado simulado total de:
              </p>

              <div style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'white',
                marginBottom: '24px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                padding: '12px 24px',
                borderRadius: '8px',
                display: 'inline-block'
              }}>
                ${getPackValueMxn()} MXN
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleOpenPack}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '14px' }}
                >
                  <RefreshCw size={16} /> Abrir Otro Sobre
                </button>
                <button 
                  onClick={handleSaveToVault}
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '14px' }}
                >
                  <Layers size={16} /> Guardar en mi Bóveda
                </button>
                <button 
                  onClick={() => {
                    setSelectedExp(EXPANSIONS[0]);
                    setOpenedCards([]);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '14px', border: '1px solid var(--border-color)' }}
                >
                  Cambiar Expansión
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estilos responsivos para simulador */}
      <style>{`
        @media (max-width: 992px) {
          .simulator-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
        }
        @media (max-width: 768px) {
          .revealed-pack-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
