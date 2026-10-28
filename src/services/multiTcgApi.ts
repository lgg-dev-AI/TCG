// services/multiTcgApi.ts
export interface CardSearchResult {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    id: string;
    name: string;
  };
  game_type: string;
  marketPrice?: number;
}

// Caché inteligente de alta velocidad para no saturar las cuotas gratuitas de pokemontcg.io
const memoryCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function getCached<T>(key: string): T | null {
  const mem = memoryCache.get(key);
  if (mem && (Date.now() - mem.timestamp < CACHE_TTL_MS)) {
    return mem.data as T;
  }
  if (typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`tcg_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed.data as T;
        }
      }
    } catch {}
  }
  return null;
}

function setCached<T>(key: string, data: T): void {
  const item = { timestamp: Date.now(), data };
  memoryCache.set(key, item);
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(`tcg_cache_${key}`, JSON.stringify(item));
    } catch {}
  }
}

// Obtener las expansiones reales donde aparece un Pokémon con caché resiliente
export const fetchPokemonExpansionsForCard = async (pokemonName: string): Promise<string[]> => {
  if (!pokemonName || !pokemonName.trim()) return [];
  const clean = pokemonName.trim().replace(/[*"]/g, '');
  const cacheKey = `exp_${clean.toLowerCase()}`;
  
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(clean)}"&select=set&pageSize=100`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API pokemontcg status: ${res.status}`);
    const data = await res.json();
    const sets = new Set<string>();
    (data.data || []).forEach((c: any) => {
      if (c.set && c.set.name) {
        sets.add(c.set.name);
      }
    });
    const result = Array.from(sets).sort((a, b) => a.localeCompare(b));
    setCached(cacheKey, result);
    return result;
  } catch (e) {
    console.warn('API Pokémon TCG no disponible o limitada, intentando respaldo...', e);
    // Si la API falla, retornar de caché si existe aunque haya expirado
    const fallback = memoryCache.get(cacheKey)?.data;
    return fallback || [];
  }
};

// Helper para obtener precios detallados de TCGplayer y Cardmarket para una carta específica
export const fetchCardPricingDetail = async (cardId: string): Promise<{
  marketPrice: number;
  marketPriceLow: number;
  marketPriceHigh: number;
  marketUsd: number;
} | null> => {
  try {
    const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(cardId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const tcg = data.pricing?.tcgplayer;
    const cardmarket = data.pricing?.cardmarket;
    const variant = tcg?.['holofoil'] || tcg?.['reverse-holofoil'] || tcg?.normal;

    const usdPrice = variant?.marketPrice || (cardmarket?.avg30 ? cardmarket.avg30 * 1.08 : 0);
    const lowUsd = variant?.lowPrice || (cardmarket?.low ? cardmarket.low * 1.08 : 0);
    const highUsd = variant?.highPrice || (usdPrice * 1.4);

    return {
      marketUsd: usdPrice,
      marketPrice: Math.round(usdPrice * 20),
      marketPriceLow: Math.round(lowUsd * 20),
      marketPriceHigh: Math.round(highUsd * 20)
    };
  } catch (e) {
    console.warn('Error obteniendo precios de mercado TCGplayer:', e);
    return null;
  }
};

// Interfaz adaptadora para múltiples TCGs con caché ultrarrápido
export const multiTcgSearch = async (query: string, gameType: string, expansion?: string): Promise<CardSearchResult[]> => {
  const cleanName = (query || '').trim().replace(/[*"]/g, '');
  const cleanExpansion = (expansion || '').trim().replace(/[*"]/g, '');
  const cacheKey = `search_${gameType}_${cleanName.toLowerCase()}_${cleanExpansion.toLowerCase()}`;

  const cachedResults = getCached<CardSearchResult[]>(cacheKey);
  if (cachedResults) {
    return cachedResults;
  }

  try {
    switch (gameType) {
      case 'POKEMON': {
        // 1. Intentar primero con TCGdex (gratuita, sin API key, con TCGplayer pricing y CDN ultrarrápido)
        if (cleanName) {
          try {
            const tcgdexUrl = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(cleanName)}`;
            const dexRes = await fetch(tcgdexUrl);
            if (dexRes.ok) {
              const dexCards: any[] = await dexRes.json();
              if (Array.isArray(dexCards) && dexCards.length > 0) {
                const mapped: CardSearchResult[] = dexCards.slice(0, 40).map(c => ({
                  id: c.id,
                  name: c.name,
                  images: {
                    small: c.image ? `${c.image}/low.webp` : '',
                    large: c.image ? `${c.image}/high.webp` : ''
                  },
                  set: {
                    id: c.id.split('-')[0] || 'set',
                    name: cleanExpansion || 'Pokémon Official'
                  },
                  game_type: 'POKEMON',
                  marketPrice: 0 // Se resuelve dinámicamente
                }));

                setCached(cacheKey, mapped);
                return mapped;
              }
            }
          } catch (dexErr) {
            console.warn('TCGdex fallback a pokemontcg.io:', dexErr);
          }
        }

        // 2. Fallback a pokemontcg.io si TCGdex no arrojó resultados o la consulta es general
        let q = '';
        if (cleanName) {
          q = `name:"${cleanName}"`;
        } else {
          q = 'supertype:pokemon';
        }

        const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=50`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API pokemontcg.io status ${response.status}`);
        const data = await response.json();
        
        let results = data.data || [];
        if (cleanExpansion) {
          const lowerExp = cleanExpansion.toLowerCase();
          results = results.filter((card: any) => 
            card.set?.name && card.set.name.toLowerCase().includes(lowerExp)
          );
        }

        const mapped: CardSearchResult[] = results.map((card: any) => ({
          id: card.id,
          name: card.name,
          images: { small: card.images?.small || '', large: card.images?.large || card.images?.small || '' },
          set: { id: card.set?.id || 'unknown', name: card.set?.name || cleanExpansion || 'Base' },
          game_type: 'POKEMON',
          marketPrice: card.tcgplayer?.prices?.holofoil?.market 
            ? Math.round(card.tcgplayer.prices.holofoil.market * 20) 
            : (card.cardmarket?.prices?.averageSellPrice ? Math.round(card.cardmarket.prices.averageSellPrice * 20) : 0)
        }));

        setCached(cacheKey, mapped);
        return mapped;
      }

      case 'MAGIC': {
        let searchString = query.trim();
        if (expansion) {
          searchString += ` set:"${expansion.toLowerCase().replace(/[^a-z0-9]/g, '')}"`;
        }
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchString || query)}`);
        if (!response.ok) {
          if (response.status === 404) return []; // No results found
          throw new Error('API Error (Magic)');
        }
        const data = await response.json();
        return data.data.filter((card: any) => card.image_uris).map((card: any) => ({
          id: card.id,
          name: card.name,
          images: { small: card.image_uris?.small || '', large: card.image_uris?.large || card.image_uris?.normal || '' },
          set: { id: card.set, name: card.set_name },
          game_type: 'MAGIC',
          marketPrice: parseFloat(card.prices?.usd || '0') * 20 // Convertir aprox. USD a MXN
        }));
      }

      case 'YUGIOH': {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`);
        if (!response.ok) {
          if (response.status === 400) return []; // No results found
          throw new Error('API Error (Yu-Gi-Oh!)');
        }
        const data = await response.json();
        return data.data.slice(0, 50).map((card: any) => ({ // Limitar a 50
          id: card.id.toString(),
          name: card.name,
          images: { small: card.card_images[0]?.image_url_small || '', large: card.card_images[0]?.image_url || '' },
          set: { id: card.card_sets?.[0]?.set_code || 'N/A', name: card.card_sets?.[0]?.set_name || 'Base' },
          game_type: 'YUGIOH',
          marketPrice: parseFloat(card.card_prices?.[0]?.cardmarket_price || '0') * 20
        }));
      }

      case 'ONEPIECE':
      case 'DRAGONBALL':
      case 'BASEBALL': {
        const response = await fetch(`/api/catalog/search?game_type=${gameType}&q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`API Error (Internal ${gameType})`);
        const data = await response.json();
        return data.map((card: any) => ({
          id: card.id,
          name: card.name,
          images: { small: card.image_url, large: card.image_url },
          set: { id: 'unknown', name: card.expansion || 'Base' },
          game_type: card.game_type,
          marketPrice: card.market_price || 0
        }));
      }

      default:
        return [];
    }
  } catch (error) {
    console.error(`Error buscando cartas para ${gameType}:`, error);
    return [];
  }
};
