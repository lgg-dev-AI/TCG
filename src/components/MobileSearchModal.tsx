import { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, ChevronRight } from 'lucide-react';
import type { Product } from './ProductItem';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSearchSubmit: (query: string) => void;
}

export default function MobileSearchModal({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onSearchSubmit
}: MobileSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        (p.expansion && p.expansion.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 10)
    : [];

  const popularSearches = ['Charizard', 'Pikachu', 'One Piece', 'Manga', 'Lorcana', 'Booster Box', 'Micas'];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0d14',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Barra de Búsqueda Superior */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#0e121c'
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por carta, expansión o juego..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit(query);
                onClose();
              }
            }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '10px 38px 10px 38px',
              color: '#ffffff',
              fontSize: '16px', // 16px exacto para prevenir auto-zoom de iOS
              outline: 'none',
              fontFamily: 'var(--font-heading)'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '8px 4px',
            fontFamily: 'var(--font-heading)'
          }}
        >
          Cancelar
        </button>
      </div>

      {/* Contenido / Resultados */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Sugerencias Rápidas si no ha escrito nada */}
        {!query.trim() && (
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Búsquedas Populares
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    onSearchSubmit(term);
                    onClose();
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={12} color="#ffcb05" />
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resultados en tiempo real */}
        {query.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {filtered.length} Resultados encontrados
            </span>

            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  cursor: 'pointer'
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: '45px',
                    height: '58px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0,0,0,0.3)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)' }}>
                      ${product.price.toLocaleString('es-MX')} MXN
                    </span>
                    {product.expansion && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        • {product.expansion}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-secondary)" />
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '14px', margin: 0 }}>No encontramos productos que coincidan con "{query}"</p>
                <button
                  onClick={() => {
                    onSearchSubmit(query);
                    onClose();
                  }}
                  style={{
                    marginTop: '12px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Buscar en todo el catálogo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
