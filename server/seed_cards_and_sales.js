import { query, run, get } from './db.js';

async function seed() {
  console.log('🌱 Iniciando seeding de productos y ventas en PokéVault...');

  // 1. Asegurar usuarios clientes
  const users = [
    { id: 'usr_carlos_01', email: 'carlos.mendez@coleccion.mx', name: 'Carlos Méndez', phone: '5512345678', city: 'Monterrey', state: 'Nuevo León' },
    { id: 'usr_sofia_02', email: 'sofia.tcg@gmail.com', name: 'Sofía Ramírez', phone: '3398765432', city: 'Guadalajara', state: 'Jalisco' },
    { id: 'usr_diego_03', email: 'diego.torres@outlook.com', name: 'Diego Torres', phone: '5587654321', city: 'CDMX', state: 'CDMX' },
    { id: 'usr_mostrador_04', email: 'mostrador@pokevault.mx', name: 'Cliente Mostrador Local', phone: '8110002233', city: 'San Pedro', state: 'Nuevo León' },
  ];

  const userMap = {};
  for (const u of users) {
    let existing = await get('SELECT id FROM users WHERE email = ?', [u.email]);
    if (!existing) {
      await run(
        `INSERT INTO users (id, email, name, role, phone, city, state) VALUES (?, ?, ?, 'CUSTOMER', ?, ?, ?)`,
        [u.id, u.email, u.name, u.phone, u.city, u.state]
      );
      userMap[u.email] = u.id;
      console.log(`👤 Usuario creado: ${u.email}`);
    } else {
      userMap[u.email] = existing.id;
    }
  }

  // 2. Lista de 15 cartas de Pokémon icónicas y cotizadas
  const products = [
    {
      id: 'poke_charizard_151_sir',
      name: 'Charizard ex SIR #199/165',
      price: 2850,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
      description: 'Charizard ex ilustración especial rara de Scarlet & Violet 151. Condición Near Mint garantizada.',
      stock: 5,
      expansion: 'Scarlet & Violet: 151',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Scarlet & Violet: 151 Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 2800,
      market_price_low: 2600,
      market_price_high: 3100
    },
    {
      id: 'poke_pikachu_vmax_rainbow',
      name: 'Pikachu VMAX Rainbow Rare #188/185',
      price: 3200,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh4/188_hires.png',
      description: 'El legendario Chonkachu Arcoíris de Vivid Voltage. Secret Rare en perfecto estado.',
      stock: 3,
      expansion: 'Vivid Voltage',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Vivid Voltage Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 3150,
      market_price_low: 2900,
      market_price_high: 3500
    },
    {
      id: 'poke_rayquaza_vmax_alt',
      name: 'Rayquaza VMAX Alternate Art #218/203',
      price: 6400,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh7/218_hires.png',
      description: 'Rayquaza VMAX Arte Alterno sobrevolando las montañas. Una de las cartas más codiciadas de Evolving Skies.',
      stock: 2,
      expansion: 'Evolving Skies',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Evolving Skies Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 6300,
      market_price_low: 5800,
      market_price_high: 7000
    },
    {
      id: 'poke_umbreon_vmax_alt',
      name: 'Umbreon VMAX Alt Art "Moonbreon" #215/203',
      price: 14500,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh7/215_hires.png',
      description: 'La joya indiscutible de la era Sword & Shield: Moonbreon alcanzando la luna. Centrado impecable.',
      stock: 2,
      expansion: 'Evolving Skies',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Evolving Skies Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 14200,
      market_price_low: 13500,
      market_price_high: 15500
    },
    {
      id: 'poke_gengar_vmax_alt',
      name: 'Gengar VMAX Alternate Art #271/264',
      price: 4900,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh8/271_hires.png',
      description: 'Gengar VMAX tragándose edificios con su Gigamax. Arte alterno épico de Fusion Strike.',
      stock: 4,
      expansion: 'Fusion Strike',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Fusion Strike Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 4850,
      market_price_low: 4500,
      market_price_high: 5300
    },
    {
      id: 'poke_lugia_v_alt',
      name: 'Lugia V Alternate Art #186/195',
      price: 3800,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh12/186_hires.png',
      description: 'Lugia V surcando los mares de Silver Tempest. Ilustración de kawayoo, condición Near Mint.',
      stock: 3,
      expansion: 'Silver Tempest',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Silver Tempest Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 3750,
      market_price_low: 3400,
      market_price_high: 4100
    },
    {
      id: 'poke_mewtwo_vstar_gg',
      name: 'Mewtwo VSTAR Galarian Gallery #GG44/GG70',
      price: 1750,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh12pt5/GG44_hires.png',
      description: 'Mewtwo combatiendo a Charizard en el aire. Arte espectacular de Crown Zenith.',
      stock: 6,
      expansion: 'Crown Zenith',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Crown Zenith Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 1700,
      market_price_low: 1550,
      market_price_high: 1900
    },
    {
      id: 'poke_giratina_v_alt',
      name: 'Giratina V Alternate Art #186/196',
      price: 5600,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh11/186_hires.png',
      description: 'Giratina en el Mundo Distorsión. Arte hipercomplejo y psicodélico de Shinji Kanda en Lost Origin.',
      stock: 2,
      expansion: 'Lost Origin',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Lost Origin Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 5500,
      market_price_low: 5100,
      market_price_high: 6000
    },
    {
      id: 'poke_blastoise_151_sir',
      name: 'Blastoise ex SIR #200/165',
      price: 1250,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/sv3pt5/200_hires.png',
      description: 'Blastoise nadando en las profundidades del océano. Especial Illustration Rare de 151.',
      stock: 7,
      expansion: 'Scarlet & Violet: 151',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Scarlet & Violet: 151 Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 1200,
      market_price_low: 1100,
      market_price_high: 1400
    },
    {
      id: 'poke_venusaur_151_sir',
      name: 'Venusaur ex SIR #198/165',
      price: 1100,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/sv3pt5/198_hires.png',
      description: 'Venusaur ex en la selva tropical. Especial Illustration Rare de 151.',
      stock: 5,
      expansion: 'Scarlet & Violet: 151',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Scarlet & Violet: 151 Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 1050,
      market_price_low: 950,
      market_price_high: 1200
    },
    {
      id: 'poke_greninja_ex_sir',
      name: 'Greninja ex SIR #214/167',
      price: 4200,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/sv6/214_hires.png',
      description: 'Greninja ex en técnica tradicional japonesa de tinta. Carta estrella de Twilight Masquerade.',
      stock: 3,
      expansion: 'Twilight Masquerade',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Twilight Masquerade Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 4100,
      market_price_low: 3800,
      market_price_high: 4500
    },
    {
      id: 'poke_magikarp_ir',
      name: 'Magikarp Illustration Rare #203/193',
      price: 2100,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/sv2/203_hires.png',
      description: 'El viral e icónico Magikarp saltando la cascada. Una de las cartas más deseadas de Paldea Evolved.',
      stock: 5,
      expansion: 'Paldea Evolved',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Paldea Evolved Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 2050,
      market_price_low: 1900,
      market_price_high: 2300
    },
    {
      id: 'poke_iono_sir',
      name: 'Iono Special Illustration Rare #269/193',
      price: 1950,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/sv2/269_hires.png',
      description: 'Iono (e-Nigma) streamer en vivo. Staple competitivo y grial de colección en Paldea Evolved.',
      stock: 4,
      expansion: 'Paldea Evolved',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Paldea Evolved Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 1900,
      market_price_low: 1750,
      market_price_high: 2150
    },
    {
      id: 'poke_arceus_vstar_gold',
      name: 'Arceus VSTAR Gold Secret #GG70/GG70',
      price: 1800,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/swsh12pt5/GG70_hires.png',
      description: 'Arceus VSTAR Dorado creando el cosmos. El grial dorado de Crown Zenith.',
      stock: 4,
      expansion: 'Crown Zenith',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Crown Zenith Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'No',
      market_price: 1750,
      market_price_low: 1600,
      market_price_high: 2000
    },
    {
      id: 'poke_lugia_neo_genesis_1st',
      name: 'Lugia Holo 1st Edition #9/111',
      price: 22000,
      category: 'Cartas Sueltas',
      image_url: 'https://images.pokemontcg.io/neo1/9_hires.png',
      description: 'El santo grial vintage de Neo Genesis. Primera edición auténtica de los 2000 con sello original 1st Edition.',
      stock: 1,
      expansion: 'Neo Genesis',
      is_promo: 0,
      region: 'ENG',
      pulled_from: 'Neo Genesis 1st Edition Booster Pack',
      card_condition: 'Near Mint',
      game_type: 'POKEMON',
      is_first_edition: 'Sí',
      market_price: 21500,
      market_price_low: 19500,
      market_price_high: 25000
    }
  ];

  for (const p of products) {
    const existing = await get('SELECT id FROM products WHERE id = ?', [p.id]);
    if (!existing) {
      await run(`
        INSERT INTO products (
          id, name, price, category, image_url, description, stock, expansion, 
          is_promo, region, pulled_from, card_condition, game_type, is_first_edition, 
          market_price, market_price_low, market_price_high, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        p.id, p.name, p.price, p.category, p.image_url, p.description, p.stock, p.expansion,
        p.is_promo, p.region, p.pulled_from, p.card_condition, p.game_type, p.is_first_edition,
        p.market_price, p.market_price_low, p.market_price_high
      ]);
      console.log(`🃏 Producto creado: ${p.name}`);
    } else {
      // Actualizar datos de stock y precio para asegurar consistencia
      await run(`
        UPDATE products SET 
          price = ?, stock = ?, image_url = ?, is_first_edition = ?, game_type = 'POKEMON'
        WHERE id = ?
      `, [p.price, p.stock, p.image_url, p.is_first_edition, p.id]);
    }
  }

  // 3. Crear Órdenes realistas con diferentes fechas
  const now = new Date();
  
  // Helper para generar fechas en SQLite format: YYYY-MM-DD HH:MM:SS
  const formatSQLDate = (d) => {
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  const dToday = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Hoy hace 2 horas
  const dYesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000); // Ayer
  const d3DaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // Hace 3 días
  const d6DaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // Hace 6 días
  const d12DaysAgo = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000); // Hace 12 días
  const d20DaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // Hace 20 días

  const ordersToSeed = [
    {
      id: 'PV-849201',
      user_id: userMap['carlos.mendez@coleccion.mx'],
      total: 4200,
      status: 'PAGADO',
      tracking_number: 'PAYPAL - TRX: 99420188A',
      created_at: formatSQLDate(dToday),
      items: [
        { product_id: 'poke_greninja_ex_sir', quantity: 1, price_at_purchase: 4200 }
      ]
    },
    {
      id: 'PV-OTC31904',
      user_id: userMap['mostrador@pokevault.mx'],
      total: 3950,
      status: 'PAGADO',
      tracking_number: 'VENTA FISICA - Terminal Bancaria',
      created_at: formatSQLDate(new Date(now.getTime() - 4 * 60 * 60 * 1000)),
      items: [
        { product_id: 'poke_charizard_151_sir', quantity: 1, price_at_purchase: 2850 },
        { product_id: 'poke_venusaur_151_sir', quantity: 1, price_at_purchase: 1100 }
      ]
    },
    {
      id: 'PV-771923',
      user_id: userMap['sofia.tcg@gmail.com'],
      total: 6400,
      status: 'ENVIADO',
      tracking_number: 'ESTAFETA-9823419082',
      created_at: formatSQLDate(dYesterday),
      items: [
        { product_id: 'poke_rayquaza_vmax_alt', quantity: 1, price_at_purchase: 6400 }
      ]
    },
    {
      id: 'PV-652819',
      user_id: userMap['diego.torres@outlook.com'],
      total: 14500,
      status: 'ENTREGADO',
      tracking_number: 'DHL-EXPRESS-4419208471',
      created_at: formatSQLDate(d3DaysAgo),
      items: [
        { product_id: 'poke_umbreon_vmax_alt', quantity: 1, price_at_purchase: 14500 }
      ]
    },
    {
      id: 'PV-512093',
      user_id: userMap['carlos.mendez@coleccion.mx'],
      total: 5050,
      status: 'ENTREGADO',
      tracking_number: 'FEDEX-7719203948',
      created_at: formatSQLDate(d6DaysAgo),
      items: [
        { product_id: 'poke_pikachu_vmax_rainbow', quantity: 1, price_at_purchase: 3200 },
        { product_id: 'poke_arceus_vstar_gold', quantity: 1, price_at_purchase: 1800 }
      ]
    },
    {
      id: 'PV-410982',
      user_id: userMap['sofia.tcg@gmail.com'],
      total: 4900,
      status: 'ENTREGADO',
      tracking_number: 'ESTAFETA-5591028374',
      created_at: formatSQLDate(d12DaysAgo),
      items: [
        { product_id: 'poke_gengar_vmax_alt', quantity: 1, price_at_purchase: 4900 }
      ]
    },
    {
      id: 'PV-398102',
      user_id: userMap['diego.torres@outlook.com'],
      total: 3800,
      status: 'ENTREGADO',
      tracking_number: 'DHL-EXPRESS-1192837465',
      created_at: formatSQLDate(d20DaysAgo),
      items: [
        { product_id: 'poke_lugia_v_alt', quantity: 1, price_at_purchase: 3800 }
      ]
    }
  ];

  for (const o of ordersToSeed) {
    const existingOrder = await get('SELECT id FROM orders WHERE id = ?', [o.id]);
    if (!existingOrder) {
      await run(
        `INSERT INTO orders (id, user_id, total, status, tracking_number, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [o.id, o.user_id, o.total, o.status, o.tracking_number, o.created_at]
      );
      for (const it of o.items) {
        await run(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`,
          [o.id, it.product_id, it.quantity, it.price_at_purchase]
        );
      }
      console.log(`📦 Orden creada: ${o.id} - Total: $${o.total} MXN - Estado: ${o.status} - Fecha: ${o.created_at}`);
    }
  }

  // Comprobar totales finales en la base de datos
  const totalOrders = await get('SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status IN ("PAGADO", "ENVIADO", "ENTREGADO")');
  const countProducts = await get('SELECT COUNT(*) as count FROM products');
  
  console.log('\n=============================================');
  console.log('✅ SEEDING COMPLETADO EXITOSAMENTE');
  console.log(`Total de Productos en Catálogo: ${countProducts.count}`);
  console.log(`Total de Órdenes Válidas: ${totalOrders.count}`);
  console.log(`Ingresos Reales Registrados: $${Number(totalOrders.revenue).toLocaleString('es-MX')} MXN`);
  console.log('=============================================\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error en seeding:', err);
  process.exit(1);
});
