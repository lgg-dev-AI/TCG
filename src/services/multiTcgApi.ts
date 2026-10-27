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

// Interfaz adaptadora para múltiples TCGs
export const multiTcgSearch = async (query: string, gameType: string, expansion?: string): Promise<CardSearchResult[]> => {
  if (!query && !expansion) return [];

  try {
    switch (gameType) {
      case 'POKEMON': {
        // La API pokemontcg.io falla con Error 502 cuando se usan asteriscos (*) en set.name
        // La forma oficial y 100% estable es name:"nombre" o buscar por nombre y filtrar localmente
        let q = '';
        const cleanName = query.trim().replace(/[*"]/g, '');
        const cleanExpansion = expansion ? expansion.trim().replace(/[*"]/g, '') : '';

        if (cleanName) {
          q = `name:"${cleanName}"`;
        } else if (cleanExpansion) {
          // Si solo viene expansión, buscar Pokémon populares de esa era para traer el conjunto
          q = 'supertype:pokemon';
        }

        const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=100`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error (Pokémon)');
        const data = await response.json();
        
        let results = data.data || [];
        
        // Si se especificó expansión, filtrar de manera segura por el nombre del set
        if (cleanExpansion) {
          const lowerExp = cleanExpansion.toLowerCase();
          results = results.filter((card: any) => 
            card.set?.name && card.set.name.toLowerCase().includes(lowerExp)
          );
        }

        return results.map((card: any) => ({
          id: card.id,
          name: card.name,
          images: { small: card.images?.small || '', large: card.images?.large || card.images?.small || '' },
          set: { id: card.set?.id || 'unknown', name: card.set?.name || cleanExpansion || 'Base' },
          game_type: 'POKEMON',
          marketPrice: card.cardmarket?.prices?.averageSellPrice || 0
        }));
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
