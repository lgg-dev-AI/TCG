export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp?: string;
  types?: string[];
  rules?: string[];
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  number: string;
  artist?: string;
  rarity: string;
  flavorText?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices?: {
      normal?: { low: number; mid: number; high: number; market: number };
      holofoil?: { low: number; mid: number; high: number; market: number };
      reverseHolofoil?: { low: number; mid: number; high: number; market: number };
    };
  };
  set: {
    id: string;
    name: string;
    series: string;
  };
}

const BASE_URL = 'https://api.pokemontcg.io/v2';

// Caché local en memoria/localStorage para evitar límites de tasa (rate limiting)
const CACHE_KEY_PREFIX = 'pokevault_cache_';
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hora de caché

function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return data as T;
  } catch (e) {
    console.error('Error leyendo caché', e);
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      CACHE_KEY_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {
    console.error('Error escribiendo caché', e);
  }
}

export async function fetchCards(query = '', page = 1, pageSize = 20): Promise<{ data: PokemonCard[]; totalCount: number }> {
  // Construir consulta avanzada si hay texto de búsqueda
  // Por defecto, traer cartas populares del set base o expansiones famosas y recientes
  let q = 'supertype:pokemon';
  if (query) {
    q += ` name:"*${query}*"`;
  } else {
    // Si no hay búsqueda, traer Pokémon populares e icónicos
    q += ` (name:charizard OR name:pikachu OR name:mewtwo OR name:gengar OR name:eevee OR name:lugia OR name:rayquaza OR name:lucario OR name:gardevoir OR name:snorlax OR name:dragonite OR name:blastoise OR name:venusaur)`;
  }

  const cacheKey = `cards_${q}_page_${page}_size_${pageSize}`;
  const cached = getCachedData<{ data: PokemonCard[]; totalCount: number }>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/cards?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&orderBy=-images.large`,
      {
        headers: {
          // Si tuviéramos una API key, la pondríamos aquí
          // 'X-Api-Key': 'TU_API_KEY_AQUÍ'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const json = await response.json();
    const result = {
      data: json.data as PokemonCard[],
      totalCount: json.totalCount || json.data.length
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error cargando cartas de Pokémon TCG API:', error);
    return { data: [], totalCount: 0 };
  }
}

// Obtener cartas para simulador de sobres por expansión
export async function fetchCardsForPack(setName: string): Promise<PokemonCard[]> {
  const cacheKey = `pack_cards_${setName}`;
  const cached = getCachedData<PokemonCard[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${BASE_URL}/cards?q=set.name:"${setName}"&pageSize=100`,
      { headers: {} }
    );
    if (!response.ok) throw new Error('Error al obtener cartas para sobre');
    
    const json = await response.json();
    const result = json.data as PokemonCard[];
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error cargando cartas para sobre:', error);
    return [];
  }
}
