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

// Caché inteligente de alta velocidad para no saturar APIs externas
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

// Mapa global en memoria de Sets de TCGdex para resolución inmediata de expansiones (<1ms)
let tcgdexSetMap: Map<string, string> | null = null;
let tcgdexSetPromise: Promise<Map<string, string>> | null = null;

export const getTcgdexSetMap = async (): Promise<Map<string, string>> => {
  if (tcgdexSetMap) return tcgdexSetMap;
  if (tcgdexSetPromise) return tcgdexSetPromise;

  tcgdexSetPromise = (async () => {
    try {
      const cached = getCached<Record<string, string>>('tcgdex_sets_map');
      if (cached) {
        tcgdexSetMap = new Map(Object.entries(cached));
        return tcgdexSetMap;
      }
      const res = await fetch('https://api.tcgdex.net/v2/en/sets');
      if (res.ok) {
        const sets: any[] = await res.json();
        const map = new Map<string, string>();
        const plain: Record<string, string> = {};
        sets.forEach(s => {
          if (s.id && s.name) {
            map.set(s.id, s.name);
            plain[s.id] = s.name;
          }
        });
        setCached('tcgdex_sets_map', plain);
        tcgdexSetMap = map;
        return map;
      }
    } catch (e) {
      console.warn('Error cargando sets de TCGdex:', e);
    }
    return new Map<string, string>();
  })();

  return tcgdexSetPromise;
};

// Obtener las expansiones reales donde aparece un Pokémon de forma ultrarrápida (<400ms)
export const fetchPokemonExpansionsForCard = async (pokemonName: string): Promise<string[]> => {
  if (!pokemonName || !pokemonName.trim()) return [];
  const clean = pokemonName.trim().replace(/[*"]/g, '');
  const cacheKey = `exp_${clean.toLowerCase()}`;
  
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  try {
    // 1. Resolver con TCGdex (ultrarrápido y sin cuotas)
    const [setMap, res] = await Promise.all([
      getTcgdexSetMap(),
      fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(clean)}`)
    ]);

    if (res.ok) {
      const cards: any[] = await res.json();
      if (Array.isArray(cards) && cards.length > 0) {
        const setsSet = new Set<string>();
        cards.forEach(c => {
          const setId = c.id.split('-')[0];
          const setName = setMap.get(setId);
          if (setName) {
            setsSet.add(setName);
          }
        });
        const result = Array.from(setsSet).sort((a, b) => a.localeCompare(b));
        if (result.length > 0) {
          setCached(cacheKey, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('TCGdex sets fallback:', err);
  }

  // 2. Respaldo a pokemontcg.io si TCGdex no arrojó resultados
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s máx
    const url = `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(clean)}"&select=set&pageSize=100`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
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
    }
  } catch (e) {
    console.warn('Fallo de pokemontcg.io para expansiones:', e);
  }

  return [];
};

// Helper para obtener precios detallados de cotización para una carta específica
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
    console.warn('Error obteniendo precios de mercado:', e);
    return null;
  }
};

// Catálogo precargado de One Piece Card Game oficial
const POPULAR_ONE_PIECE_CARDS: CardSearchResult[] = [
  {
    id: 'OP01-001',
    name: 'Roronoa Zoro (Leader)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png'
    },
    set: { id: 'OP01', name: 'Romance Dawn (OP-01)' },
    game_type: 'ONEPIECE',
    marketPrice: 450
  },
  {
    id: 'OP01-025',
    name: 'Roronoa Zoro (SR)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-025.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-025.png'
    },
    set: { id: 'OP01', name: 'Romance Dawn (OP-01)' },
    game_type: 'ONEPIECE',
    marketPrice: 620
  },
  {
    id: 'OP01-016',
    name: 'Nami (R)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016.png'
    },
    set: { id: 'OP01', name: 'Romance Dawn (OP-01)' },
    game_type: 'ONEPIECE',
    marketPrice: 380
  },
  {
    id: 'OP01-120',
    name: 'Shanks (SEC)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120.png'
    },
    set: { id: 'OP01', name: 'Romance Dawn (OP-01)' },
    game_type: 'ONEPIECE',
    marketPrice: 1600
  },
  {
    id: 'OP02-001',
    name: 'Edward.Newgate (Leader)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-001.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-001.png'
    },
    set: { id: 'OP02', name: 'Paramount War (OP-02)' },
    game_type: 'ONEPIECE',
    marketPrice: 350
  },
  {
    id: 'OP02-013',
    name: 'Portgas.D.Ace (SR)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-013.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-013.png'
    },
    set: { id: 'OP02', name: 'Paramount War (OP-02)' },
    game_type: 'ONEPIECE',
    marketPrice: 580
  },
  {
    id: 'OP05-060',
    name: 'Monkey.D.Luffy (Gear 5 - SEC)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-060.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-060.png'
    },
    set: { id: 'OP05', name: 'Awakening of the New Era (OP-05)' },
    game_type: 'ONEPIECE',
    marketPrice: 2400
  },
  {
    id: 'OP05-119',
    name: 'Monkey.D.Luffy (Manga Rare)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119.png'
    },
    set: { id: 'OP05', name: 'Awakening of the New Era (OP-05)' },
    game_type: 'ONEPIECE',
    marketPrice: 12500
  },
  {
    id: 'OP06-118',
    name: 'Roronoa Zoro (SEC)',
    images: {
      small: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP06-118.png',
      large: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP06-118.png'
    },
    set: { id: 'OP06', name: 'Wings of the Captain (OP-06)' },
    game_type: 'ONEPIECE',
    marketPrice: 950
  }
];

// Interfaz adaptadora para múltiples TCGs con respuesta inmediata y caché
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
        // 1. TCGdex: motor primario ultrarrápido con CDN y resolución de nombres de sets
        if (cleanName) {
          try {
            const [setMap, dexRes] = await Promise.all([
              getTcgdexSetMap(),
              fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(cleanName)}`)
            ]);

            if (dexRes.ok) {
              const dexCards: any[] = await dexRes.json();
              if (Array.isArray(dexCards) && dexCards.length > 0) {
                let mapped: CardSearchResult[] = dexCards.map(c => {
                  const setId = c.id.split('-')[0] || 'set';
                  const realSetName = setMap.get(setId) || setId;
                  return {
                    id: c.id,
                    name: c.name,
                    images: {
                      small: c.image ? `${c.image}/low.webp` : '',
                      large: c.image ? `${c.image}/high.webp` : ''
                    },
                    set: {
                      id: setId,
                      name: realSetName
                    },
                    game_type: 'POKEMON',
                    marketPrice: 0 // Se cotiza al seleccionar o pre-calcular
                  };
                });

                // Filtrar por expansión si el usuario seleccionó una
                if (cleanExpansion) {
                  const lowerExp = cleanExpansion.toLowerCase();
                  mapped = mapped.filter(c => c.set.name.toLowerCase().includes(lowerExp));
                }

                if (mapped.length > 0) {
                  const finalResult = mapped.slice(0, 60);
                  setCached(cacheKey, finalResult);
                  return finalResult;
                }
              }
            }
          } catch (dexErr) {
            console.warn('TCGdex error, intentando respaldo con pokemontcg.io:', dexErr);
          }
        }

        // 2. Fallback a pokemontcg.io si TCGdex no arrojó resultados o la búsqueda es por sobre
        let q = '';
        if (cleanName) {
          q = `name:"${cleanName}"`;
        } else {
          q = 'supertype:pokemon';
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000); // 7s máx
        const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=50`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

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
          if (response.status === 404) return [];
          throw new Error('API Error (Magic)');
        }
        const data = await response.json();
        const mapped = data.data.filter((card: any) => card.image_uris).map((card: any) => ({
          id: card.id,
          name: card.name,
          images: { small: card.image_uris?.small || '', large: card.image_uris?.large || card.image_uris?.normal || '' },
          set: { id: card.set, name: card.set_name },
          game_type: 'MAGIC',
          marketPrice: Math.round(parseFloat(card.prices?.usd || '0') * 20)
        }));
        setCached(cacheKey, mapped);
        return mapped;
      }

      case 'YUGIOH': {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`);
        if (!response.ok) {
          if (response.status === 400) return [];
          throw new Error('API Error (Yu-Gi-Oh!)');
        }
        const data = await response.json();
        const mapped = data.data.slice(0, 50).map((card: any) => ({
          id: card.id.toString(),
          name: card.name,
          images: { small: card.card_images[0]?.image_url_small || '', large: card.card_images[0]?.image_url || '' },
          set: { id: card.card_sets?.[0]?.set_code || 'N/A', name: card.card_sets?.[0]?.set_name || 'Yu-Gi-Oh! Base' },
          game_type: 'YUGIOH',
          marketPrice: Math.round(parseFloat(card.card_prices?.[0]?.cardmarket_price || '0') * 20)
        }));
        setCached(cacheKey, mapped);
        return mapped;
      }

      case 'ONEPIECE': {
        // Intentar primero con base de datos interna si existe
        try {
          const response = await fetch(`/api/catalog/search?game_type=ONEPIECE&q=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              const mapped = data.map((card: any) => ({
                id: card.id,
                name: card.name,
                images: { small: card.image_url, large: card.image_url },
                set: { id: 'unknown', name: card.expansion || 'One Piece Set' },
                game_type: 'ONEPIECE',
                marketPrice: Math.round(card.market_price || 0)
              }));
              setCached(cacheKey, mapped);
              return mapped;
            }
          }
        } catch {}

        // Fallback a catálogo precargado filtrado
        const lowerQ = query.toLowerCase();
        const matches = POPULAR_ONE_PIECE_CARDS.filter(c => 
          c.name.toLowerCase().includes(lowerQ) || (c.set?.name && c.set.name.toLowerCase().includes(lowerQ))
        );
        return matches.length > 0 ? matches : POPULAR_ONE_PIECE_CARDS;
      }

      default:
        return [];
    }
  } catch (error) {
    console.error(`Error buscando cartas para ${gameType}:`, error);
    return [];
  }
};
